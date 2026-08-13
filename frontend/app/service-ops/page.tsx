import { AppShell } from "../../components/AppShell";
import { Chip, GlassCard, PrimaryButton, Progress, SecondaryButton } from "../../components/UI";

const subnav = [
  { label: "Intelligence ticket", href: "/service-ops", active: true },
  { label: "Copilote Agent", href: "/service-ops/copilot" },
  { label: "Charge & capacité", href: "/service-ops/workload" },
  { label: "Connaissances", href: "/service-ops/knowledge" },
  { label: "Actions IA", href: "/service-ops/actions" },
];

export default function ServiceOpsPage() {
  return (
    <AppShell section="service" subnav={subnav}>
      <div className="ticket-hero"><div><div className="ticket-id"><Chip tone="red">P1 CRITIQUE</Chip><code>INC-9942</code></div><h2>Pic de latence sur la passerelle d’authentification</h2></div><div className="ticket-actions"><SecondaryButton><span className="material-symbols-outlined">share</span>Partager le contexte</SecondaryButton><PrimaryButton><span className="material-symbols-outlined">bolt</span>Lancer le plan d’action</PrimaryButton></div></div>
      <div className="ticket-grid">
        <div className="ticket-main">
          <GlassCard className="summary-card"><div className="card-header"><h3><span className="material-symbols-outlined blue">auto_awesome</span>Résumé IA</h3></div><div className="summary-list">
            <div className="summary-item"><span className="summary-dot problem"/><div><strong>Problème</strong><p>La passerelle d’identité EU-West présente un pic de latence à 4 500 ms, provoquant des expirations d’authentification pour environ 40 % des profils utilisateurs standards.</p></div></div>
            <div className="summary-item"><span className="summary-dot context"/><div><strong>Contexte</strong><p>Le signal est corrélé à une séquence de déploiement non attendue détectée sur le cluster « iam-core-services » à 08:14 UTC.</p></div></div>
            <div className="summary-item"><span className="summary-dot"/><div><strong>Actions déjà réalisées</strong><p>Le routage automatique a basculé 30 % de la charge vers le secours US-East. Une première collecte des journaux est terminée.</p></div></div>
            <div className="summary-item next-step"><span className="summary-dot next"/><div><strong className="green">Prochaine action recommandée</strong><p>Préparer le rollback de « iam-core-services » vers la version v1.4.2 puis invalider le cache Redis d’authentification, sous réserve de validation.</p></div></div>
          </div></GlassCard>
          <GlassCard className="recommend-engine"><div className="card-header"><h3><span className="material-symbols-outlined green">difference</span>Recommandation d’action</h3><Chip tone="muted">Modifications proposées</Chip></div><div className="diff-head"><span>État actuel</span><span>État proposé par l’IA</span></div><div className="diff-row"><div>− Groupe : <s>Support N1</s></div><div>＋ Groupe : <b>Sécurité Workplace</b></div></div><div className="diff-row"><div>− Priorité : <s>P3 - Moyenne</s></div><div>＋ Priorité : <b>P1 - Urgente</b></div></div><div className="diff-actions"><button className="mini-apply">✓ Appliquer les modifications</button></div></GlassCard>
          <GlassCard className="classification-card"><div className="card-header"><h3><span className="material-symbols-outlined">category</span>Classification proposée</h3></div>{[["Identité & accès",98.4,"blue"],["Réseau & infrastructure",72.1,"green"],["Applications & hébergement",15,"muted"]].map(([name,val,tone])=><div className="class-row" key={String(name)}><div className="class-head"><span>{name}</span><span className={tone === "blue" ? "blue" : tone === "green" ? "green" : "muted"}>{String(val).replace(".",",")} %</span></div><Progress value={Number(val)} tone={tone as "blue"|"green"|"muted"}/></div>)}</GlassCard>
        </div>
        <aside className="ticket-side">
          <GlassCard className="sla-predictor"><div className="card-header"><h3><span className="material-symbols-outlined amber">timer</span>Risque de dépassement SLA</h3><span className="risk-badge">91 % DE RISQUE</span></div><div className="card-label">Temps avant dépassement</div><div className="breach-time">01:14:23</div><p>Un dépassement est probable sans intervention rapide, compte tenu du rythme actuel de résolution.</p></GlassCard>
          <GlassCard className="knowledge-card"><div className="knowledge-head">⌘ Connaissances pertinentes</div><div className="knowledge-tabs"><span>Articles de connaissance</span><span>Tickets similaires</span></div><div className="kb-list"><div className="kb-item"><strong>Dépannage des expirations Redis sur la passerelle d’identité</strong><code>KB-9812 · Pertinence 94 %</code></div><div className="kb-item"><strong>Procédure de rollback d’urgence des services IAM Core</strong><code>KB-4401 · Pertinence 88 %</code></div></div><div className="kb-footer">Résultats issus de la recherche sémantique D-Clic.</div></GlassCard>
        </aside>
      </div>
    </AppShell>
  );
}
