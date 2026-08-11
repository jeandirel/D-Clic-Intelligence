# 10 — Glossary

## API
Une porte officielle permettant à deux logiciels de communiquer.

**Comme si j’ai 5 ans :** une fenêtre où D-Clic peut demander quelque chose à Freshservice.

## REST API
Une façon standard de faire des demandes à un service web avec des opérations comme GET, POST, PUT et DELETE.

## MCP
Model Context Protocol. Une manière standardisée d’exposer des outils et données à des systèmes IA.

**Simple :** une boîte à outils que l’IA peut découvrir et utiliser avec des règles.

## LLM
Large Language Model.

**Simple :** le moteur qui sait comprendre et générer du langage.

## ML
Machine Learning.

**Simple :** un modèle qui apprend des exemples pour faire une prédiction.

## NLP
Natural Language Processing.

Traitement informatique du texte et du langage.

## Embedding
Représentation numérique d’un texte.

**Simple :** transformer une phrase en coordonnées pour mesurer si deux phrases se ressemblent.

## Vector DB
Base optimisée pour rechercher des embeddings similaires.

## RAG
Retrieval-Augmented Generation.

Le système cherche d’abord des documents pertinents, puis demande au LLM de répondre avec ce contexte.

## GraphRAG
RAG utilisant aussi un graphe de relations.

## Knowledge Graph
Réseau de choses et de liens.

Exemple :
Ticket → Asset → Service → Change.

## SLA
Engagement de délai/qualité.

## SLA breach
Violation d’un SLA.

## MTTR
Mean Time To Resolution.

Temps moyen de résolution.

## MTTA
Mean Time To Acknowledge/Assign selon convention.

## FCR
First Contact Resolution.

Résolution dès le premier contact.

## ITSM
IT Service Management.

Gestion des services informatiques.

## Incident
Interruption ou dégradation d’un service.

## Problem
Cause ou ensemble de causes derrière un ou plusieurs incidents.

## Change
Modification planifiée d’un système/service.

## Asset
Équipement ou ressource gérée.

## CMDB
Base des éléments de configuration et de leurs relations.

## Gateway
Porte unique entre D-Clic et Freshservice.

## Rate limit
Nombre maximal d’appels autorisés dans une fenêtre de temps.

## 429
Code HTTP indiquant que trop de requêtes ont été envoyées.

## Retry
Réessayer une opération.

## Backoff
Attendre de plus en plus longtemps avant de réessayer.

## Circuit breaker
Couper temporairement les appels vers un service en difficulté pour éviter d’aggraver la panne.

## Cache
Copie temporaire d’une donnée pour éviter de la redemander.

## ODS
Operational Data Store.

Base locale opérationnelle servant aux calculs rapides.

## Queue
File d’attente de tâches.

## Idempotence
Faire deux fois la même commande ne doit pas produire deux effets non voulus.

## RBAC
Role-Based Access Control.

Droits basés sur le rôle.

## ABAC
Attribute-Based Access Control.

Droits basés sur davantage de contexte.

## Policy Engine
Moteur qui décide si une action est autorisée.

## Human-in-the-loop
Un humain doit intervenir avant certaines actions.

## Confidence score
Estimation de confiance du modèle.

Attention : ce n’est pas une garantie.

## Calibration
Vérifier que 80 % de confiance correspond réellement à environ 80 % de réussite dans les cas comparables.

## Drift
Changement des données ou du métier qui peut rendre un modèle moins bon.

## Shadow mode
Le modèle fait ses prédictions sans influencer la production.

## Champion/Challenger
Comparer le modèle actuel à un candidat.

## Feature
Variable utilisée par un modèle.

## Model Registry
Catalogue des versions de modèles.

## MLOps
Pratiques pour entraîner, versionner, déployer et monitorer les modèles ML.

## LLMOps
Même idée appliquée aux applications utilisant des LLM.

## Observability
Capacité à comprendre l’état d’un système grâce aux logs, métriques et traces.

## Audit trail
Historique permettant de savoir qui a fait quoi, quand et pourquoi.

## Rollback
Revenir à l’état précédent.

## Digital Twin
Modèle numérique servant à simuler le comportement d’un système.

## Decision Intelligence
Utiliser données, modèles et règles pour aider à choisir entre plusieurs actions.
