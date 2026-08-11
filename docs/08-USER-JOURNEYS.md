# 08 — User Journeys

# Journey 1 — Agent : traiter un ticket

## Étape 1
L’agent ouvre le ticket dans Freshservice et D-Clic en parallèle.

## Étape 2
D-Clic affiche :

```text
Résumé
Problème principal
Confiance de classification
Risque SLA
Tickets similaires
KB pertinente
Actions proposées
```

## Étape 3
L’agent choisit « Appliquer ».

## Étape 4
D-Clic affiche une preview :

```diff
- Groupe: Non assigné
+ Groupe: Workplace

- Catégorie: Non classé
+ Catégorie: Accès / VPN

+ Note interne: "..."
```

## Étape 5
Policy check.

## Étape 6
Gateway exécute.

## Étape 7
Confirmation :

> Modifications vérifiées dans Freshservice.

---

# Journey 2 — Agent : réponse assistée

Demande :

> « Prépare une réponse courte et claire. »

D-Clic :
1. lit ticket ;
2. lit conversations ;
3. cherche KB ;
4. produit réponse sourcée ;
5. agent édite ;
6. envoi après confirmation.

---

# Journey 3 — Manager : SLA à risque

Écran :

```text
19 tickets > 80% risk
7 tickets > 90% risk
```

Le manager clique un ticket.

Il voit les facteurs :

- seulement 52 min restantes ;
- groupe en surcharge ;
- ticket déjà réassigné deux fois ;
- catégorie historiquement longue.

Recommandation :

> Réassigner à Senior Workplace.

Simulation :

> risque estimé après action : 42 %.

---

# Journey 4 — Incident Radar

Alerte :

> Cluster anormal détecté — VPN.

L’écran montre :
- timeline ;
- nombre ;
- sites ;
- catégories ;
- phrases communes ;
- assets ;
- changements récents.

Actions :
- créer Problem ;
- rattacher incidents ;
- notifier équipe ;
- lancer watch mode.

---

# Journey 5 — Knowledge Manager

D-Clic :

> 34 tickets ont été résolus avec la même procédure. Aucun article officiel correspondant.

Le manager ouvre.

D-Clic génère un draft.

L’expert corrige.

Policy :
publication KB requiert rôle `knowledge_manager`.

Publication.

---

# Journey 6 — Admin API

Admin ouvre API Control.

```text
Quota 400/min
Actuel 231/min
Reserve 80/min
429 last hour: 2
Top consumer: ticket-sync
```

Il peut :
- réduire batch ;
- arrêter sync ;
- augmenter cache TTL ;
- désactiver un module ;
- modifier priorité.

---

# Journey 7 — Natural Language Command

Manager :

> « Quels incidents critiques ont été créés après le changement réseau de ce matin ? »

Le système montre le plan de lecture.

Puis résultats.

Manager :

> « Prépare l’association au problème le plus probable. »

D-Clic génère les actions.

Avant exécution :
preview + policy + validation.

---

# Journey 8 — Utilisateur final

Utilisateur :

> « Je n’arrive plus à me connecter au VPN. »

D-Clic :
1. comprend ;
2. cherche KB ;
3. pose deux questions utiles ;
4. propose self-service ;
5. si échec, prépare ticket complet.

Ticket créé avec :
- bon sujet ;
- bonne description ;
- diagnostic déjà réalisé ;
- catégorie proposée ;
- contexte.

Gain : l’agent commence avec un ticket de meilleure qualité.

---

# Journey 9 — Change Manager

Avant changement :

```text
Risk: High
Similar historical changes: 17
Incidents after similar changes: 5
Critical services exposed: 3
Rollback plan completeness: 60%
```

Recommandations :
- enrichir rollback ;
- déplacer fenêtre ;
- surveiller services.

Après exécution :
D-Clic passe en **Post Change Watch**.

---

# Journey 10 — Direction

Pas de jargon ML.

Vue :

```text
+12% SLA compliance
-18% average handling time
31 SLA breaches prevented
14 recurring incident clusters detected
226 agent hours estimated saved
```

Chaque chiffre doit être calculable et auditable.
