# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ngo', 'NGO'),
        ('restaurant', 'Restaurant'),
        ('volunteer', 'Volunteer'),
        ('other', 'Other'),
    )

    # keep username from AbstractUser; make email unique
    email = models.EmailField(unique=True)

    # role information
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="other")

    # feature flags (optional, convenience)
    is_restaurant = models.BooleanField(default=False)
    is_ngo = models.BooleanField(default=False)

    # small avatar filename or URL; you can replace with ImageField if you want uploads
    avatar = models.CharField(max_length=200, default="avatar1.png")

    def __str__(self):
        # return username and role for clarity
        return f"{self.username} ({self.role})"
