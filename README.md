# TECH ACCESS — Site statique

Ce projet est un site statique prêt pour un déploiement sur Vercel sans backend.

## Déploiement

- Sur Vercel, il suffit de déployer le dossier `TECH-ACCESS-GALSEN` en tant que site statique.
- Il n’y a pas besoin de Node.js ni d’API serveur pour le paiement Wave.

## Paiement Wave

- Le paiement Wave est géré avec un lien de redirection simple.
- Ouvre `index.html` et remplace la constante `wavePaymentLink` par ton lien de paiement Wave direct.
- Lors du clic sur « Commander », l’utilisateur est redirigé vers Wave.

## Note

- Si tu veux conserver une option carte bancaire, cela nécessite une intégration serveur supplémentaire.
- Pour une publication sur Vercel, tu peux déployer tel quel : `index.html`, `admin.html`, `logo.svg` et les ressources associées.
