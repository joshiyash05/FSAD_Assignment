from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Spot(models.Model):
    label = models.CharField(max_length=10, unique=True)       # "A1", "A2", "B1"
    zone = models.CharField(max_length=50, default="A")        # "A" or "B"
    spot_type = models.CharField(max_length=20, default="regular")  # "regular", "ev", "handicap", "covered"
    is_active = models.BooleanField(default=True)
    description = models.CharField(max_length=100, blank=True)  # "Near gate 1", "Near elevator"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['zone', 'label']

    def __str__(self):
        return f"{self.label} (Zone {self.zone})"


class Vehicle(models.Model):
    VEHICLE_TYPES = [("car", "Car"), ("two_wheeler", "Two-wheeler"), ("suv", "SUV")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    plate_number = models.CharField(max_length=20)
    model_name = models.CharField(max_length=100)              # "Hyundai Creta"
    color = models.CharField(max_length=30, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default="car")
    fuel_type = models.CharField(max_length=20, default="petrol")  # "petrol", "diesel", "ev"
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ['user', 'plate_number']

    def save(self, *args, **kwargs):
        # If this is being set as default, unset all other defaults for this user
        if self.is_default:
            Vehicle.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.plate_number} - {self.model_name}"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    spot = models.ForeignKey(Spot, on_delete=models.CASCADE, related_name='reservations')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.spot.label} ({self.status})"

    @property
    def duration_hours(self):
        delta = self.end_time - self.start_time
        return round(delta.total_seconds() / 3600, 1)

    @property
    def amount(self):
        """Calculate total amount: ₹20/hour + 18% GST"""
        base = self.duration_hours * 20
        gst = base * 0.18
        return round(base + gst, 2)


class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("refunded", "Refunded"),
    ]

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='payment')
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.razorpay_order_id} — {self.status}"


class Amenity(models.Model):
    CATEGORY_CHOICES = [
        ("petrol", "Petrol Pump"),
        ("ev", "EV Charging"),
        ("cafe", "Cafe"),
        ("pharmacy", "Pharmacy"),
        ("atm", "ATM"),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    distance = models.CharField(max_length=50)                  # "200m from gate 1"
    is_open = models.BooleanField(default=True)
    operating_hours = models.CharField(max_length=50, blank=True)  # "6 AM – 11 PM"
    extra_info = models.CharField(max_length=100, blank=True)     # "2 of 4 chargers free"

    def __str__(self):
        return f"{self.name} ({self.category})"
