# 11 — Freshservice Gateway Specification

## Responsabilité

Le Gateway est **la seule frontière technique autorisée** pour les échanges D-Clic → Freshservice.

---

# 1. Interface interne

Au lieu d’exposer les URLs Freshservice partout :

```python
freshservice.update_ticket(...)
```

le reste du système utilise :

```python
gateway.execute(command)
```

Commande :

```json
{
  "command_id": "cmd-abc",
  "actor_id": "user-123",
  "action": "ticket.update",
  "resource_id": "18492",
  "payload": {
    "priority": "high"
  },
  "correlation_id": "corr-789"
}
```

---

# 2. Pipeline d’exécution

```text
Receive command
  ↓
Schema validation
  ↓
Authorization token/context check
  ↓
Idempotency check
  ↓
Rate budget check
  ↓
Priority queue
  ↓
Adapter selection REST/MCP
  ↓
Execute
  ↓
Handle error/retry
  ↓
Verify
  ↓
Audit
  ↓
Return normalized result
```

---

# 3. Command status

- RECEIVED
- VALIDATED
- QUEUED
- EXECUTING
- SUCCEEDED
- VERIFIED
- RETRYING
- FAILED
- REJECTED
- UNKNOWN_REQUIRES_RECONCILIATION

`UNKNOWN` ne doit jamais être caché.

---

# 4. Idempotency store

Clé :
`command_id`

Stocker :
- hash payload ;
- first_seen ;
- status ;
- Freshservice reference ;
- response.

Si même command_id avec payload différent :
**reject**.

---

# 5. Rate budget

Le Gateway maintient une estimation locale, mais Freshservice reste autoritaire.

Sources :
- headers ;
- réponses 429 ;
- configuration plan ;
- historique.

---

# 6. Quota partitions

Exemple configurable :

```yaml
quota:
  emergency_reserve_percent: 20
  interactive_percent: 40
  automation_percent: 20
  sync_percent: 15
  batch_percent: 5
```

En situation critique, le batch peut être suspendu.

---

# 7. Cache policy

Chaque ressource possède une classe.

```yaml
ticket_form_fields:
  ttl: 30m

agents:
  ttl: 5m

ticket_detail:
  ttl: 30s

approval_state:
  ttl: 0s
```

---

# 8. Retry policy

Retry :
- timeout ;
- 429 selon Retry-After ;
- certains 5xx.

Pas de retry aveugle :
- validation error 400 ;
- unauthorized 401 ;
- forbidden 403 ;
- conflict selon contexte.

---

# 9. Circuit breaker

États :
- CLOSED ;
- OPEN ;
- HALF_OPEN.

Si Freshservice échoue massivement :
- bloquer temporairement ;
- protéger le système ;
- tester progressivement.

---

# 10. Normalized errors

Exemple :

```json
{
  "type": "RATE_LIMITED",
  "retryable": true,
  "retry_after_seconds": 42,
  "source": "freshservice",
  "correlation_id": "corr-789"
}
```

L’UI ne doit pas interpréter elle-même les codes Freshservice.

---

# 11. Verification

Méthodes :

### Response verification
La réponse contient l’état final.

### Read-after-write
Relire.

### Event confirmation
Attendre événement.

La stratégie dépend de l’action.

---

# 12. Audit event

```json
{
  "event": "freshservice.command.verified",
  "command_id": "cmd-abc",
  "actor_id": "user-123",
  "action": "ticket.update",
  "resource_id": "18492",
  "policy_id": "P-123",
  "ai_recommendation_id": "rec-456",
  "started_at": "...",
  "verified_at": "...",
  "result": "success"
}
```

---

# 13. Metrics

- requests_total ;
- requests_by_action ;
- rate_limit_remaining ;
- rate_limit_consumed ;
- retries ;
- 429 ;
- 5xx ;
- queue depth ;
- queue wait ;
- command latency ;
- verification failures ;
- cache hits/misses.

---

# 14. Adapter REST

Responsabilités :
- endpoint mapping ;
- auth ;
- serialization ;
- pagination ;
- error mapping ;
- headers.

---

# 15. Adapter MCP

Responsabilités :
- tool discovery/config ;
- permission awareness ;
- tool call mapping ;
- usage limits ;
- error normalization.

MCP doit respecter exactement les mêmes règles internes de command/audit.

---

# 16. Tests

## Unit
- limiter ;
- backoff ;
- idempotence ;
- error mapping.

## Integration
- sandbox Freshservice ;
- create/update/read ;
- 429 simulation.

## Chaos
- timeout ;
- 5xx ;
- lost response ;
- duplicate delivery.

---

# 17. Règle absolue

> Si un nouveau module veut appeler directement `*.freshservice.com`, la revue d’architecture doit échouer.
