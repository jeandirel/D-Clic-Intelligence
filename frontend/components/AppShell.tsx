import Link from "next/link";
import type { ReactNode } from "react";

type Section = "command" | "radar" | "neural" | "service" | "system";

type SubNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type AppShellProps = {
  section: Section;
  title?: string;
  searchPlaceholder?: string;
  subnav?: SubNavItem[];
  children: ReactNode;
};

const nav = [
  { key: "command", label: "Command Center", href: "/", icon: "dashboard" },
  { key: "radar", label: "Incident Radar", href: "/incident-radar", icon: "radar" },
  { key: "neural", label: "Neural Analytics", href: "/neural-analytics", icon: "neurology" },
  { key: "service", label: "Service Ops", href: "/service-ops", icon: "settings_suggest" },
  { key: "system", label: "System Config", href: "/system-config", icon: "tune" },
] as const;

export function AppShell({
  section,
  title = "D-Clic Intelligence",
  searchPlaceholder = "Query Intelligence Engine...",
  subnav,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="core-orb" aria-hidden="true">
            <span className="core-grid" />
            <span className="core-pulse" />
          </div>
          <div className="brand-copy">
            <strong>D-Clic AI</strong>
            <span><i /> Engine Active</span>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={section === item.key ? "nav-item active" : "nav-item"}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <button className="deploy-button" type="button">
          <span className="material-symbols-outlined">rocket_launch</span>
          Deploy Patch
        </button>
        <div className="sidebar-footer">
          <a href="#"><span className="material-symbols-outlined">help</span>Support</a>
          <a href="#"><span className="material-symbols-outlined">terminal</span>Logs</a>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            <label className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input aria-label="Recherche" placeholder={searchPlaceholder} />
            </label>
            <button className="icon-button status-on" aria-label="Live status"><span className="material-symbols-outlined">sensors</span></button>
            <button className="icon-button" aria-label="AI processor"><span className="material-symbols-outlined">memory</span></button>
            <button className="icon-button network-dot" aria-label="Integrations"><span className="material-symbols-outlined">hub</span></button>
            <button className="avatar" aria-label="Profil">JD</button>
          </div>
        </header>
        {subnav && subnav.length > 0 ? (
          <div className="context-nav" aria-label="Sous-navigation">
            {subnav.map((item) => (
              <Link key={item.href} href={item.href} className={item.active ? "active" : ""}>{item.label}</Link>
            ))}
          </div>
        ) : null}
        <div className="page-canvas">{children}</div>
      </main>
    </div>
  );
}
