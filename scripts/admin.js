// JavaScript spécifique à admin.html

const STORAGE_KEY = 'techAccessData';
let currentEditId = null;
let currentPromoId = null;
let currentData = {
  products: [],
  categories: [],
  ticker: [],
  exchangeRate: 655,
  wavePaymentLink: ''
};

function initApp() {
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) toggleAdminMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') toggleAdminMenu(false);
  });
  if (!auth) return;
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await loadData();
      showAdmin();
    } else {
      showLogin();
    }
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  const pwd = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('loginError');

  try {
    await auth.signInWithEmailAndPassword(email, pwd);
    errorEl.style.display = 'none';
  } catch (error) {
    errorEl.textContent = '❌ Identifiants incorrects ou accès refusé';
    errorEl.style.display = 'block';
  }
}

function logout() {
  auth.signOut();
  currentEditId = null;
  showLogin();
}

function showLogin() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showAdmin() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'grid';
  toggleAdminMenu(false);
  document.getElementById('exchangeRate').value = currentData.exchangeRate;
  document.getElementById('wavePaymentLink').value = currentData.wavePaymentLink || '';
  updateDashboard();
  renderProducts();
  renderCategories();
  renderTicker();
  loadCategorySelect();
  updateFilterCategories();
}

function filterProducts() {
  const searchTerm = document.getElementById('productSearch').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  const filtered = currentData.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || String(p.category) === String(categoryFilter);
    return matchesSearch && matchesCategory;
  });
  renderProducts(filtered);
}

function updateFilterCategories() {
  const filterSelect = document.getElementById('filterCategory');
  const options = currentData.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  filterSelect.innerHTML = '<option value="">Toutes les catégories</option>' + options;
}

async function loadData() {
  try {
    const settings = await db.collection('settings').doc('config').get();
    if (settings.exists) {
      const d = settings.data();
      currentData.categories = d.categories || [];
      currentData.ticker = d.ticker || [];
      currentData.exchangeRate = d.exchangeRate || 655;
      currentData.wavePaymentLink = d.wavePaymentLink || currentData.wavePaymentLink;
    }
    const productsSnap = await db.collection('products').get();
    currentData.products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('📦 Produits chargés depuis le Cloud:', currentData.products.length);
  } catch (error) {
    console.error('Erreur de chargement Firebase:', error);
    showToast('❌ Erreur de connexion au Cloud', 'error');
  }
}

async function saveData() {
  try {
    const dataToSave = {
      categories: currentData.categories,
      ticker: currentData.ticker,
      exchangeRate: currentData.exchangeRate,
      wavePaymentLink: currentData.wavePaymentLink
    };
    await db.collection('settings').doc('config').set(dataToSave);
    showToast('✅ Configuration synchronisée cloud', 'success');
  } catch (e) {
    console.error('❌ Erreur sauvegarde:', e);
    showToast('❌ Erreur sync config: ' + e.message, 'error');
  }
}

function saveSettings() {
  const rate = parseFloat(document.getElementById('exchangeRate').value);
  const link = document.getElementById('wavePaymentLink').value.trim();
  if (!rate || rate <= 0) {
    showToast('⚠️ Saisissez un taux de change valide', 'error');
    return;
  }
  currentData.exchangeRate = rate;
  currentData.wavePaymentLink = link || currentData.wavePaymentLink;
  saveData();
  updateDashboard();
  renderProducts();
  showToast('✅ Paramètres enregistrés!', 'success');
}

function updateDashboard() {
  document.getElementById('statProducts').textContent = currentData.products.length;
  document.getElementById('statCategories').textContent = currentData.categories.length;
  document.getElementById('statExchange').textContent = currentData.exchangeRate;
  
  // Calcul du revenu total et préparation du graphique
  renderSalesDashboard();
}

async function renderSalesDashboard() {
  const snapshot = await db.collection('orders').orderBy('timestamp', 'asc').get();
  let totalRevenue = 0;
  const dailySales = {};

  snapshot.forEach(doc => {
    const order = doc.data();
    totalRevenue += (Number(order.total) || 0);
    
    if (order.timestamp) {
      const date = order.timestamp.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dailySales[date] = (dailySales[date] || 0) + (Number(order.total) || 0);
    }
  });

  const revenueEl = document.getElementById('statRevenue');
  if (revenueEl) revenueEl.textContent = totalRevenue.toLocaleString() + ' FCFA';

  // Rendu du graphique
  const ctx = document.getElementById('salesChart')?.getContext('2d');
  if (!ctx) return;

  if (window.revenueChart) window.revenueChart.destroy();

  const labels = Object.keys(dailySales).slice(-7); // 7 derniers jours
  const data = labels.map(l => dailySales[l]);

  window.revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ventes (FCFA)',
        data: data,
        borderColor: '#1E88E5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
        x: { grid: { display: false }, ticks: { color: '#aaa' } }
      }
    }
  });
}

function toggleAdminMenu(forceOpen) {
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.getElementById('adminSidebarOverlay');
  const toggle = document.getElementById('mobileNavToggle');
  const open = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');

  sidebar?.classList.toggle('open', open);
  overlay?.classList.toggle('show', open);
  document.body.classList.toggle('admin-menu-open', open);
  toggle?.setAttribute('aria-expanded', String(open));
}

function switchPanel(panel, button) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(panel).classList.add('active');
  if (button) button.classList.add('active');
  toggleAdminMenu(false);
  if (panel === 'sales') loadOrders();
  if (panel === 'finance') loadFinances();
  if (panel === 'inventory') loadInventory();
  if (panel === 'support') loadSupportTickets();
  if (panel === 'reports') loadReports();
  if (panel === 'promotions') loadPromotions();
}

function openProductModal(id = null) {
  currentEditId = id;
  if (id) {
    const product = currentData.products.find(p => p.id === id);
    const exchangeRate = currentData.exchangeRate || 655;
    document.getElementById('productModalTitle').textContent = 'Modifier le produit';
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = Math.round(product.price * exchangeRate);
    document.getElementById('productDesc').value = product.desc;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productRating').value = product.rating || 5;
    document.getElementById('productBadge').value = product.badge || '';
    if(document.getElementById('productStock')) document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productImagePreview').textContent = product.icon;
    if (product.image) {
      document.getElementById('productImagePreview').innerHTML = `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    }
  } else {
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productRating').value = 5;
    document.getElementById('productBadge').value = '';
    if(document.getElementById('productStock')) document.getElementById('productStock').value = 0;
    document.getElementById('productImagePreview').textContent = '📦';
  }
  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  currentEditId = null;
}

function previewProductImage() {
  const file = document.getElementById('productImage').files[0];
  if (file && file.size <= 2 * 1024 * 1024) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('productImagePreview').innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
  } else {
    showToast('❌ Image trop grande (max 2MB)', 'error');
  }
}

function saveProduct() {
  const name = document.getElementById('productName').value.trim();
  const priceFCFA = parseFloat(document.getElementById('productPrice').value);
  const exchangeRate = currentData.exchangeRate || 655;
  const category = document.getElementById('productCategory').value;
  const desc = document.getElementById('productDesc').value.trim();
  const rating = parseFloat(document.getElementById('productRating').value);
  const badge = document.getElementById('productBadge').value.trim();
  const stock = parseInt(document.getElementById('productStock')?.value || 0);
  if (!name || isNaN(priceFCFA) || !category || !desc) {
    showToast('❌ Remplissez tous les champs obligatoires', 'error');
    return;
  }
  const imagePreview = document.getElementById('productImagePreview');
  let imageData = null;
  if (imagePreview.querySelector('img')) {
    imageData = imagePreview.querySelector('img').src;
  }
  const priceBase = priceFCFA / exchangeRate;
  const categoryId = String(category).trim();
  const productData = {
    name: name,
    price: priceBase,
    category: categoryId,
    desc: desc,
    rating: rating,
    badge: badge,
    stock: stock,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (imageData) productData.image = imageData;

  if (currentEditId) {
    db.collection('products').doc(String(currentEditId)).update(productData)
      .then(() => { finishSave(); })
      .catch(err => { showToast('❌ Erreur: ' + err.message, 'error'); });
  } else {
    db.collection('products').add(productData)
      .then(() => { finishSave(); })
      .catch(err => { showToast('❌ Erreur: ' + err.message, 'error'); });
  }
}

function finishSave() {
  loadData();
  closeProductModal();
  showToast('✅ Produit enregistré dans le cloud !', 'success');
}

function deleteProduct(id) {
  if (confirm('Êtes-vous sûr?')) {
    db.collection('products').doc(id).delete().then(() => {
      loadData();
      showToast('✅ Produit supprimé!', 'success');
    }).catch(err => {
      showToast('❌ Erreur: ' + err.message, 'error');
    });
  }
}

let selectedProductIds = new Set();

function toggleSelectAll() {
  const isChecked = document.getElementById('selectAll').checked;
  const checkboxes = document.querySelectorAll('.product-checkbox');
  selectedProductIds.clear();
  checkboxes.forEach(cb => {
    cb.checked = isChecked;
    if (isChecked) selectedProductIds.add(cb.dataset.id);
  });
  updateBulkActionsUI();
}

function toggleProductSelection(id) {
  if (selectedProductIds.has(id)) selectedProductIds.delete(id);
  else selectedProductIds.add(id);
  updateBulkActionsUI();
}

function updateBulkActionsUI() {
  const btn = document.getElementById('bulkDeleteBtn');
  const count = document.getElementById('selectedCount');
  if (selectedProductIds.size > 0) {
    btn.style.display = 'block';
    count.textContent = selectedProductIds.size;
  } else {
    btn.style.display = 'none';
  }
}

function renderProducts(productsToRender = null) {
  const tbody = document.getElementById('productsTableBody');
  const products = productsToRender || currentData.products;
  tbody.innerHTML = products.map(p => {
    const price = Number(p.price) || 0;
    const exchangeRate = Number(currentData.exchangeRate) || 1;
    return `
      <tr class="${selectedProductIds.has(p.id) ? 'selected-row' : ''}">
        <td><input type="checkbox" class="product-checkbox" data-id="${p.id}" ${selectedProductIds.has(p.id) ? 'checked' : ''} onclick="toggleProductSelection('${p.id}')"></td>
        <td style="font-size: 1.5rem;">${p.image ? `<img src="${p.image}" style="width: 40px; height: 40px; border-radius: 4px;">` : p.icon || '📦'}</td>
        <td>${p.name || '—'}</td>
        <td>${p.category || 'Autre'}</td>
        <td>${(price * exchangeRate).toFixed(0)} FCFA</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="openProductModal('${p.id}')">✏️ Éditer</button>
            <button class="btn-delete" onclick="deleteProduct('${p.id}')">🗑️ Supprimer</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function bulkDelete() {
  if (!confirm(`Supprimer définitivement ces ${selectedProductIds.size} produits ?`)) return;
  try {
    const promises = Array.from(selectedProductIds).map(id => db.collection('products').doc(id).delete());
    await Promise.all(promises);
    selectedProductIds.clear();
    document.getElementById('selectAll').checked = false;
    updateBulkActionsUI();
    await loadData();
    showToast('✅ Produits supprimés avec succès', 'success');
  } catch (e) {
    showToast('❌ Erreur lors de la suppression groupée', 'error');
  }
}

function openCategoryModal(id = null) {
  currentEditId = id;
  const imageInput = document.getElementById('categoryImageFile');
  const imagePreview = document.getElementById('categoryImagePreview');
  const imageImg = document.getElementById('categoryImageImg');
  
  if (id) {
    const cat = currentData.categories.find(c => String(c.id).trim() === String(id).trim());
    document.getElementById('categoryModalTitle').textContent = 'Modifier la catégorie';
    document.getElementById('categoryName').value = cat.name;
    imageInput.value = '';
    if (cat.backgroundImage) {
      imageImg.src = cat.backgroundImage;
      imagePreview.style.display = 'block';
    } else {
      imagePreview.style.display = 'none';
    }
  } else {
    document.getElementById('categoryModalTitle').textContent = 'Ajouter une catégorie';
    document.getElementById('categoryName').value = '';
    imageInput.value = '';
    imagePreview.style.display = 'none';
  }
  
  imageInput.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        imageImg.src = event.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
  
  document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.remove('active');
  currentEditId = null;
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const imageInput = document.getElementById('categoryImageFile');
  const imagePreview = document.getElementById('categoryImagePreview');
  
  if (!name) {
    showToast('❌ Remplissez le nom de la catégorie', 'error');
    return;
  }
  
  const currentImage = imagePreview.style.display !== 'none' ? document.getElementById('categoryImageImg').src : null;
  if (!imageInput.files.length && !currentImage) {
    showToast('❌ Ajouter une image de fond', 'error');
    return;
  }
  
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const backgroundImage = event.target.result;
      saveOrUpdateCategory(name, backgroundImage);
    };
    reader.readAsDataURL(file);
  } else if (currentImage) {
    saveOrUpdateCategory(name, currentImage);
  }
}

function saveOrUpdateCategory(name, backgroundImage) {
  if (currentEditId) {
    const cat = currentData.categories.find(c => String(c.id).trim() === String(currentEditId).trim());
    cat.name = name;
    cat.backgroundImage = backgroundImage;
  } else {
    const newId = Math.max(...currentData.categories.map(c => Number(c.id) || 0), 0) + 1;
    currentData.categories.push({ id: newId, name, backgroundImage });
  }
  saveData();
  renderCategories();
  loadCategorySelect();
  closeCategoryModal();
  showToast('✅ Catégorie enregistrée!', 'success');
}

function deleteCategory(id) {
  if (confirm('Êtes-vous sûr? Les produits dans cette catégorie seront conservés.')) {
    currentData.categories = currentData.categories.filter(c => String(c.id).trim() !== String(id).trim());
    saveData();
    renderCategories();
    loadCategorySelect();
    showToast('✅ Catégorie supprimée!', 'success');
  }
}

function renderCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  tbody.innerHTML = currentData.categories.map(c => {
    const count = currentData.products.filter(p => String(p.category) === String(c.id)).length;
    const imgPreview = c.backgroundImage ? `<img src="${c.backgroundImage}" alt="${c.name}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;">` : '<span style="font-size: 1.5rem;">🖼️</span>';
    return `
      <tr>
        <td>${imgPreview}</td>
        <td>${c.name}</td>
        <td>${count}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" onclick="openCategoryModal('${c.id}')">✏️ Éditer</button>
            <button class="btn-delete" onclick="deleteCategory('${c.id}')">🗑️ Supprimer</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function loadCategorySelect() {
  const select = document.getElementById('productCategory');
  select.innerHTML = '<option value="">-- Sélectionner --</option>' + currentData.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function updateTicker() {
  const input = document.getElementById('tickerInput').value;
  if (!input.trim()) {
    showToast('❌ Entrez au moins un message', 'error');
    return;
  }
  currentData.ticker = input.split(',').map(m => m.trim()).filter(m => m);
  saveData();
  renderTicker();
  showToast('✅ Ticker mis à jour!', 'success');
}

function renderTicker() {
  document.getElementById('tickerInput').value = currentData.ticker.join(', ');
  const tbody = document.getElementById('tickerTableBody');
  tbody.innerHTML = currentData.ticker.map((msg, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${msg}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-edit" onclick="editTicker(${idx})">✏️ Éditer</button>
          <button class="btn-delete" onclick="deleteTicker(${idx})">🗑️ Supprimer</button>
        </div>
      </td>
    </tr>`).join('');
}

async function loadOrders(filter = 'all') {
  const tbody = document.getElementById('salesTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
  try {
    let query = db.collection('orders').orderBy('timestamp', 'desc');
    if (filter !== 'all') {
      const now = new Date();
      let start = new Date();
      if (filter === 'day') start.setHours(0,0,0,0);
      else if (filter === 'week') start.setDate(now.getDate() - 7);
      else if (filter === 'month') start.setMonth(now.getMonth() - 1);
      query = query.where('timestamp', '>=', start);
    }
    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    tbody.innerHTML = orders.map(order => {
      const date = order.timestamp ? order.timestamp.toDate().toLocaleDateString('fr-FR') : '—';
      const invoiceUrl = `invoice.html?id=${encodeURIComponent(order.id)}${order.orderToken ? `&token=${encodeURIComponent(order.orderToken)}` : ''}`;
      const invoiceWindowName = `invoice_${order.id}`;
      
      let statusColor = '#ffa500'; // Orange par défaut
      if (order.status === 'Payé') statusColor = '#2e7d32'; // Vert
      if (order.status === 'Annulé') statusColor = '#c62828'; // Rouge

      return `
        <tr>
          <td><div style="font-size: 0.75rem;">${date}</div><div style="font-size: 0.6rem; color: var(--mid)">ID: ${order.id.substring(0,8)}</div></td>
          <td><div style="font-weight:700">${order.customer.firstName} ${order.customer.name}</div><div style="font-size: 0.7rem;">📍 ${order.customer.quartier}</div></td>
          <td style="font-size: 0.75rem;">${order.items.map(i => `${i.qty}x ${i.name}`).join('<br>')}</td>
          <td style="font-weight:700; color:var(--accent2)">${order.total.toLocaleString()} FCFA</td>
          <td>
            <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:4px; background:${statusColor}; color:white; border:none; border-radius:4px; font-weight:bold;">
              <option value="En attente" ${order.status === 'En attente' ? 'selected' : ''}>⏳ Attente</option>
              <option value="Payé" ${order.status === 'Payé' ? 'selected' : ''}>✅ Payé</option>
              <option value="Annulé" ${order.status === 'Annulé' ? 'selected' : ''}>❌ Annulé</option>
            </select>
          </td>
          <td><div class="action-buttons">
            <button class="btn-edit" onclick="window.open('${invoiceUrl}', '${invoiceWindowName}', 'width=920,height=820')">📄 Facture</button>
            <button class="btn-delete" onclick="deleteOrder('${order.id}')">🗑️</button>
          </div></td>
        </tr>`;
    }).join('');
  } catch (e) { console.error(e); }
}

async function updateOrderStatus(id, status) {
  try { await db.collection('orders').doc(id).update({ status }); showToast('✅ Statut mis à jour'); } catch (e) { showToast('❌ Erreur', 'error'); }
}

async function deleteOrder(id) {
  if (!confirm('Supprimer cette commande ?')) return;
  try { await db.collection('orders').doc(id).delete(); loadOrders(); showToast('✅ Supprimé'); } catch (e) { showToast('❌ Erreur', 'error'); }
}

function formatFCFA(value) {
  return Number(value || 0).toLocaleString('fr-FR') + ' FCFA';
}

function loadInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  tbody.innerHTML = currentData.products.map(product => {
    const stock = Number(product.stock || 0);
    const price = Number(product.price || 0) * Number(currentData.exchangeRate || 655);
    return `
      <tr>
        <td>${product.name || '—'}</td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <input id="stockInput_${product.id}" type="number" min="0" value="${stock}" style="width:100px; padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color:#fff;">
            <button class="btn-secondary" onclick="updateProductStock('${product.id}', document.getElementById('stockInput_${product.id}').value)">MAJ</button>
          </div>
        </td>
        <td>${formatFCFA(price)}</td>
        <td>${product.category || '—'}</td>
        <td><button class="btn-edit" onclick="openProductModal('${product.id}')">✏️ Éditer</button></td>
      </tr>`;
  }).join('');
}

async function updateProductStock(id, value) {
  const stock = Number(value);
  if (isNaN(stock) || stock < 0) {
    showToast('❌ Stock invalide', 'error');
    return;
  }
  try {
    await db.collection('products').doc(id).update({ stock });
    await loadData();
    loadInventory();
    showToast('✅ Stock mis à jour !', 'success');
  } catch (e) {
    console.error('Erreur MAJ stock:', e);
    showToast('❌ Impossible de mettre à jour le stock', 'error');
  }
}

async function loadSupportTickets() {
  const tbody = document.getElementById('supportTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
  try {
    const snapshot = await db.collection('supportTickets').orderBy('timestamp', 'desc').get();
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (!tickets.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucun ticket trouvé.</td></tr>';
      return;
    }
    tbody.innerHTML = tickets.map(ticket => {
      const date = ticket.timestamp ? ticket.timestamp.toDate().toLocaleDateString('fr-FR') : '—';
      return `
        <tr>
          <td>${ticket.name || '—'}</td>
          <td>${ticket.whatsapp || '—'}</td>
          <td>${ticket.subject || '—'}</td>
          <td>${ticket.status || 'Nouveau'}</td>
          <td>${date}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" onclick="updateSupportStatus('${ticket.id}', 'En cours')">⏳</button>
              <button class="btn-edit" onclick="updateSupportStatus('${ticket.id}', 'Résolu')">✅</button>
              <button class="btn-delete" onclick="deleteSupportTicket('${ticket.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erreur chargement tickets support:', e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Erreur de chargement.</td></tr>';
  }
}

async function saveSupportTicket() {
  const name = document.getElementById('supportName').value.trim();
  const whatsapp = document.getElementById('supportWhatsApp').value.trim();
  const subject = document.getElementById('supportSubject').value.trim();
  const message = document.getElementById('supportMessage').value.trim();
  if (!name || !whatsapp || !subject || !message) {
    showToast('❌ Remplissez tous les champs du ticket', 'error');
    return;
  }
  try {
    await db.collection('supportTickets').add({
      name,
      whatsapp,
      subject,
      message,
      status: 'Nouveau',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('supportName').value = '';
    document.getElementById('supportWhatsApp').value = '';
    document.getElementById('supportSubject').value = '';
    document.getElementById('supportMessage').value = '';
    showToast('✅ Ticket créé !', 'success');
    loadSupportTickets();
  } catch (e) {
    console.error('Erreur création ticket support:', e);
    showToast('❌ Impossible de créer le ticket', 'error');
  }
}

async function updateSupportStatus(id, status) {
  try {
    await db.collection('supportTickets').doc(id).update({ status });
    loadSupportTickets();
    showToast('✅ Statut du ticket mis à jour', 'success');
  } catch (e) {
    console.error('Erreur update ticket support:', e);
    showToast('❌ Impossible de mettre à jour le ticket', 'error');
  }
}

async function deleteSupportTicket(id) {
  if (!confirm('Supprimer ce ticket de support ?')) return;
  try {
    await db.collection('supportTickets').doc(id).delete();
    loadSupportTickets();
    showToast('✅ Ticket supprimé', 'success');
  } catch (e) {
    console.error('Erreur suppression ticket support:', e);
    showToast('❌ Impossible de supprimer le ticket', 'error');
  }
}

async function loadReports() {
  const totalRevenueEl = document.getElementById('reportTotalRevenue');
  const totalOrdersEl = document.getElementById('reportTotalOrders');
  const avgOrderEl = document.getElementById('reportAvgOrder');
  const topProductEl = document.getElementById('reportTopProduct');
  const tbody = document.getElementById('reportsTopProductsBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">Chargement...</td></tr>';
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const productSales = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.name || 'Produit inconnu';
        if (!productSales[key]) productSales[key] = { qty: 0, total: 0 };
        productSales[key].qty += Number(item.qty) || 0;
        productSales[key].total += (Number(item.price) || 0) * (Number(item.qty) || 0);
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, qty: data.qty, total: data.total }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    if (totalRevenueEl) totalRevenueEl.textContent = formatFCFA(totalRevenue);
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (avgOrderEl) avgOrderEl.textContent = formatFCFA(avgOrder);
    if (topProductEl) topProductEl.textContent = topProducts[0] ? `${topProducts[0].name}` : '—';
    tbody.innerHTML = topProducts.length ? topProducts.map(product => `
      <tr>
        <td>${product.name}</td>
        <td>${product.qty}</td>
        <td>${formatFCFA(product.total)}</td>
      </tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucun produit vendu.</td></tr>';
    renderReportsChart(topProducts);
  } catch (e) {
    console.error('Erreur chargement rapports:', e);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">Erreur de chargement.</td></tr>';
  }
}

function renderReportsChart(topProducts) {
  const ctx = document.getElementById('reportsChart')?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;
  const labels = topProducts.map(p => p.name);
  const values = topProducts.map(p => p.total);
  if (window.reportsChart) window.reportsChart.destroy();
  window.reportsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Chiffre d’affaires',
        data: values,
        backgroundColor: '#1E88E5',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { display: false } },
        y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' }, beginAtZero: true }
      }
    }
  });
}

function exportReport() {
  const rows = [['Produit', 'Quantité vendue', 'Montant total']];
  const tbody = document.getElementById('reportsTopProductsBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    if (cells.length === 3) rows.push(cells);
  });
  const csvContent = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-top-produits-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

async function loadPromotions() {
  const tbody = document.getElementById('promotionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
  try {
    const snapshot = await db.collection('promotions').orderBy('createdAt', 'desc').get();
    const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (!promotions.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucune promotion.</td></tr>';
      return;
    }
    tbody.innerHTML = promotions.map(promo => {
      const expiry = promo.expiresAt ? promo.expiresAt.toDate().toLocaleDateString('fr-FR') : '—';
      return `
        <tr>
          <td>${promo.code}</td>
          <td>${promo.discount}%</td>
          <td>${promo.description || '—'}</td>
          <td>${expiry}</td>
          <td>${promo.active ? 'Oui' : 'Non'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-edit" onclick="editPromotion('${promo.id}')">✏️</button>
              <button class="btn-delete" onclick="deletePromotion('${promo.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erreur chargement promotions:', e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Erreur de chargement.</td></tr>';
  }
}

async function savePromotion() {
  const code = document.getElementById('promoCode').value.trim();
  const discount = Number(document.getElementById('promoDiscount').value);
  const description = document.getElementById('promoDescription').value.trim();
  const expiresAtValue = document.getElementById('promoExpiry').value;
  const active = document.getElementById('promoActive').checked;
  if (!code || !discount || discount <= 0) {
    showToast('❌ Code et remise valides requis', 'error');
    return;
  }
  const promoData = {
    code,
    discount,
    description,
    active,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (expiresAtValue) {
    promoData.expiresAt = firebase.firestore.Timestamp.fromDate(new Date(expiresAtValue));
  }
  try {
    if (currentPromoId) {
      await db.collection('promotions').doc(currentPromoId).update(promoData);
      currentPromoId = null;
    } else {
      await db.collection('promotions').add(promoData);
    }
    document.getElementById('promoCode').value = '';
    document.getElementById('promoDiscount').value = '';
    document.getElementById('promoDescription').value = '';
    document.getElementById('promoExpiry').value = '';
    document.getElementById('promoActive').checked = true;
    showToast('✅ Promotion enregistrée !', 'success');
    loadPromotions();
  } catch (e) {
    console.error('Erreur sauvegarde promotion:', e);
    showToast('❌ Impossible d’enregistrer la promotion', 'error');
  }
}

async function editPromotion(id) {
  try {
    const doc = await db.collection('promotions').doc(id).get();
    if (!doc.exists) return;
    const promo = doc.data();
    currentPromoId = id;
    document.getElementById('promoCode').value = promo.code || '';
    document.getElementById('promoDiscount').value = promo.discount || '';
    document.getElementById('promoDescription').value = promo.description || '';
    document.getElementById('promoExpiry').value = promo.expiresAt ? promo.expiresAt.toDate().toISOString().slice(0,10) : '';
    document.getElementById('promoActive').checked = promo.active !== false;
  } catch (e) {
    console.error('Erreur edit promotion:', e);
    showToast('❌ Impossible de charger la promotion', 'error');
  }
}

async function deletePromotion(id) {
  if (!confirm('Supprimer cette promotion ?')) return;
  try {
    await db.collection('promotions').doc(id).delete();
    showToast('✅ Promotion supprimée', 'success');
    loadPromotions();
  } catch (e) {
    console.error('Erreur suppression promotion:', e);
    showToast('❌ Impossible de supprimer la promotion', 'error');
  }
}

async function loadFinances() {
  const salesEl = document.getElementById('financeTotalSales');
  const ordersEl = document.getElementById('financeTotalOrders');
  const purchasesEl = document.getElementById('financeTotalPurchases');
  const profitEl = document.getElementById('financeProfit');
  const tbody = document.getElementById('financePurchasesBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';

  try {
    const [ordersSnap, purchasesSnap] = await Promise.all([
      db.collection('orders').orderBy('timestamp', 'desc').get(),
      db.collection('purchases').orderBy('timestamp', 'desc').get()
    ]);

    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const totalOrders = orders.length;
    const totalPurchases = purchases.reduce((sum, purchase) => sum + (Number(purchase.amount) || 0), 0);
    const profit = totalSales - totalPurchases;

    if (salesEl) salesEl.textContent = formatFCFA(totalSales);
    if (ordersEl) ordersEl.textContent = totalOrders;
    if (purchasesEl) purchasesEl.textContent = formatFCFA(totalPurchases);
    if (profitEl) profitEl.textContent = formatFCFA(profit);

    renderFinanceChart(orders, purchases);

    if (purchases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucun achat enregistré.</td></tr>';
    } else {
      tbody.innerHTML = purchases.map(purchase => {
        const date = purchase.timestamp ? purchase.timestamp.toDate().toLocaleDateString('fr-FR') : '—';
        return `
          <tr>
            <td>${date}</td>
            <td>${purchase.vendor || '—'}</td>
            <td>${purchase.category || '—'}</td>
            <td style="font-weight:700; color: var(--accent2);">${formatFCFA(purchase.amount)}</td>
            <td>${purchase.description || '—'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-delete" onclick="deletePurchase('${purchase.id}')">🗑️</button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }
  } catch (e) {
    console.error('Erreur lors du chargement des finances :', e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Erreur de chargement des finances.</td></tr>';
  }
}

function renderFinanceChart(orders, purchases) {
  const daily = {};

  orders.forEach(order => {
    if (!order.timestamp) return;
    const key = order.timestamp.toDate().toISOString().slice(0, 10);
    if (!daily[key]) daily[key] = { sales: 0, purchases: 0 };
    daily[key].sales += Number(order.total) || 0;
  });

  purchases.forEach(purchase => {
    if (!purchase.timestamp) return;
    const key = purchase.timestamp.toDate().toISOString().slice(0, 10);
    if (!daily[key]) daily[key] = { sales: 0, purchases: 0 };
    daily[key].purchases += Number(purchase.amount) || 0;
  });

  const sortedKeys = Object.keys(daily).sort();
  const labels = sortedKeys.slice(-14).map(key => {
    const [year, month, day] = key.split('-');
    return `${day}/${month}`;
  });
  const salesData = sortedKeys.slice(-14).map(key => daily[key].sales);
  const purchasesData = sortedKeys.slice(-14).map(key => daily[key].purchases);

  const ctx = document.getElementById('financeChart')?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  if (window.financeChart) window.financeChart.destroy();

  window.financeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Ventes',
          data: salesData,
          borderColor: '#1E88E5',
          backgroundColor: 'rgba(30, 136, 229, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3
        },
        {
          label: 'Achats',
          data: purchasesData,
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255, 82, 82, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } }
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { display: false } },
        y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.08)' }, beginAtZero: true }
      }
    }
  });
}

async function savePurchase() {
  const vendor = document.getElementById('purchaseVendor').value.trim();
  const amount = parseFloat(document.getElementById('purchaseAmount').value);
  const category = document.getElementById('purchaseCategory').value.trim();
  const description = document.getElementById('purchaseDescription').value.trim();

  if (!vendor || isNaN(amount) || amount <= 0) {
    showToast('❌ Fournisseur et montant valides requis', 'error');
    return;
  }

  try {
    await db.collection('purchases').add({
      vendor,
      amount,
      category,
      description,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('purchaseVendor').value = '';
    document.getElementById('purchaseAmount').value = '';
    document.getElementById('purchaseCategory').value = '';
    document.getElementById('purchaseDescription').value = '';
    showToast('✅ Achat enregistré !', 'success');
    loadFinances();
  } catch (e) {
    console.error('Erreur enregistrement achat :', e);
    showToast('❌ Impossible d’enregistrer l’achat', 'error');
  }
}

async function deletePurchase(id) {
  if (!confirm('Supprimer cet achat ?')) return;
  try {
    await db.collection('purchases').doc(id).delete();
    showToast('✅ Achat supprimé', 'success');
    loadFinances();
  } catch (e) {
    console.error('Erreur suppression achat :', e);
    showToast('❌ Impossible de supprimer', 'error');
  }
}

function editTicker(idx) {
  const currentMsg = currentData.ticker[idx];
  const newMsg = prompt("Modifier le message du ticker :", currentMsg);
  if (newMsg !== null && newMsg.trim() !== "") {
    currentData.ticker[idx] = newMsg.trim();
    saveData();
    renderTicker();
    showToast('✅ Message mis à jour !', 'success');
  }
}

function deleteTicker(idx) {
  currentData.ticker.splice(idx, 1);
  saveData();
  renderTicker();
  showToast('✅ Message supprimé!', 'success');
}

function exportData() {
  const data = JSON.stringify(currentData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tech-access-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('✅ Données exportées!', 'success');
}

function importData() {
  document.getElementById('importFile').click();
}

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (confirm('Êtes-vous sûr? Cela remplacera toutes les données actuelles.')) {
          currentData = data;
          saveData();
          showAdmin();
          showToast('✅ Données importées!', 'success');
        }
      } catch (e) {
        showToast('❌ Fichier invalide', 'error');
      }
    };
    reader.readAsText(file);
  }
});

function resetAllData() {
  if (confirm('⚠️ ATTENTION: Cela supprimera TOUS les produits et catégories!\n\nÊtes-vous vraiment sûr?')) {
    if (confirm('Dernière confirmation: Êtes-vous absolument certain?')) {
      currentData = {
        products: [],
        categories: [
          { id: 1, name: 'Powerbanks', icon: '🔋' },
          { id: 2, name: 'Coques', icon: '🛡️' },
          { id: 3, name: 'Câbles & Chargeurs', icon: '🔌' },
          { id: 4, name: 'Audio', icon: '🎧' }
        ],
        ticker: ['LIVRAISON GRATUITE dès 50€', 'ACCESSOIRES PREMIUM', 'TECH ACCESSIBLE A TOUS', 'GARANTIE 2 ANS', 'DAKAR PLATEAU', 'SUPPORT 7J/7'],
        exchangeRate: 655,
        wavePaymentLink: ''
      };
      saveData();
      showAdmin();
      showToast('✅ Données réinitialisées!', 'success');
    }
  }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

initApp();
