# donations/management/commands/mark_expired.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from donations.models import Donation


class Command(BaseCommand):
    help = 'Marks all donations as expired if their expiry_time has passed.'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        
        # Find all donations that are expired but not yet marked as such
        expired_donations = Donation.objects.filter(
            expiry_time__lte=now,
            is_expired=False
        )
        
        count = expired_donations.count()
        
        if count > 0:
            # Bulk update them in a single query for performance
            expired_donations.update(is_expired=True)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully marked {count} donations as expired.')
            )
        else:
            self.stdout.write(self.style.SUCCESS('No new donations to expire.'))