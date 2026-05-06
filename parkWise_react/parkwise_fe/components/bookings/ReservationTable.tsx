import type { ReactNode } from "react";
import { Button, Card, Message, Skeleton, Tag } from "@/components/ui";
import { QrDialog } from "@/components/bookings/QrDialog";
import { effectiveStatus, formatDate, statusSeverity } from "@/lib/format";
import type { Reservation } from "@/types/parkwise";

export function ReservationTable({
  title,
  subtitle,
  items,
  loading,
  onRefresh,
  actions,
  qr,
  setQr,
}: {
  title: string;
  subtitle: string;
  items: Reservation[];
  loading: boolean;
  onRefresh: () => void;
  actions?: (item: Reservation) => ReactNode;
  qr?: Reservation | null;
  setQr?: (reservation: Reservation | null) => void;
}) {
  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <Button variant="outlined" disabled={loading} onClick={onRefresh}>Refresh</Button>
      </div>
      <Card>
        {loading ? (
          <div className="page-stack">
            <Skeleton height="3.5rem" />
            <Skeleton height="3.5rem" />
            <Skeleton height="3.5rem" />
          </div>
        ) : items.length === 0 ? (
          <Message severity="info">No reservations found.</Message>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Spot</th>
                  <th>Vehicle</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Amount</th>
                  <th>Status</th>
                  {actions ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>PKW-{item.id}</td>
                    <td>{item.spot.label} · Zone {item.spot.zone}</td>
                    <td>{item.vehicle?.plate_number ?? "-"}</td>
                    <td>{formatDate(item.start_time)}</td>
                    <td>{formatDate(item.end_time)}</td>
                    <td>₹{item.amount}</td>
                    <td><Tag value={effectiveStatus(item)} severity={statusSeverity(effectiveStatus(item))} /></td>
                    {actions ? <td><div className="table-actions">{actions(item)}</div></td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {qr && setQr ? <QrDialog reservation={qr} close={() => setQr(null)} /> : null}
    </section>
  );
}

export function AdminReservationRows({ items, loading, onCancel }: { items: Reservation[]; loading: boolean; onCancel: (item: Reservation) => void }) {
  if (loading) {
    return (
      <div className="page-stack">
        <Skeleton height="3.5rem" />
        <Skeleton height="3.5rem" />
        <Skeleton height="3.5rem" />
      </div>
    );
  }

  if (items.length === 0) return <Message severity="info">No reservations found.</Message>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Spot</th>
            <th>Vehicle</th>
            <th>Start</th>
            <th>End</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>PKW-{item.id}</td>
              <td><div className="table-person"><strong>{item.user?.username ?? "-"}</strong><span>{item.user?.email ?? ""}</span></div></td>
              <td>{item.spot.label} · Zone {item.spot.zone}</td>
              <td>{item.vehicle?.plate_number ?? "-"}</td>
              <td>{formatDate(item.start_time)}</td>
              <td>{formatDate(item.end_time)}</td>
              <td>₹{item.amount}</td>
              <td><Tag value={item.status} severity={statusSeverity(item.status)} /></td>
              <td>{item.status === "active" ? <Button variant="danger" onClick={() => onCancel(item)}>Cancel</Button> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
