from django.db.models.signals import post_save
from django.dispatch import receiver
from donations.models import Order
from .models import Notification

@receiver(post_save, sender=Order)
def notify_on_order_changes(sender, instance, created, **kwargs):
    donation = instance.donation
    donor = donation.donor
    ngo = instance.user
    
    # 1. When the NGO first claims the food
    if created:
        Notification.objects.create(
            user=donor,
            title="Food Claimed!",
            message=f"Your donation '{donation.name}' was claimed by {ngo.username}. They are on their way!"
        )
    
    # 2. When the Donor verifies the pickup code
    elif instance.status == "picked_up" and instance.code_verified_at:
        Notification.objects.create(
            user=ngo,
            title="Pickup Verified! ✅",
            message=f"You have successfully picked up '{donation.name}' from {donor.username}. Thank you for rescuing food!"
        )