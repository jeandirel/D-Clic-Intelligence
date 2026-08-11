# ADR-002 — Tout accès Freshservice passe par le Gateway

## Statut
Accepted.

## Contexte
Plusieurs modules IA peuvent consommer la même API et le même budget de quotas.

## Décision
Interdire les appels directs Freshservice hors du Gateway.

## Raisons
- quotas ;
- sécurité ;
- audit ;
- retry ;
- cache ;
- cohérence ;
- observabilité.

## Conséquence
Tout nouveau module implémente une commande interne, jamais un client Freshservice indépendant.
