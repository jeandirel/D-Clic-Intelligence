import { AppShell } from "../../components/AppShell";
import { Chip, GlassCard, PageIntro, Progress } from "../../components/UI";

const subnav = [
  { label: "Predictive Intelligence", href: "/neural-analytics", active: true },
  { label: "Model Ops", href: "/neural-analytics/models" },
];

export default function NeuralAnalyticsPage() {
  return (
    <AppShell section="neural" subnav={subnav}>
      <PageIntro eyebrow={<span className="eyebrow tone-blue">Neural Signal Fabric</span>} title="Predictive Intelligence" subtitle="Forecast SLA exposure, anomaly pressure and decision confidence before operations degrade." />
      <div className="dashboard-grid">
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">SLA Model Health</span><span className="material-symbols-outlined green">verified</span></div><div className="metric-value green">96.8%</div><div className="metric-note">CALIBRATED · v3.4.1</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Forecast Horizon</span><span className="material-symbols-outlined blue">schedule</span></div><div className="metric-value blue">12h</div><div className="metric-note">ROLLING · 5 MIN REFRESH</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Anomaly Pressure</span><span className="material-symbols-outlined amber">crisis_alert</span></div><div className="metric-value amber">0.73</div><div className="metric-note">ELEVATED · VPN / IAM</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Abstention Rate</span><span className="material-symbols-outlined muted">do_not_disturb_on</span></div><div className="metric-value">7.2%</div><div className="metric-note">SAFE FALLBACK ENABLED</div></GlassCard>
        <GlassCard className="big-chart span-8"><div className="card-header"><h3><span className="material-symbols-outlined blue">insights</span>SLA Risk Forecast</h3><Chip tone="blue">12h Predictive Window</Chip></div><div className="svg-chart"><svg viewBox="0 0 760 260" preserveAspectRatio="none"><defs><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#00e0ff" stopOpacity=".22"/><stop offset="1" stopColor="#00e0ff" stopOpacity="0"/></linearGradient></defs><path d="M0 204 C80 192 112 166 168 172 C231 178 260 131 321 139 C386 147 420 92 482 103 C554 116 585 65 642 75 C699 85 719 44 760 34 L760 260 L0 260 Z" fill="url(#blueFill)"/><path d="M0 204 C80 192 112 166 168 172 C231 178 260 131 321 139 C386 147 420 92 482 103 C554 116 585 65 642 75 C699 85 719 44 760 34" fill="none" stroke="#00e0ff" strokeWidth="4"/><path d="M0 224 C95 215 138 205 190 207 C250 209 309 198 356 201 C430 207 493 178 546 186 C611 196 675 168 760 162" fill="none" stroke="#70f3b8" strokeWidth="2" strokeDasharray="7 7" opacity=".8"/></svg></div></GlassCard>
        <GlassCard className="card-pad span-4"><div className="card-header"><h3><span className="material-symbols-outlined green">psychology</span>Model Consensus</h3></div>{[["SLA Gradient Boost",94,"green"],["Temporal Transformer",89,"blue"],["Rules Baseline",72,"amber"]].map(([n,v,t])=><div className="work-row" key={String(n)}><div className="work-row-head"><span>{n}</span><span className={String(t)}>{v}%</span></div><Progress value={Number(v)} tone={t as "green"|"blue"|"amber"}/></div>)}<div className="action-card"><span className="card-label">Decision</span><p>Consensus supports proactive reassignment for 14 tickets. Human validation remains required.</p><Chip tone="green">Policy: L2</Chip></div></GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined amber">ssid_chart</span>Drift Signals</h3><Chip tone="amber">2 Watch Items</Chip></div><div className="source-row"><strong>Group workload distribution</strong><span className="amber">+18.4%</span><span className="muted">7d shift</span></div><div className="source-row"><strong>VPN semantic cluster</strong><span className="amber">+11.2%</span><span className="muted">24h shift</span></div><div className="source-row"><strong>Priority label mix</strong><span className="green">+2.1%</span><span className="muted">stable</span></div></GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined blue">account_tree</span>Feature Influence</h3></div>{[["Remaining SLA minutes",91],["Group backlog",78],["Reassignment count",62],["Semantic complexity",49]].map(([n,v])=><div className="work-row" key={String(n)}><div className="work-row-head"><span>{n}</span><span className="blue">{v}</span></div><Progress value={Number(v)} tone="blue"/></div>)}</GlassCard>
      </div>
    </AppShell>
  );
}
