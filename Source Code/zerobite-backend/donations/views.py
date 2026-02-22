from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db import transaction

from .models import Donation, Order
from .serializers import DonationSerializer, OrderSerializer


# ---------------- Existing Donation APIs ---------------- #

class DonationListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: List all donations (auto-mark expired)
    POST: Create new donation (requires authentication)
    """
    serializer_class = DonationSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Donation.objects.all()
        now = timezone.now()

        # Mark expired donations automatically
        expired_qs = qs.filter(
            expiry_time__isnull=False,
            expiry_time__lte=now,
            is_expired=False
        )
        if expired_qs.exists():
            expired_qs.update(is_expired=True)

        include_expired = self.request.query_params.get('include_expired') == 'true'
        include_claimed = self.request.query_params.get('include_claimed') == 'true'

        q = qs
        if not include_expired:
            q = q.filter(is_expired=False)
        if not include_claimed:
            q = q.filter(is_claimed=False)

        return q.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)


class DonationRetrieveDestroyAPIView(generics.RetrieveDestroyAPIView):
    """
    Retrieve a donation (anyone)
    Delete: Only donor or admin
    """
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def delete(self, request, *args, **kwargs):
        donation = self.get_object()
        user = request.user
        if not user.is_authenticated:
            raise PermissionDenied("Authentication required to delete.")
        if user == donation.donor or user.is_staff:
            return super().delete(request, *args, **kwargs)
        raise PermissionDenied("Only the donor or admin can remove this donation.")


class DonationClaimAPIView(APIView):
    """
    PATCH: Mark a donation as claimed
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, format=None):
        try:
            donation = Donation.objects.get(pk=pk)
        except Donation.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        donation.mark_if_expired()
        if donation.is_expired:
            return Response({'detail': 'This donation has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if donation.is_claimed:
            return Response({'detail': 'Already claimed.'}, status=status.HTTP_400_BAD_REQUEST)

        donation.is_claimed = True
        donation.save(update_fields=['is_claimed'])
        return Response(DonationSerializer(donation, context={'request': request}).data)


class DonationUserStatsAPIView(APIView):
    """
    GET: Return user's donation stats & list
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        qs = Donation.objects.filter(donor=user)
        now = timezone.now()

        # auto-mark expired
        Donation.objects.filter(
            donor=user,
            expiry_time__isnull=False,
            expiry_time__lte=now,
            is_expired=False
        ).update(is_expired=True)

        posted = qs.count()
        claimed = qs.filter(is_claimed=True).count()
        expired = qs.filter(is_expired=True).count()
        posts = DonationSerializer(qs.order_by('-created_at'), many=True, context={'request': request}).data

        return Response({
            'posted_count': posted,
            'claimed_count': claimed,
            'expired_count': expired,
            'posts': posts
        })


# ---------------- New Order (Pickup Confirmation) API ---------------- #

class OrderListCreateView(generics.ListCreateAPIView):
    """
    GET: List confirmed orders of the logged-in user
    POST: Confirm a donation order (only for NGO/Volunteer)
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("donation", "user")
            .order_by("-created_at")
        )

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user

        # ✅ Role check
        user_role = getattr(user, "role", "").upper()
        if user_role not in ("NGO", "VOLUNTEER"):
            raise PermissionDenied("Only NGO or Volunteer users can confirm an order.")

        donation = serializer.validated_data.get("donation")
        if not donation:
            raise PermissionDenied("Donation field is required.")

        # ✅ Donation validation
        donation.mark_if_expired()
        if donation.is_expired:
            raise PermissionDenied("This donation has expired and cannot be confirmed.")
        if donation.is_claimed:
            raise PermissionDenied("This donation has already been claimed.")

        # ✅ Save order and mark donation claimed atomically
        serializer.save(user=user)
        donation.is_claimed = True
        donation.save(update_fields=["is_claimed"])
