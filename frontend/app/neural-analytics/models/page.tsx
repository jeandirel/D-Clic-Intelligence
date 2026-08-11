import { AppShell } from "../../../components/AppShell";
import { Chip, GlassCard, PageIntro, Progress } from "../../../components/UI";

const subnav = [
  { label: "Predictive Intelligence", href: "/neural-analytics" },
  { label: "Model Ops", href: "/neural-analytics/models", active: true },
];

export default function ModelsPage() {
  return (
    <AppShell section="neural" title="D-Clic Intelligence" subnav={subnav} searchPlaceholder="Search model registry...">
      <PageIntro eyebrow={<span className="eyebrow tone-green">Model Control Plane</span>} title="Model Ops" subtitle="Champion/challenger governance, drift, latency and release gates for every production intelligence model." />
      <div className="dashboard-grid">
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Production Models</span><span className="material-symbols-outlined green">deployed_code</span></div><div className="metric-value">8</div><div className="metric-note">3 PREDICTIVE · 5 NLP/RAG</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Models Healthy</span><span className="material-symbols-outlined green">health_and_safety</span></div><div className="metric-value green">7/8</div><div className="metric-note">1 UNDER DRIFT WATCH</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">P95 Inference</span><span className="material-symbols-outlined blue">timer</span></div><div className="metric-value blue">184ms</div><div className="metric-note">SLO &lt; 250MS</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Eval Gate</span><span className="material-symbols-outlined amber">rule</span></div><div className="metric-value amber">1 Pending</div><div className="metric-note">ASSIGNMENT v4.0</div></GlassCard>
        <GlassCard className="table-card span-12"><div className="card-pad"><div className="card-header"><h3><span className="material-symbols-outlined green">database</span>Production Registry</h3><Chip tone="green">Registry Synced</Chip></div></div><div className="table-head cols-6"><span>Model</span><span>Version</span><span>Role</span><span>Quality</span><span>Drift</span><span>Status</span></div>{[["SLA Breach Predictor","v3.4.1","Champion","96.8%","Low","Healthy"],["Ticket Classifier","v7.2.0","Champion","91.3%","Low","Healthy"],["Assignment Recommender","v3.8.2","Champion","88.7%","Medium","Watch"],["Assignment Recommender","v4.0-rc2","Challenger","92.1%","Low","Eval"],["Semantic Duplicate","v2.6.4","Champion","94.5%","Low","Healthy"]].map((r)=><div className="table-row cols-6" key={r[0]+r[1]}><strong>{r[0]}</strong><code>{r[1]}</code><span>{r[2]}</span><span className="green">{r[3]}</span><span className={r[4]==="Medium"?"amber":"green"}>{r[4]}</span><Chip tone={r[5]==="Watch"?"amber":r[5]==="Eval"?"blue":"green"}>{r[5]}</Chip></div>)}</GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined blue">compare_arrows</span>Champion vs Challenger</h3></div><div className="source-row"><strong>Top-1 assignment accuracy</strong><span>88.7%</span><span className="green">92.1%</span></div><div className="source-row"><strong>Calibration error</strong><span>0.071</span><span className="green">0.043</span></div><div className="source-row"><strong>P95 latency</strong><span>121ms</span><span className="amber">168ms</span></div><div className="source-row"><strong>Abstention coverage</strong><span>93.4%</span><span className="green">95.1%</span></div></GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined amber">fact_check</span>Release Gates</h3></div>{[["Offline evaluation",100,"green"],["Calibration",100,"green"],["Bias/error review",82,"amber"],["Shadow production",65,"blue"]].map(([n,v,t])=><div className="work-row" key={String(n)}><div className="work-row-head"><span>{n}</span><span className={String(t)}>{v}%</span></div><Progress value={Number(v)} tone={t as "green"|"amber"|"blue"}/></div>)}</GlassCard>
      </div>
    </AppShell>
  );
}
