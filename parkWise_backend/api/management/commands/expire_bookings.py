from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Reservation

class Command(BaseCommand):
    help = 'Marks active reservations with end_time in the past as completed.'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        updated_count = Reservation.objects.filter(
            end_time__lt=now, status="active"
        ).update(status="completed")
        self.stdout.write(self.style.SUCCESS(f"Successfully marked {updated_count} reservations as completed."))
