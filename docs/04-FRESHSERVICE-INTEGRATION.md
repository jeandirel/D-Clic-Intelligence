# 04 — Freshservice Integration

## Objectif

Faire de Freshservice un système parfaitement intégré sans :

- gaspiller ses quotas ;
- exposer des secrets ;
- créer des appels concurrents incontrôlés ;
- dépendre d’une seule méthode d’intégration.

---

# 1. Source de vérité

Freshservice reste la **source de vérité opérationnelle**.

La base locale D-Clic est :
- un cache enrichi ;
- un Operational Data Store ;
- une base analytique.

Elle ne devient pas la vérité officielle d’un ticket.

---

# 2. REST API v2

Freshservice documente notamment des opérations autour de :

- tickets ;
- conversations ;
- service requests ;
- approbations ;
- tâches ;
- problèmes ;
- changements ;
- releases ;
- utilisateurs/requesters ;
- agents ;
- groupes ;
- assets ;
- catalogue ;
- solutions/connaissances ;
- et d’autres ressources selon le produit et le plan.

Référence :
https://api.freshservice.com/v2/

---

# 3. Rate limiting : point critique

La documentation Freshservice API v2 indique que, pour les comptes utilisant la limitation à la minute, la limite est appliquée **au niveau du compte**.

Valeurs générales documentées :

| Plan | Overall limit/min |
|---|---:|
| Starter | 100 |
| Growth | 200 |
| Pro | 400 |
| Enterprise | 500 |

Des sous-limites existent pour certaines opérations : list tickets, view ticket, create/update ticket, assets, agents, requesters, etc.

Freshservice documente aussi des add-ons de capacité sur certains plans, avec limites supérieures.

> **Conséquence architecturale : les quotas sont un budget partagé.**

Si 5 applications utilisent la même instance :

```text
Chatbot
Classification
Ticket summarizer
Monitoring
D-Clic Intelligence
```

elles ne possèdent pas cinq budgets indépendants.

---

# 4. Headers à surveiller

Le Gateway doit enregistrer les informations de rate limit renvoyées par Freshservice, notamment celles documentées comme :

- `X-RateLimit-Total`
- `X-RateLimit-Remaining`
- `X-RateLimit-Used-CurrentRequest`
- `Retry-After`

Le code ne doit pas « deviner » le quota.

Il doit écouter les réponses du serveur.

---

# 5. 429

Quand Freshservice renvoie `429 Rate Limit Exceeded` :

1. ne pas retry immédiatement ;
2. lire `Retry-After` ;
3. placer les opérations non urgentes en attente ;
4. réduire la concurrence ;
5. alerter si la saturation est anormale ;
6. ne pas perdre les commandes idempotentes.

---

# 6. Pagination

Pour les listes :

- utiliser pagination ;
- ne pas récupérer « toute la base » à chaque écran ;
- persister curseur/page si ingestion ;
- préférer delta/incrémental lorsque disponible ;
- limiter les champs/embeds inutiles.

Les ressources incluses/embarquées peuvent consommer davantage de crédits API : le Gateway doit mesurer le coût réel, pas seulement le nombre de requêtes HTTP.

---

# 7. MCP Freshservice

Au 11 juin 2026, la documentation Freshservice présente son MCP comme **Beta / EAP**, disponible pour certains clients Enterprise.

Elle documente notamment des outils pour :

- tickets ;
- assets ;
- agents ;
- requesters ;
- onboarding/offboarding ;
- service catalog ;
- solution categories/folders/articles ;
- workspaces.

Freshservice documente également des permissions par outil telles que :
- Always allow ;
- Needs approval ;
- Blocked ;
- Custom.

Référence :
https://support.freshservice.com/support/solutions/articles/50000012678-model-context-protocol-mcp-integration-in-freshservice

### Principe D-Clic

Le MCP est une capacité intéressante mais **pas un socle unique**.

```text
D-Clic
   ↓
Execution Adapter
   ├── REST API v2
   └── MCP
```

L’adapter choisit la voie.

---

# 8. Authentication

Principes :

- jamais de clé API dans le frontend ;
- secrets dans un secret manager ;
- rotation ;
- séparation dev/test/prod ;
- privilégier OAuth quand adapté ;
- permissions minimales ;
- traçabilité du compte technique.

---

# 9. Synchronisation

## Ne pas faire

```text
Toutes les 5 secondes :
GET tous les tickets
```

## Faire

Approche hybride :

```text
Webhooks/events si disponibles
         +
synchronisation incrémentale
         +
réconciliation périodique
```

### Pourquoi une réconciliation ?
Un événement peut être perdu.

Une synchronisation périodique permet de détecter les écarts.

---

# 10. Freshservice Normalized Model

Le reste de D-Clic ne doit pas dépendre du JSON brut Freshservice.

Créer un modèle interne.

Exemple :

```python
class Ticket:
    id: str
    subject: str
    description: str
    status: str
    priority: str
    requester_id: str
    group_id: str | None
    agent_id: str | None
    created_at: datetime
    updated_at: datetime
    raw_version: str
```

Adapter :

```text
Freshservice JSON
      ↓
Freshservice Adapter
      ↓
D-Clic Domain Model
```

Avantage :
si l’API évolue, on modifie l’adapter, pas 40 modules.

---

# 11. Read-through cache

Exemple :

```text
GET ticket intelligence
      ↓
Local data freshness?
   ↙             ↘
 yes             no
 ↓                ↓
use local       Gateway → FS
                  ↓
              update cache
```

La durée de fraîcheur dépend du cas :

- dashboard global : quelques minutes peuvent être acceptables ;
- validation d’action : exiger une donnée très fraîche ;
- audit : jamais de cache approximatif.

---

# 12. Write-through + read-after-write

Pour une action :

1. vérifier état actuel ;
2. policy ;
3. construire commande ;
4. envoyer ;
5. récupérer réponse ;
6. relire ou vérifier état ;
7. enregistrer résultat.

Pourquoi relire ?

Parce qu’une réponse « requête acceptée » ne suffit pas toujours à prouver l’état métier final.

---

# 13. Optimistic concurrency

Avant une modification sensible :

- mémoriser version/date `updated_at` ;
- vérifier que la ressource n’a pas changé ;
- refuser ou recalculer si elle a changé.

Exemple :

> L’IA propose de changer la priorité à 12:00.  
> À 12:01, un agent a déjà modifié le ticket.  
> L’action IA ne doit pas écraser aveuglément la modification humaine.

---

# 14. Idempotence

Une commande « ajouter note » exécutée deux fois peut créer deux notes.

Créer un identifiant de commande :

```text
command_id = dclic-2026-08-11-abc123
```

Stocker :

- command_id ;
- resource ;
- action ;
- status ;
- result.

Avant retry : vérifier si déjà exécutée.

---

# 15. Priority Queues

Tous les appels n’ont pas la même valeur.

Exemple :

### P0
- validation d’une action humaine en cours.

### P1
- incident critique ;
- vérification post-action.

### P2
- rafraîchissement UI.

### P3
- synchronisation historique ;
- embeddings batch.

En cas de quota faible, P3 attend.

---

# 16. API Budget Manager

Le Gateway doit pouvoir calculer :

```text
Budget total
- consommation interactive
- consommation automation
- consommation sync
- réserve urgence
= budget disponible
```

Exemple de politique :

- 20 % réserve ;
- 50 % opérations interactives ;
- 20 % sync ;
- 10 % batch.

Les pourcentages doivent être configurables.

---

# 17. Dashboard API

Afficher :

- appels/min ;
- restant ;
- erreurs 429 ;
- erreurs 4xx/5xx ;
- latence p50/p95/p99 ;
- coût par module ;
- endpoints les plus consommateurs ;
- top consumers ;
- queue depth ;
- cache hit rate.

---

# 18. Data Usage Analytics

Freshservice documente en 2026 des vues Data Usage Analytics pour le stockage, l’usage API et l’usage MCP chez certains clients.

D-Clic doit importer/compléter ces signaux lorsqu’ils sont disponibles, mais garder sa propre télémétrie car il doit savoir **quel module interne** a consommé l’appel.

Référence :
https://support.freshservice.com/support/solutions/articles/50000014074-data-usage-analytics
