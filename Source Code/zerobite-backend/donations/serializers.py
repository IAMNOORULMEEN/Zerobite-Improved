# donations/serializers.py
from rest_framework import serializers
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Donation, DonationImage, Order

User = get_user_model()


# ---------------- Donation image / donation serializers ---------------- #

class DonationImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DonationImage
        fields = ("id", "image", "image_url", "uploaded_at")
        read_only_fields = ("id", "image", "image_url", "uploaded_at")

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        try:
            rel = obj.image.url
        except Exception:
            return None
        if request:
            return request.build_absolute_uri(rel)
        return rel


class DonationSerializer(serializers.ModelSerializer):
    donor_username = serializers.ReadOnlyField(source="donor.username")
    donor_avatar = serializers.ReadOnlyField(source="donor.avatar")
    donor_role = serializers.ReadOnlyField(source="donor.role")
    images = DonationImageSerializer(many=True, read_only=True)
    remaining_seconds = serializers.SerializerMethodField(read_only=True)
    thumbnail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Donation
        fields = [
            "id", "donor_name", "contact_number", "name", "description", "quantity",
            "expiry_time", "remaining_seconds", "location", "latitude", "longitude",
            "donor", "donor_username", "donor_avatar", "donor_role",
            "images", "thumbnail", "created_at", "is_claimed", "is_expired",
        ]
        read_only_fields = [
            "donor", "created_at", "donor_username", "donor_avatar",
            "donor_role", "remaining_seconds", "is_expired", "thumbnail",
        ]

    def get_remaining_seconds(self, obj):
        expiry = getattr(obj, "expiry_time", None)
        if not expiry:
            return None
        now = timezone.now()
        try:
            diff = (expiry - now).total_seconds()
        except Exception:
            return None
        return max(0, int(diff))

    def get_thumbnail(self, obj):
        imgs = getattr(obj, "images", None)
        if imgs:
            try:
                first = imgs.first()
            except Exception:
                first = None
            if first and first.image:
                request = self.context.get("request")
                rel = first.image.url
                if request:
                    return request.build_absolute_uri(rel)
                return rel

        default = getattr(settings, "DEFAULT_DONATION_IMAGE_URL", None)
        if default:
            return default
        return "/static/default_donation.jpg"

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data.pop("donor", None)

        donor_user = getattr(request, "user", None)
        if donor_user and donor_user.is_authenticated:
            donation = Donation.objects.create(donor=donor_user, **validated_data)
        else:
            donation = Donation.objects.create(**validated_data)

        return donation


# ---------------- Admin / utility serializers ---------------- #

class UserListSerializer(serializers.ModelSerializer):
    """Serializer for admin listing of users."""
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "is_active", "is_staff", "last_login")


class DonationAdminSerializer(serializers.ModelSerializer):
    donor_username = serializers.ReadOnlyField(source="donor.username")
    donor_email = serializers.ReadOnlyField(source="donor.email")
    images = DonationImageSerializer(many=True, read_only=True)

    class Meta:
        model = Donation
        fields = [
            "id", "donor", "donor_username", "donor_email", "donor_name", "contact_number",
            "name", "description", "quantity", "expiry_time", "location", "latitude", "longitude",
            "is_claimed", "is_expired", "created_at", "images",
        ]
        read_only_fields = ["id", "donor", "donor_username", "donor_email", "created_at"]


# ---------------- Order serializers ---------------- #

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for Order model.
    - Accepts `donation` (id) in input.
    - Returns nested `donation_details` for responses.
    - `user` is read-only; view should attach user on save.
    """
    donation_details = DonationSerializer(source="donation", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "donation", "donation_details", "user", "confirmation_note", "latitude", "longitude", "created_at"]
        read_only_fields = ["id", "user", "donation_details", "created_at"]

    confirmation_note = serializers.CharField(required=True, allow_blank=False)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)

    def validate(self, attrs):
        """
        Validate:
         - authenticated user
         - user role (NGO or Volunteer)
         - donation present and exists
         - donation not expired or already claimed
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        # role check - case-insensitive
        user_role = getattr(user, "role", "")
        if not isinstance(user_role, str) or user_role.strip().upper() not in ("NGO", "VOLUNTEER"):
            raise serializers.ValidationError("Only NGO or Volunteer users may confirm orders.")

        # donation id input: either present in attrs (if DRF converted to model instance) or in initial_data
        donation = attrs.get("donation", None)
        if donation is None:
            # try initial_data for numeric id
            donation_id = self.initial_data.get("donation")
            if donation_id is None:
                raise serializers.ValidationError({"donation": "Donation id is required."})
            try:
                donation = Donation.objects.get(pk=int(donation_id))
            except Donation.DoesNotExist:
                raise serializers.ValidationError({"donation": "Donation not found."})
            # attach model instance so perform_create / create will have it
            attrs["donation"] = donation
        else:
            # if donation is a PK or instance, normalize to model instance
            if isinstance(donation, int):
                try:
                    attrs["donation"] = Donation.objects.get(pk=donation)
                except Donation.DoesNotExist:
                    raise serializers.ValidationError({"donation": "Donation not found."})

        # Now validate donation state
        donation_obj = attrs.get("donation")
        # Ensure donation is up-to-date regarding expiry
        try:
            donation_obj.mark_if_expired()
        except Exception:
            # ignore if mark_if_expired fails; we'll still check flags below
            pass

        if getattr(donation_obj, "is_expired", False):
            raise serializers.ValidationError({"detail": "This donation has expired and cannot be confirmed."})
        if getattr(donation_obj, "is_claimed", False):
            raise serializers.ValidationError({"detail": "This donation has already been claimed."})

        return attrs

    def create(self, validated_data):
        """
        Create Order. View typically calls serializer.save(user=request.user).
        We fallback to using request.user if user not passed in `save()` call.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Ensure donation is the instance (validate ensures this)
        donation = validated_data.get("donation")

        # Remove any accidental user key
        validated_data.pop("user", None)

        # If view provided user in save(), serializer.save(user=...), that will be used instead.
        # Here we create directly if necessary.
        if user and user.is_authenticated:
            order = Order.objects.create(user=user, **validated_data)
        else:
            order = Order.objects.create(**validated_data)

        # Mark donation claimed — best practice: view does it in atomic transaction.
        try:
            donation.is_claimed = True
            donation.save(update_fields=["is_claimed"])
        except Exception:
            pass

        return order


class OrderAdminSerializer(serializers.ModelSerializer):
    donation_details = DonationSerializer(source="donation", read_only=True)
    user_username = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Order
        fields = ["id", "donation", "donation_details", "user", "user_username", "confirmation_note", "latitude", "longitude", "created_at"]
        read_only_fields = ["id", "created_at"]
