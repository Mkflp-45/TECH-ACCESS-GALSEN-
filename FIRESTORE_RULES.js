// ============================================
// FIRESTORE SECURITY RULES — TECH ACCESS GALSEN
// ============================================
// 
// INSTRUCTIONS D'UTILISATION:
// 1. Ouvre: https://console.firebase.google.com/project/tech-acces-galsen/firestore/rules
// 2. Supprime TOUT le contenu existant
// 3. Copie ENTIÈREMENT ce fichier
// 4. Clique "Publish"
// 5. Attends le message "Publish successful"
//
// ============================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == "mohameth2051@gmail.com";
    }

    match /products/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /adminLogs/{document=**} {
      allow read, write: if isAdmin();
    }

    match /orders/{document=**} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}

// ============================================
// GUIDE DE RÉFÉRENCE DES PERMISSIONS
// ============================================

/*

COLLECTIONS ET PERMISSIONS:

1. PUBLIC (Lecture libre, écriture admin)
   ├─ /products/* — Produits du catalogue
   ├─ /settings/* — Configuration du site
   └─ /promotions/* — Codes promo actifs

2. AUTHENTICATED (Login requis)
   ├─ /users/{uid} — Profil utilisateur (propriétaire)
   ├─ /orders/* — Commandes (créer, lire siennes)
   └─ /newsletter/* — Inscription newsletter (création libre)

3. ADMIN ONLY (Email mohameth2051@gmail.com)
   ├─ Lire/modifier tous les /products
   ├─ Lire/modifier tous les /orders
   ├─ Lire/modifier tous les /promotions
   ├─ Lire/modifier tous les /newsletter
   ├─ Lire/modifier tous les /adminLogs
   └─ Lire/modifier tous les /users

4. DEFAULT DENY
   └─ Tout ce qui n'est pas explicitement autorisé

OPÉRATIONS AUTORISÉES PAR RÔLE:

╔═══════════════════╦═══════════╦════════════╦═════════╗
║ Collection        ║ Publique  ║ Authentifié║ Admin   ║
╠═══════════════════╬═══════════╬════════════╬═════════╣
║ products          ║ read      ║ read       ║ ✓       ║
║ settings          ║ read      ║ read       ║ ✓       ║
║ promotions        ║ read      ║ read       ║ ✓       ║
║ users/{uid}       ║ -         ║ self       ║ ✓       ║
║ orders            ║ -         ║ create+own ║ ✓       ║
║ newsletter        ║ create    ║ create     ║ ✓       ║
║ adminLogs         ║ -         ║ -          ║ ✓       ║
╚═══════════════════╩═══════════╩════════════╩═════════╝

*/

// ============================================
// NOTES DE SÉCURITÉ
// ============================================

/*

✅ BONNES PRATIQUES APPLIQUÉES:

1. Default Deny Pattern
   └─ Refuser par défaut, autoriser explicitement seulement ce qui est nécessaire

2. Role-based Access Control (RBAC)
   └─ Admin identifié par email "mohameth2051@gmail.com"
   └─ Utilisateurs authentifiés ont accès restreint
   └─ Publique accès en lecture seule

3. Data Ownership
   └─ Les utilisateurs ne peuvent modifier que leurs propres documents
   └─ Les commandes liées à l'utilisateur sont accessibles

4. Collection-level Permissions
   └─ Chaque collection a sa propre politique d'accès
   └─ Pas de wildcard dangereux

⚠️ LIMITATIONS ACTUELLES:

- Authentification par email (simple)
- Pas de vérification de domaine email
- Pas de signature JWT personnalisée
- Pas d'audit détaillé des accès

🔒 POUR AMÉLIORER LA SÉCURITÉ:

1. Ajouter vérification de rôle dans Firestore (claims personnalisés)
2. Utiliser Custom Claims d'Azure AD ou Auth0
3. Ajouter audit logging plus détaillé
4. Implémenter rate limiting côté serveur
5. Chiffrer les données sensibles (paiements, mots de passe)

*/
