# VOLT Wave Backend

Backend Node.js pour le paiement Wave de la page `volt.html`.

## Installation

1. Copier `.env.example` en `.env`
2. Ajouter `WAVE_API_KEY` dans le fichier `.env`
3. Installer les dépendances :

```bash
npm install
```

## Lancer le serveur

```bash
npm start
```

Le backend tourne ensuite sur `http://localhost:3000`.

## API

- `POST /api/wave`
  - `items`: tableau des produits
  - `total`: montant total (nombre)
  - `currency`: devise, par exemple `EUR`

Le frontend de `volt.html` est configuré pour envoyer la requête à `http://localhost:3000/api/wave`.

## Notes

- Remplace `WAVE_API_URL` dans `.env` si ton endpoint Wave est différent.
- Ce backend est un exemple de base. Pour une intégration réelle, adapte le format du payload selon la documentation Wave.
