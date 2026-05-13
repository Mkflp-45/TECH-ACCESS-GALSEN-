# TECH ACCESS — Site statique

Ce projet est un site statique prêt pour un déploiement sur Netlify sans backend.

## Déploiement

- Sur Netlify, il suffit de connecter ton dépôt Git ou déposer les fichiers.
- Le dossier racine `TECH-ACCESS-GALSEN` contient `index.html`, `admin.html`, `migrate.html` et `logo.svg`.
- Il n’y a pas besoin de Node.js ni d’API serveur pour le paiement Wave.

## Paiement Wave

- Le paiement Wave est géré avec un lien de redirection simple.
- Ouvre `index.html` et remplace la constante `wavePaymentLink` par ton lien de paiement Wave direct.
- Lors du clic sur « Commander », l’utilisateur est redirigé vers Wave.

## Firebase

- Ce projet utilise Firebase Firestore pour synchroniser les produits.
- Pour un déploiement en production, configure les règles Firestore de façon adaptée à ton usage.
- Si tu veux migrer tes produits locaux vers Firestore, ouvre `migrate.html` et lance la migration.

## Note

- Si tu veux conserver une option carte bancaire, cela nécessite une intégration serveur supplémentaire.
- Netlify sert le site statique, Firebase gère les données partagées entre appareils.
