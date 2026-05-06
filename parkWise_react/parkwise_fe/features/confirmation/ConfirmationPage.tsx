import { useEffect, useState } from "react";
import { QrCodeDisplay } from "@/components/qr/QrCodeDisplay";
import { Button, Card, Message, Tag } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Notify, Reservation } from "@/types/parkwise";

export function ConfirmationPage({ id, push, notify }: { id: number; push: (path: string) => void; notify: Notify }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parkwiseApi.reservation(id)
      .then(setReservation)
      .catch((err) => notify({ severity: "error", summary: "Confirmation unavailable", detail: apiErrorMessage(err, "Failed to load confirmation.") }))
      .finally(() => setLoading(false));
  }, [id, notify]);

  if (loading) return <section className="confirmation-page"><div className="spinner" /></section>;
  if (!reservation) return <Message severity="error">Failed to load confirmation details.</Message>;

  const baseAmount = Math.round((reservation.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((reservation.amount - baseAmount) * 100) / 100;

  return (
    <section className="confirmation-page">
      <Card className="confirmation-card">
        <div className="confirmation-hero">✓</div>
        <div className="center-title"><h1>Booking Confirmed</h1><p>Reservation PKW-{reservation.id}</p></div>
        <div className="confirmation-grid">
          <div className="summary-list wide">
            <span>Spot</span><strong>{reservation.spot.label} · Zone {reservation.spot.zone}</strong>
            <span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "No vehicle"}</strong>
            <span>Check in</span><strong>{formatDate(reservation.start_time)}</strong>
            <span>Check out</span><strong>{formatDate(reservation.end_time)}</strong>
            <span>Status</span><Tag value={reservation.status} severity="success" />
          </div>
          <div className="qr-box">
            <QrCodeDisplay value={`PKW-${reservation.id}`} size={180} />
            <span>Scan at entry</span>
          </div>
        </div>
        <hr />
        <div className="price-box plain">
          <div><span>Base amount</span><strong>₹{baseAmount}</strong></div>
          <div><span>GST</span><strong>₹{gstAmount}</strong></div>
          <hr />
          <div className="total-row"><span>Total paid</span><strong>₹{reservation.amount}</strong></div>
        </div>
        <div className="sidebar-actions">
          <Button variant="secondary" onClick={() => push("/bookings")}>View bookings</Button>
          <Button onClick={() => push("/")}>Dashboard</Button>
        </div>
      </Card>
    </section>
  );
}
