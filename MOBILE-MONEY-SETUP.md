# 💳 Guide d'Intégration Mobile Money

## 📋 Vue d'ensemble

Le système de paiement Wave a été **remplacé par une API Mobile Money générale** qui supporte :
- ✅ Orange Money (SN)
- ✅ Wave (SN)
- ✅ Free Money
- ✅ Autres portefeuilles mobiles compatibles

## 🔧 Configuration

### 1. Admin Panel

Connecte-toi au panel admin : [admin.html](admin.html)

1. Va à la section **Paramètres** (settings)
2. Remplis :
   - **Clé API Mobile Money** : `<VOTRE_CLE_API>`
   - **Clé Secrète Mobile Money** : `<VOTRE_CLE_SECRETE>`
3. Clique sur **💾 Enregistrer les paramètres**

Les clés sont sauvegardées dans Firestore et utilisées automatiquement pour tous les paiements.

### 2. Variables d'environnement (.env.local)

Crée un fichier `.env.local` (non commité) :

```bash
MOBILE_MONEY_API_KEY=<VOTRE_CLE_API>
MOBILE_MONEY_SECRET_KEY=<VOTRE_CLE_SECRETE>
```

Utilisation :
```javascript
// main.js charge depuis le .env
adminData.mobileMoneyApiKey = process.env.MOBILE_MONEY_API_KEY
adminData.mobileMoneySecretKey = process.env.MOBILE_MONEY_SECRET_KEY
```

## 🔄 Flux de paiement

### Avant (Wave uniquement)
```
Utilisateur → Panier → Lien Wave → Paiement Wave
```

### Après (API Mobile Money)
```
Utilisateur 
  → Panier 
  → Sélectionne "Mobile Money (Orange Money, Wave, etc.)"
  → Saisit ses infos
  → Validation & Enregistrement commande
  → Appel API Mobile Money
  → Redirection vers gateway de paiement
  → Retour après paiement
```

## 🔑 Détails API Mobile Money

### Endpoint
```
POST https://api.mobile-money.io/payment/initiate
```

### Headers requis
```
Content-Type: application/json
X-API-Key: {MOBILE_MONEY_API_KEY}
X-API-Secret: {MOBILE_MONEY_SECRET_KEY}
```

### Payload d'initiation
```javascript
{
  "amount": 50000,                    // FCFA
  "currency": "XOF",
  "orderId": "ORDER-UUID",
  "customerName": "Amadou Diop",
  "customerPhone": "+221771234567",
  "description": "Commande TECH-ACCESS",
  "returnUrl": "https://tech-access.sn/",
  "notifyUrl": "https://tech-access.sn/api/webhook/payment"
}
```

### Réponse réussie
```json
{
  "status": "success",
  "paymentUrl": "https://checkout.mobile-money.io/UUID",
  "checkoutId": "CHK-12345",
  "expiresAt": "2026-06-11T15:00:00Z"
}
```

## 📝 Implémentation côté client ([scripts/main.js](scripts/main.js))

### Fonction principale : `initiateMobileMoneyPayment(orderData)`

```javascript
async function initiateMobileMoneyPayment(orderData) {
  // 1. Convertir montant en FCFA
  const amountFCFA = Math.round(orderData.total * adminData.exchangeRate);
  
  // 2. Créer payload
  const paymentPayload = {
    amount: amountFCFA,
    currency: 'XOF',
    orderId: orderData.orderToken,
    customerName: `${orderData.customer.firstName} ${orderData.customer.name}`,
    customerPhone: orderData.customer.whatsapp,
    description: `Commande TECH-ACCESS #${orderData.orderToken}`,
    returnUrl: window.location.href,
    notifyUrl: '/api/webhook/payment'
  };
  
  // 3. Appeler API avec authentification
  const response = await fetch('https://api.mobile-money.io/payment/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': adminData.mobileMoneyApiKey,
      'X-API-Secret': adminData.mobileMoneySecretKey
    },
    body: JSON.stringify(paymentPayload)
  });
  
  // 4. Rediriger vers checkout
  const result = await response.json();
  window.location.href = result.paymentUrl;
}
```

## 🎨 UI Changements

### Avant
```
[ ○ Wave ] [ ○ Espèces ]
```

### Après
```
[ ○ Mobile Money (Orange Money, Wave, etc.) ] [ ○ Espèces ]
```

## 📊 Firestore - Collection `settings`

Nouvel objet de configuration :

```firestore
settings/config/
  ├── exchangeRate: 655
  ├── mobileMoneyApiKey: "cf75768..."
  ├── mobileMoneySecretKey: "673d49..."
  ├── categories: [...]
  ├── ticker: [...]
  └── products: [...]
```

## ✅ Checklist d'intégration

- ✅ Remplacer Wave par Mobile Money API dans `main.js`
- ✅ Ajouter fonctions d'authentification API (`initiateMobileMoneyPayment`)
- ✅ Mettre à jour `admin.html` (inputs clés API)
- ✅ Mettre à jour `admin.js` (gestion des clés)
- ✅ Mettre à jour `index.html` (radio buttons → "Mobile Money")
- ✅ Ajouter clés à `.env.example`
- ✅ Firestore sauvegarde les clés automatiquement

## 🧪 Test

### En local (admin panel)

1. Ouvre [admin.html](admin.html)
2. Remplis les clés API Mobile Money
3. Clique **Enregistrer**
4. Ouvre [index.html](index.html)
5. Ajoute des produits au panier
6. Clique **Commander**
7. Sélectionne "Mobile Money"
8. Remplis infos client
9. Valide → **Redirection vers paiement**

### Dans Firestore

Vérifier que la configuration est sauvegardée :
1. Firebase Console → Firestore
2. Collection `settings` → Document `config`
3. Vérifier les champs `mobileMoneyApiKey` et `mobileMoneySecretKey`

## 🔒 Sécurité

- ✅ Clés API **jamais commitées** (`.env.local` ignoré)
- ✅ Clés stockées en variables d'env ou admin panel
- ✅ Communication **HTTPS uniquement** (API)
- ⚠️ À faire : Webhook côté serveur pour confirmer paiement

## 🔗 Webhook (TODO côté serveur)

Pour une intégration complète, créer un endpoint :

```javascript
// /api/webhook/payment (Node.js/Express exemple)
app.post('/api/webhook/payment', (req, res) => {
  const { orderId, status, transactionId } = req.body;
  
  // Vérifier la signature
  if (!verifySignature(req.body, MOBILE_MONEY_SECRET_KEY)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  // Mettre à jour le statut de la commande
  if (status === 'success') {
    db.collection('orders').doc(orderId).update({
      status: 'Payé',
      transactionId: transactionId,
      paidAt: new Date()
    });
  }
  
  res.json({ success: true });
});
```

## 📚 Fichiers modifiés

- [scripts/main.js](scripts/main.js) - Logique paiement
- [scripts/admin.js](scripts/admin.js) - Gestion config
- [admin.html](admin.html) - UI admin
- [index.html](index.html) - Radio buttons
- [.env.example](.env.example) - Variables

## ❓ FAQ

**Q: Puis-je garder Wave?**  
A: Wave est maintenant supporté via l'API Mobile Money (utilise la même passerelle).

**Q: Comment changer les clés?**  
A: Admin panel → Paramètres → Remplis nouvelles clés → Enregistre.

**Q: Le paiement en espèces marche toujours?**  
A: Oui, aucun changement (alternative à Mobile Money).

**Q: Où voir les transactions?**  
A: Dashboard admin → Commandes → Vérifier le champ `paymentMethod`.

**Q: Comment tester le paiement?**  
A: Utiliser l'environnement de test de l'API Mobile Money (mentionner si supporté).
