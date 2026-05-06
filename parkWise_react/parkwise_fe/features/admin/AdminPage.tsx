import { useCallback, useEffect, useState } from "react";
import { AdminReservationRows } from "@/components/bookings/ReservationTable";
import { Button, Card, Stat, Tag } from "@/components/ui";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { AdminStats, Notify, Reservation } from "@/types/parkwise";

export function AdminPage({ notify }: { notify: Notify }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([parkwiseApi.adminStats(), parkwiseApi.adminReservations()])
      .then(([statsResponse, reservationResponse]) => {
        setStats(statsResponse);
        setItems(reservationResponse);
      })
      .catch((err) => notify({ severity: "error", summary: "Admin data unavailable", detail: apiErrorMessage(err, "Failed to load admin dashboard.") }))
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

  const totalRevenue = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <section className="page-stack">
      <div className="page-title">
        <div><h1>Admin</h1><p>Monitor occupancy, bookings, users, and revenue.</p></div>
        <Button variant="outlined" disabled={loading} onClick={load}>Refresh</Button>
      </div>
      <div className="stat-grid">
        <Stat label="Users" value={stats?.total_users ?? 0} />
        <Stat label="Active bookings" value={stats?.active_bookings ?? 0} tone="info" />
        <Stat label="Occupancy" value={`${stats?.occupancy_percent ?? 0}%`} tone="success" />
        <Stat label="Revenue today" value={`₹${stats?.revenue_today ?? 0}`} />
      </div>
      <Card title={<div className="zone-title"><span>Reservations</span><Tag value={`₹${totalRevenue.toFixed(2)} total listed`} severity="info" /></div>}>
        <AdminReservationRows items={items} loading={loading} onCancel={cancel} />
      </Card>
    </section>
  );
}
