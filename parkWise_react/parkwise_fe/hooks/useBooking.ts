"use client";

import { useEffect, useMemo, useState } from "react";
import { todayIso } from "@/lib/format";
import type { Spot } from "@/types/parkwise";

export function useBooking() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [startTime, setStartTime] = useState("09:00:00");
  const [endTime, setEndTime] = useState("11:00:00");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    setSelectedDate(localStorage.getItem("booking_date") ?? todayIso());
    setStartTime(localStorage.getItem("booking_start") ?? "09:00:00");
    setEndTime(localStorage.getItem("booking_end") ?? "11:00:00");
  }, []);

  const durationHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(1, eh + em / 60 - (sh + sm / 60));
  }, [startTime, endTime]);

  const baseRate = Math.round(durationHours * 20 * 100) / 100;
  const gst = Math.round(baseRate * 0.18 * 100) / 100;
  const totalAmount = Math.round((baseRate + gst) * 100) / 100;

  const setFilters = (date: string, start: string, end: string) => {
    setSelectedDate(date);
    setStartTime(start);
    setEndTime(end);
    localStorage.setItem("booking_date", date);
    localStorage.setItem("booking_start", start);
    localStorage.setItem("booking_end", end);
  };

  return {
    selectedDate,
    startTime,
    endTime,
    selectedSpot,
    setSelectedSpot,
    setFilters,
    durationHours,
    baseRate,
    gst,
    totalAmount,
  };
}

export type BookingState = ReturnType<typeof useBooking>;
