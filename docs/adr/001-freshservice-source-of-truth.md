# ADR-001 — Freshservice reste la source de vérité

## Statut
Accepted.

## Décision
D-Clic Intelligence ne devient pas le système officiel de gestion des tickets.

Freshservice reste la source de vérité.

## Raisons
- éviter deux états officiels ;
- réduire les conflits ;
- conserver les workflows existants ;
- limiter le périmètre ;
- faciliter l’adoption.

## Conséquence
Les données locales sont des projections/cache/analytics et doivent être réconciliables avec Freshservice.
