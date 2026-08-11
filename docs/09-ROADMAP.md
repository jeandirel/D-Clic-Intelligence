# 09 — Roadmap

## Principe

Ne pas construire le « méga outil » en une seule fois.

Construire des **vertical slices** qui apportent une valeur complète.

---

# Phase 0 — Fondation

### Livrables
- documentation ;
- architecture ;
- sécurité ;
- conventions ;
- environnements ;
- CI/CD ;
- observabilité minimale.

### Done quand
Tout développeur peut comprendre le système et lancer le socle.

---

# Phase 1 — Freshservice Control Plane

### Objectif
Construire le Gateway avant les gros modules IA.

### Livrables
- Freshservice client ;
- auth ;
- rate limiter ;
- retry ;
- 429 handling ;
- cache ;
- audit ;
- metrics ;
- API usage dashboard.

### Démo
Lire 100 tickets sans accès direct hors Gateway.

---

# Phase 2 — First Intelligent Action

### Flux
Ticket → analyse → recommandation → approval → update → verify.

### IA minimale
- résumé ;
- classification ;
- réponse suggérée.

### Importance
C’est la première preuve bout-en-bout.

---

# Phase 3 — Agent Copilot

### Modules
- ticket intelligence ;
- similar tickets ;
- KB search ;
- next best action ;
- response drafting.

### KPIs
- temps de traitement ;
- adoption ;
- correction.

---

# Phase 4 — SLA Intelligence

### Modules
- SLA risk model ;
- dashboard ;
- explanations ;
- alerting ;
- recommended interventions.

### Déploiement
shadow mode avant recommandations visibles.

---

# Phase 5 — Incident Radar

### Modules
- embeddings ;
- clustering ;
- anomaly detection ;
- change correlation ;
- problem suggestion.

---

# Phase 6 — Knowledge Intelligence

- RAG ;
- KB gap ;
- article drafting ;
- stale knowledge.

---

# Phase 7 — Workload & Forecasting

- volume forecast ;
- weighted workload ;
- team capacity ;
- rebalancing ;
- what-if.

---

# Phase 8 — Change Intelligence

- change risk ;
- blast radius ;
- post-change watch.

---

# Phase 9 — Agentic Operations

Seulement après avoir construit :
- Gateway ;
- policy ;
- audit ;
- approvals ;
- observability.

Ajouter des agents spécialisés.

---

# Phase 10 — Digital Twin

Simulation de scénarios opérationnels.

Nécessite :
- historique fiable ;
- modèles calibrés ;
- relations ;
- capacité de mesurer outcomes.

---

# Priorité MoSCoW initiale

## MUST
- Freshservice Gateway ;
- IAM ;
- audit ;
- ticket intelligence ;
- policy ;
- human approval ;
- observability.

## SHOULD
- RAG ;
- SLA prediction ;
- clustering ;
- API command center.

## COULD
- GraphRAG ;
- digital twin ;
- multi-agent ;
- advanced optimization.

## NOT YET
- autonomie élevée généralisée ;
- fermeture automatique de tickets sensibles ;
- décisions RH/personnelles.

---

# Première roadmap 12 semaines indicative

## S1-S2
architecture + repo + auth + client Freshservice.

## S3-S4
Gateway + quotas + metrics + ODS.

## S5-S6
Ticket Intelligence + UI.

## S7
Policy + approval.

## S8
Write + verify + audit.

## S9
RAG.

## S10
classification model integration.

## S11
observability dashboards.

## S12
pilot + mesure + hardening.

Les durées sont des unités de planification, pas des engagements calendaires.

---

# Definition of Ready pour une feature IA

Avant développement :

- problème précis ;
- utilisateur ;
- décision améliorée ;
- données ;
- owner ;
- KPI ;
- risque ;
- niveau autonomie.

---

# Definition of Done IA

- tests ;
- evaluation ;
- telemetry ;
- policy ;
- audit ;
- fallback ;
- documentation ;
- UX d’incertitude ;
- owner ;
- runbook.
