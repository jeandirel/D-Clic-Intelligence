import { AppShell } from "../../components/AppShell";
import { Chip, GlassCard, PageIntro, PrimaryButton, Progress } from "../../components/UI";

export default function IncidentRadarPage() {
  return (
    <AppShell section="radar" searchPlaceholder="Search parameters...">
      <PageIntro eyebrow={<><span className="material-symbols-outlined amber">warning</span><span className="eyebrow tone-amber">Active Detection Grid</span></>} title="Incident Radar" subtitle="Detection of clusters and emerging anomalies in real-time." action={<PrimaryButton><span className="material-symbols-outlined">auto_awesome</span>Promote to Problem</PrimaryButton>} />
      <div className="dashboard-grid">
        <GlassCard className="radar-card span-8">
          <h3>Clustering View</h3><div className="cluster-badge"><Chip tone="amber">● 47 Incidents Linked to VPN</Chip></div>
          <div className="radar-stage"><span className="cluster-dot cyan"/><span className="cluster-dot pink"/><span className="cluster-dot yellow"/><span className="cluster-line one"/><span className="cluster-line two"/></div>
        </GlassCard>
        <GlassCard className="ranking-card span-4">
          <div className="card-header"><h3><span className="material-symbols-outlined blue">psychology</span>Root Cause Ranking</h3></div>
          <div className="rank-item best"><div className="rank-top"><span className="rank-code">CHG-1234</span><Chip tone="green">88% Match</Chip></div><p>Firewall rules update for European Region VPN gateway.</p><Progress value={88} tone="green"/></div>
          <div className="rank-item"><div className="rank-top"><span className="rank-code">INC-8992</span><span className="amber mono">42%</span></div><p>ISP latency spike reported in Frankfurt POP.</p><Progress value={42} tone="amber"/></div>
          <div className="rank-item"><div className="rank-top"><span className="rank-code">SYS-EVT</span><span className="muted mono">15%</span></div><p>Routine token expiry batch job.</p><Progress value={15} tone="muted"/></div>
        </GlassCard>
        <GlassCard className="temporal-card span-8"><div className="card-header"><h3><span className="material-symbols-outlined muted">timeline</span>Temporal Spikes</h3></div><div className="spike-chart">{[34,44,52,68,94,126,88,55,38,28].map((h,i)=><span key={i} className={`spike ${i===3?"blue":i===4||i===6?"amber":i===5?"red":""}`} style={{height:h}}/> )}</div><div className="spike-time"><span>08:00</span><span>08:30</span><span>09:00</span><span className="red">09:10</span><span>09:30</span></div></GlassCard>
        <GlassCard className="site-map span-4"><span className="map-title">⌖ Affected Sites</span><span className="map-dot one"/><span className="map-dot two"/><span className="map-label">Frankfurt (32)</span></GlassCard>
      </div>
    </AppShell>
  );
}
