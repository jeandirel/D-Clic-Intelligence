# 13 — Guide fonctionnel, utilisation et tests

> **D-Clic Intelligence — guide de référence fonctionnelle**  
> Version : 11 août 2026

Ce document transforme la documentation d’architecture en un guide utilisable par les agents Service Desk, responsables ITSM, administrateurs, équipes IA/Data, sécurité et testeurs.

Il répond à quatre questions pour chaque fonction :

1. **À quoi sert-elle ?**
2. **Qui l’utilise et dans quel contexte ?**
3. **Comment l’utiliser ?**
4. **Comment la tester et quel résultat attendre ?**

## 1. Sources de référence

Ce guide synthétise principalement :

- `01-PRODUCT-VISION.md` — vision produit et valeur métier ;
- `02-SYSTEM-ARCHITECTURE.md` — architecture cible ;
- `03-AI-CAPABILITIES.md` — catalogue des capacités IA ;
- `04-FRESHSERVICE-INTEGRATION.md` — intégration Freshservice et quotas ;
- `05-DATA-ML-ARCHITECTURE.md` — données, ML, RAG et MLOps ;
- `06-SECURITY-GOVERNANCE.md` — sécurité, politiques et validation humaine ;
- `07-OBSERVABILITY.md` — métriques, alertes et auditabilité ;
- `08-USER-JOURNEYS.md` — parcours utilisateurs ;
- `09-ROADMAP.md` — ordre de construction ;
- `11-API-GATEWAY-SPEC.md` — spécification du Gateway Freshservice ;
- `12-MVP-ACCEPTANCE-CRITERIA.md` — critères d’acceptation du MVP.

## 2. Légende de maturité

| État | Signification |
|---|---|
| 🟢 **Testable aujourd’hui** | Fonction backend réellement présente et testable dans le dépôt. |
| 🟡 **Interface de démonstration** | Écran présent, mais données actuellement fictives ou action non encore branchée au backend. |
| 🟠 **Partiellement implémenté** | Une partie du flux existe, mais il manque encore la donnée réelle, le modèle ou l’intégration complète. |
| 🔵 **Prévu / spécifié** | Fonction documentée dans l’architecture, mais non encore développée de bout en bout. |

> **Règle importante :** l’existence d’un bouton dans l’interface ne signifie pas automatiquement que l’action est active dans Freshservice. Les écritures Freshservice restent désactivées par défaut avec `FRESHSERVICE_WRITE_ENABLED=false`.

---

# 3. Accès aux interfaces

| Module | Route | Public principal | État |
|---|---|---|---|
| Centre de pilotage | `/` | Responsable Service Desk, manager | 🟡 |
| Radar d’incidents | `/incident-radar` | Incident Manager, Problem Manager | 🟡 |
| Analyses prédictives | `/neural-analytics` | Manager, équipe Data/IA | 🟡 |
| Pilotage des modèles | `/neural-analytics/models` | Data Scientist, MLOps, gouvernance IA | 🟡 |
| Intelligence ticket | `/service-ops` | Agent Service Desk | 🟠 |
| Charge & capacité | `/service-ops/workload` | Team Lead, manager | 🟡 |
| Intelligence des connaissances | `/service-ops/knowledge` | Knowledge Manager, expert métier | 🟡 |
| Actions IA & validations | `/service-ops/actions` | Manager, approbateur, administrateur | 🟠 |
| Contrôle API & quotas | `/system-config` | Administrateur, plateforme | 🟠 |
| Audit & gouvernance | `/system-config/audit` | Admin, sécurité, DPO, audit | 🟠 |

---

# 4. Centre de pilotage

## F-001 — Santé globale des services

**But métier :** donner une lecture synthétique de l’état du Service Desk et des signaux opérationnels.

**Utilisation :** ouvrir `/`. La carte de santé doit agréger à terme SLA, incidents, charge, disponibilité des composants D-Clic et qualité des modèles.

**État :** 🟡 interface de démonstration.

**Test actuel :**
1. ouvrir `/` ;
2. vérifier que le score et son statut sont visibles ;
3. réduire la largeur de la fenêtre ;
4. vérifier que la carte reste lisible.

**Résultat attendu :** aucune erreur de rendu, score lisible, interface responsive.

## F-002 — Risque de dépassement SLA

**But métier :** identifier les tickets qui risquent de dépasser leur SLA avant que le dépassement arrive.

**Données cibles :** âge du ticket, priorité, groupe, temps restant, backlog, réassignations, complexité, heure/jour et délai depuis la dernière réponse.

**Utilisation cible :** le manager clique sur la zone de risque, puis ouvre les tickets les plus exposés et leurs facteurs de risque.

**État :** 🟡 graphique de démonstration ; modèle prédictif réel à connecter.

**Test futur :** constituer un jeu temporel de tickets clôturés, vérifier ROC-AUC/PR-AUC, rappel sur les vrais dépassements, calibration et délai d’anticipation.

## F-003 — Recommandations IA prioritaires

**But métier :** proposer la prochaine action la plus utile en combinant bénéfice, risque, coût et perturbation.

**Utilisation cible :** examiner une recommandation, consulter les preuves, prévisualiser l’action, passer la Policy Engine puis valider si nécessaire.

**État :** 🟡 démonstration sur le Centre de pilotage ; flux structuré d’action disponible côté backend.

**Test :** vérifier que l’interface ne présente jamais une action à risque comme automatiquement autorisée uniquement à cause d’un score de confiance élevé.

## F-004 — Répartition de la charge

**But métier :** voir rapidement quelles équipes sont proches de la saturation.

**État :** 🟡 démonstration. Le calcul cible est un **Weighted Workload Score**, pas seulement un nombre de tickets.

**Test futur :** comparer le score de charge à une mesure réelle d’effort et vérifier qu’un ticket complexe pèse davantage qu’une demande simple.

---

# 5. Radar d’incidents

## F-010 — Regroupement temporel et sémantique

**But métier :** détecter plusieurs tickets qui décrivent probablement le même incident.

**Signaux :** texte, proximité temporelle, service, site, équipement/CI, catégorie et changements récents.

**Utilisation cible :** ouvrir `/incident-radar`, sélectionner un groupe et inspecter les incidents liés.

**État :** 🟡 visualisation de démonstration.

**Test futur :** injecter un lot avec 20 tickets VPN proches et un lot témoin sans lien. Vérifier que le cluster VPN est détecté avec peu de faux positifs.

## F-011 — Détection d’incident émergent

**But métier :** repérer un volume anormal par rapport à une référence historique.

**Exemple :** moyenne 30 jours = 2,4 tickets VPN/heure ; heure actuelle = 17 ; anomalie forte.

**État :** 🔵 spécifié.

**Test futur :** rejouer une série temporelle connue, vérifier le moment de détection et mesurer le délai avant l’alerte humaine historique.

## F-012 — Candidat incident majeur

**But métier :** signaler un cluster qui pourrait nécessiter le processus Major Incident.

**Facteurs :** nombre d’utilisateurs, criticité, diversité de sites, vitesse d’arrivée, services touchés, dépendances et priorité.

**État :** 🔵 spécifié.

## F-013 — Classement des causes probables

**But métier :** fournir des **causes candidates classées par signaux**, jamais affirmer une cause sans preuve.

**Sources :** changements récents, assets communs, dépendances CMDB, erreurs similaires, historique.

**État :** 🟡 interface de démonstration.

**Test :** vérifier que les libellés parlent de « cause probable » ou « correspondance », jamais de certitude non démontrée.

## F-014 — Pics temporels et sites concernés

**But métier :** localiser quand et où un incident se propage.

**État :** 🟡 démonstration.

**Test futur :** contrôler que les volumes correspondent aux données source et que le même ticket n’est pas compté plusieurs fois.

---

# 6. Analyses prédictives

## F-020 — Prévision du risque SLA

**But métier :** estimer l’évolution du risque de dépassement dans les prochaines heures.

**État :** 🟡 interface ; modèle réel à intégrer.

**Test modèle :** split temporel, baseline métier, calibration, rappel des dépassements, stabilité par groupe et catégorie.

## F-021 — Prévision du temps de résolution

**But métier :** fournir une distribution de temps de résolution plutôt qu’une fausse valeur exacte.

**Sortie cible :** par exemple 50 % sous 3 h, 80 % sous 7 h, 95 % sous 18 h.

**État :** 🔵 spécifié.

## F-022 — Pression d’anomalie

**But métier :** résumer l’intensité des signaux inhabituels détectés.

**État :** 🟡 démonstration.

## F-023 — Taux d’abstention

**But métier :** mesurer la capacité du modèle à dire « je ne suis pas assez sûr ».

**Principe :** mieux vaut s’abstenir que produire une recommandation risquée.

**État :** 🟡 indicateur de démonstration ; mécanisme à généraliser aux modèles.

## F-024 — Consensus des modèles

**But métier :** comparer plusieurs approches avant décision : modèle ML, modèle temporel, règles métier, etc.

**État :** 🟡 démonstration.

## F-025 — Détection de dérive

**But métier :** détecter une modification statistique ou organisationnelle : nouvelle équipe, nouvelles catégories, nouveaux mots, nouveaux processus.

**État :** 🟡 interface ; pipeline de mesure à connecter.

**Test futur :** modifier artificiellement la distribution d’une variable et vérifier qu’une alerte apparaît au-delà du seuil défini.

## F-026 — Facteurs influents

**But métier :** expliquer quels facteurs contribuent le plus à une prédiction sans présenter une corrélation comme une causalité.

**État :** 🟡 démonstration.

---

# 7. Pilotage des modèles / MLOps

## F-030 — Registre des modèles

**But métier :** connaître le modèle, sa version, son rôle, sa qualité, sa dérive et son statut.

**État :** 🟡 interface de démonstration.

## F-031 — Champion / challenger

**But métier :** comparer le modèle en production avec un candidat avant remplacement.

**État :** 🟡 démonstration ; processus MLOps à connecter.

**Test futur :** challenger en shadow mode, comparaison sur mêmes données, seuils métier, possibilité de rollback.

## F-032 — Critères de mise en production

Un modèle ne passe en production qu’après : dataset documenté, baseline, validation, calibration, robustesse, analyse d’erreurs, seuil métier, shadow mode, monitoring et rollback.

**État :** 🟡 visualisation ; politique complète à automatiser.

---

# 8. Intelligence ticket — parcours agent

## F-040 — Lecture d’un ticket Freshservice

**But métier :** ouvrir un ticket réel et récupérer ses données via la seule frontière autorisée : le Freshservice Gateway.

**Backend :** 🟢 `GET /api/v1/tickets/{ticket_id}/intelligence`.

**Pré-requis :** `FRESHSERVICE_DOMAIN` et `FRESHSERVICE_API_KEY` configurés côté backend.

**Test :**
1. garder `FRESHSERVICE_WRITE_ENABLED=false` ;
2. choisir un ticket de test existant ;
3. appeler `GET /api/v1/tickets/<id>/intelligence` ;
4. vérifier HTTP 200 et l’identifiant du ticket.

**Résultat attendu :** lecture du ticket sans aucune modification Freshservice.

## F-041 — Résumé automatique

**But métier :** extraire problème, contexte, actions déjà réalisées, situation et prochaine étape.

**État :** 🟠 un résumé bootstrap existe ; le résumé LLM complet et évalué reste à intégrer.

**Test :** fournir un ticket avec sujet + description et vérifier que le résumé ne perd pas l’information principale.

## F-042 — Classification hiérarchique

**But métier :** proposer groupe, catégorie, sous-catégorie, élément et type avec top-k et confiance.

**État :** 🟠 heuristiques bootstrap côté backend ; modèles historiques CamemBERT/ML à industrialiser dans cette plateforme.

**Test futur :** top-1/top-3/top-k, macro-F1, performance par classe, matrice de confusion et taux d’abstention.

## F-043 — Assignation intelligente

**But métier :** proposer groupe/agent selon compétence, disponibilité, historique, catégorie, charge, SLA et équité.

**État :** 🔵 spécifié.

## F-044 — Priorité intelligente

**But métier :** proposer une priorité respectant les règles ITSM officielles à partir de l’impact et de l’urgence.

**État :** 🔵 spécifié ; exemple de modification visible dans l’UI.

## F-045 — Détection de doublons

**But métier :** détecter un ticket similaire déjà existant via embeddings, similarité lexicale, métadonnées et proximité temporelle.

**État :** 🔵 spécifié.

## F-046 — Risque SLA du ticket

**But métier :** donner à l’agent le risque et le temps restant, avec facteurs explicatifs.

**État :** 🟡 UI ; modèle réel à brancher.

## F-047 — Connaissances et tickets similaires

**But métier :** montrer des articles validés et des cas historiques pertinents avec score et sources.

**État :** 🟡 UI ; RAG réel à connecter.

## F-048 — Prévisualisation avant modification

**But métier :** montrer clairement l’état actuel et l’état proposé avant toute écriture.

**État :** 🟠 interface présente, Policy Engine et commandes structurées disponibles côté backend.

**Test :** aucune action d’écriture ne doit être déclenchée simplement en ouvrant la prévisualisation.

---

# 9. Charge & capacité

## F-050 — Score de charge pondéré

**But métier :** mesurer l’effort réel au lieu de compter uniquement les tickets.

**État :** 🟡 interface ; calcul cible à développer.

## F-051 — Carte de charge horaire

**But métier :** visualiser la pression attendue par équipe et par heure.

**État :** 🟡 démonstration.

## F-052 — Prévision de charge

**But métier :** prévoir volumes par heure, jour, groupe et catégorie.

**État :** 🔵 spécifié.

## F-053 — Rééquilibrage recommandé

**But métier :** proposer des transferts tenant compte des compétences, droits, horaires, SLA, équité et capacité.

**État :** 🟡 démonstration.

**Test futur :** comparer scénario actuel vs scénario proposé et vérifier que le gain SLA ne dégrade pas injustement une autre équipe.

---

# 10. Intelligence des connaissances

## F-060 — RAG sourcé

**But métier :** rechercher dans articles, procédures, résolutions historiques et documentation validée.

**État :** 🟡 interface ; architecture RAG spécifiée.

**Test futur :** golden set de questions, taux de réponses sourcées, exactitude des citations, refus quand aucune source suffisante n’existe.

## F-061 — Détection des lacunes documentaires

**But métier :** identifier un motif récurrent résolu par les agents sans article officiel.

**État :** 🟡 démonstration.

## F-062 — Génération de brouillon d’article

**Sortie cible :** titre, symptômes, cause, résolution, vérification, rollback, mots-clés.

**État :** 🟡 interface ; publication réelle non branchée.

**Règle :** publication officielle toujours soumise aux droits et à une validation métier.

## F-063 — Détection d’articles obsolètes

**But métier :** repérer article ancien, inutilisé, contradictoire ou contenant des liens morts.

**État :** 🟡 démonstration.

## F-064 — Fiabilité des sources

**But métier :** pondérer ou exclure les sources selon permissions et niveau de confiance.

**État :** 🟡 démonstration ; politique RAG à implémenter.

---

# 11. Actions IA, politiques et validation humaine

## F-070 — Policy Engine

**But métier :** décider de façon déterministe si une action est autorisée, nécessite validation ou est refusée.

**État :** 🟢 backend disponible via `POST /api/v1/actions/preview` et le flux d’exécution.

**Test :**
- action faible risque autorisée → `allow` ;
- action high/critical non validée → `require_approval` ;
- action explicitement interdite → `deny`.

## F-071 — Niveaux d’autonomie

- **L0 Observation** : lecture et détection ;
- **L1 Recommandation** : proposition, aucune exécution ;
- **L2 Validation humaine** : préparation + approbation obligatoire ;
- **L3 Automatisation encadrée** : uniquement actions explicitement autorisées par politique ;
- **L4 Bloqué/sensible** : aucune exécution automatique.

**Principe :** **la confiance du modèle n’est jamais une permission**.

## F-072 — Exécution gouvernée

**Backend :** 🟢 `POST /api/v1/actions/execute`.

**Mode par défaut :** dry-run car `FRESHSERVICE_WRITE_ENABLED=false`.

**Test sûr :** soumettre une commande autorisée en conservant l’écriture désactivée. Attendre un résultat `dry_run` sans modification Freshservice.

## F-073 — Idempotence

**But métier :** empêcher un double clic ou un retry de créer deux actions identiques.

**État :** 🟢 registre persistant PostgreSQL.

**Tests :**
1. envoyer deux fois la même commande avec le même `command_id` et même payload ;
2. vérifier qu’aucune double action n’est exécutée ;
3. réutiliser le même `command_id` avec un payload différent ;
4. attendre un conflit HTTP `409`.

## F-074 — Vérification après écriture

**But métier :** prouver l’état final Freshservice après une modification.

**État :** 🟢 read-after-write prévu dans le Gateway pour l’action supportée.

**Test en environnement non-production :** activer temporairement les écritures, modifier un ticket dédié, vérifier que D-Clic relit l’état et marque la commande comme vérifiée.

## F-075 — Journal d’exécution

**But métier :** reconstruire recommandation → politique → validation → Gateway → Freshservice → vérification → audit.

**État :** 🟠 backend audit disponible ; UI actuellement démonstrative.

---

# 12. Freshservice Gateway, API et quotas

## F-080 — Gateway obligatoire

**Règle absolue :** aucun module D-Clic ne doit appeler directement `*.freshservice.com`.

**État :** 🟢 architecture backend appliquée aux fonctions actuelles.

**Test de revue :** rechercher les URLs Freshservice dans le code ; tout appel hors adapter/Gateway doit faire échouer la revue.

## F-081 — Budget API partagé

**But métier :** éviter que plusieurs applications consomment le même quota sans coordination.

**État :** 🟢 quota partagé via Redis côté D-Clic ; limite configurable.

**Endpoint :** `GET /api/v1/operations/quota`.

**Test :** appeler l’endpoint et vérifier `configured_limit`, `used_by_dclic`, `standard_budget`, `emergency_reserve`.

## F-082 — Réserve d’urgence

**But métier :** conserver une partie du quota pour les opérations critiques.

**État :** 🟢 configurable avec `FRESHSERVICE_EMERGENCY_RESERVE_PERCENT`.

## F-083 — Gestion des 429

**But métier :** respecter `Retry-After`, ne pas retry immédiatement et protéger le quota.

**État :** 🟢 gestion backend présente.

**Test :** simuler une réponse 429 et vérifier que l’erreur normalisée expose un délai de retry ; aucun retry agressif ne doit avoir lieu.

## F-084 — Retry contrôlé

**Cas retryables :** timeout, 429 selon délai, certains 5xx.

**Cas non retryables automatiquement :** 400, 401, 403 et conflits métier selon contexte.

**État :** 🟢 pour le client actuel.

## F-085 — Priorités de file

P0 validation humaine en cours ; P1 incident critique/vérification ; P2 rafraîchissement UI ; P3 historique/batch.

**État :** 🔵 spécifié ; file prioritaire complète à développer.

## F-086 — Cache de lecture

**But métier :** éviter les appels répétitifs et protéger Freshservice.

**État :** 🔵 spécifié ; stratégie TTL documentée.

## F-087 — État de préparation plateforme

**Endpoint :** 🟢 `GET /api/v1/operations/readiness`.

**Test :** PostgreSQL et Redis actifs → `status=ready`. Si une dépendance est indisponible → `degraded`.

## F-088 — Métriques Prometheus

**Endpoint :** 🟢 `GET /api/v1/metrics`.

**Test :** vérifier un contenu Prometheus et la présence des métriques Freshservice/actions après trafic de test.

## F-089 — Arrêts d’urgence

**But métier :** permettre d’arrêter ingestion, batch ou intégrations en cas d’incident.

**État :** 🟡 UI démonstrative ; contrôles runtime à implémenter.

---

# 13. Audit & gouvernance

## F-090 — Journal d’audit persistant

**Backend :** 🟢 PostgreSQL + `GET /api/v1/operations/audit`.

**Utilisation :** rechercher une action par `command_id`, acteur ou `correlation_id` lorsque les filtres seront exposés dans l’UI.

**Test :** exécuter un dry-run puis lire `/operations/audit`. Vérifier qu’un événement associé à la commande existe.

## F-091 — Résultats de politique

**But métier :** suivre les décisions `allow`, `require_approval`, `deny`.

**État :** 🟠 Policy Engine réel, agrégation UI démonstrative.

## F-092 — Chaîne de preuve

**But métier :** conserver état observé, modèle/version, proposition, décision humaine/politique, résultat et preuve d’exécution.

**État :** 🟠 structure partiellement présente ; enrichissement à poursuivre.

## F-093 — Correlation ID

**But métier :** suivre le même événement de bout en bout.

**État :** 🔵 exigence d’architecture à généraliser à tous les flux.

---

# 14. Capacités planifiées complémentaires

## F-100 — Change Risk Predictor

Estimer le risque d’un changement à partir des CI, historique, dépendances, plage horaire et qualité du rollback. **État : 🔵**.

## F-101 — Estimation du blast radius

Utiliser le graphe de dépendances pour estimer services, sites et utilisateurs potentiellement touchés. **État : 🔵**.

## F-102 — Surveillance post-changement

Après un changement, surveiller hausse de tickets, anomalies et services associés. **État : 🔵**.

## F-103 — Commandes en langage naturel

Transformer une demande utilisateur en plan de lecture, analyse, proposition d’action structurée, politique et validation. Le LLM ne doit jamais fabriquer librement un appel HTTP de production. **État : 🔵**.

## F-104 — Agents IA spécialisés

Agents envisagés : Ticket Analyst, SLA Guardian, Incident Radar, Knowledge Curator, Change Risk, Workload Planner, API Guardian. Outils et permissions limités par rôle. **État : 🔵**.

## F-105 — Simulation « what-if »

Comparer situation actuelle, action A et action B sur SLA, MTTR, risque et perturbation. **État : 🔵**.

---

# 15. Guide de test rapide

## Pré-requis locaux

```bash
cp .env.example .env
docker compose up --build
```

Conserver pour les tests sûrs :

```env
FRESHSERVICE_WRITE_ENABLED=false
```

Services attendus :

- frontend : `http://localhost:3000`
- backend : `http://localhost:8000`
- documentation API : `http://localhost:8000/docs`
- PostgreSQL : `5432`
- Redis : `6379`

## T-001 — Santé API

```bash
curl http://localhost:8000/api/v1/health
```

Attendu : HTTP 200, `status=ok` et écritures Freshservice désactivées.

## T-002 — Readiness

```bash
curl http://localhost:8000/api/v1/operations/readiness
```

Attendu : `database=true`, `redis=true`, `status=ready` quand les dépendances fonctionnent.

## T-003 — Quota

```bash
curl http://localhost:8000/api/v1/operations/quota
```

Attendu : budget configuré, consommation D-Clic et réserve visibles.

## T-004 — Métriques

```bash
curl http://localhost:8000/api/v1/metrics
```

Attendu : format Prometheus.

## T-005 — Lecture d’un ticket réel

Après configuration du domaine et de la clé API :

```bash
curl http://localhost:8000/api/v1/tickets/12345/intelligence
```

Remplacer `12345` par un ticket de test existant.

Attendu : lecture + intelligence bootstrap, **aucune écriture**.

## T-006 — Prévisualisation Policy Engine

Exemple faible risque :

```bash
curl -X POST http://localhost:8000/api/v1/actions/preview \
  -H 'Content-Type: application/json' \
  -d '{
    "command_id":"test-preview-001",
    "actor_id":"tester",
    "action":"ticket.update",
    "resource_id":12345,
    "payload":{"tags":["dclic-test"]},
    "risk":"low",
    "approved":false,
    "reason":"Test de prévisualisation"
  }'
```

Attendu : décision conforme aux politiques courantes.

## T-007 — Dry-run d’une action

Envoyer la même structure à `/api/v1/actions/execute` avec `FRESHSERVICE_WRITE_ENABLED=false`.

Attendu : statut `dry_run` ; aucun changement réel dans Freshservice.

## T-008 — Idempotence

Répéter la même commande et le même `command_id`.

Attendu : aucune double exécution.

Puis changer le payload en conservant le même `command_id`.

Attendu : HTTP 409.

## T-009 — Audit

```bash
curl http://localhost:8000/api/v1/operations/audit
```

Attendu : événements récents et traçabilité des commandes testées.

## T-010 — Navigation frontend

Tester successivement :

```text
/
/incident-radar
/neural-analytics
/neural-analytics/models
/service-ops
/service-ops/workload
/service-ops/knowledge
/service-ops/actions
/system-config
/system-config/audit
```

Attendu : toutes les routes s’affichent sans erreur, navigation cohérente, libellés français.

## T-011 — Responsive

Tester desktop, tablette et mobile. Attendu : aucune information critique inaccessible, aucun débordement majeur, navigation utilisable.

## T-012 — CI

La PR doit passer :

- installation backend ;
- Ruff ;
- tests Pytest ;
- installation frontend ;
- `next build`.

---

# 16. Test d’acceptation métier du MVP

Le scénario de référence reste **Intelligent Ticket Action** :

1. ouvrir un ticket ;
2. comprendre le problème via résumé ;
3. voir classification et confiance ;
4. voir risque SLA ;
5. voir connaissances/tickets similaires ;
6. examiner l’action proposée ;
7. prévisualiser avant/après ;
8. passer la Policy Engine ;
9. valider si nécessaire ;
10. exécuter via Gateway ;
11. vérifier l’état Freshservice ;
12. retrouver l’action dans l’audit ;
13. contrôler le coût API dans le dashboard quota.

Le MVP est réussi si un utilisateur comprend en moins de 10 secondes :

- ce que l’IA pense ;
- pourquoi ;
- ce qu’elle propose de modifier ;
- si une validation est nécessaire ;
- si l’action a réellement réussi.

---

# 17. Règles de sécurité pour les tests

1. Ne jamais mettre la clé Freshservice dans le frontend ou Git.
2. Commencer en lecture seule et dry-run.
3. Utiliser des tickets dédiés aux tests d’écriture.
4. Ne jamais activer `FRESHSERVICE_WRITE_ENABLED=true` sur la production sans politique, droits, audit et plan de retour arrière validés.
5. Tester 429, timeouts, 5xx et double clic avant toute automatisation.
6. Vérifier l’audit après chaque scénario d’écriture.
7. Une confiance IA élevée ne contourne jamais les autorisations.
8. Freshservice reste la source de vérité opérationnelle.

---

# 18. Définition de réussite globale

D-Clic Intelligence ne doit pas être jugé seulement sur la précision d’un modèle. Le produit est réussi s’il permet de :

- réduire les dépassements SLA ;
- diminuer le temps moyen de traitement/résolution ;
- détecter plus tôt les incidents récurrents ;
- améliorer la qualité des tickets ;
- mieux répartir la charge ;
- réutiliser davantage la connaissance validée ;
- protéger le quota Freshservice ;
- automatiser uniquement ce qui est sûr ;
- expliquer et auditer chaque action importante.

> **Principe final : le modèle propose, la politique décide, l’humain valide quand nécessaire, le Gateway exécute, l’audit prouve.**
