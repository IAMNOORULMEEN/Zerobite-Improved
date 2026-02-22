from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import Donation
from .serializers import UserListSerializer, DonationAdminSerializer

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/admin/users/  (admin only)
    """
    queryset = User.objects.all().order_by("-last_login")
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminDonationListView(generics.ListAPIView):
    """
    GET /api/admin/donations/  (admin only)
    """
    queryset = Donation.objects.all().order_by("-created_at")
    serializer_class = DonationAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class AdminDonationDeleteView(APIView):
    """
    DELETE /api/admin/donations/<pk>/  (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk, format=None):
        try:
            donation = Donation.objects.get(pk=pk)
        except Donation.DoesNotExist:
            raise NotFound(detail="Donation not found")

        donation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
