# 12 — MVP Acceptance Criteria

## MVP : « Intelligent Ticket Action »

### Histoire utilisateur

> En tant qu’agent, je veux ouvrir un ticket dans D-Clic, comprendre rapidement la situation, obtenir une recommandation, prévisualiser la modification, la valider et voir cette modification confirmée dans Freshservice.

---

# 1. Fonctionnel

## AC-01 — Lire un ticket
Given un ticket Freshservice valide  
When l’agent l’ouvre  
Then D-Clic affiche les données essentielles.

## AC-02 — Résumé
Le système produit un résumé séparant :
- problème ;
- contexte ;
- actions déjà réalisées ;
- prochaine étape.

## AC-03 — Classification
Afficher top-3 :
- groupe/catégorie ;
- score.

## AC-04 — Action proposée
Au moins une action structurée.

## AC-05 — Preview
Aucune écriture avant preview.

## AC-06 — Policy
Toute action passe par policy.

## AC-07 — Approval
Une action configurée L2 demande validation.

## AC-08 — Gateway
Aucun composant autre que Gateway ne communique avec Freshservice.

## AC-09 — Verification
Après update, le système vérifie l’état.

## AC-10 — Audit
L’action est reconstructible de bout en bout.

---

# 2. Sécurité

- secrets non présents dans frontend ;
- secrets non présents dans Git ;
- RBAC ;
- logs sans données inutiles ;
- commandes structurées ;
- input non fiable marqué ;
- policy obligatoire.

---

# 3. Résilience

Tester :
- timeout ;
- 429 ;
- Freshservice 5xx ;
- LLM indisponible ;
- duplicate click.

Le double clic ne doit pas créer deux actions.

---

# 4. Observabilité

Dashboard minimal :

- API Freshservice calls ;
- remaining quota ;
- errors ;
- latency ;
- LLM calls ;
- action success/failure ;
- policy decisions.

---

# 5. IA

Le MVP ne doit pas revendiquer une « prédiction fiable » sans évaluation.

Obligatoire :
- dataset d’évaluation ;
- métrique ;
- score ;
- seuil ;
- fallback.

---

# 6. UX

L’utilisateur doit comprendre en moins de 10 secondes :

1. ce que l’IA pense ;
2. pourquoi ;
3. ce qu’elle veut modifier ;
4. si l’action a réussi.

---

# 7. Demo script

1. ouvrir ticket ;
2. voir résumé ;
3. voir classification ;
4. voir similar tickets/KB si disponible ;
5. cliquer appliquer ;
6. preview ;
7. confirmer ;
8. voir Freshservice modifié ;
9. ouvrir audit ;
10. montrer API dashboard.

Cette démo raconte toute la vision du produit avec un seul flux.
