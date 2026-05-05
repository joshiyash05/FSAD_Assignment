"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import "./globals.css";

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
};

type AuthResponse = { token: string; user: User };
type RegisterRequest = Pick<User, "username" | "email" | "first_name" | "last_name"> & { password: string };
type Spot = {
  id: number;
  label: string;
  zone: string;
  spot_type: "regular" | "ev" | "handicap" | "covered";
  is_active: boolean;
  description?: string;
  status?: "available" | "occupied" | "opening_soon";
};
type Vehicle = {
  id: number;
  plate_number: string;
  model_name: string;
  color?: string;
  vehicle_type: "car" | "two_wheeler" | "suv";
  fuel_type: "petrol" | "diesel" | "ev";
  is_default: boolean;
};
type Reservation = {
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
type ReservationStats = {
  total_bookings: number;
  total_hours: number;
  cancellations: number;
  favourite_spot?: string;
};
type Amenity = {
  id: number;
  name: string;
  category: "petrol" | "ev" | "cafe" | "pharmacy" | "atm";
  distance: string;
  is_open: boolean;
  operating_hours?: string;
  extra_info?: string;
};
type AdminStats = {
  total_users: number;
  active_bookings: number;
  revenue_today: number;
  occupancy_percent: number;
};
type ToastMessage = { id: number; severity: "success" | "error" | "info" | "warn"; summary: string; detail: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/";
const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return { label: value.slice(0, 5), value };
});

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function apiErrorMessage(error: unknown, fallback: string) {
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
    if (window.location.pathname !== "/login") window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
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
      // The API sometimes returns an empty body for auth failures.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const services = {
  login: (username: string, password: string) =>
    request<AuthResponse>("auth/login/", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (payload: RegisterRequest) => request<AuthResponse>("auth/register/", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<void>("auth/logout/", { method: "POST" }),
  availability: (date: string, start: string, end: string) =>
    request<{ spots: Spot[]; summary: { total: number; available: number; occupied: number; opening_soon: number } }>(
      `spots/availability/?date=${date}&start_time=${start}&end_time=${end}`,
    ),
  amenities: () => request<Amenity[]>("amenities/"),
  vehicles: () => request<Vehicle[]>("vehicles/"),
  addVehicle: (payload: Omit<Vehicle, "id" | "is_default">) =>
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

function useRoute() {
  const [path, setPath] = useState("/");
  const [query, setQuery] = useState(new URLSearchParams());

  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname);
      setQuery(new URLSearchParams(window.location.search));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const push = useCallback((nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(window.location.pathname);
    setQuery(new URLSearchParams(window.location.search));
  }, []);

  return { path, query, push };
}

function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    try {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const persist = (next: AuthResponse) => {
    localStorage.setItem("token", next.token);
    localStorage.setItem("user", JSON.stringify(next.user));
    setToken(next.token);
    setUser(next.user);
  };

  const initials = useMemo(() => {
    if (!user) return "P";
    const parts = [user.first_name, user.last_name].map((part) => part?.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (user.username?.[0] ?? user.email?.[0] ?? "P").toUpperCase();
  }, [user]);

  return { token, user, initials, isAuthenticated: Boolean(token), isAdmin: user?.is_staff ?? false, persist, setToken, setUser };
}

function useBooking() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [startTime, setStartTime] = useState("09:00:00");
  const [endTime, setEndTime] = useState("11:00:00");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    setSelectedDate(localStorage.getItem("booking_date") ?? todayIso());
    setStartTime(localStorage.getItem("booking_start") ?? "09:00:00");
    setEndTime(localStorage.getItem("booking_end") ?? "11:00:00");
  }, []);

  const durationHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(1, eh + em / 60 - (sh + sm / 60));
  }, [startTime, endTime]);
  const baseRate = Math.round(durationHours * 20 * 100) / 100;
  const gst = Math.round(baseRate * 0.18 * 100) / 100;
  const totalAmount = Math.round((baseRate + gst) * 100) / 100;

  const setFilters = (date: string, start: string, end: string) => {
    setSelectedDate(date);
    setStartTime(start);
    setEndTime(end);
    localStorage.setItem("booking_date", date);
    localStorage.setItem("booking_start", start);
    localStorage.setItem("booking_end", end);
  };

  return { selectedDate, startTime, endTime, selectedSpot, setSelectedSpot, setFilters, durationHours, baseRate, gst, totalAmount };
}

function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <article className={`p-card ${className}`}>
      {title ? <header className="p-card-title">{title}</header> : null}
      <div className="p-card-content">{children}</div>
    </article>
  );
}

function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outlined" | "text" | "danger" | "secondary";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`p-button ${variant} ${className}`}>
      {children}
    </button>
  );
}

function Tag({ value, severity = "info" }: { value: ReactNode; severity?: "success" | "danger" | "info" | "secondary" }) {
  return <span className={`p-tag ${severity}`}>{value}</span>;
}

function Message({ severity, children }: { severity: "success" | "error" | "info" | "warn"; children: ReactNode }) {
  return <div className={`p-message ${severity}`}>{children}</div>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, id, ...rest } = props;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...rest} />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function Toasts({ messages }: { messages: ToastMessage[] }) {
  return (
    <div className="toast-stack">
      {messages.map((message) => (
        <div key={message.id} className={`toast ${message.severity}`}>
          <strong>{message.summary}</strong>
          <span>{message.detail}</span>
        </div>
      ))}
    </div>
  );
}

function Shell({ children, session, push, onLogout }: { children: ReactNode; session: ReturnType<typeof useSession>; push: (path: string) => void; onLogout: () => void }) {
  if (!session.isAuthenticated) return <main className="app-main">{children}</main>;
  const items = [
    ["Dashboard", "/", "▦"],
    ["Bookings", "/bookings", "▤"],
    ["Nearby", "/nearby", "⌖"],
    ["Profile", "/profile", "◉"],
    ...(session.isAdmin ? ([["Admin", "/admin", "◆"]] as string[][]) : []),
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="menubar">
          <button className="brand-button" type="button" onClick={() => push("/")}>
            <span className="brand-mark small">P</span>
            <span>ParkWise</span>
          </button>
          <div className="nav-links">
            {items.map(([label, href, icon]) => (
              <button key={href} className="nav-menu-link" type="button" onClick={() => push(href)}>
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="topbar-actions">
            <span className="profile-avatar">{session.initials}</span>
            <Button variant="text" onClick={onLogout}>Sign out</Button>
          </div>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function ParkWiseApp() {
  const route = useRoute();
  const session = useSession();
  const booking = useBooking();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notify = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...message, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);

  useEffect(() => {
    if (session.token === null && route.path !== "/login") route.push(`/login?redirect=${encodeURIComponent(route.path)}`);
    if (session.token && route.path === "/login") route.push("/");
    if (session.token && route.path === "/admin" && !session.isAdmin) route.push("/");
  }, [route, session.token, session.isAdmin]);

  async function logout() {
    try {
      await services.logout();
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      session.setToken(null);
      session.setUser(null);
      route.push("/login");
    }
  }

  let page: ReactNode;
  if (route.path === "/login") page = <LoginPage session={session} push={route.push} redirect={route.query.get("redirect") ?? "/"} notify={notify} />;
  else if (route.path === "/bookings") page = <BookingsPage notify={notify} />;
  else if (route.path === "/profile") page = <ProfilePage session={session} notify={notify} />;
  else if (route.path === "/nearby") page = <NearbyPage notify={notify} />;
  else if (route.path === "/admin") page = <AdminPage notify={notify} />;
  else if (route.path.startsWith("/payment/")) page = <PaymentPage id={Number(route.path.split("/").pop())} push={route.push} notify={notify} />;
  else if (route.path.startsWith("/confirmation/")) page = <ConfirmationPage id={Number(route.path.split("/").pop())} push={route.push} notify={notify} />;
  else page = <DashboardPage booking={booking} push={route.push} notify={notify} />;

  return (
    <>
      <Shell session={session} push={route.push} onLogout={logout}>{page}</Shell>
      <Toasts messages={toasts} />
    </>
  );
}

function LoginPage({ session, push, redirect, notify }: { session: ReturnType<typeof useSession>; push: (path: string) => void; redirect: string; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [isRegistering, setRegistering] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [register, setRegister] = useState<RegisterRequest>({ username: "", email: "", password: "", first_name: "", last_name: "" });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = isRegistering ? await services.register(register) : await services.login(login.username, login.password);
      session.persist(response);
      notify({ severity: "success", summary: isRegistering ? "Account created" : "Welcome back", detail: isRegistering ? "Welcome to ParkWise." : "Logged in successfully." });
      push(redirect || "/");
    } catch (err) {
      const message = apiErrorMessage(err, isRegistering ? "Registration failed." : "Login failed.");
      setError(message);
      notify({ severity: "error", summary: isRegistering ? "Registration failed" : "Login failed", detail: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <Card className="auth-card">
        <div className="brand-lockup">
          <span className="brand-mark">P</span>
          <h1>ParkWise</h1>
          <p>Reserve smart parking with live availability.</p>
        </div>
        <div className="auth-toggle">
          <Button variant={isRegistering ? "outlined" : "primary"} disabled={isLoading} onClick={() => setRegistering(false)}>Sign in</Button>
          <Button variant={!isRegistering ? "outlined" : "primary"} disabled={isLoading} onClick={() => setRegistering(true)}>Create account</Button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {isRegistering ? (
            <>
              <div className="responsive-two">
                <Field label="First name" value={register.first_name} onChange={(e) => setRegister({ ...register, first_name: e.target.value })} />
                <Field label="Last name" value={register.last_name} onChange={(e) => setRegister({ ...register, last_name: e.target.value })} />
              </div>
              <Field label="Email" type="email" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} />
              <Field label="Username" value={register.username} onChange={(e) => setRegister({ ...register, username: e.target.value })} />
              <Field label="Password" type="password" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} />
            </>
          ) : (
            <>
              <Field label="Username" autoComplete="username" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} />
              <Field label="Password" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
            </>
          )}
          {error ? <Message severity="error">{error}</Message> : null}
          <Button type="submit" disabled={isLoading} className="w-full">{isRegistering ? "Create account" : "Sign in"}</Button>
        </form>
      </Card>
    </section>
  );
}

function DashboardPage({ booking, push, notify }: { booking: ReturnType<typeof useBooking>; push: (path: string) => void; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [date, setDate] = useState(booking.selectedDate);
  const [start, setStart] = useState(booking.startTime);
  const [end, setEnd] = useState(booking.endTime);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [summary, setSummary] = useState({ total: 0, available: 0, occupied: 0, opening_soon: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  const search = useCallback(async (showToast = true) => {
    if (!date || !start || !end || start >= end) {
      notify({ severity: "warn", summary: "Invalid search", detail: "Select a date and make sure end time is after start time." });
      return;
    }
    setLoading(true);
    setSearched(true);
    booking.setSelectedSpot(null);
    try {
      booking.setFilters(date, start, end);
      const response = await services.availability(date, start, end);
      setSpots(response.spots);
      setSummary(response.summary);
      if (showToast) notify({ severity: "success", summary: "Availability refreshed", detail: `${response.summary.available} spots available.` });
    } catch (err) {
      notify({ severity: "error", summary: "Search failed", detail: apiErrorMessage(err, "Unable to search availability.") });
    } finally {
      setLoading(false);
    }
  }, [booking, date, end, notify, start]);

  useEffect(() => {
    search(false);
    setLoadingAmenities(true);
    services.amenities().then(setAmenities).catch((err) => notify({ severity: "error", summary: "Amenities unavailable", detail: apiErrorMessage(err, "Unable to load nearby amenities.") })).finally(() => setLoadingAmenities(false));
    const timer = window.setInterval(() => search(false), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const zones = spots.reduce<Record<string, Spot[]>>((map, spot) => ({ ...map, [spot.zone]: [...(map[spot.zone] ?? []), spot] }), {});
  const bestSpotId = spots.find((spot) => spot.status === "available")?.id;

  return (
    <section className="page-stack">
      <div className="page-title">
        <div><h1>Find Parking</h1><p>Live availability, booking conflict checks, and instant payment handoff.</p></div>
        <Button variant="outlined" disabled={loading} onClick={() => search()}>Refresh</Button>
      </div>
      <Card>
        <div className="search-grid">
          <Field label="Date" type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} />
          <Select label="Start" value={start} onChange={setStart}>{timeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select label="End" value={end} onChange={setEnd}>{timeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Button disabled={loading} onClick={() => search()}>Search</Button>
        </div>
      </Card>
      <div className="stat-grid">
        <Stat label="Available" value={summary.available} tone="success" />
        <Stat label="Occupied" value={summary.occupied} tone="danger" />
        <Stat label="Opening soon" value={summary.opening_soon} tone="info" />
        <Stat label="Estimated total" value={`₹${booking.totalAmount}`} />
      </div>
      {loading ? <Skeleton height="22rem" /> : searched && spots.length === 0 ? <Message severity="info">No spots found for this time window.</Message> : null}
      <div className="zone-stack">
        {Object.entries(zones).map(([zone, zoneSpots]) => (
          <Card key={zone} title={<div className="zone-title"><span>Zone {zone}</span>{zoneSpots.some((spot) => spot.id === bestSpotId) ? <Tag value="Best available here" severity="success" /> : null}</div>}>
            <div className="spot-grid">
              {zoneSpots.map((spot) => (
                <button key={spot.id} className={`spot-tile ${spot.status} ${booking.selectedSpot?.id === spot.id ? "selected" : ""} ${bestSpotId === spot.id ? "best" : ""}`} disabled={spot.status === "occupied"} onClick={() => {
                  if (spot.status === "occupied") return;
                  booking.setSelectedSpot(spot);
                  setSidebar(true);
                }}>
                  <span className="spot-topline"><span>{spotIcon(spot)}</span>{bestSpotId === spot.id ? <Tag value="Best" severity="success" /> : null}</span>
                  <strong>{spot.label}</strong>
                  <span>Zone {spot.zone} · {spot.spot_type}</span>
                  <Tag value={spot.status === "opening_soon" ? "Soon" : spot.status === "occupied" ? "Occupied" : "Available"} severity={spot.status === "occupied" ? "danger" : spot.status === "opening_soon" ? "info" : "success"} />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card title={<div className="zone-title"><span>Nearby Amenities</span><Button variant="text" onClick={() => push("/nearby")}>View all</Button></div>}>
        {loadingAmenities ? <div className="dashboard-amenities"><Skeleton height="7rem" /><Skeleton height="7rem" /><Skeleton height="7rem" /><Skeleton height="7rem" /></div> : (
          <div className="dashboard-amenities">{amenities.slice(0, 4).map((amenity) => <AmenitySummary key={amenity.id} amenity={amenity} />)}</div>
        )}
      </Card>
      {sidebar && booking.selectedSpot ? <BookingDrawer spot={booking.selectedSpot} booking={booking} close={() => setSidebar(false)} booked={(id) => { setSidebar(false); push(`/payment/${id}`); }} notify={notify} /> : null}
    </section>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: ReactNode; tone?: string }) {
  return <Card><span className="muted-label">{label}</span><strong className={`stat ${tone}`}>{value}</strong></Card>;
}

function Skeleton({ height }: { height: string }) {
  return <div className="skeleton" style={{ height }} />;
}

function spotIcon(spot: Spot) {
  if (spot.spot_type === "ev") return "⚡";
  if (spot.spot_type === "covered") return "▣";
  if (spot.spot_type === "handicap") return "♡";
  return "P";
}

function BookingDrawer({ spot, booking, close, booked, notify }: { spot: Spot; booking: ReturnType<typeof useBooking>; close: () => void; booked: (id: number) => void; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    services.vehicles().then((items) => {
      setVehicles(items);
      setVehicleId(String(items.find((item) => item.is_default)?.id ?? items[0]?.id ?? ""));
    }).catch((err) => notify({ severity: "error", summary: "Vehicles unavailable", detail: apiErrorMessage(err, "Failed to load vehicles.") })).finally(() => setLoading(false));
  }, [notify]);

  async function reserve() {
    if (!vehicleId) {
      setError("Add or select a vehicle before booking.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const reservation = await services.createReservation({
        spot_id: spot.id,
        vehicle_id: Number(vehicleId),
        start_time: new Date(`${booking.selectedDate}T${booking.startTime}`).toISOString(),
        end_time: new Date(`${booking.selectedDate}T${booking.endTime}`).toISOString(),
      });
      booked(reservation.id);
    } catch (err) {
      const message = apiErrorMessage(err, "Booking failed.");
      setError(message);
      notify({ severity: "error", summary: "Booking failed", detail: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer-backdrop">
      <aside className="booking-sidebar">
        <div className="summary-head"><h2>Booking Summary</h2><Button variant="text" onClick={close}>Close</Button></div>
        <div className="booking-panel">
          <div className="summary-head"><div><span className="muted-label">Selected spot</span><h2>{spot.label}</h2><p>{spot.zone} · {spot.spot_type}</p></div><Tag value="Available" severity="success" /></div>
          <hr />
          <div className="summary-list"><span>Date</span><strong>{booking.selectedDate}</strong><span>Time</span><strong>{booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}</strong><span>Duration</span><strong>{booking.durationHours} hr</strong></div>
          <div className="price-box"><div><span>Base rate</span><strong>₹{booking.baseRate}</strong></div><div><span>GST</span><strong>₹{booking.gst}</strong></div><hr /><div className="total-row"><span>Total</span><strong>₹{booking.totalAmount}</strong></div></div>
          {loading ? <Skeleton height="3rem" /> : <Select label="Select vehicle" value={vehicleId} onChange={setVehicleId} disabled={saving}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate_number} - {vehicle.model_name}</option>)}</Select>}
          {!loading && vehicles.length === 0 ? <Message severity="info">Add a vehicle from Profile before reserving a spot.</Message> : null}
          {error ? <Message severity="error">{error}</Message> : null}
          <div className="sidebar-actions"><Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button><Button disabled={saving || loading || vehicles.length === 0} onClick={reserve}>Reserve</Button></div>
        </div>
      </aside>
    </div>
  );
}

function BookingsPage({ notify }: { notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<Reservation | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    services.reservations().then(setItems).catch((err) => notify({ severity: "error", summary: "Bookings unavailable", detail: apiErrorMessage(err, "Failed to load bookings.") })).finally(() => setLoading(false));
  }, [notify]);
  useEffect(load, [load]);
  async function cancel(item: Reservation) {
    try {
      const updated = await services.cancelReservation(item.id);
      setItems((current) => current.map((row) => row.id === updated.id ? updated : row));
      notify({ severity: "success", summary: "Booking cancelled", detail: `PKW-${updated.id} was cancelled.` });
    } catch (err) {
      notify({ severity: "error", summary: "Cancellation failed", detail: apiErrorMessage(err, "Could not cancel booking.") });
    }
  }
  return <ReservationTable title="Bookings" subtitle="Reservation history with live status." items={items} loading={loading} onRefresh={load} actions={(item) => <><Button variant="text" onClick={() => setQr(item)}>QR</Button>{effectiveStatus(item) === "active" ? <Button variant="danger" onClick={() => cancel(item)}>Cancel</Button> : null}</>} qr={qr} setQr={setQr} />;
}

function ReservationTable({ title, subtitle, items, loading, onRefresh, actions, qr, setQr }: { title: string; subtitle: string; items: Reservation[]; loading: boolean; onRefresh: () => void; actions?: (item: Reservation) => ReactNode; qr?: Reservation | null; setQr?: (reservation: Reservation | null) => void }) {
  return (
    <section className="page-stack">
      <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div><Button variant="outlined" disabled={loading} onClick={onRefresh}>Refresh</Button></div>
      <Card>
        {loading ? <div className="page-stack"><Skeleton height="3.5rem" /><Skeleton height="3.5rem" /><Skeleton height="3.5rem" /></div> : items.length === 0 ? <Message severity="info">No reservations found.</Message> : (
          <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Spot</th><th>Vehicle</th><th>Start</th><th>End</th><th>Amount</th><th>Status</th>{actions ? <th>Actions</th> : null}</tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>PKW-{item.id}</td><td>{item.spot.label} · Zone {item.spot.zone}</td><td>{item.vehicle?.plate_number ?? "-"}</td><td>{formatDate(item.start_time)}</td><td>{formatDate(item.end_time)}</td><td>₹{item.amount}</td><td><Tag value={effectiveStatus(item)} severity={statusSeverity(effectiveStatus(item))} /></td>{actions ? <td><div className="table-actions">{actions(item)}</div></td> : null}</tr>)}</tbody></table></div>
        )}
      </Card>
      {qr && setQr ? <QrDialog reservation={qr} close={() => setQr(null)} /> : null}
    </section>
  );
}

function ProfilePage({ session, notify }: { session: ReturnType<typeof useSession>; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ plate_number: "", model_name: "", color: "", vehicle_type: "car" as const, fuel_type: "petrol" as const });
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([services.vehicles(), services.reservationStats()]).then(([vehicleResponse, statsResponse]) => { setVehicles(vehicleResponse); setStats(statsResponse); }).catch((err) => notify({ severity: "error", summary: "Profile unavailable", detail: apiErrorMessage(err, "Failed to load profile.") })).finally(() => setLoading(false));
  }, [notify]);
  useEffect(load, [load]);
  async function addVehicle() {
    try {
      const vehicle = await services.addVehicle({ ...form, plate_number: form.plate_number.toUpperCase() });
      setVehicles((current) => [vehicle, ...current]);
      setDialog(false);
      setForm({ plate_number: "", model_name: "", color: "", vehicle_type: "car", fuel_type: "petrol" });
      notify({ severity: "success", summary: "Vehicle added", detail: "Vehicle saved to your profile." });
    } catch (err) {
      notify({ severity: "error", summary: "Vehicle not saved", detail: apiErrorMessage(err, "Failed to add vehicle.") });
    }
  }
  const name = [session.user?.first_name, session.user?.last_name].filter(Boolean).join(" ") || session.user?.username || "ParkWise user";
  return (
    <section className="page-stack">
      <div className="page-title"><div><h1>Profile</h1><p>{name} · {session.user?.email}</p></div><Button onClick={() => setDialog(true)}>Add vehicle</Button></div>
      <div className="stat-grid"><Stat label="Bookings" value={stats?.total_bookings ?? 0} /><Stat label="Hours parked" value={stats?.total_hours ?? 0} tone="info" /><Stat label="Cancellations" value={stats?.cancellations ?? 0} tone="danger" /><Stat label="Favorite spot" value={stats?.favourite_spot ?? "-"} tone="success" /></div>
      <Card title="My Vehicles">{loading ? <Skeleton height="5rem" /> : vehicles.length === 0 ? <Message severity="info">No vehicles added yet. Add one before creating a reservation.</Message> : <div className="vehicle-list">{vehicles.map((vehicle) => <div key={vehicle.id} className="vehicle-row"><div><strong>{vehicle.plate_number}</strong><p>{vehicle.model_name} · {vehicle.color || "No color"}</p><span>{vehicle.vehicle_type} · {vehicle.fuel_type}</span></div><div className="row-actions">{vehicle.is_default ? <Tag value="Default" severity="success" /> : <Button variant="text" onClick={() => services.setDefaultVehicle(vehicle.id).then(load)}>Set default</Button>}</div></div>)}</div>}</Card>
      {dialog ? <div className="drawer-backdrop"><div className="modal"><h2>Add Vehicle</h2><div className="form-stack"><Field label="Plate number" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} /><Field label="Model" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} /><Field label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /><Select label="Vehicle type" value={form.vehicle_type} onChange={(value) => setForm({ ...form, vehicle_type: value as typeof form.vehicle_type })}><option value="car">Car</option><option value="suv">SUV</option><option value="two_wheeler">Two-wheeler</option></Select><Select label="Fuel type" value={form.fuel_type} onChange={(value) => setForm({ ...form, fuel_type: value as typeof form.fuel_type })}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="ev">EV</option></Select></div><div className="sidebar-actions"><Button variant="secondary" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={addVehicle}>Save</Button></div></div></div> : null}
    </section>
  );
}

function NearbyPage({ notify }: { notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); services.amenities().then(setAmenities).catch((err) => notify({ severity: "error", summary: "Amenities unavailable", detail: apiErrorMessage(err, "Failed to load amenities.") })).finally(() => setLoading(false)); }, [notify]);
  useEffect(load, [load]);
  return <section className="page-stack"><div className="page-title"><div><h1>Nearby</h1><p>{amenities.filter((item) => item.is_open).length} amenities open near your parking area.</p></div><Button variant="outlined" disabled={loading} onClick={load}>Refresh</Button></div>{loading ? <div className="amenity-grid"><Skeleton height="10rem" /><Skeleton height="10rem" /><Skeleton height="10rem" /></div> : amenities.length === 0 ? <Message severity="info">No nearby amenities found.</Message> : <div className="amenity-grid">{amenities.map((amenity) => <Card key={amenity.id}><div className="amenity-card"><span className="amenity-icon">{amenityGlyph(amenity.category)}</span><div><div className="zone-title"><h2>{amenity.name}</h2><Tag value={amenity.is_open ? "Open" : "Closed"} severity={amenity.is_open ? "success" : "danger"} /></div><p>{amenity.distance}</p><span>{amenity.operating_hours || "Hours unavailable"}</span>{amenity.extra_info ? <strong>{amenity.extra_info}</strong> : null}</div></div></Card>)}</div>}</section>;
}

function AmenitySummary({ amenity }: { amenity: Amenity }) {
  return <article className="dashboard-amenity"><span className={`dashboard-amenity-icon amenity-${amenity.category}`}>{amenityGlyph(amenity.category)}</span><div><div className="amenity-head"><strong>{amenity.name}</strong><Tag value={amenity.is_open ? "Open" : "Closed"} severity={amenity.is_open ? "success" : "danger"} /></div><p>{amenity.distance}</p><span>{amenity.extra_info || amenity.operating_hours || "Details unavailable"}</span></div></article>;
}

function amenityGlyph(category: Amenity["category"]) {
  return ({ petrol: "⛽", ev: "⚡", cafe: "☕", pharmacy: "+", atm: "₹" } as const)[category];
}

function AdminPage({ notify }: { notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); Promise.all([services.adminStats(), services.adminReservations()]).then(([statsResponse, reservationResponse]) => { setStats(statsResponse); setItems(reservationResponse); }).catch((err) => notify({ severity: "error", summary: "Admin data unavailable", detail: apiErrorMessage(err, "Failed to load admin dashboard.") })).finally(() => setLoading(false)); }, [notify]);
  useEffect(load, [load]);
  async function cancel(item: Reservation) {
    try {
      const updated = await services.cancelReservation(item.id);
      setItems((current) => current.map((row) => row.id === updated.id ? updated : row));
      notify({ severity: "success", summary: "Booking cancelled", detail: `PKW-${updated.id} was cancelled.` });
    } catch (err) {
      notify({ severity: "error", summary: "Cancellation failed", detail: apiErrorMessage(err, "Could not cancel booking.") });
    }
  }
  const totalRevenue = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return <section className="page-stack"><div className="page-title"><div><h1>Admin</h1><p>Monitor occupancy, bookings, users, and revenue.</p></div><Button variant="outlined" disabled={loading} onClick={load}>Refresh</Button></div><div className="stat-grid"><Stat label="Users" value={stats?.total_users ?? 0} /><Stat label="Active bookings" value={stats?.active_bookings ?? 0} tone="info" /><Stat label="Occupancy" value={`${stats?.occupancy_percent ?? 0}%`} tone="success" /><Stat label="Revenue today" value={`₹${stats?.revenue_today ?? 0}`} /></div><Card title={<div className="zone-title"><span>Reservations</span><Tag value={`₹${totalRevenue.toFixed(2)} total listed`} severity="info" /></div>}><ReservationRows items={items} loading={loading} onCancel={cancel} /></Card></section>;
}

function ReservationRows({ items, loading, onCancel }: { items: Reservation[]; loading: boolean; onCancel: (item: Reservation) => void }) {
  if (loading) return <div className="page-stack"><Skeleton height="3.5rem" /><Skeleton height="3.5rem" /><Skeleton height="3.5rem" /></div>;
  if (items.length === 0) return <Message severity="info">No reservations found.</Message>;
  return <div className="table-wrap"><table><thead><tr><th>ID</th><th>User</th><th>Spot</th><th>Vehicle</th><th>Start</th><th>End</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>PKW-{item.id}</td><td><div className="table-person"><strong>{item.user?.username ?? "-"}</strong><span>{item.user?.email ?? ""}</span></div></td><td>{item.spot.label} · Zone {item.spot.zone}</td><td>{item.vehicle?.plate_number ?? "-"}</td><td>{formatDate(item.start_time)}</td><td>{formatDate(item.end_time)}</td><td>₹{item.amount}</td><td><Tag value={item.status} severity={statusSeverity(item.status)} /></td><td>{item.status === "active" ? <Button variant="danger" onClick={() => onCancel(item)}>Cancel</Button> : "-"}</td></tr>)}</tbody></table></div>;
}

function PaymentPage({ id, push, notify }: { id: number; push: (path: string) => void; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  useEffect(() => { services.reservation(id).then(setReservation).catch((err) => notify({ severity: "error", summary: "Payment unavailable", detail: apiErrorMessage(err, "Failed to load reservation.") })).finally(() => setLoading(false)); }, [id, notify]);
  if (loading) return <section className="page-stack narrow-page"><Skeleton height="14rem" /><Skeleton height="7rem" /></section>;
  if (!reservation) return <Message severity="error">Failed to load reservation.</Message>;
  const baseAmount = Math.round((reservation.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((reservation.amount - baseAmount) * 100) / 100;
  return <section className="page-stack narrow-page"><Button variant="text" className="self-start" onClick={() => push("/")}>Back</Button><div className="page-title"><div><h1>Payment</h1><p>Complete your secure Razorpay checkout.</p></div></div><Card title={<div className="zone-title"><span>Order Summary</span><Tag value={reservation.status} severity="info" /></div>}><div className="summary-list wide"><span>Spot</span><strong>{reservation.spot.label} · Zone {reservation.spot.zone}</strong><span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "No vehicle"}</strong><span>Starts</span><strong>{formatDate(reservation.start_time)}</strong><span>Ends</span><strong>{formatDate(reservation.end_time)}</strong><span>Duration</span><strong>{reservation.duration_hours} hr</strong></div><hr /><div className="price-box plain"><div><span>Base amount</span><strong>₹{baseAmount}</strong></div><div><span>GST</span><strong>₹{gstAmount}</strong></div><hr /><div className="total-row"><span>Total payable</span><strong>₹{reservation.amount}</strong></div></div></Card><Card><div className="payment-method"><span className="payment-icon">✓</span><div><strong>Dummy payment</strong><p>Development checkout with no external payment popup.</p></div></div><Button disabled={processing} className="w-full mt-4" onClick={() => { setProcessing(true); window.setTimeout(() => { notify({ severity: "success", summary: "Dummy payment successful", detail: "Payment was simulated for development." }); push(`/confirmation/${id}`); }, 700); }}>Complete dummy payment</Button></Card></section>;
}

function ConfirmationPage({ id, push, notify }: { id: number; push: (path: string) => void; notify: (message: Omit<ToastMessage, "id">) => void }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { services.reservation(id).then(setReservation).catch((err) => notify({ severity: "error", summary: "Confirmation unavailable", detail: apiErrorMessage(err, "Failed to load confirmation.") })).finally(() => setLoading(false)); }, [id, notify]);
  if (loading) return <section className="confirmation-page"><div className="spinner" /></section>;
  if (!reservation) return <Message severity="error">Failed to load confirmation details.</Message>;
  const baseAmount = Math.round((reservation.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((reservation.amount - baseAmount) * 100) / 100;
  return <section className="confirmation-page"><Card className="confirmation-card"><div className="confirmation-hero">✓</div><div className="center-title"><h1>Booking Confirmed</h1><p>Reservation PKW-{reservation.id}</p></div><div className="confirmation-grid"><div className="summary-list wide"><span>Spot</span><strong>{reservation.spot.label} · Zone {reservation.spot.zone}</strong><span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "No vehicle"}</strong><span>Check in</span><strong>{formatDate(reservation.start_time)}</strong><span>Check out</span><strong>{formatDate(reservation.end_time)}</strong><span>Status</span><Tag value={reservation.status} severity="success" /></div><div className="qr-box"><QrCodeDisplay value={`PKW-${reservation.id}`} size={180} /><span>Scan at entry</span></div></div><hr /><div className="price-box plain"><div><span>Base amount</span><strong>₹{baseAmount}</strong></div><div><span>GST</span><strong>₹{gstAmount}</strong></div><hr /><div className="total-row"><span>Total paid</span><strong>₹{reservation.amount}</strong></div></div><div className="sidebar-actions"><Button variant="secondary" onClick={() => push("/bookings")}>View bookings</Button><Button onClick={() => push("/")}>Dashboard</Button></div></Card></section>;
}

function QrDialog({ reservation, close }: { reservation: Reservation; close: () => void }) {
  const payload = JSON.stringify({ ref: `PKW-${reservation.id}`, spot: reservation.spot.label, zone: reservation.spot.zone, vehicle: reservation.vehicle?.plate_number ?? null, start: reservation.start_time, end: reservation.end_time, status: effectiveStatus(reservation) });
  return <div className="drawer-backdrop"><div className="modal qr-dialog"><div className="zone-title"><h2>Booking QR Code</h2><Button variant="text" onClick={close}>Close</Button></div><div className="qr-dialog-content"><QrCodeDisplay value={payload} size={220} /><div className="center-title compact"><h2>PKW-{reservation.id}</h2><p>{reservation.spot.label} · Zone {reservation.spot.zone}</p></div><hr /><div className="summary-list wide"><span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "-"}</strong><span>Start</span><strong>{formatDate(reservation.start_time)}</strong><span>End</span><strong>{formatDate(reservation.end_time)}</strong><span>Status</span><Tag value={effectiveStatus(reservation)} severity={statusSeverity(effectiveStatus(reservation))} /></div></div></div></div>;
}

function QrCodeDisplay({ value, size }: { value: string; size: number }) {
  const matrixSize = 29;
  const cells = useMemo(() => {
    let seed = 0;
    for (let index = 0; index < value.length; index += 1) seed = (seed * 31 + value.charCodeAt(index)) >>> 0;

    const inFinder = (row: number, col: number, rowStart: number, colStart: number) => {
      const y = row - rowStart;
      const x = col - colStart;
      if (y < 0 || y > 6 || x < 0 || x > 6) return null;
      return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
    };

    return Array.from({ length: matrixSize * matrixSize }, (_, index) => {
      const row = Math.floor(index / matrixSize);
      const col = index % matrixSize;
      const finder =
        inFinder(row, col, 1, 1) ??
        inFinder(row, col, 1, matrixSize - 8) ??
        inFinder(row, col, matrixSize - 8, 1);
      if (finder !== null) return finder;
      if (row < 9 && col < 9) return false;
      if (row < 9 && col > matrixSize - 10) return false;
      if (row > matrixSize - 10 && col < 9) return false;
      if (row === 8 || col === 8) return (row + col) % 2 === 0;

      const mix = (row * 73856093) ^ (col * 19349663) ^ seed;
      const diagonal = (row + col + seed) % 11 === 0;
      return diagonal || (mix % 13) < 5;
    });
  }, [value]);

  return (
    <div className="qr-card">
      <div className="qr-code" style={{ width: size, height: size, gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}>
        {cells.map((on, index) => <span key={index} className={on ? "on" : ""} />)}
      </div>
    </div>
  );
}

function effectiveStatus(reservation: Reservation) {
  if (reservation.status === "active" && new Date(reservation.end_time).getTime() <= Date.now()) return "completed";
  return reservation.status;
}

function statusSeverity(status: Reservation["status"]) {
  if (status === "cancelled") return "danger";
  if (status === "completed") return "success";
  return "info";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
