# 03 — AI Capabilities Catalog

Ce document décrit les capacités IA envisageables.

L’objectif n’est pas de toutes les construire immédiatement. Chaque capacité doit avoir :

- un problème métier ;
- des données disponibles ;
- une métrique ;
- un niveau d’autonomie ;
- une stratégie de monitoring ;
- une stratégie de fallback.

---

# A. Ticket Intelligence

## A1. Résumé automatique

Entrées :
- sujet ;
- description ;
- conversations ;
- notes ;
- historique.

Sortie :
- problème ;
- contexte ;
- actions déjà effectuées ;
- situation actuelle ;
- prochaine étape.

### Risque
Oublier une information critique.

### Contrôle
Afficher les sources utilisées.

---

## A2. Classification hiérarchique

Prédire :

- groupe ;
- catégorie ;
- sous-catégorie ;
- élément ;
- type.

Stratégie possible :

```text
Ticket
  ↓
Encoder NLP
  ↓
Prédictions hiérarchiques
  ├── Groupe
  ├── Catégorie
  ├── Sous-catégorie
  └── Élément
  ↓
Constraint checker
  ↓
Top-k + confiance
```

Ne pas seulement renvoyer top-1.

Exemple :

| Candidat | Score |
|---|---:|
| Accès > VPN > Connexion | 0,82 |
| Réseau > VPN > Client | 0,11 |
| Identité > Mot de passe | 0,04 |

---

## A3. Assignation intelligente

Prédire le meilleur groupe/agent selon :

- compétence ;
- disponibilité ;
- historique ;
- catégorie ;
- charge ;
- localisation ;
- SLA ;
- complexité.

Attention : l’algorithme ne doit pas « punir » toujours les meilleurs agents en leur donnant tout.

Ajouter une composante de **fair workload distribution**.

---

## A4. Priorité intelligente

Combiner :

- impact ;
- urgence ;
- service critique ;
- population touchée ;
- sentiment ;
- incident global ;
- SLA restant.

La priorité proposée doit respecter les règles ITSM officielles.

---

## A5. Duplicate Detection

Détecter si un nouveau ticket ressemble fortement à un ticket existant.

Techniques :
- embeddings ;
- lexical similarity ;
- metadata ;
- temporal proximity ;
- asset/service overlap.

---

# B. SLA Intelligence

## B1. SLA Breach Prediction

Objectif :

\[
P(\text{breach} \mid X)
\]

Features :

- âge ;
- priorité ;
- groupe ;
- temps restant ;
- heure ;
- jour ;
- backlog ;
- historique ;
- conversations ;
- réassignations ;
- complexité ;
- catégorie ;
- charge équipe ;
- délai depuis dernière réponse.

Métriques :
- ROC-AUC ;
- PR-AUC ;
- recall sur tickets réellement violés ;
- calibration ;
- lead time.

Une bonne AUC avec une mauvaise calibration est insuffisante pour prendre des décisions.

---

## B2. Time To Resolution

Prédire une distribution, pas seulement une valeur.

Exemple :

> 50 % de chances : résolu sous 3h  
> 80 % : sous 7h  
> 95 % : sous 18h

---

# C. Incident & Problem Intelligence

## C1. Clustering temporel

Détecter les groupes de tickets proches dans :

- contenu ;
- temps ;
- service ;
- site ;
- asset ;
- changement récent.

## C2. Emerging Incident Detector

Comparer le volume actuel à une baseline.

Exemple :

```text
VPN
baseline 30 jours : 2,4 tickets / heure
heure actuelle : 17 tickets
anomaly score : 0,97
```

## C3. Major Incident Candidate

Combiner :

- nombre d’utilisateurs ;
- criticité ;
- diversité de sites ;
- vitesse d’arrivée ;
- services touchés ;
- sentiment ;
- priorité ;
- dépendances.

## C4. Root Cause Candidate Ranking

Ne jamais dire « la cause est X » sans preuve.

Dire :

> Causes candidates classées par signaux.

Sources :
- changements récents ;
- assets communs ;
- dépendances CMDB ;
- erreurs similaires ;
- historique.

---

# D. Knowledge Intelligence

## D1. RAG
Recherche dans :

- articles ;
- procédures ;
- résolutions historiques ;
- documentation validée.

Réponse avec sources.

## D2. KB Gap Detection

Détecter un motif récurrent sans article.

## D3. Article Drafting

Générer :
- titre ;
- symptômes ;
- cause ;
- résolution ;
- vérification ;
- rollback ;
- mots-clés.

Toujours passer par validation si publication officielle.

## D4. Stale Knowledge Detection

Repérer :
- article jamais utilisé ;
- contenu contredit par les résolutions récentes ;
- lien mort ;
- procédure ancienne.

---

# E. Workload Intelligence

## E1. Charge en temps réel

Pas seulement « nombre de tickets ».

Un ticket simple ≠ incident complexe.

Créer un **Weighted Workload Score**.

Exemple conceptuel :

\[
Load = \sum_i Complexity_i \times Urgency_i \times ExpectedTime_i
\]

## E2. Forecast de charge
Prévoir les volumes par :
- heure ;
- jour ;
- groupe ;
- catégorie.

## E3. Rebalancing
Recommander une redistribution.

Contraintes :
- compétences ;
- droits ;
- horaires ;
- SLA ;
- équité ;
- capacité.

---

# F. Change Intelligence

## F1. Change Risk Predictor

Variables :
- type ;
- CI concernés ;
- historique similaire ;
- taux d’échec passé ;
- plage horaire ;
- dépendances ;
- qualité du rollback plan ;
- nombre d’utilisateurs potentiels.

## F2. Blast Radius Estimation

À partir du graphe :

```text
Change
  ↓
Router
  ↓
VPN service
  ↓
Sites
  ↓
Users
```

## F3. Post-change Watch
Après un changement :
- surveiller hausse de tickets ;
- anomalies ;
- erreurs ;
- services associés.

---

# G. User Intelligence

À utiliser avec prudence.

Possibilités :
- intention ;
- besoin ;
- frustration ;
- langue ;
- niveau de technicité estimé.

Interdiction :
- profilage inutile ;
- inférences sensibles non nécessaires ;
- scoring de personnes sans finalité métier claire.

---

# H. Decision Intelligence

## H1. What-if Simulator

Comparer :

```text
Situation actuelle
vs
Action A
vs
Action B
```

Exemple :

| Scénario | SLA prévu | MTTR prévu | Risque |
|---|---:|---:|---|
| actuel | 91 % | 7h12 | élevé |
| rebalance A | 95 % | 5h20 | moyen |
| rebalance B | 96 % | 4h58 | moyen |

## H2. Next Best Action

Pour chaque ticket, produire une liste d’actions candidates.

Score possible :

\[
Utility = Benefit - Risk - Cost - Disruption
\]

---

# I. Natural Language Operations

Utilisateur :

> « Trouve les tickets VPN ouverts depuis lundi, regroupe ceux qui semblent liés et vérifie s’il y a un changement réseau récent. »

L’orchestrateur construit un plan.

Mais avant toute écriture :

```text
Natural language
      ↓
Intent parser
      ↓
Read plan
      ↓
Analysis
      ↓
Structured action proposal
      ↓
Policy
      ↓
Approval
      ↓
Gateway
```

Le LLM ne fabrique jamais directement un appel HTTP libre en production.

---

# J. AI Agents

Agents spécialisés possibles :

- Ticket Analyst Agent ;
- SLA Guardian Agent ;
- Incident Radar Agent ;
- Knowledge Curator Agent ;
- Change Risk Agent ;
- Workload Planner Agent ;
- API Guardian Agent.

Ils partagent :
- outils contrôlés ;
- mémoire limitée ;
- policies ;
- observabilité ;
- audit.

Éviter un « super-agent » avec tous les droits.

---

# K. Critères de mise en production d’un modèle

Un modèle ne passe pas en production seulement parce que sa métrique offline est bonne.

Il faut :

1. dataset documenté ;
2. split temporel si pertinent ;
3. baseline ;
4. validation ;
5. calibration ;
6. tests de robustesse ;
7. analyse d’erreurs ;
8. seuil métier ;
9. shadow mode ;
10. A/B ou champion/challenger ;
11. monitoring ;
12. rollback ;
13. owner clairement identifié.
