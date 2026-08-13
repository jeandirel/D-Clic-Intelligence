# 15 — D-Clic Copilote Agent — Production

## Positionnement

Le **D-Clic Copilote Agent** est le poste de travail intelligent des agents et managers Service Desk. Il ne remplace pas Freshservice : Freshservice reste la source de vérité. D-Clic ajoute compréhension, recommandations, voix, visualisation, gouvernance et orchestration.

Boucle :

**Rechercher → sélectionner → lire Freshservice → comprendre → recommander → prévisualiser → validation humaine → Gateway → Freshservice → relire → auditer.**

## Route

`/service-ops/copilot`

Cette route utilise désormais le backend D-Clic et les données Freshservice réelles. Elle ne retombe pas silencieusement sur des tickets de démonstration.

## Endpoints D-Clic Copilote

- `GET /api/v1/copilot/status`
- `GET /api/v1/copilot/tickets`
- `GET /api/v1/copilot/tickets/filter?query=...`
- `GET /api/v1/copilot/tickets/{id}/context`
- `POST /api/v1/copilot/analyze`
- `POST /api/v1/copilot/preview`
- `POST /api/v1/copilot/execute`
- `POST /api/v1/copilot/visualize`
- `POST /api/v1/copilot/voice/token`

## Freshservice utilisé

Le Gateway centralise les appels vers l’API v2 :

- tickets ;
- filtre de tickets ;
- ticket individuel ;
- conversations ;
- `ticket_form_fields` ;
- groupes ;
- agents ;
- requester / stats / assets / changes / related tickets via `include` ;
- `PUT ticket` uniquement après validation.

Documentation officielle : https://api.freshservice.com/v2/

## Taxonomie

`GET /api/v2/ticket_form_fields` est synchronisé/caché afin de fournir au Copilote la taxonomie réellement configurée. Les recommandations applicables doivent rester dans les valeurs Freshservice disponibles.

## Analyse IA

### Avec fournisseur IA configuré

Variables backend :

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Le backend envoie le contexte structuré du ticket au fournisseur IA et exige une sortie JSON structurée. Le modèle reçoit notamment :

- ticket ;
- conversations récentes ;
- groupes Freshservice autorisés ;
- définition du champ catégorie.

Le modèle ne reçoit pas le droit d’écrire dans Freshservice.

### Sans fournisseur IA

Le Copilote reste connecté aux données Freshservice réelles mais passe en mode `bootstrap`. L’interface l’indique explicitement. Il n’est donc jamais présenté comme une génération LLM lorsqu’aucun LLM n’est configuré.

## Mise à jour Freshservice — L2/HITL

Toute action `ticket.update` nécessite une approbation humaine explicite.

```text
Proposition IA
   ↓
Avant / Après
   ↓
Agent corrige si nécessaire
   ↓
Policy Engine
   ↓
Validation humaine
   ↓
Freshservice Gateway
   ↓
PUT /tickets/{id}
   ↓
GET /tickets/{id}
   ↓
Verified + Audit
```

Pour le premier déploiement :

```env
FRESHSERVICE_WRITE_ENABLED=false
```

Après validation complète des lectures, analyses et previews :

```env
FRESHSERVICE_WRITE_ENABLED=true
```

## Visual Intelligence — données réelles

Le Copilote peut demander des visualisations à partir de tickets Freshservice réels :

- tickets par groupe ;
- priorité ;
- statut ;
- catégorie ;
- source ;
- type ;
- évolution quotidienne ;
- arrivée par plage horaire ;
- tickets à échéance proche par groupe.

Important : la fonction `tickets à risque SLA` actuellement disponible dans Visual Intelligence signifie **échéance opérationnelle proche ou dépassée**. Elle n’est pas présentée comme une prédiction ML de breach tant qu’un modèle prédictif évalué n’est pas branché.

Pour les analyses volumineuses, l’architecture cible reste l’ODS PostgreSQL afin d’éviter de parcourir l’API Freshservice à chaque question.

## Voix production — Azure AI Speech

Le frontend utilise le SDK JavaScript `microsoft-cognitiveservices-speech-sdk`.

Fonctions :

- reconnaissance depuis le microphone ;
- commande vocale du Copilote ;
- synthèse vocale des réponses ;
- choix de voix dans l’interface.

Voix proposées dans la V1 :

- `fr-FR-DeniseNeural` ;
- `fr-FR-HenriNeural` ;
- `fr-FR-VivienneMultilingualNeural` ;
- `fr-FR-RemyMultilingualNeural`.

### Sécurité de la clé Speech

Ne jamais mettre `AZURE_SPEECH_KEY` dans `NEXT_PUBLIC_*`.

Le fonctionnement est :

```text
Navigateur
   ↓ POST /api/v1/copilot/voice/token
Backend D-Clic
   ↓ utilise AZURE_SPEECH_KEY
Azure Speech STS
   ↓ jeton court
Backend
   ↓ jeton uniquement
Navigateur / Speech SDK
```

Variables backend :

```env
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=westeurope
AZURE_SPEECH_LANGUAGE=fr-FR
AZURE_SPEECH_VOICE=fr-FR-DeniseNeural
```

## Variables de déploiement

### Backend D-Clic — secrets

```env
FRESHSERVICE_DOMAIN=cerprouen.freshservice.com
FRESHSERVICE_API_KEY=...
FRESHSERVICE_WRITE_ENABLED=false
FRESHSERVICE_WORKSPACE_ID=

OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini

AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=westeurope
AZURE_SPEECH_LANGUAGE=fr-FR
AZURE_SPEECH_VOICE=fr-FR-DeniseNeural

CORS_ORIGINS=https://d-clic-intelligence-beta.vercel.app

DATABASE_URL=...
REDIS_URL=...
```

### Frontend Vercel

Le frontend ne reçoit qu’une URL publique :

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-dclic>
```

Ne jamais définir dans le frontend :

- `NEXT_PUBLIC_FRESHSERVICE_API_KEY` ;
- `NEXT_PUBLIC_OPENAI_API_KEY` ;
- `NEXT_PUBLIC_AZURE_SPEECH_KEY`.

## Où mettre la clé Freshservice ?

La clé doit être placée dans **l’environnement qui exécute FastAPI / Freshservice Gateway**. Si le frontend est sur Vercel et le backend sur Azure Container Apps, App Service, Kubernetes, Render ou autre, la clé appartient au backend, pas au projet frontend Vercel.

Le frontend Vercel appelle seulement `NEXT_PUBLIC_API_BASE_URL`.

## Séquence de mise en service

1. Déployer le backend avec PostgreSQL et Redis.
2. Configurer `FRESHSERVICE_DOMAIN` et `FRESHSERVICE_API_KEY`.
3. Garder `FRESHSERVICE_WRITE_ENABLED=false`.
4. Configurer `CORS_ORIGINS` avec l’URL Vercel.
5. Configurer `NEXT_PUBLIC_API_BASE_URL` sur Vercel.
6. Vérifier `/api/v1/copilot/status`.
7. Vérifier la liste des tickets.
8. Ouvrir un vrai ticket et charger son contexte.
9. Configurer `OPENAI_API_KEY` pour l’analyse LLM réelle si souhaité.
10. Configurer Azure Speech et tester microphone + lecture vocale.
11. Tester Preview Avant/Après.
12. Seulement après validation, activer `FRESHSERVICE_WRITE_ENABLED=true`.
13. Tester une modification sur un ticket de test/non critique.
14. Vérifier le read-after-write et l’audit.

## Principes de sécurité

- aucune clé dans le navigateur ;
- Freshservice uniquement via Gateway ;
- confiance IA ≠ permission ;
- `ticket.update` = L2/HITL ;
- idempotence ;
- quota central ;
- Retry-After / 429 ;
- audit ;
- read-after-write ;
- CORS explicite ;
- taxonomie issue de Freshservice ;
- aucune prétention de prédiction ML quand le signal est seulement déterministe.
