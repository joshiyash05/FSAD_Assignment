from django.core.management.base import BaseCommand
from api.models import Amenity

class Command(BaseCommand):
    help = 'Seeds the database with initial amenities.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding amenities...")
        
        amenities_data = [
            {"name": "HP Petrol Pump", "category": "petrol", "distance": "200m from gate 1", "operating_hours": "6 AM – 11 PM"},
            {"name": "EV Charging Station", "category": "ev", "distance": "Inside lot Zone B", "operating_hours": "24 hours", "extra_info": "2 of 4 chargers free"},
            {"name": "Cafe Coffee Day", "category": "cafe", "distance": "100m from gate 1", "operating_hours": "8 AM – 10 PM"},
            {"name": "MedPlus Pharmacy", "category": "pharmacy", "distance": "350m from gate 2", "operating_hours": "8 AM – 10 PM"},
            {"name": "SBI ATM", "category": "atm", "distance": "150m from gate 1", "operating_hours": "24 hours"},
            {"name": "Indian Oil Pump", "category": "petrol", "distance": "500m from gate 2", "operating_hours": "24 hours"},
        ]

        for data in amenities_data:
            Amenity.objects.update_or_create(
                name=data['name'],
                defaults={
                    'category': data['category'],
                    'distance': data['distance'],
                    'operating_hours': data.get('operating_hours', ''),
                    'extra_info': data.get('extra_info', ''),
                    'is_open': True # Default to true as per model
                }
            )
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {Amenity.objects.count()} amenities."))
