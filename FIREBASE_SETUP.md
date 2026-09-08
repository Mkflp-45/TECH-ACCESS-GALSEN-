# 🔧 GUIDE DE CONFIGURATION - FIREBASE API

## ❌ PROBLÈME ACTUEL

L'erreur `Firebase: Error (auth/invalid-api-key)` signifie que **ta clé API Firebase est vide ou invalide**.

## ✅ SOLUTION RAPIDE EN 3 ÉTAPES

### **Étape 1️⃣ : Récupère tes clés Firebase**

1. Va sur: https://console.firebase.google.com/project/tech-acces-galsen/settings/general
2. Tu verras une section "Web apps" ou "Configuration"
3. Copie **TOUTES ces valeurs** :
   - ✅ API Key (commence par `AIzaSy...`)
   - ✅ App ID (format `1:586222995096:web:...`)
   - ✅ Measurement ID (optionnel, commence par `G-...`)

### **Étape 2️⃣ : Remplis le fichier .env.local**

Ouvre le fichier `.env.local` à la racine du projet et remplace les `xxx` par tes vraies clés :

```env
FIREBASE_API_KEY=AIzaSyDvoXAxxxxxxxxxxxxxxxxxxxxx     # ← REMPLACE PAR TA VRAIE CLÉ
FIREBASE_APP_ID=1:586222995096:web:xxxxxxxxxx        # ← REMPLACE PAR TON APP ID
FIREBASE_MEASUREMENT_ID=G-XXXXXXX                     # ← Optionnel
```

### **Étape 3️⃣ : Génère la configuration**

Ouvre un terminal à la racine du projet et exécute :

```bash
node setup-firebase.js
```

Cela va automatiquement générer `firebase-config.js` avec tes vraies clés.

---

## 🔐 FIREBASE RULES (VÉRIFICATION)

Tes règles Firestore sont correctement configurées:
- ✅ Lecture publique pour products et settings
- ✅ Écriture restreinte aux admins
- ✅ Email admin: `mohameth2051@gmail.com` ← **À VÉRIFIER**

⚠️ **Important**: Dans Firebase Auth, assure-toi que l'utilisateur `mohameth2051@gmail.com` existe!

---

## 🚀 VÉRIFICATION FINALE

Après avoir complété les étapes:

1. Ouvre la DevTools (F12)
2. Va dans l'onglet Console
3. Tu devrais voir: ✅ Firebase Config Loaded
4. Pas d'erreur `invalid-api-key`

---

## ❓ AIDE SUPPLÉMENTAIRE

### Si tu ne trouves pas tes clés Firebase:

1. Accès Firebase Console: https://console.firebase.google.com
2. Sélectionne le projet: `tech-acces-galsen`
3. Settings (icône engrenage) → General
4. Scroll jusqu'à "Your apps"
5. Clique sur la section "Web" (</> icon)

### Si tu as une erreur "Project not found":

- Demande l'accès à firebase.google.com avec ton email
- Le propriétaire du projet t'a peut-être invité

### Si le setup-firebase.js ne fonctionne pas:

Remplis `firebase-config.js` directement:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDvoXAxxxxxxxxxxxxxxxxxxxxx",  // Remplace par ta vraie clé
  authDomain: "tech-acces-galsen.firebaseapp.com",
  projectId: "tech-acces-galsen",
  storageBucket: "tech-acces-galsen.firebasestorage.app",
  messagingSenderId: "586222995096",
  appId: "1:586222995096:web:xxxxxxxxxxxxxxxx",  // Remplace par ton app ID
  measurementId: "G-XXXXXXX"  // Optionnel
};
```

---

✉️ **Quand tu as tes clés, envoie-les (en privé/sécurisé) et je vais finaliser la configuration!**
