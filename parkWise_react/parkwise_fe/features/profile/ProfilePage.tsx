import { useCallback, useEffect, useState } from "react";
import { Button, Card, Field, Message, Select, Skeleton, Stat, Tag } from "@/components/ui";
import type { SessionState } from "@/hooks/useSession";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Notify, ReservationStats, Vehicle, VehiclePayload } from "@/types/parkwise";

export function ProfilePage({ session, notify }: { session: SessionState; notify: Notify }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<VehiclePayload>({ plate_number: "", model_name: "", color: "", vehicle_type: "car", fuel_type: "petrol" });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([parkwiseApi.vehicles(), parkwiseApi.reservationStats()])
      .then(([vehicleResponse, statsResponse]) => {
        setVehicles(vehicleResponse);
        setStats(statsResponse);
      })
      .catch((err) => notify({ severity: "error", summary: "Profile unavailable", detail: apiErrorMessage(err, "Failed to load profile.") }))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(load, [load]);

  async function addVehicle() {
    try {
      const vehicle = await parkwiseApi.addVehicle({ ...form, plate_number: form.plate_number.toUpperCase() });
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
      <div className="page-title">
        <div><h1>Profile</h1><p>{name} · {session.user?.email}</p></div>
        <Button onClick={() => setDialog(true)}>Add vehicle</Button>
      </div>
      <div className="stat-grid">
        <Stat label="Bookings" value={stats?.total_bookings ?? 0} />
        <Stat label="Hours parked" value={stats?.total_hours ?? 0} tone="info" />
        <Stat label="Cancellations" value={stats?.cancellations ?? 0} tone="danger" />
        <Stat label="Favorite spot" value={stats?.favourite_spot ?? "-"} tone="success" />
      </div>
      <Card title="My Vehicles">
        {loading ? <Skeleton height="5rem" /> : vehicles.length === 0 ? <Message severity="info">No vehicles added yet. Add one before creating a reservation.</Message> : (
          <div className="vehicle-list">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-row">
                <div>
                  <strong>{vehicle.plate_number}</strong>
                  <p>{vehicle.model_name} · {vehicle.color || "No color"}</p>
                  <span>{vehicle.vehicle_type} · {vehicle.fuel_type}</span>
                </div>
                <div className="row-actions">
                  {vehicle.is_default ? <Tag value="Default" severity="success" /> : <Button variant="text" onClick={() => parkwiseApi.setDefaultVehicle(vehicle.id).then(load)}>Set default</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {dialog ? (
        <div className="drawer-backdrop">
          <div className="modal">
            <h2>Add Vehicle</h2>
            <div className="form-stack">
              <Field label="Plate number" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} />
              <Field label="Model" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} />
              <Field label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Select label="Vehicle type" value={form.vehicle_type} onChange={(value) => setForm({ ...form, vehicle_type: value as VehiclePayload["vehicle_type"] })}>
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="two_wheeler">Two-wheeler</option>
              </Select>
              <Select label="Fuel type" value={form.fuel_type} onChange={(value) => setForm({ ...form, fuel_type: value as VehiclePayload["fuel_type"] })}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="ev">EV</option>
              </Select>
            </div>
            <div className="sidebar-actions">
              <Button variant="secondary" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={addVehicle}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
