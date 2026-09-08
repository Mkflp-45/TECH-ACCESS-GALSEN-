// Fonction serverless Netlify — s'exécute côté serveur, jamais dans le navigateur.
// Les clés MOBILE_MONEY_API_KEY / MOBILE_MONEY_SECRET_KEY sont lues depuis les
// variables d'environnement du site Netlify (Site settings > Environment variables),
// PAS depuis un fichier commité. Le navigateur ne voit jamais ces clés.
//
// ⚠️ IMPORTANT : l'URL ci-dessous (api.mobile-money.io) est un PLACEHOLDER.
// Ce n'est pas un vrai fournisseur enregistré au Sénégal. Avant mise en prod,
// remplace-la par la vraie API de ton opérateur (Wave Business, Orange Money API,
// ou un agrégateur comme PayTech/InTouch) et adapte le payload au format qu'il exige.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Méthode non autorisée' }) };
  }

  const apiKey = process.env.MOBILE_MONEY_API_KEY;
  const secretKey = process.env.MOBILE_MONEY_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.error('Clés Mobile Money manquantes dans les variables d\'environnement Netlify');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Configuration serveur incomplète' })
    };
  }

  let orderData;
  try {
    orderData = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Corps de requête invalide' }) };
  }

  // Validation minimale des champs attendus
  const required = ['amount', 'orderId', 'customerName', 'customerPhone'];
  const missing = required.filter(field => !orderData[field]);
  if (missing.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Champs manquants: ${missing.join(', ')}` })
    };
  }

  const paymentPayload = {
    amount: orderData.amount,
    currency: 'XOF',
    orderId: orderData.orderId,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    description: orderData.description || `Commande ${orderData.orderId}`,
    returnUrl: orderData.returnUrl,
    notifyUrl: orderData.notifyUrl
  };

  try {
    const response = await fetch('https://api.mobile-money.io/payment/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': secretKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: result.message || 'Erreur du fournisseur de paiement' })
      };
    }

    // On ne renvoie au navigateur QUE ce dont il a besoin pour rediriger le client,
    // jamais les clés.
    return {
      statusCode: 200,
      body: JSON.stringify({
        paymentUrl: result.paymentUrl || null,
        checkoutId: result.checkoutId || null
      })
    };
  } catch (error) {
    console.error('Erreur appel fournisseur Mobile Money:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ message: 'Impossible de contacter le fournisseur de paiement' })
    };
  }
};
