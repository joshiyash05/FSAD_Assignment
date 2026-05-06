import { useCallback, useEffect, useState } from "react";
import { amenityGlyph } from "@/components/amenities/AmenitySummary";
import { Button, Card, Message, Skeleton, Tag } from "@/components/ui";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Amenity, Notify } from "@/types/parkwise";

export function NearbyPage({ notify }: { notify: Notify }) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    parkwiseApi.amenities()
      .then(setAmenities)
      .catch((err) => notify({ severity: "error", summary: "Amenities unavailable", detail: apiErrorMessage(err, "Failed to load amenities.") }))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(load, [load]);

  return (
    <section className="page-stack">
      <div className="page-title">
        <div><h1>Nearby</h1><p>{amenities.filter((item) => item.is_open).length} amenities open near your parking area.</p></div>
        <Button variant="outlined" disabled={loading} onClick={load}>Refresh</Button>
      </div>
      {loading ? (
        <div className="amenity-grid"><Skeleton height="10rem" /><Skeleton height="10rem" /><Skeleton height="10rem" /></div>
      ) : amenities.length === 0 ? (
        <Message severity="info">No nearby amenities found.</Message>
      ) : (
        <div className="amenity-grid">
          {amenities.map((amenity) => (
            <Card key={amenity.id}>
              <div className="amenity-card">
                <span className="amenity-icon">{amenityGlyph(amenity.category)}</span>
                <div>
                  <div className="zone-title">
                    <h2>{amenity.name}</h2>
                    <Tag value={amenity.is_open ? "Open" : "Closed"} severity={amenity.is_open ? "success" : "danger"} />
                  </div>
                  <p>{amenity.distance}</p>
                  <span>{amenity.operating_hours || "Hours unavailable"}</span>
                  {amenity.extra_info ? <strong>{amenity.extra_info}</strong> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
