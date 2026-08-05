# Couverture de migration Fi Fow

## Statut

Le backend actif est exclusivement le projet TypeScript présent dans `src`.
L'ancien backend se trouve dans `archive/legacy-mongoose`, hors de la
compilation et de l'exécution. Sa suppression définitive ne doit intervenir
qu'après les tests d'intégration PostgreSQL et la validation des contrats avec
le frontend.

## Principes appliqués

- PostgreSQL et Prisma remplacent MongoDB et Mongoose.
- Les identifiants métier utilisent des UUID.
- Les montants sont calculés côté serveur et stockés en `BigInt`, en GNF.
- Les changements critiques sont transactionnels et verrouillent les lignes
  concernées lorsque plusieurs requêtes peuvent entrer en concurrence.
- Les données privées, clés de stockage, hashes et secrets ne sont pas exposés.
- Les paiements, remboursements et reversements dépendent uniquement de
  webhooks signés et idempotents pour confirmer leur résultat.
- Aucun succès Orange Money ou MTN MoMo n'est simulé sans adaptateur officiel.

## Couverture par domaine

| Domaine | Couverture active | Statut |
| --- | --- | --- |
| Authentification | Inscription email, connexion, vérification email, récupération du mot de passe, rotation refresh token, détection de réutilisation, révocation globale, verrouillage après échecs | Complet |
| Utilisateurs | Profil privé/public, modification, avatar local, archivage, blocage mutuel, retrait du badge vendeur | Complet |
| Catégories | Arbre public, détail, création, modification, archivage et contrôle des catégories utilisées | Complet |
| Annonces | Brouillon, modification, publication, modération, archivage, recherche, filtres, pagination curseur, statistiques | Complet |
| Images annonces | Contrôle MIME et contenu, conversion WebP, limite, image principale, ordre, suppression et nettoyage | Complet |
| Interactions | Favoris, likes, vues dédupliquées sur 24 heures, compteurs atomiques | Complet |
| Conversations | Création unique, liste, détail, lecture, archivage, blocage utilisateur, temps réel Socket.IO | Complet |
| Messages | Texte et image, idempotence `clientId`, compteurs non lus, notifications et temps réel | Complet |
| Offres | Proposition, acceptation, refus, contre-proposition, expiration et verrouillage concurrent | Complet |
| Commandes | Devis serveur à usage unique, snapshots, création, confirmation vendeur, préparation, remise/livraison, réception, annulation et litige | Complet |
| Paiements | Initiation idempotente, montant serveur, webhook signé, événements fournisseur, réservation de l'annonce et ledger | Complet en mode MOCK |
| Remboursements | Demande admin, blocage du reversement, callback signé, remboursement partiel/complet, écritures inverses | Complet en mode MOCK |
| Reversements | Blocage initial, planification après réception, éligibilité vendeur, traitement, callback signé, ledger et notification | Complet en mode MOCK |
| Avis | Commande terminée obligatoire, participant réel, unicité, réponse vendeur et recalcul de note | Complet |
| Signalements | Cibles vérifiées, anti-doublon, priorité, auto-masquage, assignation et résolution | Complet |
| Vérification vendeur | Documents locaux contrôlés, demande, approbation, refus et retrait du badge | Complet |
| Boosts | Plans, création, paiement signé, activation, expiration, annulation et remboursement | Complet en mode MOCK |
| Notifications | Liste, lecture unitaire/globale, événements métier et Socket.IO | Complet |
| Administration | Tableau de bord, utilisateurs, produits, catégories, paiements, remboursements, reversements, avis, boosts, conversations signalées, vérifications et journaux d'audit | Complet |
| Maintenance | Expiration des offres/boosts, nettoyage des sessions et jetons, notifications | Complet |

## Remplacements volontaires de l'ancien contrat

### Authentification OTP

Les routes historiques `send-otp` et `verify-otp` ne sont pas migrées, car
l'API SMS n'est pas disponible. Elles sont remplacées par l'authentification
email et mot de passe demandée pour le raccordement actuel. Le téléphone reste
optionnel et non vérifié tant qu'un fournisseur SMS fiable n'est pas intégré.

### Statuts manuels des annonces

Les anciennes actions `mark-reserved` et `mark-sold` ne sont pas exposées.
Une annonce devient `RESERVED` uniquement après paiement confirmé et `SOLD`
uniquement après réception confirmée. Cela empêche les incohérences entre
annonce, commande et paiement.

### Signalements spécialisés

Les anciennes routes propres aux produits, utilisateurs, messages et avis sont
remplacées par `POST /api/v1/reports` avec `targetType` et `targetId`. Le service
vérifie l'accès à la cible avant d'accepter le signalement.

### Cycle de commande

Les anciennes actions génériques `reserve` et `complete` sont remplacées par
des transitions explicites: confirmation vendeur, paiement, préparation,
remise ou expédition, réception, puis fin de transaction.

## Sécurité vérifiée

- Configuration Zod stricte et secrets de 64 caractères minimum.
- Refus des secrets `CHANGE_ME` en production.
- CORS sur liste blanche, Helmet, HPP et limites de corps.
- Rate limits globaux et renforcés sur l'authentification et les webhooks.
- Bcrypt avec coût configurable borné.
- Refresh token opaque haché, rotation et révocation de famille.
- Cookies `HttpOnly`, `Secure` en production et origine de confiance.
- HMAC SHA-256 comparé en temps constant pour les webhooks financiers.
- Identifiant d'événement fournisseur unique pour l'idempotence.
- Validation du contenu réel des images avec Sharp.
- Protection contre la traversée de chemins du stockage local.
- Journal d'audit des actions administratives sensibles.

## Validation exécutée

- `npm run lint`: réussi.
- `npm test`: 11 tests réussis.
- `npm run typecheck`: réussi en mode strict.
- `npm run build`: réussi.
- `prisma validate`: réussi.
- `prisma generate`: réussi.
- Migration initiale PostgreSQL générée depuis le schéma complet.

## Blocages externes

1. La base PostgreSQL locale écoute sur `5432`, mais les identifiants déclarés
   dans `.env.example` ne correspondent pas à l'installation Windows actuelle.
   La migration n'a donc pas été appliquée afin de ne pas toucher une base avec
   des identifiants devinés.
2. Redis n'écoute pas actuellement sur `6379`. L'API sait démarrer en mode
   dégradé, mais le temps réel multi-instance nécessite Redis.
3. Orange Money et MTN MoMo nécessitent leurs SDK, clés et contrats de webhook
   officiels. `PAYMENT_ENABLED=false` doit rester la valeur par défaut.
4. Le driver email `console` convient au développement uniquement. Un driver
   transactionnel devra être ajouté avant la production.

## Conditions avant suppression de l'archive legacy

1. Appliquer la migration sur une base PostgreSQL de test vide.
2. Exécuter le seed et créer l'administrateur via les variables d'environnement.
3. Passer les scénarios d'intégration avec PostgreSQL et Redis.
4. Valider les payloads du contrat API avec le frontend.
5. Tester un cycle complet achat, paiement, livraison, avis et reversement.
6. Archiver une copie externe de l'ancien backend.
7. Retirer les scripts et dépendances exclusivement legacy.
