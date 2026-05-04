// Comprehensive TypeScript types for the ParkWise frontend

// ========== User & Auth ==========
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
}

// ========== Parking Spots ==========
export interface Spot {
  id: number
  label: string
  zone: string
  spot_type: 'regular' | 'ev' | 'handicap' | 'covered'
  is_active: boolean
  description?: string
  created_at?: string
  status?: 'available' | 'occupied' | 'opening_soon'
}

export interface SpotAvailabilityRequest {
  date: string
  start_time: string
  end_time: string
}

export interface AvailabilityResponse {
  spots: Spot[]
  summary: {
    total: number
    available: number
    occupied: number
    opening_soon: number
  }
}

// ========== Vehicles ==========
export interface Vehicle {
  id: number
  user?: number
  plate_number: string
  model_name: string
  color?: string
  vehicle_type: 'car' | 'two_wheeler' | 'suv'
  fuel_type: 'petrol' | 'diesel' | 'ev'
  is_default: boolean
}

export interface CreateVehicleRequest {
  plate_number: string
  model_name: string
  color?: string
  vehicle_type: 'car' | 'two_wheeler' | 'suv'
  fuel_type: 'petrol' | 'diesel' | 'ev'
}

// ========== Reservations ==========
export interface Reservation {
  id: number
  user?: User
  spot: Spot
  vehicle?: Vehicle
  start_time: string
  end_time: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  duration_hours: number
  amount: number
}

export interface CreateReservationRequest {
  spot_id: number
  vehicle_id?: number
  start_time: string
  end_time: string
}

export interface ReservationStats {
  total_bookings: number
  total_hours: number
  cancellations: number
  favourite_spot?: string
}

// ========== Payments & Razorpay ==========
export interface Payment {
  id: number
  reservation: Reservation
  razorpay_order_id: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  amount: number
  status: 'pending' | 'paid' | 'refunded'
  created_at: string
}

export interface CreateOrderResponse {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface RazorpayWindowOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss: () => void
  }
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// ========== Amenities ==========
export interface Amenity {
  id: number
  name: string
  category: 'petrol' | 'ev' | 'cafe' | 'pharmacy' | 'atm'
  distance: string
  is_open: boolean
  operating_hours?: string
  extra_info?: string
}

// ========== Admin ==========
export interface AdminStats {
  total_users: number
  active_bookings: number
  revenue_today: number
  occupancy_percent: number
}

// ========== UI State ==========
export interface BookingFlowState {
  selectedDate: string
  startTime: string
  endTime: string
  selectedSpot: Spot | null
  selectedVehicle: Vehicle | null
  durationHours: number
  baseRate: number
  gst: number
  totalAmount: number
}

// ========== API Errors ==========
export interface ApiError {
  detail?: string
  error?: string
  [key: string]: any
}

export interface ValidationError {
  [key: string]: string[]
}
