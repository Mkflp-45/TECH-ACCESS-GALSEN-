// JavaScript spécifique à invoice.html

function showInvoiceError(message) {
  const printButton = document.querySelector('.btn-print');
  if (printButton) printButton.style.display = 'none';
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

async function loadInvoice() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const orderToken = urlParams.get('token');

  if (!orderId) {
    showInvoiceError('Aucun identifiant de commande fourni.');
    return;
  }

  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      showInvoiceError('Commande introuvable.');
      return;
    }

    const order = doc.data();
    if (order.orderToken && order.orderToken !== orderToken) {
      showInvoiceError('Clé de facture invalide.');
      return;
    }

    const date = order.timestamp ? order.timestamp.toDate() : new Date();
    document.getElementById('invId').textContent = orderId.substring(0, 8).toUpperCase();
    document.getElementById('invDate').textContent = date.toLocaleDateString('fr-FR');
    document.getElementById('custName').textContent = `${order.customer.firstName} ${order.customer.name}`;
    document.getElementById('custQuartier').textContent = order.customer.quartier;
    document.getElementById('custTel').textContent = order.customer.whatsapp;
    document.getElementById('invStatus').textContent = order.status || 'En attente';
    document.getElementById('itemsBody').innerHTML = order.items.map(item => `
      <tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toLocaleString()} FCFA</td><td>${(item.price * item.qty).toLocaleString()} FCFA</td></tr>
    `).join('');
    document.getElementById('grandTotal').textContent = order.total.toLocaleString() + ' FCFA';
  } catch (e) {
    console.error(e);
    showInvoiceError('Erreur lors du chargement de la facture.');
  }
}

loadInvoice();
