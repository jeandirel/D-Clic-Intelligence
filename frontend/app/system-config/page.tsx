import { AppShell } from "../../components/AppShell";
import { GlassCard, Progress } from "../../components/UI";

const subnav = [
  { label: "API & Quota", href: "/system-config", active: true },
  { label: "Audit & Governance", href: "/system-config/audit" },
];

export default function SystemConfigPage() {
  return (
    <AppShell section="system" title="API & Quota Control" searchPlaceholder="Search config..." subnav={subnav}>
      <div className="quota-layout">
        <div className="quota-main">
          <GlassCard className="quota-stat"><div className="stat-line"><div><div className="card-label">Quota Burn Rate</div><div className="quota-rate">231 <small>/ min</small></div></div><span className="material-symbols-outlined green">speed</span></div><div className="quota-meta"><span>Current</span><span>Limit: 400</span></div><Progress value={58} tone="amber"/><div className="quota-warning">Warning Threshold Approaching</div></GlassCard>
          <GlassCard className="quota-stat"><div className="stat-line"><div><div className="card-label">429 Last Hour</div><div className="quota-rate red">2 <small>events</small></div></div><span className="material-symbols-outlined red">warning</span></div><div className="action-card"><span className="red mono">↗ +2 vs prior hr</span></div></GlassCard>
          <GlassCard className="consumer-card"><div className="card-header"><span className="card-label">Top Consumers</span><span className="green mono">View All</span></div>{[["Ticket Sync Service",145,64,"blue"],["Intelligence Engine Core",68,30,"green"],["User Authentication API",12,8,"muted"],["Asset Discovery Probe",6,4,"muted"]].map(([name,req,val,tone])=><div className="consumer-row" key={String(name)}><div className="consumer-head"><span>{name}</span><code>{req} req/m</code></div><Progress value={Number(val)} tone={tone as "blue"|"green"|"muted"}/></div>)}</GlassCard>
        </div>
        <aside className="quota-side">
          <GlassCard className="reserve-card"><div className="reserve-ring"><span className="material-symbols-outlined">lock</span></div><p>Emergency Reserve</p><div className="reserve-value">20%</div><div style={{marginTop:14}}><span className="chip chip-muted">Locked for Critical Ops</span></div></GlassCard>
          <GlassCard className="kill-card"><div className="card-header"><span className="card-label red">⏻ Kill Switches</span></div>{[["Data Ingestion",true],["Batch Processing",true],["External Webhooks",false]].map(([name,on])=><div className={`kill-row ${on?"":"halted"}`} key={String(name)}><div><strong>{name}</strong><small>{on?"ACTIVE":"HALTED"}</small></div><span className={`toggle ${on?"on":""}`}/></div>)}<div className="kb-footer">ⓘ Action requires Admin+ clearance</div></GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
