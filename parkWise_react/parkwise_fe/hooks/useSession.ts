"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthResponse, User } from "@/types/parkwise";

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    try {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const persist = (next: AuthResponse) => {
    localStorage.setItem("token", next.token);
    localStorage.setItem("user", JSON.stringify(next.user));
    setToken(next.token);
    setUser(next.user);
  };

  const initials = useMemo(() => {
    if (!user) return "P";
    const parts = [user.first_name, user.last_name].map((part) => part?.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (user.username?.[0] ?? user.email?.[0] ?? "P").toUpperCase();
  }, [user]);

  return {
    token,
    user,
    initials,
    isAuthenticated: Boolean(token),
    isAdmin: user?.is_staff ?? false,
    persist,
    setToken,
    setUser,
  };
}

export type SessionState = ReturnType<typeof useSession>;
