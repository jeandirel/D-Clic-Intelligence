# 00 — Start Here : comprendre D-Clic Intelligence en 10 minutes

## 1. Le problème que nous voulons résoudre

Dans une entreprise, beaucoup de personnes utilisent Freshservice en même temps.

Un utilisateur crée un ticket.  
Un agent le lit.  
Un autre agent cherche une solution.  
Un manager surveille les SLA.  
Un administrateur configure des workflows.  
Une équipe Data construit un modèle de classification.  
Une autre équipe construit un chatbot.  
Un autre projet veut résumer les tickets.  
Chacun peut avoir besoin de lire ou modifier des données Freshservice.

Si chaque projet travaille seul, plusieurs problèmes apparaissent :

- les mêmes données sont lues plusieurs fois ;
- les quotas API sont consommés inutilement ;
- personne n’a une vision globale ;
- les règles d’automatisation se contredisent ;
- les modèles IA ne sont pas gouvernés de la même façon ;
- une action automatique peut être difficile à expliquer ;
- une clé API peut se retrouver dans trop de services ;
- il devient difficile de savoir « qui a modifié quoi et pourquoi ».

D-Clic Intelligence crée **un point central de compréhension, de décision et d’action**.

---

## 2. Une image très simple

Freshservice = **le cahier officiel**.

D-Clic Intelligence = **l’assistant intelligent qui lit le cahier, réfléchit et propose quoi écrire dedans**.

Le cahier garde toujours la version officielle.

L’assistant n’écrit jamais sans permission.

---

## 3. Exemple concret : 47 tickets VPN

### Sans D-Clic Intelligence

47 utilisateurs créent 47 tickets.

Les agents ouvrent les tickets un par un.

Certains les affectent au groupe Réseau.  
D’autres au Support.  
Certains mettent « High ».  
D’autres « Medium ».

Après un moment, quelqu’un remarque peut-être qu’il existe un incident global.

### Avec D-Clic Intelligence

Le système observe l’arrivée des tickets.

Il calcule leurs similarités.

Il détecte une hausse anormale du thème « VPN ».

Il vérifie les changements récents.

Il découvre qu’un changement réseau a eu lieu à 08:30.

Il affiche :

> 47 incidents similaires détectés depuis 09:10.  
> 39 semblent liés au VPN.  
> 34 sont apparus après le changement CHG-1234.  
> Probabilité de cause commune : 88 %.  
> Recommandation : créer un Problem, rattacher les tickets et alerter l’équipe Réseau.

Le manager clique **Appliquer**.

Le Policy Engine vérifie que ce manager a le droit.

Le Freshservice Gateway effectue les appels.

D-Clic Intelligence relit Freshservice pour vérifier que les modifications ont réussi.

L’audit enregistre :

- qui a demandé l’action ;
- ce que l’IA avait recommandé ;
- le score de confiance ;
- la règle appliquée ;
- les appels Freshservice ;
- le résultat.

---

## 4. Les neuf étapes mentales du système

### 4.1 Observer
« Que se passe-t-il ? »

### 4.2 Comprendre
« De quoi parlent les tickets ? »

### 4.3 Prédire
« Que risque-t-il de se passer ? »

### 4.4 Détecter
« Y a-t-il quelque chose d’anormal ? »

### 4.5 Recommander
« Quelle est la meilleure action ? »

### 4.6 Simuler
« Si on fait cette action, quel résultat pouvons-nous attendre ? »

### 4.7 Autoriser
« Cette action est-elle permise ? Faut-il un humain ? »

### 4.8 Exécuter et vérifier
« Fais l’action, puis vérifie qu’elle est réellement appliquée. »

### 4.9 Apprendre
« La recommandation était-elle bonne ? »

---

## 5. Pourquoi il ne faut pas commencer par un chatbot

Un chatbot est seulement **une interface**.

Le cerveau réel est derrière :

- données ;
- modèles ML ;
- recherche sémantique ;
- règles ;
- graphe de relations ;
- moteur de recommandation ;
- orchestrateur ;
- moteur de policy ;
- Gateway Freshservice ;
- audit ;
- monitoring.

On peut remplacer demain la fenêtre de chat par :

- une barre de commande ;
- un dashboard ;
- une extension navigateur ;
- une interface dans Teams ;
- une application mobile.

Le cœur du système reste le même.

---

## 6. Ce que doit voir un agent

L’agent ne doit pas avoir à comprendre « embeddings », « gradient boosting » ou « RAG ».

Il doit voir :

> Ticket #18492  
> Sujet : VPN après changement de mot de passe  
> Risque SLA : 91 %  
> 17 incidents similaires  
> Solution probable : réinitialisation du cache VPN  
> Confiance : 86 %  
> Article KB : KB-291  
>
> Actions proposées :
> - Catégorie : Accès / VPN
> - Groupe : Workplace
> - Priorité : High
> - Réponse préparée
>
> [Appliquer les actions] [Modifier] [Refuser]

C’est simple pour l’utilisateur, même si le moteur derrière est complexe.

---

## 7. Ce que doit voir un manager

> 1 284 tickets ouverts  
> 74 SLA à risque  
> 19 violations probables dans les 4h  
> 3 clusters d’incidents émergents  
> 5 agents en surcharge  
> 8 recommandations d’optimisation

Le manager doit pouvoir demander :

> « Pourquoi 19 SLA sont à risque ? »

Puis :

> « Que se passe-t-il si je réaffecte les tickets simples ? »

Puis :

> « Prépare la réaffectation. »

---

## 8. Ce que doit voir un admin

L’admin gère le système lui-même :

- consommation Freshservice API ;
- erreurs 429 ;
- cache ;
- backlog d’actions ;
- fournisseurs LLM ;
- coûts ;
- latences ;
- modèles ;
- version de modèles ;
- drift ;
- permissions ;
- politiques ;
- automatisations actives ;
- taux d’acceptation ;
- rollback ;
- incidents techniques.

---

## 9. Règle la plus importante

> **Une IA utile ne doit pas seulement être intelligente. Elle doit être contrôlable, observable et explicable.**

D-Clic Intelligence doit toujours pouvoir répondre à :

1. Qu’ai-je observé ?
2. Qu’ai-je compris ?
3. Quelle prédiction ai-je faite ?
4. Sur quelles données ?
5. Avec quelle confiance ?
6. Quelle action ai-je recommandée ?
7. Qui l’a autorisée ?
8. Qu’ai-je envoyé à Freshservice ?
9. Freshservice a-t-il confirmé ?
10. Quel a été le résultat réel ?

---

## 10. Résumé en une phrase

**D-Clic Intelligence est le cerveau gouverné placé entre les humains, les systèmes IA et Freshservice pour transformer les données du Service Desk en décisions et actions utiles.**
