import type { Reservation } from "@/types/parkwise";

export function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function effectiveStatus(reservation: Reservation) {
  if (reservation.status === "active" && new Date(reservation.end_time).getTime() <= Date.now()) {
    return "completed";
  }
  return reservation.status;
}

export function statusSeverity(status: Reservation["status"]) {
  if (status === "cancelled") return "danger";
  if (status === "completed") return "success";
  return "info";
}

export const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return { label: value.slice(0, 5), value };
});
