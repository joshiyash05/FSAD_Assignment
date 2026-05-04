// Shared TypeScript types for the ParkWise frontend

export interface Spot {
  id: number | string
  label?: string
  zone?: string
  [key: string]: any
}

export interface Vehicle {
  id: number
  plate_number: string
  is_default?: boolean
  [key: string]: any
}

export interface Amenity {
  id: number
  name: string
  [key: string]: any
}

export interface Reservation {
  id: number
  spot_id: number
  vehicle_id: number
  start_time: string
  end_time: string
  status?: string
  [key: string]: any
}

export interface UserStats {
  total?: number
  upcoming?: number
  [key: string]: any
}

export interface AuthResponse {
  token?: string
  user?: any
}

export interface User {
  id?: number
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  is_staff?: boolean
  [key: string]: any
}

export type AvailabilityResponse = { availability: Record<string, string> } | Record<string, string>

export interface CreateOrderResponse {
  id: string
  amount?: number
  [key: string]: any
}

export type PaymentIntent = { id: string; client_secret?: string } | any
