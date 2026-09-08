# 💙 Paiement — Wave uniquement

## Vue d'ensemble

Le site accepte deux modes de paiement :
1. **Wave** — redirection vers un lien marchand Wave public, montant pré-rempli
2. **Espèces** — paiement à la livraison

Il n'y a **aucune clé API, aucun secret, aucun backend** à gérer pour le paiement Wave : c'est un simple lien public.

## Comment ça marche

Dans `scripts/main.js` :

```js
const WAVE_PAYMENT_LINK = 'https://pay.wave.com/m/M_sn_Bg4an4f38jXi/c/sn';

function redirectToWavePayment(orderData) {
  const amountFCFA = Math.round(orderData.total * adminData.exchangeRate);
  window.location.href = `${WAVE_PAYMENT_LINK}?amount=${amountFCFA}`;
}
```

Quand le client choisit "Wave" au checkout :
1. La commande est enregistrée dans Firestore (`orders`) avec le statut `En attente - paiement en cours`
2. Le client est redirigé vers `https://pay.wave.com/m/M_sn_Bg4an4f38jXi/c/sn?amount=<montant>`
3. Il confirme le paiement directement dans l'app Wave

## ⚠️ Limite importante à connaître

Ce lien Wave ne notifie **pas automatiquement** ton site quand un paiement est effectué (pas de webhook). Concrètement :
- La commande apparaît dans l'admin panel avec le statut "En attente - paiement en cours" dès la redirection, **que le client paie réellement ou non**.
- Il faut donc vérifier manuellement dans ton app Wave marchand (ou ton relevé) que le paiement correspondant a bien été reçu avant d'expédier la commande.

Si le volume de commandes grandit et que cette vérification manuelle devient lourde, les options seraient :
- Passer à un compte Wave Business avec API (webhooks disponibles)
- Utiliser un agrégateur de paiement sénégalais (PayTech, InTouch, etc.) qui gère lui-même les notifications

## Pour changer le lien Wave

Si tu changes de compte marchand Wave, mets à jour uniquement la constante `WAVE_PAYMENT_LINK` en haut de `scripts/main.js` — c'est le seul endroit où elle est définie.
