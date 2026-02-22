# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password2", "role", "avatar"]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
        }

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def validate(self, data):
        # simple password validation; you can use more rules or require password2
        password = data.get("password")
        # optional confirm
        password2 = data.get("password2")
        if password2 is not None and password != password2:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        # run Django validators
        try:
            validate_password(password)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data.get("email"),
            role=validated_data.get("role", "other"),
            avatar=validated_data.get("avatar", "avatar1.png"),
        )
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "avatar", "is_staff", "is_superuser"]
        read_only_fields = ["is_staff", "is_superuser"]
    