// JavaScript spécifique à admin.html

const STORAGE_KEY = 'techAccessData';
let currentEditId = null;
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
      return `
        <tr>
          <td><div style="font-size: 0.75rem;">${date}</div><div style="font-size: 0.6rem; color: var(--mid)">ID: ${order.id.substring(0,8)}</div></td>
          <td><div style="font-weight:700">${order.customer.firstName} ${order.customer.name}</div><div style="font-size: 0.7rem;">📍 ${order.customer.quartier}</div></td>
          <td style="font-size: 0.75rem;">${order.items.map(i => `${i.qty}x ${i.name}`).join('<br>')}</td>
          <td style="font-weight:700; color:var(--accent2)">${order.total.toLocaleString()} FCFA</td>
          <td>
            <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:4px; background:var(--black); color:white; border:1px solid var(--mid);">
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
