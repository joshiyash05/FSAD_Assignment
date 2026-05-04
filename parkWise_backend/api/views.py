import os
import razorpay
from datetime import datetime, timedelta
from django.db.models import Count, Sum, F, Q
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from .models import Spot, Vehicle, Reservation, Payment, Amenity
from .serializers import (
    UserSerializer, RegisterSerializer, SpotSerializer, SpotAvailabilitySerializer,
    VehicleSerializer, ReservationSerializer, ReservationCreateSerializer,
    PaymentSerializer, AmenitySerializer, LoginSerializer,
    CreateRazorpayOrderSerializer, VerifyRazorpayPaymentSerializer
)
from .permissions import IsOwnerOrAdmin


# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))


def expire_completed_reservations():
    """Mark active reservations whose checkout time has passed as completed."""
    return Reservation.objects.filter(
        status='active',
        end_time__lte=timezone.now()
    ).update(status='completed')


# --- Authentication Views ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer)
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": UserSerializer(user).data
            })
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


# --- Spot Views ---
class SpotListView(generics.ListAPIView):
    queryset = Spot.objects.filter(is_active=True)
    serializer_class = SpotSerializer
    permission_classes = [IsAuthenticated]


class SpotAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        expire_completed_reservations()

        date_str = request.query_params.get('date')
        start_time_str = request.query_params.get('start_time')
        end_time_str = request.query_params.get('end_time')

        if not all([date_str, start_time_str, end_time_str]):
            return Response({"error": "date, start_time, and end_time are required query parameters."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Combine date with time strings to create full datetime objects
            requested_start = timezone.make_aware(datetime.strptime(f"{date_str} {start_time_str}", "%Y-%m-%d %H:%M:%S"))
            requested_end = timezone.make_aware(datetime.strptime(f"{date_str} {end_time_str}", "%Y-%m-%d %H:%M:%S"))
        except ValueError:
            return Response({"error": "Invalid date or time format. Use YYYY-MM-DD and HH:MM:SS."},
                            status=status.HTTP_400_BAD_REQUEST)

        if requested_start >= requested_end:
            return Response({"error": "Start time must be before end time."}, status=status.HTTP_400_BAD_REQUEST)

        all_active_spots = Spot.objects.filter(is_active=True).order_by('zone', 'label')
        
        available_spots = []
        occupied_spots = []
        opening_soon_spots = []

        for spot in all_active_spots:
            # Check for any active reservation that overlaps the requested window
            overlapping_active_reservations = Reservation.objects.filter(
                spot=spot,
                status='active',
                start_time__lt=requested_end,
                end_time__gt=requested_start
            ).exists()

            if not overlapping_active_reservations:
                spot.status = "available"
                available_spots.append(spot)
            else:
                # Check if the spot is currently occupied but will be free within the requested window
                # This means there's an active reservation that ends within the requested window
                # and starts before or during the requested window.
                # More precisely, an active reservation that overlaps, but ends before requested_end.
                # If it ends *after* requested_end, it's just occupied.
                
                # Find the reservation that causes the overlap
                current_reservation = Reservation.objects.filter(
                    spot=spot,
                    status='active',
                    start_time__lt=requested_end,
                    end_time__gt=requested_start
                ).first()

                if current_reservation and current_reservation.end_time <= requested_end:
                    spot.status = "opening_soon"
                    opening_soon_spots.append(spot)
                else:
                    spot.status = "occupied"
                    occupied_spots.append(spot)

        response_data = {
            "spots": SpotAvailabilitySerializer(available_spots + occupied_spots + opening_soon_spots, many=True).data,
            "summary": {
                "total": all_active_spots.count(),
                "available": len(available_spots),
                "occupied": len(occupied_spots),
                "opening_soon": len(opening_soon_spots)
            }
        }
        return Response(response_data)


# --- Vehicle Views ---
class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user).order_by('-is_default', 'plate_number')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        vehicle = self.get_object()
        if vehicle.user != request.user:
            return Response({"detail": "Not authorized to modify this vehicle."}, status=status.HTTP_403_FORBIDDEN)
        
        vehicle.is_default = True
        vehicle.save() # The save method handles unsetting other defaults
        return Response(self.get_serializer(vehicle).data)


# --- Reservation Views ---
class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        expire_completed_reservations()
        return Reservation.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        expire_completed_reservations()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(user=request.user)
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()

        if reservation.user != request.user:
            return Response({"detail": "Not authorized to cancel this reservation."}, status=status.HTTP_403_FORBIDDEN)

        if reservation.status != 'active':
            return Response({"detail": "Only active reservations can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for cancellation policy (e.g., 1 hour before start time for full refund)
        # For simplicity, we'll just cancel here. Refund logic would be more complex.
        if reservation.start_time - timezone.now() < timedelta(hours=1):
            # This is where you'd implement partial or no refund logic
            pass 

        # If payment exists and is paid, mark as refunded
        if hasattr(reservation, 'payment') and reservation.payment.status == 'paid':
            reservation.payment.status = 'refunded'
            reservation.payment.save()

        reservation.status = 'cancelled'
        reservation.save()
        return Response(self.get_serializer(reservation).data)


class ReservationStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        expire_completed_reservations()
        user_reservations = Reservation.objects.filter(user=request.user)

        total_bookings = user_reservations.count()
        total_hours = user_reservations.aggregate(total_h=Sum(F('end_time') - F('start_time')))['total_h']
        total_hours_float = round(total_hours.total_seconds() / 3600, 1) if total_hours else 0.0
        
        cancellations = user_reservations.filter(status='cancelled').count()

        favourite_spot_query = user_reservations.values('spot__label').annotate(
            count=Count('spot__label')
        ).order_by('-count').first()
        favourite_spot = favourite_spot_query['spot__label'] if favourite_spot_query else None

        return Response({
            "total_bookings": total_bookings,
            "total_hours": total_hours_float,
            "cancellations": cancellations,
            "favourite_spot": favourite_spot
        })


# --- Payment Views ---
class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CreateRazorpayOrderSerializer)
    def post(self, request, *args, **kwargs):
        expire_completed_reservations()

        reservation_id = request.data.get('reservation_id')
        if not reservation_id:
            return Response({"error": "reservation_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation = Reservation.objects.get(id=reservation_id, user=request.user)
        except Reservation.DoesNotExist:
            return Response({"error": "Reservation not found or does not belong to user."}, status=status.HTTP_404_NOT_FOUND)

        if reservation.end_time <= timezone.now():
            reservation.status = 'completed'
            reservation.save(update_fields=['status'])
            return Response({"error": "This reservation has already expired."}, status=status.HTTP_400_BAD_REQUEST)
        
        if hasattr(reservation, 'payment') and reservation.payment.status == 'paid':
            return Response({"error": "Payment for this reservation is already completed."}, status=status.HTTP_400_BAD_REQUEST)

        amount_paise = int(reservation.amount * 100)  # Razorpay uses paise

        try:
            order = razorpay_client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"PKW-{reservation.id}",
            })

            payment, created = Payment.objects.update_or_create(
                reservation=reservation,
                defaults={
                    'razorpay_order_id': order['id'],
                    'amount': reservation.amount,
                    'status': "pending"
                }
            )

            return Response({
                "order_id": order['id'],
                "amount": amount_paise,
                "currency": "INR",
                "key_id": os.getenv('RAZORPAY_KEY_ID'),
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=VerifyRazorpayPaymentSerializer)
    def post(self, request, *args, **kwargs):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({"error": "Missing Razorpay payment details."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify signature
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })

            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = "paid"
            payment.save()

            # Optionally, update reservation status if needed (e.g., to 'confirmed')
            # reservation = payment.reservation
            # reservation.status = 'confirmed' 
            # reservation.save()

            return Response({"status": "Payment verified successfully"})
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Payment verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# --- Amenity Views ---
class AmenityListView(generics.ListAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAuthenticated]


# --- Admin Views ---
class AdminReservationListView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        expire_completed_reservations()
        return Reservation.objects.all().order_by('-created_at')


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        expire_completed_reservations()
        total_users = User.objects.count()
        active_bookings = Reservation.objects.filter(status='active').count()

        # Revenue today (assuming 'paid' payments created today)
        today = timezone.now().date()
        revenue_today_query = Payment.objects.filter(
            status='paid',
            created_at__date=today
        ).aggregate(total_revenue=Sum('amount'))['total_revenue']
        revenue_today = revenue_today_query if revenue_today_query else 0

        # Occupancy percentage (active spots vs total spots)
        total_spots = Spot.objects.filter(is_active=True).count()
        occupied_spots_count = Reservation.objects.filter(
            status='active',
            start_time__lte=timezone.now(),
            end_time__gte=timezone.now()
        ).values('spot').distinct().count()
        
        occupancy_percent = (occupied_spots_count / total_spots * 100) if total_spots > 0 else 0

        return Response({
            "total_users": total_users,
            "active_bookings": active_bookings,
            "revenue_today": round(revenue_today, 2),
            "occupancy_percent": round(occupancy_percent, 2)
        })


class AdminSpotUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Spot.objects.all()
    serializer_class = SpotSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'pk' # Default is 'pk', but good to be explicit
