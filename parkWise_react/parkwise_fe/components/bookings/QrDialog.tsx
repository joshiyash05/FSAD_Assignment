import { Button, Tag } from "@/components/ui";
import { QrCodeDisplay } from "@/components/qr/QrCodeDisplay";
import { effectiveStatus, formatDate, statusSeverity } from "@/lib/format";
import type { Reservation } from "@/types/parkwise";

export function QrDialog({ reservation, close }: { reservation: Reservation; close: () => void }) {
  const payload = JSON.stringify({
    ref: `PKW-${reservation.id}`,
    spot: reservation.spot.label,
    zone: reservation.spot.zone,
    vehicle: reservation.vehicle?.plate_number ?? null,
    start: reservation.start_time,
    end: reservation.end_time,
    status: effectiveStatus(reservation),
  });

  return (
    <div className="drawer-backdrop">
      <div className="modal qr-dialog">
        <div className="zone-title">
          <h2>Booking QR Code</h2>
          <Button variant="text" onClick={close}>Close</Button>
        </div>
        <div className="qr-dialog-content">
          <QrCodeDisplay value={payload} size={220} />
          <div className="center-title compact">
            <h2>PKW-{reservation.id}</h2>
            <p>{reservation.spot.label} · Zone {reservation.spot.zone}</p>
          </div>
          <hr />
          <div className="summary-list wide">
            <span>Vehicle</span><strong>{reservation.vehicle?.plate_number ?? "-"}</strong>
            <span>Start</span><strong>{formatDate(reservation.start_time)}</strong>
            <span>End</span><strong>{formatDate(reservation.end_time)}</strong>
            <span>Status</span><Tag value={effectiveStatus(reservation)} severity={statusSeverity(effectiveStatus(reservation))} />
          </div>
        </div>
      </div>
    </div>
  );
}
