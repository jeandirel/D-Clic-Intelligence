# 14 — Mode démonstration : workflows de bout en bout

## Objectif

Le mode démonstration permet de présenter la vision complète de D-Clic Intelligence sans connecter ni modifier le Freshservice de production.

**Règle absolue de la démo :** toutes les données, prédictions, actions, appels API, validations et traces affichés par `/demo` sont simulés côté interface. Le mode démo n’effectue aucune écriture Freshservice.

## Accès

- URL : `/demo`
- Entrée visible dans la barre latérale : **Lancer la démonstration**
- Badge permanent : **DÉMO · DONNÉES SIMULÉES**

## Fonctionnement

Pour chaque scénario :

1. sélectionner le workflow ;
2. cliquer **Démarrer ce workflow** ;
3. avancer avec **Étape suivante** ;
4. expliquer l’acteur, l’action, le résultat et la preuve affichés ;
5. ouvrir l’écran métier correspondant si nécessaire ;
6. cliquer **Réinitialiser** pour rejouer le scénario.

Chaque étape génère un identifiant de corrélation fictif de la forme :

```text
correlation_id=demo-<workflow>-<step>
external_write=false
status=SIMULATED | VERIFIED
```

## Workflows couverts

1. Pilotage global du Service Desk
2. Traitement intelligent d’un ticket
3. Réponse assistée à l’utilisateur
4. Prévention d’un dépassement SLA
5. Détection d’un incident émergent
6. Classement des causes probables
7. Rééquilibrage de la charge des équipes
8. Connaissance, RAG et lacunes documentaires
9. Actions IA et validation humaine
10. Gestion des quotas API et erreur 429
11. Pilotage des modèles IA
12. Commande en langage naturel
13. Self-service utilisateur final
14. Risque de changement et surveillance post-changement
15. Audit et gouvernance de bout en bout
16. Résilience : timeout, 5xx et double-clic

## Ce que la démonstration doit faire comprendre

### Freshservice reste la source de vérité
D-Clic ne remplace pas Freshservice. Il analyse, anticipe, recommande, gouverne et orchestre autour de Freshservice.

### L’IA ne possède pas les permissions
Un score de confiance élevé ne donne jamais le droit d’exécuter une action. Les permissions relèvent du Policy Engine et de la validation humaine quand elle est requise.

### Le Gateway protège Freshservice
Le Gateway centralise quota, retry, 429, idempotence, vérification et audit.

### Chaque décision est explicable au niveau métier
La présentation ne doit pas exposer une chaîne de pensée de modèle. Elle montre les données d’entrée utiles, les facteurs métier, la décision structurée et la preuve/audit.

## Ordre recommandé pour une démonstration à un manager

### Démo courte — 7 à 10 minutes

1. Pilotage global
2. Traitement intelligent d’un ticket
3. Prévention SLA
4. Incident émergent
5. Actions IA & validation humaine
6. Contrôle quota API
7. Audit

### Démo complète — atelier produit

Parcourir les 16 workflows et ouvrir l’écran métier après chaque scénario.

## Validation

Le mode démonstration est considéré comme fonctionnel si :

- les 16 scénarios sont sélectionnables ;
- chaque scénario peut être démarré, avancé et réinitialisé ;
- chaque étape affiche acteur, action, résultat et preuve ;
- le lien vers l’écran métier fonctionne ;
- aucune étape n’appelle le backend Freshservice ;
- le build Next.js réussit ;
- les protections backend existantes restent inchangées.
