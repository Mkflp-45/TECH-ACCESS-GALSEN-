// JavaScript spécifique à invoice.html

function showInvoiceError(message) {
  const buttons = document.querySelectorAll('.invoice-actions button');
  buttons.forEach(btn => btn.style.display = 'none');
  const invoiceCard = document.querySelector('.invoice-card');
  if (invoiceCard) {
    invoiceCard.innerHTML = `
      <div style="padding: 60px; text-align: center;">
        <h1 style="font-family: 'Bebas Neue', sans-serif; color: #c62828;">Accès refusé</h1>
        <p style="font-family: 'Space Mono', monospace; color: #444;">${message}</p>
      </div>
    `;
  }
}

function cleanWhatsappNumber(raw) {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 8 || digits.length === 9) digits = '221' + digits;
  if (digits.length === 9 && raw.trim().startsWith('7')) digits = '221' + digits;
  return digits;
}

function getInvoiceUrl() {
  return window.location.href;
}

function shareInvoiceWhatsApp() {
  const phone = document.getElementById('custTel').textContent.trim();
  const cleanNumber = cleanWhatsappNumber(phone);
  const invoiceUrl = getInvoiceUrl();
  const text = `Bonjour, voici la facture de votre commande TECH ACCESS : ${invoiceUrl}`;
  if (!cleanNumber) {
    alert('Aucun numéro WhatsApp valide trouvé pour le client.');
    return;
  }
  window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

function copyInvoiceLink() {
  const invoiceUrl = getInvoiceUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(invoiceUrl).then(() => {
      alert('Lien de la facture copié dans le presse-papier.');
    }).catch(() => {
      prompt('Copiez le lien de la facture :', invoiceUrl);
    });
  } else {
    prompt('Copiez le lien de la facture :', invoiceUrl);
  }
}

async function loadInvoice() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    showInvoiceError('Aucun identifiant de commande fourni.');
    return;
  }

  try {
    if (!window.db) {
      showInvoiceError('Firebase non initialisé.');
      return;
    }
    const doc = await window.db.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      showInvoiceError('Commande introuvable.');
      return;
    }

    const order = doc.data();
    const date = order.timestamp ? order.timestamp.toDate() : new Date();
    document.getElementById('invId').textContent = orderId.substring(0, 8).toUpperCase();
    document.getElementById('invDate').textContent = date.toLocaleDateString('fr-FR');
    document.getElementById('custName').textContent = `${order.customer.firstName} ${order.customer.name}`;
    document.getElementById('custQuartier').textContent = order.customer.quartier;
    document.getElementById('custTel').textContent = order.customer.whatsapp;
    document.getElementById('invStatus').textContent = order.status || 'En attente';
    document.getElementById('invPaymentMethod').textContent = order.paymentMethod ? order.paymentMethod : 'Non précisé';
    document.getElementById('itemsBody').innerHTML = order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 14px 8px; font-weight: 600; color: #111;">${item.name}</td><td style="text-align:center;">${item.qty}</td><td>${item.price.toLocaleString()} FCFA</td><td style="font-weight: 700; color: #0D47A1; text-align:right;">${(item.price * item.qty).toLocaleString()} FCFA</td></tr>
    `).join('');
    document.getElementById('grandTotal').textContent = order.total.toLocaleString() + ' FCFA';
  } catch (e) {
    console.error(e);
    showInvoiceError('Erreur lors du chargement de la facture.');
  }
}

function initInvoicePage() {
  if (!auth) {
    showInvoiceError('Firebase non initialisé.');
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (!user) {
      showInvoiceError('Veuillez vous connecter en admin pour afficher cette facture.');
      return;
    }
    loadInvoice();
  });
}

initInvoicePage();
