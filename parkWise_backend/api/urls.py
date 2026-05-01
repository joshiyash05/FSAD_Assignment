from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView,
    SpotListView, SpotAvailabilityView,
    VehicleViewSet,
    ReservationViewSet, ReservationStatsView,
    CreateRazorpayOrderView, VerifyRazorpayPaymentView,
    AmenityListView,
    AdminReservationListView, AdminStatsView, AdminSpotUpdateView
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'reservations', ReservationViewSet, basename='reservation')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Spots
    path('spots/', SpotListView.as_view(), name='spot-list'),
    path('spots/availability/', SpotAvailabilityView.as_view(), name='spot-availability'),

    # Reservations (custom stats)
    path('reservations/stats/', ReservationStatsView.as_view(), name='reservation-stats'),

    # Payments
    path('payments/create-order/', CreateRazorpayOrderView.as_view(), name='create-razorpay-order'),
    path('payments/verify/', VerifyRazorpayPaymentView.as_view(), name='verify-razorpay-payment'),

    # Amenities
    path('amenities/', AmenityListView.as_view(), name='amenity-list'),

    # Admin
    path('admin/reservations/', AdminReservationListView.as_view(), name='admin-reservation-list'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/spots/<int:pk>/', AdminSpotUpdateView.as_view(), name='admin-spot-update'),

    # DRF Router for ViewSets
    path('', include(router.urls)),
]
