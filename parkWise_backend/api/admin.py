from django.contrib import admin
from .models import Spot, Vehicle, Reservation, Payment, Amenity


@admin.register(Spot)
class SpotAdmin(admin.ModelAdmin):
    list_display = ['label', 'zone', 'spot_type', 'is_active', 'description', 'created_at']
    list_filter = ['is_active', 'zone', 'spot_type']
    search_fields = ['label', 'description']
    list_editable = ['is_active']


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['user', 'plate_number', 'model_name', 'vehicle_type', 'is_default']
    list_filter = ['vehicle_type', 'is_default']
    search_fields = ['user__username', 'plate_number', 'model_name']
    raw_id_fields = ['user'] # For better user selection in admin


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['user', 'spot', 'vehicle', 'start_time', 'end_time', 'status', 'duration_hours', 'amount', 'created_at']
    list_filter = ['status', 'spot__zone', 'start_time', 'end_time']
    search_fields = ['user__username', 'spot__label', 'vehicle__plate_number']
    readonly_fields = ['duration_hours', 'amount', 'created_at']
    raw_id_fields = ['user', 'spot', 'vehicle']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'amount', 'status', 'razorpay_order_id', 'razorpay_payment_id', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['reservation__user__username', 'reservation__spot__label', 'razorpay_order_id', 'razorpay_payment_id']
    readonly_fields = ['created_at']
    raw_id_fields = ['reservation']


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'distance', 'is_open', 'operating_hours']
    list_filter = ['category', 'is_open']
    search_fields = ['name', 'distance', 'extra_info']
