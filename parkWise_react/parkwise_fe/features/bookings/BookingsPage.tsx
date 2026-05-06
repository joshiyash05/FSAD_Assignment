import { useCallback, useEffect, useState } from "react";
import { ReservationTable } from "@/components/bookings/ReservationTable";
import { Button } from "@/components/ui";
import { effectiveStatus } from "@/lib/format";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Notify, Reservation } from "@/types/parkwise";

export function BookingsPage({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<Reservation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    parkwiseApi.reservations()
      .then(setItems)
      .catch((err) => notify({ severity: "error", summary: "Bookings unavailable", detail: apiErrorMessage(err, "Failed to load bookings.") }))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(load, [load]);

  async function cancel(item: Reservation) {
    try {
      const updated = await parkwiseApi.cancelReservation(item.id);
      setItems((current) => current.map((row) => row.id === updated.id ? updated : row));
      notify({ severity: "success", summary: "Booking cancelled", detail: `PKW-${updated.id} was cancelled.` });
    } catch (err) {
      notify({ severity: "error", summary: "Cancellation failed", detail: apiErrorMessage(err, "Could not cancel booking.") });
    }
  }

  return (
    <ReservationTable
      title="Bookings"
      subtitle="Reservation history with live status."
      items={items}
      loading={loading}
      onRefresh={load}
      actions={(item) => (
        <>
          <Button variant="text" onClick={() => setQr(item)}>QR</Button>
          {effectiveStatus(item) === "active" ? <Button variant="danger" onClick={() => cancel(item)}>Cancel</Button> : null}
        </>
      )}
      qr={qr}
      setQr={setQr}
    />
  );
}
