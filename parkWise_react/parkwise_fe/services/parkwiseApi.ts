import type {
  AdminStats,
  Amenity,
  AuthResponse,
  RegisterRequest,
  Reservation,
  ReservationStats,
  Spot,
  Vehicle,
  VehiclePayload,
} from "@/types/parkwise";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/";

export function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      if (typeof data.error === "string") message = data.error;
      else if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.non_field_errors)) message = data.non_field_errors.join(", ");
      else if (data && typeof data === "object") message = Object.values(data).flat().filter(Boolean).join(", ") || message;
    } catch {
      // Empty API errors are still surfaced with the HTTP status text.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const parkwiseApi = {
  login: (username: string, password: string) =>
    request<AuthResponse>("auth/login/", { method: "POST", body: JSON.stringify({ username, password }) }),

  register: (payload: RegisterRequest) =>
    request<AuthResponse>("auth/register/", { method: "POST", body: JSON.stringify(payload) }),

  logout: () => request<void>("auth/logout/", { method: "POST" }),

  availability: (date: string, start: string, end: string) =>
    request<{ spots: Spot[]; summary: { total: number; available: number; occupied: number; opening_soon: number } }>(
      `spots/availability/?date=${date}&start_time=${start}&end_time=${end}`,
    ),

  amenities: () => request<Amenity[]>("amenities/"),

  vehicles: () => request<Vehicle[]>("vehicles/"),

  addVehicle: (payload: VehiclePayload) =>
    request<Vehicle>("vehicles/", { method: "POST", body: JSON.stringify(payload) }),

  setDefaultVehicle: (id: number) => request<Vehicle>(`vehicles/${id}/set_default/`, { method: "POST" }),

  reservations: () => request<Reservation[]>("reservations/"),

  reservation: (id: number) => request<Reservation>(`reservations/${id}/`),

  createReservation: (payload: { spot_id: number; vehicle_id?: number; start_time: string; end_time: string }) =>
    request<Reservation>("reservations/", { method: "POST", body: JSON.stringify(payload) }),

  cancelReservation: (id: number) => request<Reservation>(`reservations/${id}/cancel/`, { method: "PATCH" }),

  reservationStats: () => request<ReservationStats>("reservations/stats/"),

  adminStats: () => request<AdminStats>("admin/stats/"),

  adminReservations: () => request<Reservation[]>("admin/reservations/"),
};
