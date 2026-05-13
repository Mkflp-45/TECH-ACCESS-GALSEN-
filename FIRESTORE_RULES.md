# Configuration des règles Firestore

## 🔐 Règles Firestore pour production

Tu utilises Firebase en production, donc il faut une configuration qui autorise la synchronisation tout en préparant un passage à plus de sécurité.

### **Étape 1 : Accéder aux règles Firestore**

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionne ton projet `TECH-ACCESS-GALSEN`
3. Clique sur **"Firestore Database"**
4. Onglet **"Règles"**

### **Étape 2 : Remplacer les règles par celles-ci**

Pour que l’application puisse lire et écrire les produits sans authentification :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### **Étape 3 : Publier les règles**

Clique sur **"Publier"** (bouton bleu en bas à droite)

---

## ✅ Ce que cela permet

- ✅ Lecture des produits depuis tous les appareils
- ✅ Écriture des produits depuis ton interface admin
- ✅ Synchronisation partagée entre appareils

---

## ⚠️ Important pour la production

Ces règles sont **très ouvertes**. Si tu veux sécuriser le projet plus tard :

- active l’authentification Firebase
- n’autorise l’écriture que pour un compte admin
- conserve `allow read: if true;` si tu veux un catalogue public

Exemple de règles plus sûres lorsque tu ajoutes l’authentification :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 🧪 Vérifier la synchronisation

1. Ouvre `admin.html` et modifie un produit.
2. Ouvre `index.html` sur un autre appareil ou un autre navigateur.
3. Actualise : les données doivent être identiques.

Si ça ne marche pas, vérifie la console du navigateur pour des erreurs Firebase.
