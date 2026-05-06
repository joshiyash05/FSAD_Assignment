import { useCallback, useEffect, useState } from "react";
import { AmenitySummary } from "@/components/amenities/AmenitySummary";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { Button, Card, Field, Message, Select, Skeleton, Stat, Tag } from "@/components/ui";
import type { BookingState } from "@/hooks/useBooking";
import { timeOptions, todayIso } from "@/lib/format";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Amenity, Notify, Spot } from "@/types/parkwise";

export function DashboardPage({ booking, push, notify }: { booking: BookingState; push: (path: string) => void; notify: Notify }) {
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
      const response = await parkwiseApi.availability(date, start, end);
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
    parkwiseApi.amenities()
      .then(setAmenities)
      .catch((err) => notify({ severity: "error", summary: "Amenities unavailable", detail: apiErrorMessage(err, "Unable to load nearby amenities.") }))
      .finally(() => setLoadingAmenities(false));
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

function spotIcon(spot: Spot) {
  if (spot.spot_type === "ev") return "⚡";
  if (spot.spot_type === "covered") return "▣";
  if (spot.spot_type === "handicap") return "♡";
  return "P";
}
