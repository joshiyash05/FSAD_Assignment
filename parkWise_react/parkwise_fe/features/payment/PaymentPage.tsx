import { useEffect, useState } from "react";
import { Button, Card, Message, Skeleton, Tag } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Notify, Reservation } from "@/types/parkwise";

export function PaymentPage({ id, push, notify }: { id: number; push: (path: string) => void; notify: Notify }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    parkwiseApi.reservation(id)
      .then(setReservation)
      .catch((err) => notify({ severity: "error", summary: "Payment unavailable", detail: apiErrorMessage(err, "Failed to load reservation.") }))
      .finally(() => setLoading(false));
  }, [id, notify]);

  if (loading) return <section className="page-stack narrow-page"><Skeleton height="14rem" /><Skeleton height="7rem" /></section>;
  if (!reservation) return <Message severity="error">Failed to load reservation.</Message>;

  const baseAmount = Math.round((reservation.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((reservation.amount - baseAmount) * 100) / 100;

  return (
    <section className="page-stack narrow-page">
      <Button variant="text" className="self-start" onClick={() => push("/")}>Back</Button>
      <div className="page-title"><div><h1>Payment</h1><p>Complete your secure Razorpay checkout.</p></div></div>
      <Card title={<div className="zone-title"><span>Order Summary</span><Tag value={reservation.status} severity="info" /></div>}>
        <div className="summary-list wide">
          <span>Spot</span><strong>{reservation.spot.label} · Zone {reservation.spot.zone}</strong>
          <span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "No vehicle"}</strong>
          <span>Starts</span><strong>{formatDate(reservation.start_time)}</strong>
          <span>Ends</span><strong>{formatDate(reservation.end_time)}</strong>
          <span>Duration</span><strong>{reservation.duration_hours} hr</strong>
        </div>
        <hr />
        <div className="price-box plain">
          <div><span>Base amount</span><strong>₹{baseAmount}</strong></div>
          <div><span>GST</span><strong>₹{gstAmount}</strong></div>
          <hr />
          <div className="total-row"><span>Total payable</span><strong>₹{reservation.amount}</strong></div>
        </div>
      </Card>
      <Card>
        <div className="payment-method">
          <span className="payment-icon">✓</span>
          <div><strong>Dummy payment</strong><p>Development checkout with no external payment popup.</p></div>
        </div>
        <Button disabled={processing} className="w-full mt-4" onClick={() => {
          setProcessing(true);
          window.setTimeout(() => {
            notify({ severity: "success", summary: "Dummy payment successful", detail: "Payment was simulated for development." });
            push(`/confirmation/${id}`);
          }, 700);
        }}>Complete dummy payment</Button>
      </Card>
    </section>
  );
}
