# 🧹 Nettoyage du Projet

Depuis que tu as choisi de rester en **HTML/JS statique**, certains fichiers ne sont plus utiles.

## Fichiers à supprimer (recommandé)

### 🔴 Obligatoires

```
node_modules/                  ← Déjà supprimé ✅
```

### 🟠 Fortement recommandés

Ces fichiers ne sont **jamais utilisés** et créent juste de la confusion :

```
server.py                      ← Serveur dev Python (remplacé par Live Server)
analyze.py                     ← Script d'analyse ad hoc
cleanup_node_modules.py        ← Band-aid pour un problème résolu
diff-session.txt               ← Fichier temporaire de session
```

**Pourquoi?**
- `server.py` : Tu peux utiliser VS Code Live Server ou `python -m http.server`
- `analyze.py` : Script ponctuel d'analyse (plus de valeur à long terme)
- `cleanup_node_modules.py` : Était un workaround pour nettoyer les dépendances (résolu)
- `diff-session.txt` : Fichier temporaire oublié dans le repo

**Commande pour les supprimer :**
```bash
rm server.py analyze.py cleanup_node_modules.py diff-session.txt
```

### 🟡 Optionnel : Next.js

Tu peux garder ou supprimer `nextjs-app/` :

**Garder si** : Tu envisages de migrer vers Next.js un jour
```bash
# Laisse nextjs-app/ mais ignorer ses dépendances dans le build
# Il faudrait ajuster netlify.toml à ce moment
```

**Supprimer si** : Tu es sûr que tu restes sur HTML/JS à long terme
```bash
rm -r nextjs-app/
```

---

## Fichiers à GARDER ✅

```
/ 
├── index.html              ✅ Page d'accueil
├── admin.html              ✅ Admin panel
├── invoice.html            ✅ Page de facture
├── migrate.html            ✅ Outil migration Firestore
├── firebase-config.js      ✅ Config Firebase (maintenant sécurisée!)
├── netlify.toml            ✅ Deploy config
├── .env.example            ✅ Variables d'env template
├── .gitignore              ✅ Protection des secrets
├── DEPLOYMENT.md           ✅ Guide de déploiement
├── README.md               ✅ Docs générales
├── FIRESTORE_RULES.md      ✅ Règles de sécurité
│
├── assets/                 ✅ Images et ressources
├── scripts/                ✅ JS vanilla du site
├── styles/                 ✅ CSS du site
└── vercel.json             ⚠️  Optionnel (peut être supprimé si tu utilises que Netlify)
```

---

## 📝 Aide-mémoire: Sécurité ✅

- ✅ **Firebase API Key** : Maintenant en `.env` (jamais en public)
- ✅ **.gitignore** : Protège `.env` et `node_modules/`
- ✅ **.env.example** : Template pour les collègues
- ✅ **Déploiement** : Clair via `netlify.toml`

---

## Prochaines étapes

1. **Optionnel** : Nettoie les fichiers orphelins listés ci-dessus
2. **Créer `.env.local`** :
   ```bash
   cp .env.example .env.local
   # Remplis avec tes vraies credentials Firebase
   ```
3. **Tester localement** :
   ```bash
   # VS Code: File → Open with Live Server
   # Ou: python -m http.server 8000
   ```
4. **Déployer** : 
   ```bash
   git add .
   git commit -m "Security: Firebase en env vars + nettoyage"
   git push
   # Netlify se déclenche automatiquement
   ```
