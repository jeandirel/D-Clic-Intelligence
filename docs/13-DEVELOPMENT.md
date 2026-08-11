# 13 — Development Guide

## Objectif

Lancer le premier vertical slice D-Clic Intelligence en local :

```text
Next.js Command Center
        ↓
FastAPI
        ↓
Policy Engine
        ↓
Freshservice Gateway
        ↓
Freshservice API v2
```

Par défaut, les écritures Freshservice sont **désactivées**.

---

# 1. Pré-requis

- Docker + Docker Compose ;
- ou Python 3.11+ et Node.js 22+ pour un lancement hors Docker ;
- une instance Freshservice et une clé API pour tester les lectures réelles.

---

# 2. Configuration

```bash
cp .env.example .env
```

Puis renseigner :

```env
FRESHSERVICE_DOMAIN=company.freshservice.com
FRESHSERVICE_API_KEY=...
```

Garder impérativement au début :

```env
FRESHSERVICE_WRITE_ENABLED=false
```

Cela place le Gateway en **dry-run** pour les commandes d'écriture.

---

# 3. Démarrage Docker

```bash
make up
```

Interfaces :

- Command Center : `http://localhost:3000`
- API : `http://localhost:8000`
- Swagger : `http://localhost:8000/docs`
- Health : `http://localhost:8000/api/v1/health`

---

# 4. Lancer seulement le backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Sous Windows PowerShell :

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

---

# 5. Lancer seulement le frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 6. Tests

Backend :

```bash
make backend-test
```

La CI vérifie également :

- Ruff ;
- pytest ;
- build Next.js.

---

# 7. Premier test Freshservice

Une fois les secrets configurés :

```http
GET /api/v1/tickets/{ticket_id}/intelligence
```

Le backend :

1. passe par le Freshservice Gateway ;
2. lit le ticket ;
3. envoie le payload au service Ticket Intelligence ;
4. produit résumé, risque SLA bootstrap et recommandations ;
5. ne modifie rien dans Freshservice.

---

# 8. Preview d'une action

```http
POST /api/v1/actions/preview
Content-Type: application/json
```

```json
{
  "command_id": "cmd-demo-001",
  "actor_id": "agent-demo",
  "action": "ticket.update",
  "resource_id": 123,
  "payload": {"priority": 2},
  "risk": "low",
  "approved": false,
  "reason": "Demo"
}
```

Le Policy Engine renvoie `allow`, `require_approval` ou `deny`.

---

# 9. Exécution

L'endpoint :

```http
POST /api/v1/actions/execute
```

utilise la même commande.

Avec `FRESHSERVICE_WRITE_ENABLED=false`, la réponse reste `dry_run` même si la policy autorise l'action.

Pour activer les écritures dans un environnement contrôlé :

```env
FRESHSERVICE_WRITE_ENABLED=true
```

Ne jamais activer cette option en production avant :

- identité/RBAC ;
- audit persistant ;
- idempotence persistante ;
- gestion 429/backoff complète ;
- approbations persistantes ;
- tests d'intégration.

---

# 10. État actuel du bootstrap

Déjà présent :

- UI Command Center ;
- FastAPI ;
- configuration ;
- Freshservice client ;
- Gateway central ;
- limitation de concurrence locale ;
- Policy Engine ;
- dry-run ;
- read-after-write verification ;
- heuristiques Ticket Intelligence ;
- tests unitaires ;
- CI.

À construire ensuite :

1. PostgreSQL ODS ;
2. Redis quota/cache ;
3. rate-limit manager basé sur les headers Freshservice ;
4. audit persistant ;
5. authentification/RBAC ;
6. vraie classification ML ;
7. RAG/Knowledge Intelligence ;
8. SLA Prediction ;
9. Incident Radar ;
10. observabilité Prometheus/Grafana.
