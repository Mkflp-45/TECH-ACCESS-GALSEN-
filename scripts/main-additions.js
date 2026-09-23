// Fonctions annexes du site client : codes promo, lazy loading, fiche produit.

// Note : le panier n'est plus persisté dans localStorage — il se vide
// volontairement à chaque actualisation de page (comportement demandé).

// ==================== PROMO CODES ====================
let appliedPromo = null;
let promoList = [];

async function loadPromoCodesFromFirestore() {
  try {
    if (!window.db) {
      console.warn('⚠️ Firestore not yet initialized for promo codes');
      return;
    }
    // Écoute en temps réel : si l'admin active/désactive un code pendant
    // qu'un client a déjà le site ouvert, ça se met à jour sans qu'il ait
    // besoin de recharger la page (comme le ticker, les produits, etc.)
    window.db.collection('promotions').where('active', '==', true).onSnapshot(snapshot => {
      promoList = snapshot.docs.map(doc => ({
        id: doc.id,
        code: doc.data().code,
        discount: Number(doc.data().discount) || 0,
        expiresAt: doc.data().expiresAt
      })).filter(p => !p.expiresAt || p.expiresAt.toDate() > new Date());
    }, err => {
      console.warn('Erreur écoute codes promo:', err);
    });
  } catch (e) {
    console.warn('Erreur chargement codes promo:', e);
  }
}

function applyPromoCode(code) {
  const promo = promoList.find(p => p.code.toUpperCase() === code.toUpperCase());
  if (!promo) {
    showToast('❌ Code promo invalide', 'error');
    return;
  }
  appliedPromo = promo;
  showToast(`✅ Code appliqué: -${promo.discount}%`, 'success');
  updateCart();
}

// Note : getCartTotal() est définie dans main.js (gère aussi le code promo)

// ==================== LAZY LOADING ====================
function initLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.loading = 'eager';
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.style.opacity = '1';
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ==================== PRODUCT DETAIL MODAL ====================
function openProductDetail(productId) {
  const product = adminData.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.createElement('div');
  modal.className = 'product-detail-modal';
  modal.onclick = (e) => e.target === modal && modal.remove();
  
  const exchangeRate = adminData.exchangeRate || 655;
  const priceFCFA = (Number(product.price) * exchangeRate).toFixed(0);
  const stock = Number(product.stock || 0);

  modal.innerHTML = `
    <div class="modal-content" style="position:relative; border-radius:16px; padding:20px; width:100%; max-width:600px; max-height:88vh; overflow-y:auto;">
      <button style="position:absolute; top:10px; right:12px; background:none; border:none; color:#fff; font-size:26px; cursor:pointer; padding:8px; z-index:2;" onclick="this.closest('.product-detail-modal').remove()">✕</button>
      ${product.image
        ? `<img src="${product.image}" alt="${product.name}" style="width:100%; height:240px; object-fit:cover; border-radius:12px; margin-bottom:16px;">`
        : `<div class="product-detail-icon-fallback">${product.icon || '📦'}</div>`}
      <h2 style="font-size:1.8rem; margin-bottom:8px;">${product.name}</h2>
      <p style="color:#aaa; margin-bottom:16px;">${product.category}</p>
      <p style="font-size:1.2rem; color:var(--accent2); margin-bottom:16px; font-weight:700;">${priceFCFA} FCFA</p>
      <p style="margin-bottom:16px; line-height:1.6;">${product.desc}</p>
      ${stock <= 5 ? `<div class="stock-indicator low">⚠️ ${stock} articles restants</div>` : stock > 0 ? `<div class="stock-indicator available">✓ En stock</div>` : `<div class="stock-indicator">Rupture de stock</div>`}
      <button class="add-btn" style="width:100%; margin-top:16px; padding:16px; font-size:1rem; border-radius:12px;" onclick="addToCart('${product.id}'); this.closest('.product-detail-modal').remove();">Ajouter au panier</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== INIT ALL FEATURES ====================
function initializeAllFeatures() {
  loadPromoCodesFromFirestore();
  // Le panier ne doit PAS survivre à une actualisation de page : on ne
  // restaure plus depuis localStorage, et on nettoie une éventuelle donnée
  // laissée par une ancienne version du site chez les visiteurs déjà venus.
  localStorage.removeItem('techAccessCart');
  initLazyLoading();

  // Promo code input handler
  const promoInput = document.getElementById('promoCodeInput');
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyPromoCode(promoInput.value);
        promoInput.value = '';
      }
    });
  }
}

// Call initialization after Firebase is ready
setTimeout(initializeAllFeatures, 500);
