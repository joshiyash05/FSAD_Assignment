"use client";

import { useCallback, useState } from "react";
import type { ToastMessage } from "@/types/parkwise";

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...message, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);

  return { toasts, notify };
}
