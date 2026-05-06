export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
};

export type AuthResponse = { token: string; user: User };

export type RegisterRequest = Pick<User, "username" | "email" | "first_name" | "last_name"> & {
  password: string;
};

export type Spot = {
  id: number;
  label: string;
  zone: string;
  spot_type: "regular" | "ev" | "handicap" | "covered";
  is_active: boolean;
  description?: string;
  status?: "available" | "occupied" | "opening_soon";
};

export type Vehicle = {
  id: number;
  plate_number: string;
  model_name: string;
  color?: string;
  vehicle_type: "car" | "two_wheeler" | "suv";
  fuel_type: "petrol" | "diesel" | "ev";
  is_default: boolean;
};

export type VehiclePayload = Omit<Vehicle, "id" | "is_default">;

export type Reservation = {
  id: number;
  user?: User;
  spot: Spot;
  vehicle?: Vehicle;
  start_time: string;
  end_time: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  duration_hours: number;
  amount: number;
};

export type ReservationStats = {
  total_bookings: number;
  total_hours: number;
  cancellations: number;
  favourite_spot?: string;
};

export type Amenity = {
  id: number;
  name: string;
  category: "petrol" | "ev" | "cafe" | "pharmacy" | "atm";
  distance: string;
  is_open: boolean;
  operating_hours?: string;
  extra_info?: string;
};

export type AdminStats = {
  total_users: number;
  active_bookings: number;
  revenue_today: number;
  occupancy_percent: number;
};

export type ToastMessage = {
  id: number;
  severity: "success" | "error" | "info" | "warn";
  summary: string;
  detail: string;
};

export type Notify = (message: Omit<ToastMessage, "id">) => void;
