from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.db import transaction
from django.db.models import F 

from .models import Donation, Order
from .serializers import DonationSerializer, OrderSerializer

from math import radians, cos, sin, asin, sqrt
# ---------------- Atomic claim helper ---------------- #

class DonationAlreadyClaimed(Exception):
    """Raised when a donation is claimed by a concurrent request."""
    pass


def atomic_claim_donation(donation_id, user):
    """
    Atomically claim a donation.

    Uses SELECT ... FOR UPDATE to lock the row so two concurrent requests
    cannot both succeed. Must be called inside a transaction.

    Returns the claimed Donation instance.

    Raises:
        Donation.DoesNotExist       — donation doesn't exist
        ValidationError             — donation expired
        DonationAlreadyClaimed      — someone else claimed it first
    """
    # select_for_update() takes a row-level lock in MariaDB.
    # Any other transaction trying to SELECT ... FOR UPDATE on this row
    # will block until this one commits or rolls back.
    donation = Donation.objects.select_for_update().get(pk=donation_id)

    # Auto-expire if the time has passed
    donation.mark_if_expired()

    if donation.is_expired:
        raise ValidationError({"detail": "This donation has expired."})

    if donation.is_claimed:
        raise DonationAlreadyClaimed(
            f"Donation {donation_id} was already claimed."
        )

    donation.is_claimed = True
    donation.claimed_by = user
    donation.claimed_at = timezone.now()
    donation.save(update_fields=["is_claimed", "claimed_by", "claimed_at"])

    return donation

# ---------------- Existing Donation APIs ---------------- #

class DonationListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: List all donations (auto-mark expired)
    POST: Create new donation (requires authentication)
    """
    serializer_class = DonationSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

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

        # --- NEW: Haversine Distance Calculation ---
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        
        if lat and lng:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
                # Haversine formula
                def haversine(lon1, lat1, lon2, lat2):
                    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
                    dlon = lon2 - lon1 
                    dlat = lat2 - lat1 
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a)) 
                    r = 6371 # Radius of earth in kilometers
                    return c * r

                q = list(q) # Convert to list to calculate in Python
                for donation in q:
                    if donation.latitude and donation.longitude:
                        dist = haversine(user_lng, user_lat, float(donation.longitude), float(donation.latitude))
                        donation.distance_km = round(dist, 1)
                    else:
                        donation.distance_km = 9999 # Unknown location goes to the end
                
                # Sort by distance
                q.sort(key=lambda x: x.distance_km)
                return q
            except ValueError:
                pass # If lat/lng are invalid, fall back to default sorting

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
    PATCH: Mark a donation as claimed (atomically).

    Returns:
        200 — claimed successfully
        400 — donation expired
        404 — donation doesn't exist
        409 — already claimed by someone else
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, format=None):
        try:
            with transaction.atomic():
                donation = atomic_claim_donation(pk, request.user)
        except Donation.DoesNotExist:
            return Response(
                {"detail": "Donation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DonationAlreadyClaimed as e:
            return Response(
                {"detail": str(e), "code": "already_claimed"},
                status=status.HTTP_409_CONFLICT,
            )
        except ValidationError as e:
            # ValidationError.detail is a dict/list; normalize to a dict response
            return Response(
                getattr(e, "detail", {"detail": str(e)}),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            DonationSerializer(donation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


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
    parser_classes = (MultiPartParser, FormParser, JSONParser)

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

        # ✅ Atomic claim — locks the row, checks expiry, checks is_claimed,
        #    and updates in one transaction. If another request is racing
        #    us, this call blocks until that one commits, then sees the
        #    updated is_claimed=True and raises DonationAlreadyClaimed.
        try:
            donation = atomic_claim_donation(donation.pk, user)
        except DonationAlreadyClaimed as e:
            raise ValidationError({"detail": str(e), "code": "already_claimed"})

        # ✅ Create the Order row. If the Order creation fails, the whole
        #    transaction (including the claim above) rolls back — donation
        #    goes back to unclaimed, so no orphaned state.
        serializer.save(user=user, donation=donation)


# ---------------- Pickup Code Verification (feature 4) ---------------- #

class OrderVerifyCodeView(APIView):
    """
    POST /api/orders/<id>/verify-code/
    Body: { "code": "123456" }

    Only the *donor* of the underlying donation can call this.

    On match:
        - code_verified_at = timezone.now()
        - status = 'picked_up'

    Errors:
        400 — code missing, wrong, order already verified, or attempts exceeded
        403 — caller is not the donor of this donation
        404 — order not found
    """
    permission_classes = [permissions.IsAuthenticated]

    MAX_ATTEMPTS = 5

    def post(self, request, pk, format=None):
        # 1. Look up order + related donation (single query)
        try:
            order = Order.objects.select_related("donation").get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Only the donor of the underlying donation can verify
        if order.donation.donor_id != request.user.id:
            return Response(
                {"detail": "Only the donor can verify the pickup code."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 3. State checks
        if order.status == "picked_up":
            return Response(
                {"detail": "This pickup has already been verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == "cancelled":
            return Response(
                {"detail": "This order has been cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.code_attempts >= self.MAX_ATTEMPTS:
            return Response(
                {"detail": "Too many failed attempts. Contact support."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Input validation
        submitted = (request.data.get("code") or "").strip()
        if not submitted:
            return Response(
                {"detail": "code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5. Compare
        if submitted != order.pickup_code:
            # Atomic increment of attempts
            order.code_attempts = F("code_attempts") + 1
            order.save(update_fields=["code_attempts"])
            order.refresh_from_db(fields=["code_attempts"])
            remaining = max(self.MAX_ATTEMPTS - order.code_attempts, 0)
            return Response(
                {
                    "detail": "Incorrect code.",
                    "remaining_attempts": remaining,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 6. ✅ Match — verify pickup
        order.status = "picked_up"
        order.code_verified_at = timezone.now()
        order.save(update_fields=["status", "code_verified_at"])

        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

class RewardsAPIView(APIView):
    """
    GET: Calculate the user's impact (meals saved, CO2 avoided, etc.)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        
        # Count orders that have been successfully picked up
        completed_orders = Order.objects.filter(user=user, status="picked_up")
        meals_saved = completed_orders.count()

        # Calculations (estimates)
        # Assume 1 meal = 0.4 kg of food
        # Assume 1 kg of food = 2.5 kg of CO2 avoided
        kg_saved = round(meals_saved * 0.4, 1)
        co2_avoided = round(kg_saved * 2.5, 1)

        # Badge logic
        badge = "Seedling 🌱"
        if meals_saved >= 50:
            badge = "Mighty Oak 🌳"
        elif meals_saved >= 20:
            badge = "Sapling 🌿"
        elif meals_saved >= 5:
            badge = "Sprout 🌾"

        return Response({
            "meals_saved": meals_saved,
            "kg_saved": kg_saved,
            "co2_avoided": co2_avoided,
            "badge": badge
        })

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

class AdminStatsAPIView(APIView):
    """
    GET: Aggregate stats for the admin dashboard charts.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, format=None):
        # 1. Totals
        total_donations = Donation.objects.count()
        claimed = Donation.objects.filter(is_claimed=True).count()
        expired = Donation.objects.filter(is_expired=True).count()
        
        # 2. Donations per day (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        daily_stats = (
            Donation.objects.filter(created_at__gte=seven_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Format dates for Recharts
        chart_data = []
        for entry in daily_stats:
            chart_data.append({
                "date": entry['date'].strftime('%b %d'),
                "count": entry['count']
            })

        return Response({
            "totals": {
                "donations": total_donations,
                "claimed": claimed,
                "expired": expired,
                "available": max(0,total_donations - claimed - expired)
            },
            "chart_data": chart_data
        })