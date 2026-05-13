# Configuration des Règles Firestore

## 🔐 Règles de sécurité Firestore

Les données ne se synchronisent pas entre appareils parce que les **règles de sécurité** par défaut (mode test) sont restrictives.

### **Étape 1 : Accéder aux Règles Firestore**

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionne ton projet `TECH-ACCESS-GALSEN`
3. Clique sur **"Firestore Database"**
4. Onglet **"Règles"**

### **Étape 2 : Remplacer les règles par celles-ci**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for 'products' collection (public)
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

## ✅ Après publication des règles

- ✅ Tous les utilisateurs peuvent **lire** les produits
- ✅ Tous les utilisateurs peuvent **modifier** les produits
- ✅ **Synchronisation en temps réel** activée !

---

## ⚠️ IMPORTANT : Sécurité en production

Ces règles sont **publiques** pour le développement. Pour la **production**, utilise :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products are public (read-only)
    match /products/{document=**} {
      allow read: if true;
      allow write: if false;  // Modification seulement en admin
    }
    
    // Admin can write to products
    match /products/{document=**} {
      allow write: if request.auth.uid == 'YOUR_ADMIN_UID';
    }
  }
}
```

---

## 🧪 Test de synchronisation

1. **Ouvre** `index.html` sur **Appareil 1**
2. **Ouvre** `index.html` sur **Appareil 2** (ou navigateur différent)
3. **Ouvre** `admin.html` → ajoute/modifie un produit
4. **Regarde** → les changements apparaissent instantanément sur les deux appareils ! 🚀

---

## 🐛 Déboguer

Si ça ne fonctionne pas :

1. **Ouvre la console du navigateur** (`F12`)
2. Cherche les **erreurs Firebase** (permission denied, etc.)
3. **Vérifie** que les produits sont bien dans Firestore Console
4. **Vérifie** que les règles sont publiées (pas en brouillon)

---

## 📝 Notes

- Les règles prennent ~5-10 secondes à se publier
- La synchronisation en temps réel est **automatique** une fois les règles correctes
- Tu peux tester sur plusieurs onglets du navigateur simultanément
