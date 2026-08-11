import type { ReactNode } from "react";

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass-card ${className}`.trim()}>{children}</section>;
}

export function Eyebrow({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "amber" | "blue" | "green" }) {
  return <span className={`eyebrow tone-${tone}`}>{children}</span>;
}

export function Chip({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "blue" | "red" | "muted" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function Progress({ value, tone = "green" }: { value: number; tone?: "green" | "amber" | "blue" | "red" | "muted" }) {
  return <div className="progress-track"><span className={`progress-fill fill-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function PageIntro({ eyebrow, title, subtitle, action }: { eyebrow?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow ? <div className="page-intro-eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="page-intro-action">{action}</div> : null}
    </div>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return <button className="button primary" type="button">{children}</button>;
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return <button className="button secondary" type="button">{children}</button>;
}
