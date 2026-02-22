# users/views.py
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db.models import ProtectedError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Public endpoint to register a new user."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    """Login endpoint that returns JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username_or_email = request.data.get("username")
        password = request.data.get("password")

        if not username_or_email or not password:
            return Response({"detail": "username and password required"}, status=400)

        # Try authenticate by username
        user = authenticate(username=username_or_email, password=password)

        # Try by email if not found
        if user is None:
            try:
                lookup = User.objects.get(email__iexact=username_or_email)
            except User.DoesNotExist:
                lookup = None
            if lookup:
                user = authenticate(username=lookup.username, password=password)

        if user is None:
            return Response({"detail": "Invalid credentials"}, status=401)

        # ⚠️ Special Admin Case (only in DEBUG mode)
        if settings.DEBUG and username_or_email == "administrator" and password == "cfgvb":
            user.is_staff = True
            user.save(update_fields=["is_staff"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user, context={"request": request}).data,
            }
        )


class UserListView(generics.ListAPIView):
    """Admin-only: list all users ordered by newest first."""
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDeleteView(APIView):
    """Admin-only: delete a given user by id."""
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, id, *args, **kwargs):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if user.is_superuser:
            return Response({"detail": "Cannot delete superuser"}, status=403)

        try:
            user.delete()
        except ProtectedError:
            return Response({"detail": "User cannot be deleted (related objects exist)"}, status=409)

        return Response(status=204)


@api_view(["POST"])
@permission_classes([IsAdminUser])  # only admins can reset others' passwords
def reset_password_direct(request):
    """Admin-only: reset a user's password directly."""
    username = request.data.get("username")
    new_password = request.data.get("password")

    if not username or not new_password:
        return Response({"detail": "username and password are required"}, status=400)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    user.set_password(new_password)
    user.save()
    return Response({"status": "OK", "message": "Password updated successfully"}, status=200)
