import { AppShell } from "../../../components/AppShell";
import { Chip, GlassCard, PageIntro, Progress } from "../../../components/UI";

const subnav = [
  { label: "Intelligence prédictive", href: "/neural-analytics" },
  { label: "Pilotage des modèles", href: "/neural-analytics/models", active: true },
];

export default function ModelsPage() {
  return (
    <AppShell section="neural" title="D-Clic Intelligence" subnav={subnav} searchPlaceholder="Rechercher dans le registre des modèles...">
      <PageIntro eyebrow={<span className="eyebrow tone-green">Pilotage MLOps</span>} title="Pilotage des modèles" subtitle="Gouvernance champion/challenger, dérive, latence et critères de mise en production de chaque modèle d’intelligence." />
      <div className="dashboard-grid">
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Modèles en production</span><span className="material-symbols-outlined green">deployed_code</span></div><div className="metric-value">8</div><div className="metric-note">3 PRÉDICTIFS · 5 NLP/RAG</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Modèles opérationnels</span><span className="material-symbols-outlined green">health_and_safety</span></div><div className="metric-value green">7/8</div><div className="metric-note">1 SOUS SURVEILLANCE DE DÉRIVE</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Latence d’inférence P95</span><span className="material-symbols-outlined blue">timer</span></div><div className="metric-value blue">184 ms</div><div className="metric-note">SLO &lt; 250 MS</div></GlassCard>
        <GlassCard className="metric-card span-3"><div className="metric-top"><span className="card-label">Validation avant production</span><span className="material-symbols-outlined amber">rule</span></div><div className="metric-value amber">1 en attente</div><div className="metric-note">AFFECTATION v4.0</div></GlassCard>
        <GlassCard className="table-card span-12"><div className="card-pad"><div className="card-header"><h3><span className="material-symbols-outlined green">database</span>Registre des modèles</h3><Chip tone="green">Registre synchronisé</Chip></div></div><div className="table-head cols-6"><span>Modèle</span><span>Version</span><span>Rôle</span><span>Qualité</span><span>Dérive</span><span>État</span></div>{[["Prédiction dépassement SLA","v3.4.1","Champion","96,8 %","Faible","Opérationnel"],["Classification des tickets","v7.2.0","Champion","91,3 %","Faible","Opérationnel"],["Recommandation d’affectation","v3.8.2","Champion","88,7 %","Moyenne","Surveillance"],["Recommandation d’affectation","v4.0-rc2","Challenger","92,1 %","Faible","Évaluation"],["Détection de doublons","v2.6.4","Champion","94,5 %","Faible","Opérationnel"]].map((r)=><div className="table-row cols-6" key={r[0]+r[1]}><strong>{r[0]}</strong><code>{r[1]}</code><span>{r[2]}</span><span className="green">{r[3]}</span><span className={r[4]==="Moyenne"?"amber":"green"}>{r[4]}</span><Chip tone={r[5]==="Surveillance"?"amber":r[5]==="Évaluation"?"blue":"green"}>{r[5]}</Chip></div>)}</GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined blue">compare_arrows</span>Champion vs challenger</h3></div><div className="source-row"><strong>Précision top-1 d’affectation</strong><span>88,7 %</span><span className="green">92,1 %</span></div><div className="source-row"><strong>Erreur de calibration</strong><span>0,071</span><span className="green">0,043</span></div><div className="source-row"><strong>Latence P95</strong><span>121 ms</span><span className="amber">168 ms</span></div><div className="source-row"><strong>Couverture après abstention</strong><span>93,4 %</span><span className="green">95,1 %</span></div></GlassCard>
        <GlassCard className="card-pad span-6"><div className="card-header"><h3><span className="material-symbols-outlined amber">fact_check</span>Critères de mise en production</h3></div>{[["Évaluation hors ligne",100,"green"],["Calibration",100,"green"],["Revue biais / erreurs",82,"amber"],["Shadow mode en production",65,"blue"]].map(([n,v,t])=><div className="work-row" key={String(n)}><div className="work-row-head"><span>{n}</span><span className={String(t)}>{v}%</span></div><Progress value={Number(v)} tone={t as "green"|"amber"|"blue"}/></div>)}</GlassCard>
      </div>
    </AppShell>
  );
}
