from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Spot, Vehicle, Reservation, Payment, Amenity


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=15, required=False) # Assuming phone is added to User model or profile

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone']

    def create(self, validated_data):
        # For simplicity, phone is not directly handled here as it's not in default User model.
        # If you extend User, you'd save it there.
        validated_data.pop('phone', None) 
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for the login request payload."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class SpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spot
        fields = '__all__'


class SpotAvailabilitySerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Spot
        fields = ['id', 'label', 'zone', 'spot_type', 'description', 'status']


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['user']


class ReservationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    spot = SpotSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    duration_hours = serializers.FloatField(read_only=True)
    amount = serializers.FloatField(read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'


class ReservationCreateSerializer(serializers.ModelSerializer):
    spot_id = serializers.PrimaryKeyRelatedField(queryset=Spot.objects.all(), source='spot')
    vehicle_id = serializers.PrimaryKeyRelatedField(queryset=Vehicle.objects.all(), source='vehicle', allow_null=True)

    class Meta:
        model = Reservation
        fields = ['spot_id', 'vehicle_id', 'start_time', 'end_time']

    def validate(self, data):
        start_time = data['start_time']
        end_time = data['end_time']
        spot = data['spot']
        user = self.context['request'].user

        if start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")
        if start_time < timezone.now():
            raise serializers.ValidationError("Reservation start time cannot be in the past.")

        # Check for overlapping reservations for the same spot
        overlapping_reservations = Reservation.objects.filter(
            spot=spot,
            status='active',
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        if overlapping_reservations:
            raise serializers.ValidationError("This spot is already reserved for the requested time window.")
        
        # Ensure the vehicle belongs to the user if provided
        if data.get('vehicle') and data['vehicle'].user != user:
            raise serializers.ValidationError("The selected vehicle does not belong to this user.")

        return data


class CreateRazorpayOrderSerializer(serializers.Serializer):
    """Serializer for creating a Razorpay order."""
    reservation_id = serializers.IntegerField()


class VerifyRazorpayPaymentSerializer(serializers.Serializer):
    """Serializer for verifying a Razorpay payment."""
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = '__all__'
