import { useEffect, useState } from "react";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import { Button, Message, Select, Skeleton, Tag } from "@/components/ui";
import type { BookingState } from "@/hooks/useBooking";
import type { Notify, Spot, Vehicle } from "@/types/parkwise";

export function BookingDrawer({
  spot,
  booking,
  close,
  booked,
  notify,
}: {
  spot: Spot;
  booking: BookingState;
  close: () => void;
  booked: (id: number) => void;
  notify: Notify;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    parkwiseApi
      .vehicles()
      .then((items) => {
        setVehicles(items);
        setVehicleId(String(items.find((item) => item.is_default)?.id ?? items[0]?.id ?? ""));
      })
      .catch((err) => notify({ severity: "error", summary: "Vehicles unavailable", detail: apiErrorMessage(err, "Failed to load vehicles.") }))
      .finally(() => setLoading(false));
  }, [notify]);

  async function reserve() {
    if (!vehicleId) {
      setError("Add or select a vehicle before booking.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const reservation = await parkwiseApi.createReservation({
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
        <div className="summary-head">
          <h2>Booking Summary</h2>
          <Button variant="text" onClick={close}>Close</Button>
        </div>
        <div className="booking-panel">
          <div className="summary-head">
            <div>
              <span className="muted-label">Selected spot</span>
              <h2>{spot.label}</h2>
              <p>{spot.zone} · {spot.spot_type}</p>
            </div>
            <Tag value="Available" severity="success" />
          </div>
          <hr />
          <div className="summary-list">
            <span>Date</span><strong>{booking.selectedDate}</strong>
            <span>Time</span><strong>{booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}</strong>
            <span>Duration</span><strong>{booking.durationHours} hr</strong>
          </div>
          <div className="price-box">
            <div><span>Base rate</span><strong>₹{booking.baseRate}</strong></div>
            <div><span>GST</span><strong>₹{booking.gst}</strong></div>
            <hr />
            <div className="total-row"><span>Total</span><strong>₹{booking.totalAmount}</strong></div>
          </div>
          {loading ? (
            <Skeleton height="3rem" />
          ) : (
            <Select label="Select vehicle" value={vehicleId} onChange={setVehicleId} disabled={saving}>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate_number} - {vehicle.model_name}</option>)}
            </Select>
          )}
          {!loading && vehicles.length === 0 ? <Message severity="info">Add a vehicle from Profile before reserving a spot.</Message> : null}
          {error ? <Message severity="error">{error}</Message> : null}
          <div className="sidebar-actions">
            <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
            <Button disabled={saving || loading || vehicles.length === 0} onClick={reserve}>Reserve</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
