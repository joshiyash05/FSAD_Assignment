# ParkWise Video Presentation Summary

## Project Overview
ParkWise is a full-stack smart parking reservation system. It helps users find available parking spots, book a slot, manage vehicles, view nearby amenities, and track reservations through a clean web interface.

## Tech Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Django, Django REST Framework
- Database: Django ORM models
- Authentication: Token-based login and protected API requests
- Payments: Razorpay order and verification flow

## Main Features
- User registration, login, logout, and session handling
- Live spot availability based on selected date and time
- Parking reservation creation, cancellation, and history
- Vehicle management with default vehicle selection
- QR code display for confirmed bookings
- Nearby amenities such as EV charging, cafes, ATMs, petrol pumps, and pharmacies
- User dashboard with reservation statistics
- Admin dashboard for reservations, spot updates, and system statistics

## Backend Highlights
- Core models: Spot, Vehicle, Reservation, Payment, and Amenity
- Reservation amount is calculated from duration plus GST
- Availability API checks active bookings to prevent slot conflicts
- Expired reservations can be automatically marked completed
- Admin-only APIs provide operational visibility and spot management

## Frontend Highlights
- Central API service handles all backend calls from one file
- Auth token is stored locally and attached to requests automatically
- Unauthorized users are redirected to login
- Separate pages cover dashboard, booking, payment, confirmation, profile, nearby amenities, and admin views
- Reusable components support tables, booking drawer, QR dialog, layout, and toast notifications

## Demo Flow
1. Start from login or registration.
2. Show the dashboard and available parking summary.
3. Select date and time to check spot availability.
4. Add or choose a vehicle.
5. Create a reservation and continue to payment.
6. Show confirmation with QR code.
7. Visit profile or bookings to manage reservations.
8. Open admin view to show reservation monitoring and statistics.

## Key API Endpoints
- `auth/login/`, `auth/register/`, `auth/logout/`
- `spots/availability/`
- `vehicles/`
- `reservations/`
- `reservations/stats/`
- `payments/create-order/`, `payments/verify/`
- `amenities/`
- `admin/stats/`, `admin/reservations/`

## Closing Point
ParkWise demonstrates a practical parking workflow from authentication to booking, payment, QR confirmation, and admin monitoring. The project combines a typed React frontend with a REST-based Django backend to deliver a complete end-to-end application.
