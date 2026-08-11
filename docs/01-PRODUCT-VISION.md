# 01 — Product Vision

## Mission

Faire passer le Service Management de :

> **réagir aux tickets après leur arrivée**

à :

> **comprendre, anticiper, prioriser et agir avant que les problèmes deviennent critiques.**

---

# 1. Proposition de valeur

D-Clic Intelligence fournit quatre formes de valeur.

## 1.1 Intelligence individuelle
Aider une personne à mieux travailler.

Exemples :

- résumer un ticket ;
- proposer une réponse ;
- chercher une procédure ;
- classifier automatiquement ;
- recommander un groupe.

## 1.2 Intelligence d’équipe
Aider une équipe à mieux s’organiser.

Exemples :

- workload balancing ;
- next best ticket ;
- estimation de charge ;
- détection de backlog dangereux.

## 1.3 Intelligence système
Comprendre le Service Desk globalement.

Exemples :

- anomalies ;
- incidents émergents ;
- risques de changement ;
- patterns de résolution ;
- dépendances entre services.

## 1.4 Intelligence décisionnelle
Comparer des décisions avant de les appliquer.

Exemples :

- simulation de réaffectation ;
- prédiction SLA ;
- estimation de capacité ;
- priorisation de changements.

---

# 2. Personas

## 2.1 Utilisateur final

### Besoin
Obtenir rapidement de l’aide sans connaître l’organisation interne.

### Capacités
- langage naturel ;
- recherche dans la connaissance ;
- diagnostic guidé ;
- suggestion self-service ;
- création intelligente de demande ;
- suivi et explication du statut.

### Ce qu’il ne doit jamais voir
- complexité de routage ;
- identifiants techniques ;
- scores ML sans explication utile ;
- informations d’autres utilisateurs.

---

## 2.2 Agent Service Desk

### Besoin
Comprendre et résoudre plus vite.

### Capacités
- résumé ;
- classification ;
- similar tickets ;
- article KB ;
- résolution probable ;
- réponse suggérée ;
- recommandation d’affectation ;
- Next Best Action ;
- alerte SLA ;
- traduction ;
- checklist de résolution.

---

## 2.3 Manager

### Besoin
Gérer risques, charge et qualité.

### Capacités
- forecast ;
- backlog risk ;
- SLA forecast ;
- workforce intelligence ;
- incident clustering ;
- major incident candidates ;
- what-if simulation ;
- capacité par groupe ;
- dérive de performances.

---

## 2.4 Administrateur

### Besoin
Garder le contrôle de l’écosystème.

### Capacités
- policies ;
- rôles ;
- permissions ;
- modèles ;
- quotas ;
- API usage ;
- MCP usage ;
- automation catalog ;
- kill switch ;
- audit ;
- configuration des seuils.

---

## 2.5 Expert métier

### Besoin
Garantir que l’IA respecte les pratiques de l’entreprise.

### Capacités
- valider les articles générés ;
- corriger les catégories ;
- approuver les règles ;
- revoir les erreurs du modèle ;
- enrichir le vocabulaire métier ;
- définir les exceptions.

---

# 3. Piliers fonctionnels

## P1 — Command Center
Vue globale temps réel ou quasi temps réel.

## P2 — Agent Copilot
Assistant opérationnel contextuel.

## P3 — Predictive Operations
SLA, résolution, charge, volumes, risque.

## P4 — Incident & Problem Intelligence
Clustering, anomalies, root cause candidates.

## P5 — Knowledge Intelligence
RAG, lacunes de KB, génération contrôlée.

## P6 — Decision Intelligence
Simulation et recommandations.

## P7 — Automation Control Plane
Policy, approbation, exécution, rollback.

## P8 — AI & API Observability
Suivi technique et métier de toute la plateforme.

---

# 4. North Star

Une métrique unique ne suffit pas. Le produit doit avoir une **North Star composite**.

### Operational Intelligence Adoption Rate

Pourcentage de situations où :

1. D-Clic Intelligence fournit une recommandation pertinente ;
2. elle est utilisée ou validée ;
3. elle produit un résultat mesurable.

Sous-métriques :

- suggestion acceptance rate ;
- correction rate ;
- prevented SLA breaches ;
- mean time saved ;
- auto-resolution rate ;
- false automation rate ;
- incident detection lead time ;
- knowledge reuse rate.

---

# 5. KPIs métier

## Tickets
- MTTA ;
- MTTR ;
- FCR ;
- taux de réouverture ;
- backlog ;
- âge du backlog.

## SLA
- taux de SLA respectés ;
- violations évitées ;
- lead time avant alerte.

## Classification
- top-1 accuracy ;
- top-k recall ;
- taux de correction agent ;
- couverture de confiance.

## Automatisation
- taux de recommandations acceptées ;
- taux d’actions automatiques ;
- erreurs ;
- rollback ;
- gains de temps.

## Knowledge
- articles proposés ;
- validés ;
- utilisés ;
- réduction des tickets répétitifs.

## IA
- qualité ;
- coût ;
- latence ;
- hallucination / factuality ;
- drift ;
- disponibilité.

---

# 6. Principes UX

## 6.1 Toujours montrer « pourquoi »
Une recommandation sans raison crée de la méfiance.

## 6.2 Montrer la confiance
Exemple : **Confiance élevée — 94 %**.

## 6.3 Ne pas noyer l’utilisateur
Afficher d’abord la décision utile, puis permettre d’ouvrir les détails.

## 6.4 Prévisualiser avant d’appliquer
Pour une modification importante, afficher exactement ce qui va changer.

## 6.5 Montrer la confirmation Freshservice
« Action préparée » n’est pas « action réussie ».

## 6.6 Permettre la correction
Chaque correction est une donnée d’apprentissage.

---

# 7. Anti-objectifs

Nous ne cherchons pas à :

- automatiser 100 % des décisions ;
- supprimer le rôle des agents ;
- déplacer la source de vérité hors de Freshservice ;
- exécuter des actions non traçables ;
- utiliser un LLM pour un problème qu’un algorithme déterministe résout mieux ;
- faire du temps réel quand le métier n’en a pas besoin ;
- multiplier les microservices sans nécessité ;
- construire une feature sans indicateur de succès.

---

# 8. Définition du succès

Le projet est réussi lorsque l’entreprise peut dire :

> « D-Clic Intelligence nous dit ce qui mérite notre attention, explique pourquoi, nous aide à décider et peut exécuter les actions sûres sans perdre le contrôle. »
