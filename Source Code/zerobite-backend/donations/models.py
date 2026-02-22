from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone

# Use DecimalField for coordinates to keep consistent precision with Donation model
COORD_MAX_DIGITS = 9
COORD_DECIMAL_PLACES = 6


class Donation(models.Model):
    DONOR_ROLE_CHOICES = (
        ('NGO', 'NGO'),
        ('RESTAURANT', 'Restaurant'),
        ('VOLUNTEER', 'Volunteer'),
        ('OTHER', 'Other'),
    )

    # donor details
    donor_name = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)

    # food details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)

    # expiry
    expiry_time = models.DateTimeField(null=True, blank=True)

    # location
    location = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(
        max_digits=COORD_MAX_DIGITS,
        decimal_places=COORD_DECIMAL_PLACES,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=COORD_MAX_DIGITS,
        decimal_places=COORD_DECIMAL_PLACES,
        null=True,
        blank=True,
    )

    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='donations',
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    is_claimed = models.BooleanField(default=False)
    is_expired = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_claimed', 'is_expired', 'expiry_time']),
            models.Index(fields=['donor']),
        ]

    def __str__(self):
        donor_label = self.donor_name or getattr(self.donor, "username", "Unknown")
        return f"{self.name} ({self.quantity}) by {donor_label} — {self.location or 'No location'}"

    def mark_if_expired(self):
        """
        Mark this donation expired if expiry_time has passed.
        Safe to call repeatedly.
        """
        if self.expiry_time and not self.is_expired and timezone.now() >= self.expiry_time:
            self.is_expired = True
            self.save(update_fields=['is_expired'])

    @property
    def remaining_seconds(self):
        """Return seconds until expiry, or None if no expiry or already expired."""
        if not self.expiry_time or self.is_expired:
            return None
        diff = (self.expiry_time - timezone.now()).total_seconds()
        return max(0, int(diff))


class DonationImage(models.Model):
    donation = models.ForeignKey(Donation, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='donation_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for donation {self.donation_id}"


class Order(models.Model):
    """
    Order represents a confirmation/reservation by an NGO/Volunteer for a Donation.
    """
    donation = models.ForeignKey(Donation, on_delete=models.CASCADE, related_name="orders")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    confirmation_note = models.TextField(blank=True, null=True)

    # keep lat/long type consistent with Donation
    latitude = models.DecimalField(
        max_digits=COORD_MAX_DIGITS,
        decimal_places=COORD_DECIMAL_PLACES,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=COORD_MAX_DIGITS,
        decimal_places=COORD_DECIMAL_PLACES,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['donation']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        try:
            return f"Order #{self.pk} by {self.user.username} for {self.donation.name}"
        except Exception:
            return f"Order #{self.pk}"

    # Optional: If you want the DB to auto-mark donation as claimed at save time
    # you can uncomment and use this post_save signal, but note we've already
    # handled this in the view in an atomic transaction (safer).
    #
    # from django.db.models.signals import post_save
    # from django.dispatch import receiver
    #
    # @receiver(post_save, sender='donations.Order')
    # def mark_donation_claimed(sender, instance, created, **kwargs):
    #     if created:
    #         donation = instance.donation
    #         if not donation.is_claimed:
    #             donation.is_claimed = True
    #             donation.save(update_fields=['is_claimed'])
