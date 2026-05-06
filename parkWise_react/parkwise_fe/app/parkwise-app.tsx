"use client";

import { ReactNode, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Toasts } from "@/components/layout/Toasts";
import { useBooking } from "@/hooks/useBooking";
import { useRoute } from "@/hooks/useRoute";
import { useSession } from "@/hooks/useSession";
import { useToasts } from "@/hooks/useToasts";
import { AdminPage } from "@/features/admin/AdminPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { BookingsPage } from "@/features/bookings/BookingsPage";
import { ConfirmationPage } from "@/features/confirmation/ConfirmationPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { NearbyPage } from "@/features/nearby/NearbyPage";
import { PaymentPage } from "@/features/payment/PaymentPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { parkwiseApi } from "@/services/parkwiseApi";
import "./globals.css";

export default function ParkWiseApp() {
  const route = useRoute();
  const session = useSession();
  const booking = useBooking();
  const { toasts, notify } = useToasts();

  useEffect(() => {
    if (session.token === null && route.path !== "/login") route.push(`/login?redirect=${encodeURIComponent(route.path)}`);
    if (session.token && route.path === "/login") route.push("/");
    if (session.token && route.path === "/admin" && !session.isAdmin) route.push("/");
  }, [route, session.token, session.isAdmin]);

  async function logout() {
    try {
      await parkwiseApi.logout();
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      session.setToken(null);
      session.setUser(null);
      route.push("/login");
    }
  }

  let page: ReactNode;
  if (route.path === "/login") {
    page = <LoginPage session={session} push={route.push} redirect={route.query.get("redirect") ?? "/"} notify={notify} />;
  } else if (route.path === "/bookings") {
    page = <BookingsPage notify={notify} />;
  } else if (route.path === "/profile") {
    page = <ProfilePage session={session} notify={notify} />;
  } else if (route.path === "/nearby") {
    page = <NearbyPage notify={notify} />;
  } else if (route.path === "/admin") {
    page = <AdminPage notify={notify} />;
  } else if (route.path.startsWith("/payment/")) {
    page = <PaymentPage id={Number(route.path.split("/").pop())} push={route.push} notify={notify} />;
  } else if (route.path.startsWith("/confirmation/")) {
    page = <ConfirmationPage id={Number(route.path.split("/").pop())} push={route.push} notify={notify} />;
  } else {
    page = <DashboardPage booking={booking} push={route.push} notify={notify} />;
  }

  return (
    <>
      <Shell session={session} push={route.push} onLogout={logout}>{page}</Shell>
      <Toasts messages={toasts} />
    </>
  );
}
