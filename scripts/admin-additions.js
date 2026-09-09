// ==================== ADMIN ENHANCEMENTS ====================

let adminLogsDisabled = false;

// ==================== ACTIVITY LOGS ====================
async function logAdminActivity(action, details = '') {
  try {
    if (adminLogsDisabled) return;
    if (!window.db || !window.auth) {
      console.warn('Firebase not yet initialized for logging activity');
      return;
    }
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    await window.db.collection('adminLogs').add({
      adminEmail: user.email,
      action: action,
      details: details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch (e) {
    const message = String(e?.message || '');
    if (message.includes('Missing or insufficient permissions')) {
      adminLogsDisabled = true;
      return;
    }
    if (!message.includes('Missing or insufficient permissions')) {
      console.error('Erreur log activité:', e);
    }
  }
}

// ==================== ADVANCED DASHBOARD KPIs ====================
async function loadAdvancedDashboardKPIs() {
  try {
    if (!window.db) {
      console.warn('Firestore not yet initialized');
      return;
    }
    const ordersSnap = await window.db.collection('orders').get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Conversion Rate
    const visitorsEstimate = localStorage.getItem('techAccessVisitors') || '0';
    const conversionRate = visitorsEstimate > 0 ? ((orders.length / visitorsEstimate) * 100).toFixed(2) : '0';
    
    // Revenue trend (today vs yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayRevenue = orders.filter(o => o.timestamp && o.timestamp.toDate() >= today).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const yesterdayRevenue = orders.filter(o => o.timestamp && o.timestamp.toDate() >= yesterday && o.timestamp.toDate() < today).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const revenueTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : '0';
    
    // Customer metrics
    const whatsapps = orders.map(o => o.customer?.whatsapp).filter(Boolean);
    const uniqueCustomers = new Set(whatsapps).size;
    const returningCustomers = whatsapps.reduce((acc, w, idx, arr) => {
      return acc + (arr.indexOf(w) !== idx ? 1 : 0);
    }, 0);

    // Display KPIs (guard DOM elements)
    const convEl = document.getElementById('dashboardConversionRate');
    const revTrendEl = document.getElementById('dashboardRevenueTrend');
    const uniqueEl = document.getElementById('dashboardUniqueCustomers');
    const returningEl = document.getElementById('dashboardReturningCustomers');
    if (convEl) convEl.textContent = conversionRate + '%';
    if (revTrendEl) revTrendEl.textContent = revenueTrend + '%';
    if (uniqueEl) uniqueEl.textContent = String(uniqueCustomers);
    if (returningEl) returningEl.textContent = String(returningCustomers);
    
    logAdminActivity('VIEW_DASHBOARD', 'Dashboard KPIs viewed');
  } catch (e) {
    console.error('Erreur KPIs avancés:', e);
  }
}

// ==================== REAL-TIME ORDER ALERTS ====================
function initRealTimeOrderAlerts() {
  if (!window.db) {
    console.warn('Firestore not yet initialized for order alerts');
    return;
  }
  window.db.collection('orders').orderBy('timestamp', 'desc').limit(1)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const order = change.doc.data();
          const customerName = order.customer?.firstName || 'Client';
          showNotification(`🚀 Nouvelle commande de ${customerName}!`, `Total: ${order.total} FCFA`, 'success');
          logAdminActivity('NEW_ORDER', order.id);
          
          // Play sound alert if enabled
          playOrderAlert();
        }
      });
    });
}

function playOrderAlert() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1976d2'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    font-weight: 600;
    min-width: 300px;
  `;
  notification.textContent = title + ' — ' + message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 5000);
}

// ==================== CUSTOMER STATISTICS ====================
async function loadCustomerStatistics() {
  try {
    if (!window.db) {
      console.warn('⚠️ Firestore not yet initialized for customer statistics');
      return;
    }
    const ordersSnap = await window.db.collection('orders').get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const customerMap = {};
    orders.forEach(order => {
      const whatsapp = order.customer?.whatsapp;
      if (!customerMap[whatsapp]) {
        customerMap[whatsapp] = {
          name: order.customer?.firstName + ' ' + order.customer?.name,
          whatsapp: whatsapp,
          purchases: 0,
          totalSpent: 0,
          lastOrder: order.timestamp
        };
      }
      customerMap[whatsapp].purchases += 1;
      customerMap[whatsapp].totalSpent += Number(order.total) || 0;
      if (order.timestamp && (!customerMap[whatsapp].lastOrder || order.timestamp.toMillis() > customerMap[whatsapp].lastOrder.toMillis())) {
        customerMap[whatsapp].lastOrder = order.timestamp;
      }
    });
    
    const topCustomers = Object.values(customerMap)
      .filter(c => c.whatsapp)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return topCustomers;
  } catch (e) {
    console.error('Erreur statistiques clients:', e);
  }
}

// ==================== PANEL CLIENTS (rendu) ====================
async function loadCustomersPanel() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';

  const customers = await loadCustomerStatistics();

  if (!customers || customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucun client trouvé.</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const lastOrderStr = c.lastOrder ? c.lastOrder.toDate().toLocaleDateString('fr-FR') : '—';
    // whatsapp est déjà garanti "sûr" par la validation regex au checkout
    // (chiffres uniquement), donc pas besoin de l'échapper pour l'attribut
    // onclick. Le NOM en revanche est du texte libre saisi par le client :
    // on ne le passe jamais dans un attribut onclick (une simple apostrophe
    // suffirait à injecter du JS). On le récupère via un lookup à la place.
    return `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.whatsapp)}</td>
        <td>${c.purchases}</td>
        <td>${formatFCFA(c.totalSpent)}</td>
        <td>${lastOrderStr}</td>
        <td style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-secondary" style="padding:6px 10px; font-size:0.7rem;" onclick="viewCustomerHistory('${c.whatsapp}')">📋 Historique</button>
          <button class="btn-secondary" style="padding:6px 10px; font-size:0.7rem;" onclick="contactCustomerWhatsApp('${c.whatsapp}', this)">💬 Contacter</button>
        </td>
      </tr>`;
  }).join('');
}

// ==================== CUSTOMER HISTORY ====================
async function viewCustomerHistory(whatsapp) {
  try {
    if (!window.db) {
      console.error('❌ Firestore not initialized');
      return;
    }
    const orders = await window.db.collection('orders').where('customer.whatsapp', '==', whatsapp).orderBy('timestamp', 'desc').get();
    const ordersList = orders.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    showCustomerHistoryModal(whatsapp, ordersList);
    return ordersList;
  } catch (e) {
    console.error('Erreur historique client:', e);
    showToast('❌ Erreur lors du chargement de l\'historique', 'error');
  }
}

function showCustomerHistoryModal(whatsapp, ordersList) {
  const modal = document.createElement('div');
  modal.className = 'product-detail-modal';
  modal.onclick = (e) => e.target === modal && modal.remove();

  const rows = ordersList.length === 0
    ? '<tr><td colspan="4" style="text-align:center; padding:16px;">Aucune commande trouvée.</td></tr>'
    : ordersList.map(order => {
        const dateStr = order.timestamp ? order.timestamp.toDate().toLocaleDateString('fr-FR') : '—';
        return `
          <tr>
            <td>${dateStr}</td>
            <td>${formatFCFA(order.total || 0)}</td>
            <td>${order.status || '—'}</td>
            <td><a href="invoice.html?id=${order.id}" target="_blank" style="color: var(--accent2);">Voir facture</a></td>
          </tr>`;
      }).join('');

  modal.innerHTML = `
    <div class="modal-content" style="position:relative; border-radius:16px; padding:40px; max-width:700px; max-height:80vh; overflow-y:auto;">
      <button style="position:absolute; top:20px; right:20px; background:none; border:none; color:#fff; font-size:24px; cursor:pointer;" onclick="this.closest('.product-detail-modal').remove()">✕</button>
      <h2 style="font-size:1.5rem; margin-bottom:4px;">Historique — ${whatsapp}</h2>
      <p style="opacity:0.7; margin-bottom:20px;">${ordersList.length} commande(s)</p>
      <div class="table-container">
        <table>
          <thead><tr><th>Date</th><th>Total</th><th>Statut</th><th>Facture</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== CONTACT WHATSAPP (lien wa.me, sans configuration requise) ====================
function contactCustomerWhatsApp(whatsapp, buttonEl) {
  let digits = String(whatsapp || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9 || digits.length === 8) digits = '221' + digits;
  if (!digits) {
    showToast('❌ Numéro WhatsApp invalide', 'error');
    return;
  }
  // Le nom est récupéré via le DOM (textContent = toujours du texte brut, ne
  // peut jamais injecter de code), jamais transmis via un attribut onclick.
  let name = '';
  if (buttonEl) {
    const row = buttonEl.closest('tr');
    if (row && row.firstElementChild) name = row.firstElementChild.textContent.trim();
  }
  const message = `Bonjour ${name}, ici TECH ACCESS. `;
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
  logAdminActivity('WHATSAPP_CONTACT', whatsapp);
}

// Note : voir/exporter une facture se fait via le bouton "📄 Facture" du
// tableau des ventes, ou "Voir facture" dans l'historique client — les deux
// ouvrent invoice.html?id=..., qui permet d'imprimer en PDF via le navigateur.


// ==================== IMAGE MANAGEMENT ====================
function initImageUpload() {
  const productImageInput = document.getElementById('productImage');
  if (productImageInput) {
    productImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Compress and convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize to max 500px
          let width = img.width;
          let height = img.height;
          if (width > height && width > 500) {
            height = (height * 500) / width;
            width = 500;
          } else if (height > 500) {
            width = (width * 500) / height;
            height = 500;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          document.getElementById('productImagePreview').innerHTML = `<img src="${compressedBase64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

// ==================== CSV IMPORT ====================
function initCSVImport() {
  const importBtn = document.createElement('button');
  importBtn.className = 'btn-secondary';
  importBtn.textContent = '📤 Importer produits (CSV)';
  importBtn.onclick = () => document.getElementById('csvImportFile').click();
  
  const fileInput = document.createElement('input');
  fileInput.id = 'csvImportFile';
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.style.display = 'none';
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      const product = {};
      headers.forEach((h, idx) => {
        product[h.trim().toLowerCase()] = values[idx]?.trim();
      });
      
      if (product.name && product.price) {
        products.push({
          name: product.name,
          price: parseFloat(product.price) / (currentData.exchangeRate || 655),
          category: product.category || 'Autre',
          desc: product.desc || '',
          stock: parseInt(product.stock) || 0,
          icon: product.icon || '📦'
        });
      }
    }
    
    // Save all products
    let saved = 0;
    for (const prod of products) {
      try {
        if (!window.db) {
          console.error('❌ Firestore not initialized for product import');
          break;
        }
        await window.db.collection('products').add({
          ...prod,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        saved++;
      } catch (e) {
        console.error('Erreur import produit:', e);
      }
    }
    
    showToast(`✅ ${saved}/${products.length} produits importés`, 'success');
    logAdminActivity('CSV_IMPORT', `${saved} products imported`);
    loadData();
  });
  
  document.body.appendChild(fileInput);
  return importBtn;
}

// ==================== PROMO SCHEDULING ====================
async function scheduledPromoCheck() {
  try {
    if (!window.db) {
      console.warn('⚠️ Firestore not yet initialized for promo scheduling');
      return;
    }
    const now = new Date();
    const promos = await window.db.collection('promotions').get();
    
    promos.forEach(doc => {
      const promo = doc.data();
      const startDate = promo.startDate?.toDate();
      const endDate = promo.expiresAt?.toDate();
      
      // Auto-activate
      if (startDate && startDate <= now && promo.active === false) {
        window.db.collection('promotions').doc(doc.id).update({ active: true });
        logAdminActivity('AUTO_PROMO_ACTIVATE', doc.id);
      }
      
      // Auto-deactivate
      if (endDate && endDate <= now && promo.active === true) {
        window.db.collection('promotions').doc(doc.id).update({ active: false });
        logAdminActivity('AUTO_PROMO_DEACTIVATE', doc.id);
      }
    });
  } catch (e) {
    console.error('Erreur vérification promos:', e);
  }
}

// ==================== INITIALIZATION ====================
function initAdminEnhancements() {
  // Wait for Firebase to be properly initialized
  if (!window.db || !window.auth) {
    console.warn('Firebase still initializing, retrying in 500ms...');
    setTimeout(initAdminEnhancements, 500);
    return;
  }
  
  // KPIs avancés
  setTimeout(() => {
    loadAdvancedDashboardKPIs();
    setInterval(loadAdvancedDashboardKPIs, 60000);
  }, 1000);
  
  // Alertes temps réel
  initRealTimeOrderAlerts();
  
  // Vérification promos planifiées
  if (typeof scheduledPromoCheck === 'function') {
    scheduledPromoCheck();
    setInterval(scheduledPromoCheck, 3600000);
  }
  
  // Gestion images
  if (typeof initImageUpload === 'function') {
    initImageUpload();
  }
  
  logAdminActivity('ADMIN_LOGIN', 'Admin panel opened');
}

// Start initialization after a small delay to ensure Firebase is loaded
setTimeout(initAdminEnhancements, 500);
