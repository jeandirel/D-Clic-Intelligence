# Contributing

## Règles générales

1. Une feature = un problème métier clairement défini.
2. Aucun appel Freshservice direct hors Gateway.
3. Aucun secret dans le repository.
4. Toute action de production doit être auditable.
5. Toute nouvelle capacité IA doit avoir une métrique.
6. Ajouter tests.
7. Documenter les décisions architecturales importantes dans `docs/adr/`.

## Branches

- `main` : stable
- `develop` : intégration si ce workflow est retenu
- `feature/<name>`
- `fix/<name>`

## Pull Request

Une PR doit préciser :

- problème ;
- solution ;
- risques ;
- tests ;
- observabilité ;
- sécurité ;
- impact Freshservice API ;
- rollback.

## AI feature checklist

- [ ] dataset/source documenté
- [ ] baseline
- [ ] métrique
- [ ] seuil
- [ ] incertitude affichée
- [ ] policy
- [ ] audit
- [ ] fallback
- [ ] monitoring
