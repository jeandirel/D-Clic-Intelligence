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
  { key: "command", label: "Centre de pilotage", href: "/", icon: "dashboard" },
  { key: "radar", label: "Radar d’incidents", href: "/incident-radar", icon: "radar" },
  { key: "neural", label: "Analyses prédictives", href: "/neural-analytics", icon: "neurology" },
  { key: "service", label: "Opérations Service Desk", href: "/service-ops", icon: "settings_suggest" },
  { key: "system", label: "Administration", href: "/system-config", icon: "tune" },
] as const;

export function AppShell({
  section,
  title = "D-Clic Intelligence",
  searchPlaceholder = "Rechercher dans D-Clic...",
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
            <span><i /> Moteur opérationnel</span>
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
        <Link className="deploy-button" href="/demo">
          <span className="material-symbols-outlined">slideshow</span>
          Lancer la démonstration
        </Link>
        <div className="sidebar-footer">
          <a href="#"><span className="material-symbols-outlined">help</span>Support</a>
          <a href="#"><span className="material-symbols-outlined">terminal</span>Journaux</a>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <h1>{title}</h1>
            <span className="chip chip-amber" title="Les données affichées dans cette version sont simulées pour la présentation">
              DÉMO · DONNÉES SIMULÉES
            </span>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input aria-label="Recherche" placeholder={searchPlaceholder} />
            </label>
            <button className="icon-button status-on" aria-label="État temps réel"><span className="material-symbols-outlined">sensors</span></button>
            <button className="icon-button" aria-label="Moteur IA"><span className="material-symbols-outlined">memory</span></button>
            <button className="icon-button network-dot" aria-label="Intégrations"><span className="material-symbols-outlined">hub</span></button>
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
