import { AppShell } from "../components/AppShell";
import { Chip, GlassCard, Progress } from "../components/UI";

const workload = [
  ["L1 Support", 92, "amber"],
  ["Network Ops", 45, "green"],
  ["Cloud Arch", 68, "blue"],
  ["SecOps", 98, "red"],
] as const;

export default function CommandCenterPage() {
  return (
    <AppShell section="command">
      <div className="dashboard-grid">
        <GlassCard className="health-card span-4">
          <div className="card-header"><span className="card-label">Global Health Score</span><span className="material-symbols-outlined blue">verified_user</span></div>
          <div className="health-ring-wrap"><div className="health-ring"><strong>92<small>%</small></strong></div></div>
          <div className="health-status">↗ System Stable</div>
        </GlassCard>

        <GlassCard className="sla-card span-8">
          <div className="card-header"><div><span className="card-label">SLA Risk Pulse</span><h3 className="sla-title"><strong>19</strong> Tickets at &gt;80% Risk</h3></div><span className="material-symbols-outlined amber">warning</span></div>
          <div className="chart-area">
            <svg viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="amberFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ffb800" stopOpacity=".35"/><stop offset="1" stopColor="#ffb800" stopOpacity="0"/></linearGradient></defs>
              <path d="M0,170 C100,115 200,135 290,166 C390,201 460,157 520,112 C590,58 663,0 710,25 C731,38 721,77 720,92 L720,220 L0,220 Z" fill="url(#amberFill)"/>
              <path d="M0,170 C100,115 200,135 290,166 C390,201 460,157 520,112 C590,58 663,0 710,25 C731,38 721,77 720,92" fill="none" stroke="#ffb800" strokeWidth="6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="chart-axis"><span>-12h</span><span>-6h</span><span>Now</span></div>
        </GlassCard>

        <div className="span-8">
          <div className="section-label"><span className="material-symbols-outlined">lightbulb</span> Active AI Recommendations</div>
          <div className="dashboard-grid">
            <GlassCard className="recommendation-card span-6">
              <div><Chip tone="red">Critical Fix</Chip><h4>Database Index Fragmentation</h4><p>Cluster Alpha-9 is showing 42% fragmentation. Rebuilding indexes will reduce the current query-latency cascade.</p></div>
              <div className="recommendation-footer"><span className="confidence">Confidence: 98%</span><button className="mini-apply">Apply</button></div>
            </GlassCard>
            <GlassCard className="recommendation-card span-6">
              <div><Chip tone="blue">Optimization</Chip><h4>Auto-Scale Node Pool</h4><p>Current load indicates a typical Friday spike approaching. Pre-scaling workers can protect first-response latency.</p></div>
              <div className="recommendation-footer"><span className="confidence">Confidence: 85%</span><button className="mini-apply">Apply</button></div>
            </GlassCard>
          </div>
        </div>

        <GlassCard className="workload-card span-4">
          <div className="card-header"><span className="card-label">Workload Distribution</span><span className="material-symbols-outlined muted">groups</span></div>
          {workload.map(([name, value, tone]) => <div className="work-row" key={name}><div className="work-row-head"><span>{name}</span><span className={tone === "amber" ? "amber" : tone === "red" ? "red" : tone === "blue" ? "blue" : "green"}>{value}%</span></div><Progress value={value} tone={tone}/></div>)}
        </GlassCard>

        <GlassCard className="radar-highlight span-12">
          <Chip tone="muted">◎ Incident Radar Highlights</Chip>
          <span className="radar-dot a"/><span className="radar-dot b"/><span className="radar-dot c"/>
        </GlassCard>
      </div>
    </AppShell>
  );
}
