import { AppShell } from "../../components/AppShell";
import { Chip, GlassCard, PrimaryButton, Progress, SecondaryButton } from "../../components/UI";

const subnav = [
  { label: "Ticket Intelligence", href: "/service-ops", active: true },
  { label: "Workload & Capacity", href: "/service-ops/workload" },
  { label: "Knowledge", href: "/service-ops/knowledge" },
  { label: "AI Actions", href: "/service-ops/actions" },
];

export default function ServiceOpsPage() {
  return (
    <AppShell section="service" subnav={subnav}>
      <div className="ticket-hero"><div><div className="ticket-id"><Chip tone="red">SEV-1</Chip><code>INC-9942</code></div><h2>Authentication Gateway Latency Spike</h2></div><div className="ticket-actions"><SecondaryButton><span className="material-symbols-outlined">share</span>Share Context</SecondaryButton><PrimaryButton><span className="material-symbols-outlined">bolt</span>Execute Playbook</PrimaryButton></div></div>
      <div className="ticket-grid">
        <div className="ticket-main">
          <GlassCard className="summary-card"><div className="card-header"><h3><span className="material-symbols-outlined blue">auto_awesome</span>AI Summary</h3></div><div className="summary-list">
            <div className="summary-item"><span className="summary-dot problem"/><div><strong>Problem</strong><p>EU-West identity gateway is experiencing a 4500ms latency spike, causing auth timeouts for ~40% of standard user roles.</p></div></div>
            <div className="summary-item"><span className="summary-dot context"/><div><strong>Context</strong><p>Correlates with an unauthorized deployment sequence detected on the &apos;iam-core-services&apos; cluster at 08:14 UTC.</p></div></div>
            <div className="summary-item"><span className="summary-dot"/><div><strong>Actions Taken</strong><p>Automated traffic routing shifted 30% of load to US-East fallback. Initial log scrape completed.</p></div></div>
            <div className="summary-item next-step"><span className="summary-dot next"/><div><strong className="green">Next Best Step</strong><p>Initiate rollback script for &apos;iam-core-services&apos; to state v1.4.2 and flush Redis auth cache.</p></div></div>
          </div></GlassCard>
          <GlassCard className="recommend-engine"><div className="card-header"><h3><span className="material-symbols-outlined green">difference</span>Recommendation Engine</h3><Chip tone="muted">Metadata Adjustments</Chip></div><div className="diff-head"><span>Current State</span><span>AI Proposed State</span></div><div className="diff-row"><div>− Group: <s>L1 Service Desk</s></div><div>＋ Group: <b>Workplace Security</b></div></div><div className="diff-row"><div>− Priority: <s>P3 - Medium</s></div><div>＋ Priority: <b>P1 - High</b></div></div><div className="diff-actions"><button className="mini-apply">✓ Apply Changes</button></div></GlassCard>
          <GlassCard className="classification-card"><div className="card-header"><h3><span className="material-symbols-outlined">category</span>Classification Intelligence</h3></div>{[["Identity & Access Management",98.4,"blue"],["Network Infrastructure",72.1,"green"],["Application Hosting",15,"muted"]].map(([name,val,tone])=><div className="class-row" key={String(name)}><div className="class-head"><span>{name}</span><span className={tone === "blue" ? "blue" : tone === "green" ? "green" : "muted"}>{val}%</span></div><Progress value={Number(val)} tone={tone as "blue"|"green"|"muted"}/></div>)}</GlassCard>
        </div>
        <aside className="ticket-side">
          <GlassCard className="sla-predictor"><div className="card-header"><h3><span className="material-symbols-outlined amber">timer</span>SLA Risk Predictor</h3><span className="risk-badge">91% RISK</span></div><div className="card-label">Time to Breach</div><div className="breach-time">01:14:23</div><p>Breach imminent without immediate intervention based on current resolution velocity.</p></GlassCard>
          <GlassCard className="knowledge-card"><div className="knowledge-head">⌘ Semantic Knowledge</div><div className="knowledge-tabs"><span>KB Articles</span><span>Similar Tickets</span></div><div className="kb-list"><div className="kb-item"><strong>Troubleshooting Identity Gateway Redis Timeouts</strong><code>KB-9812 · 94% Relevance</code></div><div className="kb-item"><strong>Emergency Rollback Procedures for IAM Core Services</strong><code>KB-4401 · 88% Relevance</code></div></div><div className="kb-footer">Context generated via Neural Analytics embedding space.</div></GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
