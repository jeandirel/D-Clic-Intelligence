import { AppShell } from "../../components/AppShell";
import { GlassCard, Progress } from "../../components/UI";

const subnav = [
  { label: "API & quotas", href: "/system-config", active: true },
  { label: "Audit & gouvernance", href: "/system-config/audit" },
];

export default function SystemConfigPage() {
  return (
    <AppShell section="system" title="Contrôle API & quotas" searchPlaceholder="Rechercher un paramètre..." subnav={subnav}>
      <div className="quota-layout">
        <div className="quota-main">
          <GlassCard className="quota-stat"><div className="stat-line"><div><div className="card-label">Consommation du quota</div><div className="quota-rate">231 <small>/ min</small></div></div><span className="material-symbols-outlined green">speed</span></div><div className="quota-meta"><span>Actuel</span><span>Limite : 400</span></div><Progress value={58} tone="amber"/><div className="quota-warning">Seuil d’alerte proche</div></GlassCard>
          <GlassCard className="quota-stat"><div className="stat-line"><div><div className="card-label">Erreurs 429 — dernière heure</div><div className="quota-rate red">2 <small>événements</small></div></div><span className="material-symbols-outlined red">warning</span></div><div className="action-card"><span className="red mono">↗ +2 vs heure précédente</span></div></GlassCard>
          <GlassCard className="consumer-card"><div className="card-header"><span className="card-label">Principaux consommateurs</span><span className="green mono">Voir tout</span></div>{[["Synchronisation des tickets",145,64,"blue"],["Moteur D-Clic Intelligence",68,30,"green"],["API d’authentification",12,8,"muted"],["Découverte des assets",6,4,"muted"]].map(([name,req,val,tone])=><div className="consumer-row" key={String(name)}><div className="consumer-head"><span>{name}</span><code>{req} appels/min</code></div><Progress value={Number(val)} tone={tone as "blue"|"green"|"muted"}/></div>)}</GlassCard>
        </div>
        <aside className="quota-side">
          <GlassCard className="reserve-card"><div className="reserve-ring"><span className="material-symbols-outlined">lock</span></div><p>Réserve d’urgence</p><div className="reserve-value">20 %</div><div style={{marginTop:14}}><span className="chip chip-muted">Réservée aux opérations critiques</span></div></GlassCard>
          <GlassCard className="kill-card"><div className="card-header"><span className="card-label red">⏻ Arrêts d’urgence</span></div>{[["Ingestion des données",true],["Traitements batch",true],["Webhooks externes",false]].map(([name,on])=><div className={`kill-row ${on?"":"halted"}`} key={String(name)}><div><strong>{name}</strong><small>{on?"ACTIF":"ARRÊTÉ"}</small></div><span className={`toggle ${on?"on":""}`}/></div>)}<div className="kb-footer">ⓘ Action réservée aux administrateurs</div></GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
