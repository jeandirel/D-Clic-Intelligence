"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "../app/demo/demo.module.css";

type Tone = "green" | "amber" | "blue" | "red" | "muted";

type DemoStep = {
  title: string;
  actor: string;
  action: string;
  result: string;
  proof: string;
  tone?: Tone;
};

type Workflow = {
  id: string;
  title: string;
  domain: string;
  audience: string;
  objective: string;
  route: string;
  icon: string;
  steps: DemoStep[];
};

const workflows: Workflow[] = [
  {
    id: "pilotage",
    title: "Pilotage global du Service Desk",
    domain: "Management ITSM",
    audience: "Responsable Service Desk / DSI",
    objective: "Comprendre en moins d’une minute l’état opérationnel, les risques SLA, les incidents émergents et les recommandations prioritaires.",
    route: "/",
    icon: "dashboard",
    steps: [
      { title: "Consolidation des signaux", actor: "D-Clic", action: "Agrège tickets, SLA, charge, incidents et télémétrie API simulés.", result: "Score de santé : 92 %. 19 tickets à risque SLA > 80 %.", proof: "KPI du Centre de pilotage", tone: "blue" },
      { title: "Priorisation", actor: "Moteur de décision", action: "Classe les risques par impact, urgence et temps restant.", result: "3 situations nécessitent une attention immédiate.", proof: "Liste des recommandations actives", tone: "amber" },
      { title: "Recommandation", actor: "IA", action: "Propose des actions sans les exécuter.", result: "Rééquilibrage de file et investigation VPN recommandés.", proof: "Carte action + confiance", tone: "green" },
      { title: "Décision manager", actor: "Manager", action: "Ouvre le scénario concerné pour analyser les détails.", result: "Navigation vers SLA, Radar ou Charge & capacité.", proof: "Traçabilité de la consultation", tone: "green" },
    ],
  },
  {
    id: "ticket",
    title: "Traitement intelligent d’un ticket",
    domain: "Service Desk",
    audience: "Agent support",
    objective: "Faire comprendre rapidement un ticket, proposer une classification, détecter les doublons et préparer la prochaine action.",
    route: "/service-ops",
    icon: "confirmation_number",
    steps: [
      { title: "Lecture du ticket", actor: "Agent", action: "Ouvre INC-9942 dans D-Clic.", result: "Le sujet, le contexte, l’historique et le SLA sont chargés.", proof: "Vue Intelligence ticket", tone: "blue" },
      { title: "Résumé IA", actor: "IA", action: "Synthétise problème, contexte, actions déjà menées et prochaine étape.", result: "Latence du portail d’authentification identifiée comme problème principal.", proof: "Bloc Résumé IA", tone: "green" },
      { title: "Classification & doublons", actor: "IA", action: "Calcule Top-3 groupe/catégorie et rapproche les tickets similaires.", result: "IAM 98,4 % ; 3 tickets similaires détectés.", proof: "Scores + liens vers incidents similaires", tone: "blue" },
      { title: "Prévisualisation", actor: "Agent", action: "Demande à voir les changements avant application.", result: "Groupe, priorité et note interne affichés en avant/après.", proof: "Diff de prévisualisation", tone: "amber" },
      { title: "Validation", actor: "Policy Engine", action: "Vérifie le niveau de risque et les droits.", result: "Action classée L2 : validation humaine requise.", proof: "Décision de politique simulée", tone: "amber" },
    ],
  },
  {
    id: "reponse",
    title: "Réponse assistée à l’utilisateur",
    domain: "Service Desk",
    audience: "Agent support",
    objective: "Préparer une réponse claire et sourcée à partir du ticket et de la base de connaissances.",
    route: "/service-ops",
    icon: "forum",
    steps: [
      { title: "Analyse de la demande", actor: "IA", action: "Identifie l’intention et les informations déjà fournies.", result: "Problème VPN après renouvellement de certificat.", proof: "Intention + résumé", tone: "blue" },
      { title: "Recherche documentaire", actor: "RAG", action: "Recherche uniquement dans les sources autorisées.", result: "KB-9812 et KB-4401 retenus avec 94 % et 88 % de pertinence.", proof: "Sources citées", tone: "green" },
      { title: "Brouillon de réponse", actor: "IA", action: "Génère une réponse courte avec étapes de diagnostic.", result: "Brouillon prêt, aucune réponse envoyée automatiquement.", proof: "Brouillon éditable", tone: "green" },
      { title: "Validation humaine", actor: "Agent", action: "Relit, modifie puis confirme l’envoi.", result: "Réponse approuvée dans le scénario de démonstration.", proof: "Événement approval.granted", tone: "amber" },
    ],
  },
  {
    id: "sla",
    title: "Prévention d’un dépassement SLA",
    domain: "SLA Management",
    audience: "Manager / Team leader",
    objective: "Montrer comment D-Clic anticipe un risque de dépassement et simule une action corrective.",
    route: "/neural-analytics",
    icon: "timer",
    steps: [
      { title: "Détection du risque", actor: "Modèle SLA", action: "Évalue le risque à partir du temps restant, backlog et historique.", result: "INC-9942 : 91 % de risque, 1 h 14 restante.", proof: "Score calibré + facteurs", tone: "red" },
      { title: "Explication", actor: "D-Clic", action: "Présente les facteurs les plus influents.", result: "Backlog élevé, 2 réassignations et catégorie historiquement lente.", proof: "Feature influence", tone: "amber" },
      { title: "Simulation", actor: "Moteur de décision", action: "Simule un transfert vers une équipe disponible.", result: "Risque estimé après action : 42 %.", proof: "Comparaison avant/après", tone: "blue" },
      { title: "Validation", actor: "Manager", action: "Accepte ou refuse la recommandation.", result: "Scénario accepté ; commande simulée et auditée.", proof: "Timeline de décision", tone: "green" },
    ],
  },
  {
    id: "incident",
    title: "Détection d’un incident émergent",
    domain: "Incident & Problem Management",
    audience: "Incident Manager / N2-N3",
    objective: "Détecter un pic anormal de tickets et proposer la création d’un problème sans affirmer une cause non prouvée.",
    route: "/incident-radar",
    icon: "radar",
    steps: [
      { title: "Détection d’anomalie", actor: "Radar", action: "Compare le volume VPN à la baseline historique.", result: "47 tickets liés ; hausse anormale détectée.", proof: "Cluster temporel et volumétrique", tone: "amber" },
      { title: "Clustering", actor: "IA", action: "Regroupe les tickets par contenu, temps, service, site et actifs.", result: "Cluster principal : accès VPN région Europe.", proof: "Vue de clustering", tone: "blue" },
      { title: "Qualification majeur", actor: "Moteur incident", action: "Évalue utilisateurs, sites, criticité et vitesse d’arrivée.", result: "Candidat incident majeur : score 0,89.", proof: "Score et facteurs", tone: "red" },
      { title: "Proposition", actor: "D-Clic", action: "Prépare la promotion en Problem et le rattachement des incidents.", result: "47 associations préparées, aucune écriture réelle.", proof: "Preview de l’action", tone: "green" },
    ],
  },
  {
    id: "root-cause",
    title: "Classement des causes probables",
    domain: "Problem Management",
    audience: "Incident Manager / Expert technique",
    objective: "Présenter des causes candidates avec preuves plutôt qu’une cause unique inventée.",
    route: "/incident-radar",
    icon: "account_tree",
    steps: [
      { title: "Collecte des signaux", actor: "D-Clic", action: "Croise changements récents, actifs, dépendances et erreurs similaires.", result: "3 causes candidates identifiées.", proof: "Evidence bundle", tone: "blue" },
      { title: "Classement", actor: "Moteur de corrélation", action: "Calcule un score de plausibilité.", result: "CHG-1234 : 88 %, INC-8992 : 42 %, événement système : 15 %.", proof: "Root Cause Ranking", tone: "amber" },
      { title: "Vérification experte", actor: "Expert", action: "Consulte les éléments de preuve avant décision.", result: "CHG-1234 retenu comme piste d’investigation, pas comme vérité automatique.", proof: "Décision humaine", tone: "green" },
      { title: "Suivi", actor: "Incident Manager", action: "Active un mode de surveillance sur les tickets associés.", result: "Watch mode simulé activé.", proof: "Événement incident.watch.started", tone: "green" },
    ],
  },
  {
    id: "workload",
    title: "Rééquilibrage de la charge des équipes",
    domain: "Workforce / Service Operations",
    audience: "Manager Service Desk",
    objective: "Prévoir la saturation et recommander une redistribution équitable des tickets.",
    route: "/service-ops/workload",
    icon: "groups",
    steps: [
      { title: "Mesure de charge", actor: "D-Clic", action: "Calcule une charge pondérée par complexité, urgence et temps attendu.", result: "L1 : 92 %, SecOps : 98 %, Réseau : 45 %.", proof: "Heatmap + scores pondérés", tone: "amber" },
      { title: "Prévision", actor: "Forecast", action: "Projette la charge sur 12 heures.", result: "Pic attendu à 16 h 20 : 91 % global.", proof: "Prévision temporelle", tone: "blue" },
      { title: "Simulation", actor: "Moteur de capacité", action: "Teste plusieurs redistributions compatibles avec les compétences.", result: "14 tickets simples transférables vers Workplace.", proof: "Scénario de rebalance", tone: "green" },
      { title: "Résultat projeté", actor: "D-Clic", action: "Compare la situation avant/après.", result: "+14 % de conformité SLA projetée, sans surcharge de l’équipe cible.", proof: "KPI simulé", tone: "green" },
    ],
  },
  {
    id: "knowledge",
    title: "Connaissance, RAG et lacunes documentaires",
    domain: "Knowledge Management",
    audience: "Knowledge Manager / Agent",
    objective: "Montrer la recherche sourcée et la création gouvernée d’un article à partir de résolutions répétées.",
    route: "/service-ops/knowledge",
    icon: "library_books",
    steps: [
      { title: "Recherche RAG", actor: "RAG", action: "Recherche dans KB validée, procédures et résolutions autorisées.", result: "Réponse construite avec sources et scores de pertinence.", proof: "Sources + grounding", tone: "blue" },
      { title: "Détection de lacune", actor: "Knowledge Intelligence", action: "Repère un motif récurrent sans article officiel.", result: "34 résolutions VPN similaires, aucun article validé.", proof: "Knowledge Gap Detector", tone: "amber" },
      { title: "Génération de brouillon", actor: "IA", action: "Prépare titre, symptômes, cause, résolution, vérification et rollback.", result: "Brouillon prêt pour revue experte.", proof: "Draft d’article", tone: "green" },
      { title: "Gouvernance", actor: "Knowledge Manager", action: "Valide le contenu avant publication.", result: "Publication simulée ; l’IA ne publie pas seule.", proof: "Approval + audit", tone: "green" },
    ],
  },
  {
    id: "actions",
    title: "Actions IA et validation humaine",
    domain: "Gouvernance IA",
    audience: "Manager / Administrateur",
    objective: "Illustrer le principe : confiance ≠ permission, avec preview, policy, approbation, exécution et vérification.",
    route: "/service-ops/actions",
    icon: "approval",
    steps: [
      { title: "Recommandation", actor: "IA", action: "Propose de réassigner 14 tickets à risque SLA.", result: "Confiance : 94 %, risque métier : moyen.", proof: "Recommendation ID rec-demo-014", tone: "blue" },
      { title: "Policy Engine", actor: "Policy Engine", action: "Évalue droits, nature de l’action et niveau d’autonomie.", result: "L2 : validation humaine obligatoire.", proof: "Policy P-HITL-MED", tone: "amber" },
      { title: "Approbation", actor: "Manager", action: "Inspecte l’avant/après puis approuve.", result: "Commande cmd-demo-014 autorisée.", proof: "approval.granted", tone: "green" },
      { title: "Exécution simulée", actor: "Gateway DEMO", action: "Simule l’appel Freshservice sans requête externe.", result: "Statut SUCCEEDED simulé ; 0 écriture réelle.", proof: "dry_run=true", tone: "green" },
      { title: "Vérification", actor: "D-Clic", action: "Simule le read-after-write et clôt la trace.", result: "État vérifié dans le scénario fictif.", proof: "command.verified", tone: "green" },
    ],
  },
  {
    id: "quota",
    title: "Gestion des quotas API et erreur 429",
    domain: "Administration / Freshservice Gateway",
    audience: "Admin / Ops",
    objective: "Montrer comment D-Clic protège le quota partagé Freshservice et dégrade proprement les traitements non urgents.",
    route: "/system-config",
    icon: "speed",
    steps: [
      { title: "Suivi du budget", actor: "API Guardian", action: "Mesure consommation, réserve d’urgence et principaux consommateurs.", result: "231 appels/min sur limite simulée 400 ; réserve 20 %.", proof: "Contrôle API & quotas", tone: "blue" },
      { title: "Seuil d’alerte", actor: "Quota Manager", action: "Détecte une consommation proche du seuil de sécurité.", result: "Batch et synchronisations passent en priorité basse.", proof: "Politique de file", tone: "amber" },
      { title: "Simulation 429", actor: "Freshservice simulé", action: "Retourne 429 avec Retry-After: 42.", result: "Aucun retry immédiat ; opérations non urgentes mises en attente.", proof: "retry_after_seconds=42", tone: "red" },
      { title: "Reprise contrôlée", actor: "Gateway", action: "Relance après la fenêtre et conserve l’idempotence.", result: "Commande traitée une seule fois.", proof: "command_id inchangé", tone: "green" },
    ],
  },
  {
    id: "models",
    title: "Pilotage des modèles IA",
    domain: "MLOps / LLMOps",
    audience: "Équipe IA / Data / Responsable produit",
    objective: "Présenter santé, drift, champion/challenger, calibration et portes de mise en production.",
    route: "/neural-analytics/models",
    icon: "deployed_code",
    steps: [
      { title: "Surveillance", actor: "Model Ops", action: "Suit qualité, latence, drift et taux d’abstention.", result: "7 modèles sains sur 8 ; 1 sous surveillance.", proof: "Registre de production", tone: "green" },
      { title: "Drift", actor: "Monitoring", action: "Détecte un changement dans la distribution des groupes.", result: "Assignment Recommender : drift moyen.", proof: "Drift watch", tone: "amber" },
      { title: "Champion / Challenger", actor: "MLOps", action: "Compare v3.8.2 et v4.0-rc2 sur le même jeu d’évaluation.", result: "Challenger : 92,1 % vs 88,7 %, mais latence plus élevée.", proof: "Tableau comparatif", tone: "blue" },
      { title: "Release gate", actor: "Owner modèle", action: "Vérifie calibration, erreurs, shadow mode et rollback.", result: "Promotion refusée tant que la revue d’erreurs n’est pas terminée.", proof: "Gate bloquée", tone: "amber" },
    ],
  },
  {
    id: "nlops",
    title: "Commande en langage naturel",
    domain: "AI Operations",
    audience: "Manager / Expert",
    objective: "Montrer comment une demande en français devient un plan gouverné, jamais un appel HTTP libre produit par le LLM.",
    route: "/service-ops/actions",
    icon: "chat",
    steps: [
      { title: "Demande utilisateur", actor: "Manager", action: "Demande : « trouve les tickets VPN ouverts depuis lundi et vérifie les changements réseau récents ».", result: "Intention comprise : recherche + corrélation, lecture seule.", proof: "Intent plan", tone: "blue" },
      { title: "Planification", actor: "Orchestrateur", action: "Construit un plan de lecture structuré.", result: "1) tickets VPN 2) changements 3) similitudes 4) synthèse.", proof: "Plan visible avant exécution", tone: "green" },
      { title: "Résultat", actor: "D-Clic", action: "Exécute le scénario sur données fictives.", result: "47 tickets liés, changement CHG-1234 corrélé à 88 %.", proof: "Résultat sourcé", tone: "amber" },
      { title: "Action suivante", actor: "Manager", action: "Demande de préparer l’association au Problem probable.", result: "Preview générée ; validation humaine requise avant toute écriture.", proof: "Policy L2", tone: "green" },
    ],
  },
  {
    id: "self-service",
    title: "Self-service utilisateur final",
    domain: "Expérience utilisateur",
    audience: "Utilisateur final / Service Desk",
    objective: "Montrer comment l’IA améliore la qualité d’un ticket avant qu’il arrive à l’agent.",
    route: "/service-ops/knowledge",
    icon: "support_agent",
    steps: [
      { title: "Demande", actor: "Utilisateur", action: "« Je n’arrive plus à me connecter au VPN. »", result: "Intention : incident d’accès VPN.", proof: "Intent classification", tone: "blue" },
      { title: "Diagnostic guidé", actor: "Assistant", action: "Pose deux questions utiles et propose une procédure validée.", result: "Le certificat semble expiré ; procédure KB proposée.", proof: "Réponse sourcée", tone: "green" },
      { title: "Échec du self-service", actor: "Utilisateur", action: "Confirme que le problème persiste.", result: "Escalade vers création de ticket préparée.", proof: "Escalation reason", tone: "amber" },
      { title: "Ticket enrichi", actor: "D-Clic", action: "Prépare sujet, description, diagnostic, catégorie et contexte.", result: "L’agent reçoit un ticket déjà qualifié.", proof: "Preview ticket", tone: "green" },
    ],
  },
  {
    id: "change",
    title: "Risque de changement et surveillance post-changement",
    domain: "Change Management",
    audience: "Change Manager / CAB",
    objective: "Évaluer le risque avant changement, estimer le rayon d’impact puis détecter les effets indésirables après exécution.",
    route: "/neural-analytics",
    icon: "published_with_changes",
    steps: [
      { title: "Analyse pré-changement", actor: "Change Intelligence", action: "Analyse type, CI, historique, dépendances et plan de retour arrière.", result: "Risque élevé ; rollback completeness 60 %.", proof: "Risk card", tone: "red" },
      { title: "Rayon d’impact", actor: "Graph Engine", action: "Parcourt les dépendances service → sites → utilisateurs.", result: "3 services critiques et 2 400 utilisateurs potentiellement exposés.", proof: "Blast radius simulé", tone: "amber" },
      { title: "Recommandation CAB", actor: "D-Clic", action: "Propose d’enrichir le rollback et de déplacer la fenêtre.", result: "Décision préparée pour le CAB.", proof: "What-if comparison", tone: "blue" },
      { title: "Post Change Watch", actor: "Radar", action: "Surveille les tickets et anomalies liés après changement.", result: "Pic VPN détecté 18 minutes après CHG-1234.", proof: "Corrélation temporelle", tone: "amber" },
    ],
  },
  {
    id: "audit",
    title: "Audit et gouvernance de bout en bout",
    domain: "Sécurité / Conformité",
    audience: "Admin / Sécurité / DPO / Audit",
    objective: "Reconstituer qui a proposé, autorisé, exécuté et vérifié une action IA.",
    route: "/system-config/audit",
    icon: "fact_check",
    steps: [
      { title: "État observé", actor: "D-Clic", action: "Capture le snapshot ticket et les signaux utilisés.", result: "Evidence ID ev-demo-001 créée.", proof: "État initial immuable", tone: "blue" },
      { title: "Décision IA", actor: "Modèle", action: "Enregistre modèle, version, score et recommandation.", result: "rec-demo-014, confiance 94 %.", proof: "Model metadata", tone: "green" },
      { title: "Décision de politique", actor: "Policy Engine", action: "Sépare permission et confiance modèle.", result: "P-HITL-MED exige approbation humaine.", proof: "policy.evaluated", tone: "amber" },
      { title: "Décision humaine", actor: "Manager", action: "Approuve après examen de la preview.", result: "approval.granted avec acteur et horodatage fictifs.", proof: "Approver trace", tone: "green" },
      { title: "Exécution & vérification", actor: "Gateway DEMO", action: "Simule exécution puis read-after-write.", result: "Trace complète avec correlation_id corr-demo-8a41.", proof: "command.verified", tone: "green" },
    ],
  },
  {
    id: "resilience",
    title: "Résilience : timeout, 5xx et double-clic",
    domain: "Fiabilité plateforme",
    audience: "Tech Lead / Ops / QA",
    objective: "Démontrer que la plateforme ne perd pas l’état et ne duplique pas une action en cas d’erreur technique.",
    route: "/system-config",
    icon: "shield",
    steps: [
      { title: "Double-clic", actor: "Utilisateur", action: "Clique deux fois sur la même action.", result: "Même command_id détecté ; une seule exécution logique.", proof: "Idempotency store", tone: "green" },
      { title: "Timeout simulé", actor: "Freshservice simulé", action: "La réponse dépasse le délai configuré.", result: "Retry contrôlé uniquement si l’opération le permet.", proof: "retry policy", tone: "amber" },
      { title: "Erreur 503", actor: "Freshservice simulé", action: "Retourne une indisponibilité temporaire.", result: "Backoff appliqué, commande conservée et traçable.", proof: "status RETRYING", tone: "amber" },
      { title: "Réconciliation", actor: "Gateway", action: "Vérifie l’état final après reprise.", result: "SUCCEEDED/VERIFIED ou FAILED explicite ; aucun état inconnu silencieux.", proof: "Audit final", tone: "green" },
    ],
  },
];

function toneClass(tone: Tone = "muted") {
  return styles[`tone_${tone}`];
}

export function DemoCenter() {
  const [selectedId, setSelectedId] = useState(workflows[0].id);
  const [stepIndex, setStepIndex] = useState(-1);
  const selected = useMemo(() => workflows.find((item) => item.id === selectedId) ?? workflows[0], [selectedId]);
  const current = stepIndex >= 0 ? selected.steps[Math.min(stepIndex, selected.steps.length - 1)] : null;
  const finished = stepIndex >= selected.steps.length - 1 && stepIndex >= 0;

  function selectWorkflow(id: string) {
    setSelectedId(id);
    setStepIndex(-1);
  }

  function start() {
    setStepIndex(0);
  }

  function next() {
    setStepIndex((value) => Math.min(value + 1, selected.steps.length - 1));
  }

  function reset() {
    setStepIndex(-1);
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.safetyBanner}>
        <div>
          <span className="material-symbols-outlined">science</span>
          <div><strong>Environnement de démonstration</strong><p>Toutes les données, prédictions, décisions et exécutions ci-dessous sont simulées pour expliquer la solution.</p></div>
        </div>
        <div className={styles.safetyStats}><span><b>16</b> workflows</span><span><b>0</b> écriture Freshservice</span><span><b>100 %</b> réinitialisable</span></div>
      </section>

      <section className={styles.intro}>
        <div><span className={styles.eyebrow}>PARCOURS MÉTIER DE BOUT EN BOUT</span><h2>Présenter D-Clic par des démonstrations concrètes</h2><p>Choisis un scénario à gauche, lance-le puis avance étape par étape. Chaque workflow montre qui agit, ce que fait D-Clic, le résultat simulé et la preuve que l’on afficherait en production.</p></div>
        <div className={styles.legend}><span className={styles.legendDotGreen}/> validé / sûr <span className={styles.legendDotAmber}/> décision / vigilance <span className={styles.legendDotRed}/> risque</div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.catalog}>
          <div className={styles.catalogHead}><strong>Scénarios</strong><span>{workflows.length}</span></div>
          {workflows.map((flow, index) => (
            <button key={flow.id} className={`${styles.workflowButton} ${flow.id === selected.id ? styles.active : ""}`} onClick={() => selectWorkflow(flow.id)}>
              <span className="material-symbols-outlined">{flow.icon}</span>
              <span><small>{String(index + 1).padStart(2, "0")} · {flow.domain}</small><strong>{flow.title}</strong></span>
            </button>
          ))}
        </aside>

        <main className={styles.stage}>
          <div className={styles.stageHead}>
            <div><span className={styles.domain}>{selected.domain}</span><h3>{selected.title}</h3><p>{selected.objective}</p><div className={styles.audience}><span className="material-symbols-outlined">groups</span>{selected.audience}</div></div>
            <Link href={selected.route} className={styles.openScreen}><span className="material-symbols-outlined">open_in_new</span> Ouvrir l’écran métier</Link>
          </div>

          <div className={styles.progressRow}>
            {selected.steps.map((step, index) => {
              const done = stepIndex > index;
              const active = stepIndex === index;
              return <div key={step.title} className={`${styles.progressStep} ${done ? styles.done : ""} ${active ? styles.current : ""}`}><span>{done ? "✓" : index + 1}</span><small>{step.title}</small></div>;
            })}
          </div>

          {current ? (
            <section className={styles.currentCard}>
              <div className={styles.currentTop}><span className={`${styles.stepBadge} ${toneClass(current.tone)}`}>ÉTAPE {stepIndex + 1}/{selected.steps.length}</span><span className={styles.actor}>{current.actor}</span></div>
              <h4>{current.title}</h4>
              <div className={styles.infoGrid}>
                <div><small>ACTION / ENTRÉE</small><p>{current.action}</p></div>
                <div><small>RÉSULTAT SIMULÉ</small><p>{current.result}</p></div>
                <div><small>PREUVE / TRAÇABILITÉ</small><p>{current.proof}</p></div>
              </div>
              <div className={styles.fakeLog}><span>DEMO</span><code>{`correlation_id=demo-${selected.id}-${String(stepIndex + 1).padStart(2, "0")} · external_write=false · status=${finished ? "VERIFIED" : "SIMULATED"}`}</code></div>
            </section>
          ) : (
            <section className={styles.readyCard}><span className="material-symbols-outlined">play_circle</span><h4>Scénario prêt</h4><p>Commence la démonstration. Aucun appel réseau vers Freshservice n’est effectué par ce workflow.</p></section>
          )}

          <div className={styles.controls}>
            <button className={styles.secondary} onClick={reset} disabled={stepIndex < 0}><span className="material-symbols-outlined">restart_alt</span> Réinitialiser</button>
            {stepIndex < 0 ? <button className={styles.primary} onClick={start}><span className="material-symbols-outlined">play_arrow</span> Démarrer ce workflow</button> : !finished ? <button className={styles.primary} onClick={next}>Étape suivante <span className="material-symbols-outlined">arrow_forward</span></button> : <button className={styles.primary} onClick={reset}><span className="material-symbols-outlined">check_circle</span> Démo terminée — Rejouer</button>}
          </div>

          <section className={styles.storyboard}>
            <div className={styles.storyHead}><strong>Storyboard complet</strong><span>À utiliser comme aide-mémoire pendant la présentation</span></div>
            {selected.steps.map((step, index) => <div className={styles.storyRow} key={step.title}><span className={`${styles.storyIndex} ${toneClass(step.tone)}`}>{index + 1}</span><div><strong>{step.title}</strong><p><b>{step.actor}</b> — {step.action}</p></div><span className={styles.storyResult}>{step.result}</span></div>)}
          </section>
        </main>
      </div>
    </div>
  );
}
