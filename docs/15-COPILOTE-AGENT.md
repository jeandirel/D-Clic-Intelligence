# 15 — D-Clic Copilote Agent

## Positionnement

Le **Copilote Agent** est un module de D-Clic Intelligence dédié au travail quotidien des agents et managers Service Desk. Il ne remplace ni Freshservice ni les autres modules D-Clic (Radar d’incidents, SLA, Charge, Knowledge, Model Ops, API Control, Gouvernance).

Sa boucle est :

**Rechercher / sélectionner → comprendre → enrichir → recommander → visualiser → prévisualiser → faire valider → exécuter via Gateway → vérifier → apprendre.**

## État de la version actuelle

La route `/service-ops/copilot` est une **sandbox fonctionnelle de démonstration** :

- les vues Freshservice fournies pour le projet sont enregistrées dans un registre de démonstration ;
- un jeu de tickets simulés permet de tester les workflows ;
- toutes les transformations sont locales au navigateur ;
- `external_write=false` est la règle de cette version ;
- aucune modification réelle n’est envoyée à Freshservice ;
- la voix utilise Web Speech API lorsque le navigateur la supporte et retombe sur le texte sinon.

## Capacités démontrables

### Recherche et navigation conversationnelles

Le Copilote peut :

- rechercher une vue ;
- sélectionner une vue ;
- filtrer la liste locale de tickets ;
- sélectionner un ticket par ID ;
- sélectionner un ticket par demandeur (ex. Rodrigo) ;
- comprendre des commandes simples en français.

Exemples :

- `Montre-moi les tickets non assignés.`
- `Affiche les tickets VIP.`
- `Sélectionne le ticket de Rodrigo.`
- `Ouvre INC-157104.`

### Analyse du ticket

Le bouton **Analyser avec le Copilote** produit :

- résumé métier ;
- description structurée ;
- priorité recommandée ;
- groupe recommandé ;
- catégorie / sous-catégorie / élément ;
- informations manquantes ;
- tickets similaires ;
- prochaine meilleure action ;
- brouillon de réponse.

### Smart Prompting

Le Copilote identifie les informations nécessaires au diagnostic et prépare des questions ciblées plutôt que de se limiter à reformuler le texte.

### Context / Asset Intelligence

Lorsque le ticket simulé contient un actif, le Copilote affiche :

- équipement ;
- identifiant ;
- garantie ;
- nombre d’incidents connus.

La cible production prévoit l’entity resolution avec les Assets / CI Freshservice synchronisés dans l’ODS.

### Avant / Après avec validation humaine

Le Copilote ouvre une prévisualisation modifiable :

- description ;
- priorité ;
- groupe ;
- catégorie ;
- sous-catégorie ;
- élément.

Chaque champ peut être :

- conservé ;
- exclu ;
- corrigé par l’agent.

Une correction humaine différente de la proposition IA est considérée comme un signal de feedback d’apprentissage.

**Niveau d’autonomie : L2 — Human-in-the-loop.**

Une commande vocale telle que `applique les modifications` ne contourne jamais l’écran de confirmation.

## Voix

### Démonstration

La version Web utilise :

- `SpeechRecognition` / `webkitSpeechRecognition` pour la transcription ;
- `SpeechSynthesis` pour lire les réponses lorsque l’option est activée.

La reconnaissance vocale n’est pas supportée de façon homogène par tous les navigateurs : le texte reste un fallback permanent.

Documentation :

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

### Cible production

Le module doit exposer une abstraction `VoiceGateway` afin de pouvoir utiliser un fournisseur entreprise (par exemple Azure Speech) sans modifier l’orchestrateur métier.

## Visual Intelligence

Visual Intelligence transforme une demande texte ou voix en analyse Service Desk.

Exemples :

- `Crée un visuel des tickets par groupe.`
- `Montre le risque SLA par groupe.`
- `Fais la répartition par priorité.`
- `Montre l’évolution des tickets.`
- `Montre les tickets par site.`
- `Fais une heatmap des arrivées par heure.`

### Fonctionnement sandbox

Le moteur actuel :

1. interprète la demande ;
2. sélectionne une métrique et une dimension autorisées ;
3. agrège le jeu local de tickets ;
4. choisit bar / line / donut / heatmap ;
5. ouvre un modal ;
6. affiche données, scope, source, fraîcheur et insights ;
7. accepte une modification conversationnelle ;
8. permet d’épingler le visuel dans le tableau de bord local de démonstration.

### Cible production

Le LLM ne doit pas exécuter du SQL ou du JavaScript arbitraire.

Architecture cible :

```text
Voix / texte / contexte UI
          ↓
Intent Orchestrator
          ↓
VisualizationRequest structuré
          ↓
Semantic Layer
          ↓
Query Planner autorisé
          ↓
ODS PostgreSQL
          ↓
Dataset agrégé
          ↓
Visualization Planner
          ↓
D-Clic Chart Spec
          ↓
Validator
          ↓
Renderer
          ↓
Modal + Insights + Audit
```

Le Semantic Layer doit exposer des métriques contrôlées comme :

- `ticket_count` ;
- `open_ticket_count` ;
- `unassigned_count` ;
- `sla_breach_count` ;
- `sla_risk_count` ;
- `average_resolution_time` ;
- `average_first_response_time` ;
- `major_incident_count` ;
- `ai_created_count` ;
- `negative_csat_count`.

Et des dimensions telles que :

- date / heure ;
- statut ;
- priorité ;
- type ;
- groupe ;
- agent ;
- catégorie ;
- sous-catégorie ;
- élément ;
- site ;
- département ;
- source ;
- actif ;
- VIP.

## Freshservice — intégration cible

Freshservice reste la source de vérité. Le navigateur ne reçoit jamais de clé API.

### Lecture ticket

`GET /api/v2/tickets/{id}`

### Mise à jour ticket

`PUT /api/v2/tickets/{id}` uniquement après Policy Engine + approbation + Gateway.

### Taxonomie des champs

`GET /api/v2/ticket_form_fields`

Documentation officielle :

- https://api.freshservice.com/v2/
- https://support.freshservice.com/support/solutions/articles/50000000294-how-can-i-get-the-ticket-fields-using-apis-

La classification applicable doit être contrainte aux valeurs réellement configurées dans Freshservice. Une valeur absente de `ticket_form_fields` ne doit pas être présentée comme directement applicable.

## ODS et performances

Les analyses multi-tickets et les visualisations ne doivent pas parcourir Freshservice à chaque interaction.

Cible :

```text
Freshservice
   ↓
Freshservice Gateway
   ↓
Synchronisation incrémentale
   ↓
ODS PostgreSQL
   ↓
Copilote / Visual Intelligence / modèles
```

Cela protège le quota Freshservice et donne une latence interactive.

## Sécurité

Principes :

- aucune clé Freshservice dans le frontend ;
- confiance IA ≠ permission ;
- Policy Engine indépendant ;
- L2 par défaut pour les modifications ;
- preview avant écriture ;
- idempotence ;
- read-after-write ;
- audit ;
- permissions utilisateur ;
- protection contre les prompts contenus dans tickets / KB ;
- données vocales traitées selon la politique de l’entreprise.

## Feedback Loop

Pour chaque proposition :

```text
prediction
human_choice
accepted / edited / rejected
model_version
context
final_outcome
```

Les corrections deviennent un dataset d’amélioration pour classification, routage et recommandations.

## Critères d’acceptation — démonstration actuelle

- route `/service-ops/copilot` accessible depuis la sidebar ;
- registre des vues visible et recherchable ;
- sélection de tickets fonctionnelle ;
- commande conversationnelle texte fonctionnelle ;
- commande vocale disponible lorsque le navigateur le permet ;
- analyse d’un ticket modifie réellement l’état UI ;
- avant/après modifiable ;
- confirmation obligatoire ;
- modification simulée visible dans les propriétés du ticket ;
- audit local alimenté ;
- création de visualisations fonctionnelle ;
- bar / line / donut / heatmap ;
- modification conversationnelle du visuel ;
- épinglage local ;
- aucune écriture Freshservice ;
- build Next.js vert.

## Étape suivante — connexion réelle

1. Synchroniser `ticket_form_fields` et la taxonomie.
2. Ajouter les endpoints de lecture Ticket / Conversations / Requester / Assets derrière le Gateway.
3. Connecter le Copilote en lecture seule.
4. Brancher le modèle de classification métier existant.
5. Construire l’ODS analytique.
6. Connecter Visual Intelligence à l’ODS.
7. Ajouter le vrai moteur LLM sous sorties structurées.
8. Activer ensuite le `PUT ticket` uniquement avec Policy Engine + L2/HITL + vérification.
