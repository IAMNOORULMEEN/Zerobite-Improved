from django.db.models.signals import post_save
from django.dispatch import receiver
from donations.models import Order
from .models import Notification

@receiver(post_save, sender=Order)
def notify_donor_on_claim(sender, instance, created, **kwargs):
    if created:
        donation = instance.donation
        donor = donation.donor
        ngo_name = instance.user.username
        
        Notification.objects.create(
            user=donor,
            title="Food Claimed!",
            message=f"Your donation '{donation.name}' was claimed by {ngo_name}. They are on their way!"
        )