import { Tag } from "@/components/ui";
import type { Amenity } from "@/types/parkwise";

export function amenityGlyph(category: Amenity["category"]) {
  return ({ petrol: "⛽", ev: "⚡", cafe: "☕", pharmacy: "+", atm: "₹" } as const)[category];
}

export function AmenitySummary({ amenity }: { amenity: Amenity }) {
  return (
    <article className="dashboard-amenity">
      <span className={`dashboard-amenity-icon amenity-${amenity.category}`}>{amenityGlyph(amenity.category)}</span>
      <div>
        <div className="amenity-head">
          <strong>{amenity.name}</strong>
          <Tag value={amenity.is_open ? "Open" : "Closed"} severity={amenity.is_open ? "success" : "danger"} />
        </div>
        <p>{amenity.distance}</p>
        <span>{amenity.extra_info || amenity.operating_hours || "Details unavailable"}</span>
      </div>
    </article>
  );
}
