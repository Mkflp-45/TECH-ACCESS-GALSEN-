# 📦 Guide de Déploiement

## Architecture

Ce projet est un **site statique HTML/CSS/JS** (pas de Next.js en production).

```
TECH-ACCESS-GALSEN/
├── index.html          ✅ Page d'accueil
├── admin.html          ✅ Panel administrateur
├── invoice.html        ✅ Page de facture
├── migrate.html        ✅ Outil de migration Firestore
├── styles/             ✅ CSS global
├── scripts/            ✅ JavaScript vanilla
├── assets/             ✅ Images et ressources
└── netlify.toml        ✅ Configuration de déploiement
```

## Déploiement

### 🟢 Netlify (RECOMMANDÉ - À utiliser)

**Config** : [netlify.toml](netlify.toml)

```bash
# Deployment simple
- Connecte ton repo GitHub à Netlify
- Netlify va déployer la racine du projet automatiquement
- Aucune étape de build requise
```

**Variables d'environnement Netlify**:
1. Crée un fichier `.env.local` (non commité) avec tes credentials Firebase
2. Ou configure-les directement dans les paramètres Netlify → Environment

```
FIREBASE_API_KEY=ta_clé_ici
FIREBASE_PROJECT_ID=tech-acces-galsen
# ... voir .env.example
```

### ❌ Vercel (À ignorer)

- `vercel.json` existe mais **n'est pas utilisé** en production
- À suppression ou ignorer si tu déploies sur Netlify
- Si tu migres vers Next.js à l'avenir, réactive Vercel

## 🔐 Sécurité

### Firebase API Key exposée ❌ → SÉCURISÉE ✅

**Avant** : Clé en dur dans `firebase-config.js`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBEyZ7Lr79bRfLTyezU3lGp6QfapnFBSt4", // DANGER!
}
```

**Après** : Clé en variable d'environnement
```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, // ✅ SÉCURISÉ
}
```

### Checklist sécurité:
- ✅ `.gitignore` protège `.env` et `.env.local`
- ✅ `.env.example` fourni pour les collègues
- ✅ Clés Firebase jamais commitées
- ✅ Règles Firestore dans [FIRESTORE_RULES.md](FIRESTORE_RULES.md)

## 📝 Fichiers à nettoyer (optionnel)

Ces fichiers ne sont **pas utilisés** en production HTML/JS :

```
- nextjs-app/           → Scaffold Next.js inutilisé
- server.py            → Serveur local dev (remplacé par Live Server)
- analyze.py           → Script d'analyse
- cleanup_node_modules.py → Band-aid obsolète
- diff-session.txt     → Fichier temporaire
```

**Recommandation** : Supprime-les ou place-les dans un dossier `/archived` si tu veux les garder pour référence.

## 🚀 Déploiement rapide

```bash
# 1. Configure les secrets
cp .env.example .env.local
# Remplis .env.local avec tes vraies credentials

# 2. Teste localement
# Ouvre index.html dans Live Server (VS Code)
# Ou : python -m http.server 8000

# 3. Pousse sur GitHub
git add .
git commit -m "Sécurité: Firebase en variables d'env"
git push origin main

# 4. Netlify déploie automatiquement
# Pas d'étape de build, juste FTP des fichiers!
```

## 📚 Pour plus d'infos

- [README.md](README.md) - Documentation générale
- [FIRESTORE_RULES.md](FIRESTORE_RULES.md) - Règles de sécurité Firestore
- [.env.example](.env.example) - Variables d'environnement requises
