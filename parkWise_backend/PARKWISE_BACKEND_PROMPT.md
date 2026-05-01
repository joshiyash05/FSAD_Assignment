# ParkWise — Backend Development Prompt (Django + DRF)

## Project overview

ParkWise is a parking spot finder and reservation system. Users can view real-time parking availability on a visual lot map, select a date/time window, reserve a spot, pay via Razorpay, and get a QR code for entry. Admins can manage spots, view all reservations, and see analytics.

**Tech stack:** Python 3.11+, Django 5.x, Django REST Framework, SQLite (default), Razorpay Python SDK

---

## Project structure

```
parkwise-backend/
├── parkwise/                  # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/                       # Main app
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── permissions.py
│   ├── admin.py
│   └── management/
│       └── commands/
│           ├── seed_spots.py
│           ├── seed_amenities.py
│           └── expire_bookings.py
├── manage.py
├── requirements.txt
└── .env
```

---

## Setup instructions

### 1. Initialize project

```bash
django-admin startproject parkwise .
python manage.py startapp api
```

### 2. Install dependencies

```
# requirements.txt
django>=5.0
djangorestframework
django-cors-headers
razorpay
python-dotenv
```

### 3. Configure settings.py

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... default middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Razorpay
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_xxxxx')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'xxxxx')
```

---

## Models (api/models.py)

Implement these 5 models. Use Django's built-in User model for auth.

### Spot

```python
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
```

### Vehicle

```python
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
            Vehicle.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.plate_number} - {self.model_name}"
```

### Reservation

```python
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
```

### Payment

```python
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
```

### Amenity

```python
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
```

---

## API endpoints (api/urls.py)

All endpoints are prefixed with `/api/`.

### Auth endpoints (no authentication required)

| Method | URL | Description | Request body |
|--------|-----|-------------|-------------|
| POST | `/api/auth/register/` | Register new user | `{ "username", "email", "password", "first_name", "last_name", "phone" }` |
| POST | `/api/auth/login/` | Login, returns token | `{ "username", "password" }` |
| POST | `/api/auth/logout/` | Logout, deletes token | — |

**Register endpoint logic:**
1. Create user with `User.objects.create_user()`
2. Create auth token with `Token.objects.create(user=user)`
3. Return `{ "token": token.key, "user": { id, username, email, first_name } }`

**Login endpoint logic:**
1. Authenticate with `authenticate(username, password)`
2. Get or create token
3. Return same shape as register

### Spots endpoints

| Method | URL | Description | Auth | Query params |
|--------|-----|-------------|------|-------------|
| GET | `/api/spots/` | List all active spots | Yes | — |
| GET | `/api/spots/availability/` | Get spots with availability for a time window | Yes | `date`, `start_time`, `end_time` |

**Availability endpoint logic:**
This is the most important endpoint. Given a date + start + end time:
1. Query all active spots
2. For each spot, check if any ACTIVE reservation overlaps the requested window
3. Overlap condition: `reservation.start_time < requested_end AND reservation.end_time > requested_start`
4. Return each spot with a `status` field: `"available"`, `"occupied"`, or `"opening_soon"`
5. `"opening_soon"` = spot is currently occupied but will be free within the requested window

**Response format:**
```json
{
    "spots": [
        {
            "id": 1,
            "label": "A1",
            "zone": "A",
            "spot_type": "regular",
            "description": "Near gate 1",
            "status": "available"
        },
        {
            "id": 4,
            "label": "A4",
            "zone": "A",
            "spot_type": "covered",
            "description": "Covered parking",
            "status": "occupied"
        }
    ],
    "summary": {
        "total": 30,
        "available": 18,
        "occupied": 10,
        "opening_soon": 2
    }
}
```

### Reservations endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/reservations/` | List current user's reservations | Yes |
| POST | `/api/reservations/` | Create new reservation | Yes |
| PATCH | `/api/reservations/{id}/cancel/` | Cancel a reservation | Yes |
| GET | `/api/reservations/stats/` | Get user's parking stats | Yes |

**Create reservation logic:**
1. Validate: `start_time` < `end_time`, both in future
2. Check for overlap: no ACTIVE reservation on the same spot in the time window
3. Create reservation with status `"active"`
4. Return reservation data with calculated `amount`

**Request body:**
```json
{
    "spot_id": 3,
    "vehicle_id": 1,
    "start_time": "2026-04-29T09:00:00",
    "end_time": "2026-04-29T17:00:00"
}
```

**Cancel logic:**
1. Only the owner can cancel
2. Only `"active"` reservations can be cancelled
3. If payment exists and is `"paid"`, mark payment as `"refunded"`
4. Set reservation status to `"cancelled"`

**Stats endpoint response:**
```json
{
    "total_bookings": 27,
    "total_hours": 86,
    "cancellations": 2,
    "favourite_spot": "A6"
}
```
Favourite spot = the spot with the most reservations for this user (`GROUP BY spot, ORDER BY COUNT DESC, LIMIT 1`).

### Vehicles endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/vehicles/` | List current user's vehicles | Yes |
| POST | `/api/vehicles/` | Add a vehicle | Yes |
| PATCH | `/api/vehicles/{id}/` | Update vehicle | Yes |
| DELETE | `/api/vehicles/{id}/` | Delete vehicle | Yes |
| POST | `/api/vehicles/{id}/set-default/` | Set as default vehicle | Yes |

All vehicle endpoints are scoped to the current user. A user should never see or modify another user's vehicles.

### Payments endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/payments/create-order/` | Create Razorpay order | Yes |
| POST | `/api/payments/verify/` | Verify payment signature | Yes |

**Create order logic:**
```python
import razorpay
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_order(request):
    reservation_id = request.data['reservation_id']
    reservation = Reservation.objects.get(id=reservation_id, user=request.user)
    amount_paise = int(reservation.amount * 100)  # Razorpay uses paise

    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"PKW-{reservation.id}",
    })

    Payment.objects.create(
        reservation=reservation,
        razorpay_order_id=order['id'],
        amount=reservation.amount,
        status="pending"
    )

    return Response({
        "order_id": order['id'],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    })
```

**Verify payment logic:**
```python
def verify_payment(request):
    razorpay_order_id = request.data['razorpay_order_id']
    razorpay_payment_id = request.data['razorpay_payment_id']
    razorpay_signature = request.data['razorpay_signature']

    # Verify signature
    client.utility.verify_payment_signature({
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature,
    })

    payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = "paid"
    payment.save()

    return Response({"status": "Payment verified successfully"})
```

### Amenities endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/amenities/` | List all amenities | Yes |

Simple read-only endpoint. Amenities are seeded via management command.

### Admin endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/admin/reservations/` | List ALL reservations (admin only) | Admin |
| GET | `/api/admin/stats/` | Get system-wide stats | Admin |
| PATCH | `/api/admin/spots/{id}/` | Update spot (activate/deactivate) | Admin |

**Admin stats response:**
```json
{
    "total_users": 84,
    "active_bookings": 12,
    "revenue_today": 4280,
    "occupancy_percent": 40
}
```

Use `IsAdminUser` permission class for admin endpoints.

---

## Management commands

### seed_spots.py
Create 30 spots: A1–A18 (Zone A) and B1–B12 (Zone B). Mix of types: mostly regular, a few covered, EV, and handicap.

### seed_amenities.py
Create 6 amenities:
- HP Petrol Pump — petrol — 200m from gate 1 — 6 AM – 11 PM
- EV Charging Station — ev — Inside lot Zone B — 24 hours — "2 of 4 chargers free"
- Cafe Coffee Day — cafe — 100m from gate 1 — 8 AM – 10 PM
- MedPlus Pharmacy — pharmacy — 350m from gate 2 — 8 AM – 10 PM
- SBI ATM — atm — 150m from gate 1 — 24 hours
- Indian Oil Pump — petrol — 500m from gate 2 — 24 hours

### expire_bookings.py
One-liner command that marks all active reservations with `end_time < now` as `"completed"`:
```python
Reservation.objects.filter(end_time__lt=timezone.now(), status="active").update(status="completed")
```

---

## Admin panel (api/admin.py)

Register all models in Django admin. This serves as the admin dashboard — no need to build a separate React admin page. Customize the admin with:
- `list_display` for each model showing key fields
- `list_filter` for status fields
- `search_fields` for user/spot lookup
- `readonly_fields` for computed fields

```python
@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['user', 'spot', 'start_time', 'end_time', 'status', 'created_at']
    list_filter = ['status', 'spot__zone']
    search_fields = ['user__username', 'spot__label']
```

---

## CORS and auth flow

1. Frontend sends `POST /api/auth/login/` with credentials
2. Backend returns `{ "token": "abc123...", "user": {...} }`
3. Frontend stores token in localStorage
4. All subsequent requests include header: `Authorization: Token abc123...`
5. DRF's `TokenAuthentication` handles verification

---

## Key business rules

1. A spot can only have ONE active reservation at any given time window (no overlaps)
2. Users can only cancel their own reservations
3. Only active reservations can be cancelled
4. Payment must be created after reservation, verified after Razorpay callback
5. Each user can have multiple vehicles, one marked as default
6. Pricing: ₹20 per hour base rate + 18% GST
7. Cancellation before 1 hour of start time gets full refund
8. Spots can be deactivated by admin (won't show in availability)

---

## Environment variables (.env)

```
SECRET_KEY=your-django-secret-key
DEBUG=True
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

---

## Quick start commands

```bash
pip install -r requirements.txt
python manage.py makemigrations api
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_spots
python manage.py seed_amenities
python manage.py runserver
```

Server runs at `http://localhost:8000`. Admin panel at `http://localhost:8000/admin/`.
DRF browsable API at `http://localhost:8000/api/`.
