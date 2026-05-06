import type { ReactNode } from "react";
import type { SessionState } from "@/hooks/useSession";
import { Button } from "@/components/ui";

export function Shell({
  children,
  session,
  push,
  onLogout,
}: {
  children: ReactNode;
  session: SessionState;
  push: (path: string) => void;
  onLogout: () => void;
}) {
  if (!session.isAuthenticated) return <main className="app-main">{children}</main>;

  const items = [
    ["Dashboard", "/", "▦"],
    ["Bookings", "/bookings", "▤"],
    ["Nearby", "/nearby", "⌖"],
    ["Profile", "/profile", "◉"],
    ...(session.isAdmin ? ([["Admin", "/admin", "◆"]] as string[][]) : []),
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="menubar">
          <button className="brand-button" type="button" onClick={() => push("/")}>
            <span className="brand-mark small">P</span>
            <span>ParkWise</span>
          </button>
          <div className="nav-links">
            {items.map(([label, href, icon]) => (
              <button key={href} className="nav-menu-link" type="button" onClick={() => push(href)}>
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="topbar-actions">
            <span className="profile-avatar">{session.initials}</span>
            <Button variant="text" onClick={onLogout}>Sign out</Button>
          </div>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
