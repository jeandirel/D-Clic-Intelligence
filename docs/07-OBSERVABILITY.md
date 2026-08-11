# 07 — Observability

D-Clic Intelligence doit monitorer **quatre systèmes en même temps** :

1. Freshservice ;
2. la plateforme D-Clic ;
3. les modèles IA ;
4. les actions métier.

---

# 1. Golden signals techniques

Pour chaque service :

- latency ;
- traffic ;
- errors ;
- saturation.

Ajouter :
- availability ;
- queue depth ;
- DB pool ;
- cache.

---

# 2. Freshservice API dashboard

Widgets :

```text
Calls/min
Remaining quota
429/min
4xx/min
5xx/min
p95 latency
Queue depth
Cache hit rate
Top endpoint
Top internal consumer
```

---

# 3. Quota burn rate

Ne pas seulement afficher « 250 appels ».

Calculer :

> À ce rythme, serons-nous saturés avant la fin de la fenêtre ?

Alertes :
- warning ;
- critical ;
- emergency reserve.

---

# 4. MCP dashboard

Quand MCP actif :

- tool calls ;
- success rate ;
- denied/approval ;
- latency ;
- monthly usage ;
- top tool ;
- errors.

Freshservice documente des capacités de Data Usage Analytics incluant l’activité API et MCP pour certains clients. D-Clic complète avec une granularité par module interne.

---

# 5. LLM dashboard

- calls ;
- tokens input/output ;
- latency ;
- cost ;
- provider ;
- fallback ;
- structured output failures ;
- context length ;
- safety blocks.

---

# 6. ML dashboard

Par modèle :

- version ;
- predictions/min ;
- confidence distribution ;
- abstention ;
- drift ;
- latest labeled performance ;
- calibration ;
- error rate.

---

# 7. Automation dashboard

- recommendations ;
- accepted ;
- rejected ;
- edited ;
- auto-executed ;
- failed ;
- rolled back ;
- blocked by policy.

### Métrique essentielle
`false_action_rate`

Une automatisation incorrecte peut coûter beaucoup plus que 100 recommandations manquées.

---

# 8. Business dashboard

Exemples :

- SLA saved ;
- MTTR improvement ;
- time saved ;
- ticket deflection ;
- repeated incidents detected earlier ;
- KB reuse.

---

# 9. Trace distribuée d’une action

Créer un `correlation_id`.

```text
UI click
  ↓ correlation_id abc
AI recommendation
  ↓ abc
Policy
  ↓ abc
Gateway
  ↓ abc
Freshservice API
  ↓ abc
Verification
  ↓ abc
Audit
```

On peut reconstruire l’histoire complète.

---

# 10. Logs

Logs structurés JSON.

Champs :
- timestamp ;
- level ;
- service ;
- correlation_id ;
- actor_id pseudonymisé si possible ;
- operation ;
- target ;
- status ;
- latency.

Ne pas mettre automatiquement :
- description complète ticket ;
- email ;
- données sensibles ;
- clé API ;
- prompt complet.

---

# 11. Metrics

Prometheus possible.

Exemples :

```text
dclic_freshservice_requests_total
dclic_freshservice_rate_limit_remaining
dclic_action_success_total
dclic_action_policy_denied_total
dclic_model_predictions_total
dclic_llm_tokens_total
dclic_recommendation_acceptance_ratio
```

---

# 12. Alerts

## Critiques
- Freshservice write failures ;
- auth failure ;
- action duplication ;
- audit failure ;
- DB unavailable ;
- quota exhausted.

## Hautes
- 429 spike ;
- model drift ;
- LLM error spike ;
- queue backlog.

## Information
- daily API usage ;
- cost trend.

---

# 13. SLOs D-Clic

Exemple initial :

### Read intelligence
99,5 % des requêtes réussies.

### Action pipeline
99,9 % des commandes acceptées par le système sont soit :
- exécutées et vérifiées ;
- soit explicitement marquées failed.

Jamais « état inconnu » silencieux.

### Audit
100 % des actions de production écrites dans l’audit.

---

# 14. Monitoring des recommandations

Chaque recommandation produit un outcome.

Exemple :

```text
Suggested assignment: Network
Human changed to: Workplace
Outcome: rejected/corrected
```

Agrégé par :
- catégorie ;
- groupe ;
- modèle ;
- période.

---

# 15. Drift métier

Même si les mots restent les mêmes, l’organisation peut changer :

- nouvelle équipe ;
- nouveau catalogue ;
- nouvelle catégorie ;
- nouvelle procédure.

Le drift n’est pas seulement statistique. Il est aussi organisationnel.

---

# 16. Dashboard direction

Ne pas afficher les détails techniques.

Afficher :

- heures économisées ;
- SLA évités ;
- incidents détectés plus tôt ;
- taux d’adoption ;
- automatisations sûres ;
- évolution de qualité.

---

# 17. Question de contrôle

À tout moment, nous devons pouvoir répondre :

> « Pourquoi le système a fait cette action hier à 14:03 ? »

Si l’observabilité ne permet pas de répondre, elle est insuffisante.
