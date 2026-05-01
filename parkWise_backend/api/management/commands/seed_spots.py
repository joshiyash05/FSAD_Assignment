from django.core.management.base import BaseCommand
from api.models import Spot

class Command(BaseCommand):
    help = 'Seeds the database with initial parking spots.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding spots...")
        
        spots_to_create = []

        # Zone A: A1-A18
        for i in range(1, 19):
            label = f"A{i}"
            spot_type = "regular"
            description = ""
            if i == 1:
                description = "Near gate 1"
            elif i == 5:
                spot_type = "ev"
                description = "EV Charging Spot"
            elif i == 10:
                spot_type = "handicap"
                description = "Handicap Accessible"
            elif i == 15:
                spot_type = "covered"
                description = "Covered Parking"
            spots_to_create.append(Spot(label=label, zone="A", spot_type=spot_type, description=description))

        # Zone B: B1-B12
        for i in range(1, 13):
            label = f"B{i}"
            spot_type = "regular"
            if i == 3:
                spot_type = "covered"
                description = "Covered Parking"
            spots_to_create.append(Spot(label=label, zone="B", spot_type=spot_type, description=description))

        Spot.objects.bulk_create(spots_to_create, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {Spot.objects.count()} spots."))
