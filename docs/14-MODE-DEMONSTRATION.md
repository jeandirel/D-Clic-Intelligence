# 14 — Démo fonctionnelle : bac à sable D-Clic

## Objectif

`/demo` n’est plus un storyboard. C’est un **bac à sable interactif** : chaque bouton métier modifie réellement l’état affiché dans le navigateur afin de montrer le comportement attendu de D-Clic Intelligence.

**Règle absolue :** toutes les données, prédictions, validations, exécutions et traces sont simulées localement. La démo n’effectue aucun appel ni aucune écriture vers Freshservice.

## Accès

- URL : `/demo`
- Entrée sidebar : **Lancer la démonstration**
- En-tête : **BAC À SABLE FONCTIONNEL**
- `external_write=false` affiché pendant toute la démonstration.

## Ce qui est réellement interactif

Pour chaque scénario, l’utilisateur clique sur des **actions métier contextualisées**. Il n’existe plus de bouton générique « Étape suivante ».

Exemples :

- **Ticket** : `Analyser le ticket` → `Prévisualiser les modifications` → `Valider et appliquer en démo`. La priorité, le groupe et le risque SLA changent réellement dans l’état simulé.
- **SLA** : `Calculer le risque SLA` → `Simuler une réassignation` → `Approuver le scénario`. Le risque passe de 91 % à 42 % dans la simulation.
- **Incident Radar** : `Injecter le pic simulé` → `Qualifier l’incident majeur` → `Promouvoir en Problem`. Un `PRB-DEMO-104` apparaît et 47 incidents sont rattachés fictivement.
- **Charge** : `Simuler le rééquilibrage` puis `Appliquer au bac à sable`. Les KPI de charge des équipes changent.
- **Connaissance** : interrogation RAG, détection de lacune puis génération d’un article `KB-DEMO-220`.
- **Actions IA** : Policy Engine → approbation humaine → Gateway démo → état `VERIFIED`.
- **Quota API** : montée de consommation → 429 simulé → `Retry-After` → reprise contrôlée.
- **Model Ops** : shadow test → release gates → promotion du challenger dans la registry simulée.
- **Self-service** : diagnostic → échec du self-service → création d’un ticket enrichi fictif.
- **Change Management** : calcul du risque → mitigation → Post Change Watch.
- **Résilience** : timeout → 5xx → circuit breaker → double-clic dédupliqué.

## Comportement de l’interface

À chaque action :

1. le bouton affiche brièvement **Simulation en cours…** ;
2. les KPI changent ;
3. le tableau métier est remplacé par le nouvel état ;
4. le statut du scénario évolue ;
5. le journal de démonstration ajoute un événement horodaté ;
6. un `correlation_id` fictif est affiché ;
7. `external_write=false` reste visible.

Le bouton **Réinitialiser** permet de rejouer immédiatement le scénario devant un interlocuteur.

## Les 16 scénarios disponibles

1. Pilotage global du Service Desk
2. Traitement intelligent d’un ticket
3. Réponse assistée à l’utilisateur
4. Prévention d’un dépassement SLA
5. Détection d’un incident émergent
6. Classement des causes probables
7. Rééquilibrage de la charge
8. Connaissance, RAG et lacunes documentaires
9. Actions IA et validation humaine
10. Gestion des quotas API et erreur 429
11. Pilotage des modèles IA
12. Commande en langage naturel
13. Self-service utilisateur final
14. Risque de changement et surveillance post-changement
15. Audit et gouvernance de bout en bout
16. Résilience : timeout, 5xx et double-clic

## Démo manager recommandée

Pour une présentation courte :

1. Traitement intelligent d’un ticket
2. Prévention SLA
3. Incident émergent
4. Actions IA & validation humaine
5. Gestion du quota API
6. Audit

Cette séquence permet de montrer le cycle complet : **observer → analyser → prédire → recommander → gouverner → simuler l’exécution → vérifier → auditer**.

## Sécurité

Le mode démo est volontairement isolé du backend d’exécution. `FRESHSERVICE_WRITE_ENABLED=false` reste la valeur sûre par défaut et aucun scénario du bac à sable ne dépend d’une clé API Freshservice.
