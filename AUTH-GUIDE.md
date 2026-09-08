# 🔐 Guide d'Authentification Utilisateur

## 📋 Vue d'ensemble

Les utilisateurs peuvent maintenant :
- ✅ S'inscrire avec un compte
- ✅ Se connecter/déconnecter
- ✅ Consulter leur espace client (compte, fidélité, commandes)
- ✅ Générer un code de parrainage
- ✅ Voir l'historique de leurs commandes

## 🔧 Intégration technique

### Fichiers ajoutés/modifiés

| Fichier | Changement | Description |
|---------|----------|-------------|
| [scripts/auth.js](scripts/auth.js) | **CRÉÉ** | 550+ lignes - Gestion complète authentification |
| [index.html](index.html) | **MODIFIÉ** | Ajout `<script src="scripts/auth.js" defer>` |

### Architecture

```javascript
// Variables globales (auth.js)
let currentUser = null;        // Objet utilisateur Firebase
let userProfile = null;        // Données Firestore du user

// Points d'entrée (appelés depuis HTML)
openAuthModal()                // Ouvre la modal login/register
closeAuthModal()               // Ferme la modal
toggleAuthMode('login'|'register')  // Bascule les formulaires
toggleAccountDashboard()       // Ouvre/ferme l'espace client
handleLogin(event)             // Connexion
handleRegister(event)          // Inscription
handleLogout()                 // Déconnexion

// Utilitaires
updateAuthUI(isLoggedIn)       // Met à jour les boutons (Connexion vs Compte)
updateAccountUI(profile)       // Affiche le profil dans le dashboard
```

## 🔑 Données Firestore

### Collection `users`

Structure du document utilisateur :

```firestore
users/
  ├── {uid}/
  │   ├── uid: string
  │   ├── email: string
  │   ├── firstName: string
  │   ├── lastName: string
  │   ├── phone: string
  │   ├── quartier: string
  │   ├── createdAt: timestamp
  │   ├── loyaltyPoints: number
  │   ├── totalSpent: number
  │   ├── orderCount: number
  │   ├── tierLevel: string ("Bronze", "Argent", "Or", "Premium")
  │   ├── referralCode: string
  │   └── referredBy: string (uid du parrain)
```

## 📱 Flux utilisateur

### 1️⃣ Inscription

```
Index → Bouton "Connexion" 
     → Modal s'ouvre en mode LOGIN
     → Clic "S'inscrire"
     → Basculer en mode REGISTER
     → Remplir formulaire
     → Validation client-side
     → Création compte Firebase
     → Création doc Firestore
     → Auto-connexion
     → Modal ferme, espace client affiche
```

**Validation effectuée** :
- ✅ Tous les champs requis
- ✅ Passwords correspondent
- ✅ Password ≥ 6 caractères
- ✅ Email format valide
- ✅ Téléphone ≥ 8 chiffres
- ✅ Pas de doublon email (Firebase)

### 2️⃣ Connexion

```
Index → Bouton "Connexion"
     → Modal LOGIN
     → Email + Password
     → Clic "Se connecter"
     → Authentification Firebase
     → Chargement du profil Firestore
     → UI mise à jour (Connexion → Compte)
     → Fermeture modal
     → Historique commandes chargé
```

### 3️⃣ Session persistante

Au chargement de la page :
```javascript
// auth.onAuthStateChanged() écoute les changements
// Si l'utilisateur était connecté (token valide):
//   → Charger le profil Firestore
//   → Afficher "Compte" au lieu de "Connexion"
//   → Charger l'historique des commandes
```

### 4️⃣ Espace Client

Affiche :
- 💎 Carte de fidélité (points, palier, progression)
- 📜 Historique des commandes
- 🤝 Code de parrainage unique
- 👤 Infos utilisateur (email, téléphone, quartier)
- 🚪 Bouton déconnexion

## 🎁 Fidélité intégrée

Quand un utilisateur passe commande (`handleCheckout()` dans main.js) :

```javascript
// Après confirmation paiement Wave
if (currentUser) {  // Si connecté
  await updateUserLoyalty(orderTotal);
  // +1 point pour 1000 FCFA (ex: 25€ = 25 points)
}
```

Les paliers :
- 🥉 **Bronze** : 0-250 pts
- 🥈 **Argent** : 251-750 pts (Livraison gratuite)
- 🥇 **Or** : 751-1500 pts (Réduction 10%)
- 👑 **Premium** : 1501+ pts (Réduction 15%)

## 📝 Codes de parrainage

Chaque utilisateur reçoit un code unique :
```
TECH-{HASH4}{RANDOM4}
Exemple: TECH-LS7KXQMN
```

**Bonus** : 500 points si ami utilise le code lors de l'inscription

## ⚙️ Configuration requise

### Firestore Rules

À ajouter dans [FIRESTORE_RULES.md](FIRESTORE_RULES.md) :

```firestore
// Autoriser lecture/écriture du propre profil
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
  allow create: if request.auth.uid != null;
}
```

### Variables d'environnement

Aucune variable env requise pour auth.js (Firebase API key déjà en `.env`).

## 🧪 Test en local

```bash
# 1. Ouvrir index.html dans Live Server
# (VS Code: File → Open with Live Server)

# 2. Cliquer sur "Connexion"
# 3. Cliquer sur "S'inscrire"
# 4. Remplir le formulaire
# 5. Voir le compte créé dans Firebase Console:
#    https://console.firebase.google.com → Firestore → users

# 6. Actualiser la page
# → Rester connecté (session persistante)

# 7. Cliquer sur bouton "Compte"
# → Affiche le dashboard
```

## 🐛 Débogage

### Console du navigateur (F12)

```javascript
// Vérifier l'utilisateur connecté
console.log(currentUser);
console.log(userProfile);

// Tester une fonction
handleLogin({ preventDefault: () => {} });
openAuthModal();
```

### Firebase Console

1. https://console.firebase.google.com/project/tech-acces-galsen
2. **Authentication** → Vérifier les users créés
3. **Firestore** → Vérifier la collection `users`
4. **Rules** → Voir les permissions

## 🚀 Déploiement

Pas d'étapes supplémentaires :
- ✅ auth.js inclus dans index.html
- ✅ Firebase auth déjà activé
- ✅ Firestore rules à mettre à jour (voir ci-dessus)

```bash
git add scripts/auth.js index.html
git commit -m "feat: Authentification utilisateur complète"
git push
# Netlify déploie automatiquement
```

## 📚 Lien aux autres fonctionnalités

| Fonctionnalité | Interaction |
|---|---|
| **Panier** | Préservé en localStorage (même si non connecté) |
| **Commandes** | Associées au `userId` dans Firestore |
| **Fidélité** | Calculée après chaque commande si connecté |
| **Admin** | Voir les commandes des users (séparé) |
| **Newsletter** | Email capturé lors de la commande |

## ❓ FAQ

**Q: Et si l'utilisateur ferme le navigateur?**  
A: Il reste connecté (Firebase gère les tokens). Actualiser = pas d'impact.

**Q: Les mots de passe sont sécurisés?**  
A: Firebase chiffre automatiquement. Jamais stocké en clair.

**Q: Puis-je editer le profil après l'inscription?**  
A: Pas d'interface UI pour l'instant. À ajouter si besoin.

**Q: Password reset (oubli)?**  
A: À implémenter. Prévoir `sendPasswordResetEmail(email)`.

**Q: Données RGPD/Sénégal?**  
A: À gérer dans admin → logique suppression compte.
