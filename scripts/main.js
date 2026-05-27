// JavaScript spécifique à index.html

// Detect if mobile
const isMobile = () => window.innerWidth <= 768;

// Admin data sync
let adminData = {
  products: [],
  categories: [
    { id: 1, name: 'Powerbanks', backgroundImage: 'https://via.placeholder.com/200?text=Powerbanks' },
    { id: 2, name: 'Coques', backgroundImage: 'https://via.placeholder.com/200?text=Coques' },
    { id: 3, name: 'Câbles & Chargeurs', backgroundImage: 'https://via.placeholder.com/200?text=Câbles' },
    { id: 4, name: 'Audio', backgroundImage: 'https://via.placeholder.com/200?text=Audio' }
  ],
  ticker: ['LIVRAISON GRATUITE dès 50€', 'ACCESSOIRES PREMIUM', 'TECH ACCESSIBLE A TOUS', 'GARANTIE 2 ANS', 'DAKAR PLATEAU', 'SUPPORT 7J/7'],
  exchangeRate: 655,
  wavePaymentLink: 'https://pay.wave.com/m/M_sn_Bg4an4f38jXi/c/sn/'
};

// Fallback local products for a fully dynamic vanilla site even when Firestore is unreachable
adminData.products = [
  {
    id: 'p1',
    name: 'Powerbank 20 000mAh',
    price: 24.9,
    category: 1,
    desc: 'Charge rapide pour smartphone et tablette.',
    icon: '🔋',
    badge: 'Nouveau'
  },
  {
    id: 'p2',
    name: 'Coque anti-choc',
    price: 9.5,
    category: 2,
    desc: 'Protection renforcée pour écran et coins.',
    icon: '🛡️'
  },
  {
    id: 'p3',
    name: 'Câble USB-C 2m',
    price: 5.2,
    category: 3,
    desc: 'Câble tressé résistant, compatible charge rapide.',
    icon: '🔌'
  },
  {
    id: 'p4',
    name: 'Écouteurs Bluetooth',
    price: 19.9,
    category: 4,
    desc: 'Son clair avec réduction de bruit passive.',
    icon: '🎧',
    badge: 'Best-seller'
  }
];

async function loadAllDataFromFirestore() {
  try {
    console.log('📥 Initialisation des données...');
    const settingsDoc = await db.collection('settings').doc('config').get();
    if (settingsDoc.exists) {
      const settings = settingsDoc.data();
      console.log('🔍 Données brutes de Firestore (settings/config):', settings);
      adminData.categories = Array.isArray(settings.categories) ? settings.categories : adminData.categories;
      adminData.ticker = Array.isArray(settings.ticker) ? settings.ticker : adminData.ticker;
      adminData.exchangeRate = settings.exchangeRate || 655;
      adminData.wavePaymentLink = settings.wavePaymentLink || adminData.wavePaymentLink;
      console.log('✅ Catégories chargées dans adminData:', adminData.categories);
    } else {
      console.warn('⚠️ Document settings/config n\'existe pas dans Firestore');
    }

    const productsSnap = await db.collection('products').get();
    const fetchedProducts = productsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (fetchedProducts.length > 0) {
      adminData.products = fetchedProducts;
    } else {
      console.warn('⚠️ Pas de produits Firestore, utilisation du catalogue local de secours');
    }

    console.log('✅ Données prêtes:', {
      categories: adminData.categories,
      products: adminData.products.length,
      exchangeRate: adminData.exchangeRate
    });
    initializePage();
    syncFirestoreData();
  } catch (error) {
    console.error('❌ Erreur critique chargement:', error);
    initializePage();
  }
}

function syncFirestoreData() {
  db.collection('settings').doc('config').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      console.log('🔄 Mise à jour Firestore reçue (settings/config):', data);
      adminData.categories = Array.isArray(data.categories) ? data.categories : adminData.categories;
      adminData.ticker = Array.isArray(data.ticker) ? data.ticker : adminData.ticker;
      adminData.exchangeRate = data.exchangeRate || 655;
      renderCategories();
      updateTicker();
      renderProducts();
    } else {
      console.warn('⚠️ Document settings/config supprimé ou inexistant');
    }
  });

  db.collection('products').onSnapshot(snapshot => {
    adminData.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts();
  });
}

function initializePage() {
  renderCategories();
  renderProducts();
  updateTicker();
}

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');

mobileMenuToggle.addEventListener('click', () => {
  mobileMenuToggle.classList.toggle('active');
  navLinks.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuToggle.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

if (!isMobile()) {
  document.addEventListener('mousemove', e => {
    cursor.style.transform = `translate(${e.clientX - 7}px, ${e.clientY - 7}px)`;
    setTimeout(() => { ring.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`; }, 60);
  });
}

let cart = [];
let cartOpen = false;

function toggleCart() {
  cartOpen = !cartOpen;
  document.getElementById('cartOverlay').classList.toggle('open', cartOpen);
  document.getElementById('cartPanel').classList.toggle('open', cartOpen);
}

function getWavePaymentUrl(total, orderId = '') {
  const base = adminData.wavePaymentLink || 'https://pay.wave.com/m/M_sn_Bg4an4f38jXi/c/sn/';
  try {
    const url = new URL(base);
    if (total > 0) url.searchParams.set('amount', Math.round(total));
    if (orderId) url.searchParams.set('orderId', orderId);
    return url.toString();
  } catch (error) {
    return base;
  }
}

function addToCart(productId) {
  const product = adminData.products.find(p => String(p.id) === String(productId));
  if (!product) return;
  const existing = cart.find(i => i.name === product.name);
  const price = Number(product.price) || 0;
  if (existing) { existing.qty++; }
  else { cart.push({ name: product.name, price, icon: product.icon, image: product.image || null, qty: 1 }); }
  updateCart();
  showToast(`${product.icon || '🛒'} ${product.name} ajouté !`);
}

function updateCart() {
  const count = cart.reduce((a, i) => a + i.qty, 0);
  document.getElementById('cartCount').textContent = count;

  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const totalFCFA = (total * adminData.exchangeRate).toFixed(0);
  document.getElementById('cartTotal').textContent = totalFCFA + ' FCFA';

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Votre panier est vide</p></div>';
    footerEl.style.display = 'none';
  } else {
    footerEl.style.display = 'block';
    itemsEl.innerHTML = cart.map((item, idx) => {
      const itemTotalFCFA = (item.price * item.qty * adminData.exchangeRate).toFixed(0);
      return `
        <div class="cart-item">
          <div class="cart-item-img">${item.image ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;">` : item.icon}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${itemTotalFCFA} FCFA</div>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          </div>
        </div>`;
    }).join('');
  }
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0) * adminData.exchangeRate;
}

function checkout() {
  if (cart.length === 0) {
    showToast('Votre panier est vide.');
    return;
  }

  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  if (method === 'wave') {
    processPayment();
  } else {
    showToast('Mode de paiement carte sélectionné. Intégration à compléter.');
    document.getElementById('cartMessage').textContent = 'Sélection de paiement carte bancaire détectée. Intégration côté serveur requise.';
  }
}

function processPayment() {
  const total = getCartTotal();
  document.getElementById('cartMessage').textContent = '';
  openCustomerModal(total);
}

function openCustomerModal(total) {
  const totalFormatted = Math.round(total).toLocaleString('fr-FR');
  document.getElementById('modalOrderTotal').textContent = totalFormatted + ' FCFA';
  document.getElementById('customerModalOverlay').classList.add('show');
}

function closeCustomerModal() {
  document.getElementById('customerModalOverlay').classList.remove('show');
  document.getElementById('customerForm').reset();
}

async function submitCustomerForm(event) {
  event.preventDefault();

  const name = document.getElementById('customerName').value.trim();
  const firstName = document.getElementById('customerFirstName').value.trim();
  const whatsapp = document.getElementById('customerWhatsApp').value.trim();
  const quartier = document.getElementById('customerQuartier').value.trim();
  const total = getCartTotal();
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;

  if (!name || !firstName || !whatsapp || !quartier) {
    showToast('❌ Veuillez remplir tous les champs');
    return;
  }

  const btn = event.submitter;
  if (btn) btn.disabled = true;
  showToast('⌛ Traitement de la commande...');

  const orderToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const orderData = {
    customer: {
      name,
      firstName,
      whatsapp,
      quartier
    },
    items: cart.map(item => ({
      name: item.name,
      price: Math.round(item.price * adminData.exchangeRate),
      qty: item.qty
    })),
    total: total,
    paymentMethod: method,
    status: method === 'wave' ? 'Payé' : 'En attente',
    orderToken,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('orders').add(orderData);
    const orderId = docRef.id;
    showToast('✅ Commande enregistrée !');
    closeCustomerModal();
    const paymentUrl = getWavePaymentUrl(total, orderId);
    setTimeout(() => { window.location.href = paymentUrl; }, 1500);
  } catch (error) {
    console.error("Erreur commande:", error);
    showToast('❌ Erreur lors de l\'enregistrement');
    if (btn) btn.disabled = false;
  }
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function subscribe() {
  const v = document.getElementById('emailInput').value;
  if (v.includes('@')) {
    showToast('✅ Inscription confirmée !');
    document.getElementById('emailInput').value = '';
  } else {
    showToast('⚠️ Adresse email invalide');
  }
}

function normalizeCategorySlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '') || 'categorie';
}

function scrollToCategory(categorySlug) {
  if (!categorySlug) return;
  const target = document.getElementById(`category-${categorySlug}`);
  if (!target) return;
  const header = document.querySelector('nav');
  const headerOffset = (header ? header.offsetHeight : 0) + 16;
  const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  window.scrollTo({ top: targetTop, behavior: 'smooth' });
}

function smoothHorizontalScroll(container, delta, duration = 360) {
  if (!container || !delta) return;
  const startX = container.scrollLeft;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const targetX = Math.max(0, Math.min(startX + delta, maxScroll));
  if (targetX === startX) return;

  const startTime = performance.now();
  const distance = targetX - startX;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function step(now) {
    const elapsed = Math.min(1, (now - startTime) / duration);
    container.scrollLeft = startX + distance * ease(elapsed);
    if (elapsed < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) {
    console.error('❌ Élément #categoriesContainer introuvable');
    return;
  }

  const catHtml = adminData.categories.map(cat => {
    const normalizedCat = cat && typeof cat === 'object' ? cat : { id: cat, name: String(cat) };
    const catId = normalizedCat.id || normalizedCat.name || 'unknown';
    const catName = normalizedCat.name || normalizedCat.title || normalizedCat.label || String(catId);
    const categorySlug = normalizeCategorySlug(catId);
    const backgroundImage = normalizedCat.backgroundImage || 'https://via.placeholder.com/200?text=' + encodeURIComponent(catName);
    const count = adminData.products.filter(p => p.category != null && String(p.category).trim() === String(catId).trim()).length;
    const bgStyle = `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;`;
    return `
      <a class="cat-card" href="#category-${categorySlug}" onclick="scrollToCategory('${categorySlug}'); return false;" style="${bgStyle}">
        <div class="cat-overlay">
          <span class="cat-name">${catName}</span>
          <span class="cat-count">${count} produits</span>
        </div>
      </a>
    `;
  }).join('');

  container.innerHTML = catHtml || '<div class="category-empty">Aucune catégorie disponible.</div>';
  container.scrollLeft = 0;
  initializeAutoTicker(container, 0.85);
}

function initializeAutoTicker(container) {
  if (!container) return;

  if (container._autoTicker) {
    const previous = container._autoTicker;
    if (previous.listeners) {
      container.removeEventListener('pointerdown', previous.listeners.down);
      container.removeEventListener('pointerup', previous.listeners.up);
      container.removeEventListener('pointercancel', previous.listeners.cancel);
      container.removeEventListener('pointerleave', previous.listeners.leave);
      container.removeEventListener('wheel', previous.listeners.wheel, { passive: true });
    }
  }

  container.style.scrollBehavior = 'auto';
  container.style.cursor = 'grab';
  container.style.touchAction = 'pan-y';

  const state = { listeners: {} };
  container._autoTicker = state;

  state.listeners.down = () => {
    container.style.cursor = 'grabbing';
  };
  state.listeners.up = () => {
    container.style.cursor = 'grab';
  };
  state.listeners.cancel = () => {
    container.style.cursor = 'grab';
  };
  state.listeners.leave = () => {
    container.style.cursor = 'grab';
  };
  state.listeners.wheel = () => {
    container.style.cursor = 'grab';
  };

  container.addEventListener('pointerdown', state.listeners.down);
  container.addEventListener('pointerup', state.listeners.up);
  container.addEventListener('pointercancel', state.listeners.cancel);
  container.addEventListener('pointerleave', state.listeners.leave);
  container.addEventListener('wheel', state.listeners.wheel, { passive: true });
}

function safeScrollBy(container, left) {
  if (!container || !left) return;
  if (typeof container.scrollBy === 'function') {
    try {
      container.scrollBy(left, 0);
      return;
    } catch (err) {
      // fallback to manual scrollLeft if numeric scrollBy is unavailable
    }
  }
  container.scrollLeft += left;
}

function moveCategories(direction) {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  const amount = container.clientWidth * 0.6;
  smoothHorizontalScroll(container, direction * amount);
}

function moveProductCarousel(button, direction) {
  const section = button.closest('.category-section');
  if (!section) return;
  const carousel = section.querySelector('.products-carousel');
  if (!carousel) return;
  const amount = carousel.clientWidth * 0.7;
  smoothHorizontalScroll(carousel, direction * amount);
}

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

function productMatchesQuery(product, query) {
  if (!query) return true;
  const categoryName = adminData.categories.find(cat => String(cat.id).trim() === String(product.category).trim())?.name || '';
  const text = [product.name, product.desc, product.icon, product.badge, categoryName].filter(Boolean).join(' ').toLowerCase();
  return text.includes(query);
}

function filterProducts() {
  const query = document.getElementById('productSearch').value.trim().toLowerCase();
  window.productSearchQuery = query;
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (adminData.products.length === 0) {
    container.innerHTML = '<div class="cart-empty"><p>Catalogue vide ou en cours de chargement...</p></div>';
    return;
  }

  let renderedCount = 0;

  const query = window.productSearchQuery || '';
  adminData.categories.forEach(cat => {
    const catId = cat && typeof cat === 'object' ? cat.id || cat.name : cat;
    const categorySlug = normalizeCategorySlug(catId);
    const catProducts = adminData.products.filter(p => p.category && String(p.category).trim() === String(catId).trim() && productMatchesQuery(p, query));
    if (catProducts.length > 0) {
      renderedCount += catProducts.length;
      const section = document.createElement('div');
      section.className = 'category-section reveal';
      section.id = `category-${categorySlug}`;
      const productHTML = catProducts.map(product => {
        const priceFCFA = Math.round(Number(product.price) * (adminData.exchangeRate || 655));
        return `
          <div class="product-card">
            <div class="product-img" style="font-size: 0;">
              ${product.image ? `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 4rem;">${product.icon || '📦'}</span>`}
              ${product.badge ? `<div class="product-badge ${product.badge.toLowerCase().includes('nouveau') ? 'new' : ''}">${product.badge}</div>` : ''}
            </div>
            <div class="product-info">
              <div class="stars">★★★★★</div>
              <div class="product-name">${product.name}</div>
              <div class="product-desc">${product.desc || ''}</div>
              <div class="product-bottom">
                <div class="product-price">${priceFCFA.toLocaleString()} FCFA</div>
                <button type="button" class="add-btn" onclick="addToCart('${product.id}')">+</button>
              </div>
            </div>
          </div>`;
      }).join('');

      section.innerHTML = `
        <div class="category-header"><h3>${cat.name}</h3></div>
        <div class="carousel-wrapper">
          <button class="nav-arrow prev" onclick="moveProductCarousel(this, -1)">‹</button>
          <div class="products-carousel">${productHTML}</div>
          <button class="nav-arrow next" onclick="moveProductCarousel(this, 1)">›</button>
        </div>
      `;
      container.appendChild(section);
      initializeAutoTicker(section.querySelector('.products-carousel'), 0.7);
    }
  });

  if (renderedCount < adminData.products.length) {
    const otherProducts = adminData.products.filter(p => !adminData.categories.some(cat => String(cat.id).trim() === String(p.category).trim()) && productMatchesQuery(p, query));
    if (otherProducts.length > 0) {
      const section = document.createElement('div');
      section.className = 'category-section reveal';
      section.innerHTML = `
        <div class="category-header"><h3>📦 AUTRES PRODUITS</h3></div>
        <div class="products-carousel">
          ${otherProducts.map(product => {
            const priceFCFA = Math.round(Number(product.price) * (adminData.exchangeRate || 655));
            return `
              <div class="product-card">
                <div class="product-img" style="font-size: 0;">
                  ${product.image ? `<img src="${product.image}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 4rem;">${product.icon || '📦'}</span>`}
                </div>
                <div class="product-info">
                  <div class="stars">★★★★★</div>
                  <div class="product-name">${product.name}</div>
                  <div class="product-desc">${product.desc || ''}</div>
                  <div class="product-bottom">
                    <div class="product-price">${priceFCFA.toLocaleString()} FCFA</div>
                    <button type="button" class="add-btn" onclick="addToCart('${product.id}')">+</button>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>`;
      container.appendChild(section);
      initializeAutoTicker(section.querySelector('.products-carousel'), 0.7);
    }
  }

  document.querySelectorAll('.reveal').forEach(r => obs.observe(r));
}

function updateTicker() {
  const tickerInner = document.querySelector('.ticker-inner');
  const items = adminData.ticker || [];
  tickerInner.innerHTML = items.map((item, idx) => {
    const dot = idx === items.length - 1 ? '' : '<span class="ticker-dot">●</span>';
    return `<span class="ticker-item">${item} ${dot}</span>`;
  }).join('') + items.map((item, idx) => {
    const dot = idx === items.length - 1 ? '' : '<span class="ticker-dot">●</span>';
    return `<span class="ticker-item">${item} ${dot}</span>`;
  }).join('');
}

document.querySelectorAll('.reveal').forEach(r => obs.observe(r));

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    mobileMenuToggle.classList.remove('active');
    navLinks.classList.remove('active');
  }
});

window.debugTechAccess = {
  showCategories: () => {
    console.log('📊 CATÉGORIES ACTUELLES:', adminData.categories);
    return adminData.categories;
  },
  showProducts: () => {
    console.log('📦 PRODUITS ACTUELS:', adminData.products);
    return adminData.products;
  },
  checkFirestoreCategories: async () => {
    const doc = await db.collection('settings').doc('config').get();
    const data = doc.data();
    console.log('🔍 Données dans Firestore (settings/config):', data);
    return data;
  },
  reloadData: async () => {
    console.log('🔄 Rechargement des données...');
    await loadAllDataFromFirestore();
    console.log('✅ Données rechargées');
  },
  help: () => {
    console.log(`
      🛠️ OUTILS DE DEBUG DISPONIBLES:
      - debugTechAccess.showCategories() : Affiche les catégories en mémoire
      - debugTechAccess.showProducts() : Affiche les produits en mémoire
      - debugTechAccess.checkFirestoreCategories() : Vérifie les catégories dans Firestore
      - debugTechAccess.reloadData() : Force le rechargement depuis Firestore
    `);
  }
};

window.addEventListener('load', () => {
  console.log('💡 Tapez: debugTechAccess.help() pour accéder aux outils de diagnostic');
});

loadAllDataFromFirestore();
