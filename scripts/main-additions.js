// ==================== WISHLIST / FAVORIS ====================
let wishlist = JSON.parse(localStorage.getItem('techAccessWishlist')) || [];

function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast('Retiré des favoris 💔', 'info');
  } else {
    wishlist.push(productId);
    showToast('Ajouté aux favoris ❤️', 'success');
  }
  localStorage.setItem('techAccessWishlist', JSON.stringify(wishlist));
  updateWishlistButtons();
}

function updateWishlistButtons() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const productId = btn.dataset.productId;
    btn.classList.toggle('active', wishlist.includes(productId));
  });
}

// ==================== BEST SELLERS ====================
async function loadBestSellers() {
  const container = document.getElementById('bestSellersContainer');
  if (!container) return;
  
  try {
    const snapshot = await db.collection('orders').get();
    const productSales = {};
    
    snapshot.forEach(doc => {
      const order = doc.data();
      (order.items || []).forEach(item => {
        const key = item.id;
        if (!productSales[key]) productSales[key] = 0;
        productSales[key] += Number(item.qty) || 0;
      });
    });

    const topIds = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);

    const bestsellers = adminData.products.filter(p => topIds.includes(p.id));
    
    container.innerHTML = bestsellers.map(p => {
      const exchangeRate = adminData.exchangeRate || 655;
      const priceFCFA = (Number(p.price) * exchangeRate).toFixed(0);
      const stock = Number(p.stock || 0);
      return `
        <div class="product-card">
          <div class="product-img" style="position:relative; overflow:hidden;">
            <img src="${p.image || p.icon}" alt="${p.name}" loading="lazy" decoding="async" width="380" height="200" style="width:100%; height:200px; object-fit:cover;">
            <button class="wishlist-btn" data-product-id="${p.id}" onclick="event.stopPropagation(); toggleWishlist('${p.id}')">♡</button>
            ${stock <= 5 ? `<div class="stock-indicator low">⚠️ ${stock} restants</div>` : stock > 0 ? `<div class="stock-indicator available">✓ En stock</div>` : `<div class="stock-indicator">Rupture</div>`}
          </div>
          <div class="product-info">
            <div class="product-category">${p.category}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.desc.substring(0, 50)}...</div>
            <div style="display:flex; gap:8px; align-items:center; margin-top:12px;">
              <div class="product-price">${priceFCFA.toLocaleString()} FCFA</div>
              <button type="button" class="add-btn" onclick="addToCart('${p.id}')">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    updateWishlistButtons();
  } catch (e) {
    console.error('Erreur meilleures ventes:', e);
  }
}

// ==================== PERSISTENT CART ====================
function saveCartToLocalStorage() {
  localStorage.setItem('techAccessCart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  const saved = localStorage.getItem('techAccessCart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      updateCart();
    } catch (e) {
      console.warn('Erreur chargement panier:', e);
    }
  }
}

// ==================== PROMO CODES ====================
let appliedPromo = null;
let promoList = [];

async function loadPromoCodesFromFirestore() {
  try {
    const snapshot = await db.collection('promotions').where('active', '==', true).get();
    promoList = snapshot.docs.map(doc => ({
      id: doc.id,
      code: doc.data().code,
      discount: Number(doc.data().discount) || 0,
      expiresAt: doc.data().expiresAt
    })).filter(p => !p.expiresAt || p.expiresAt.toDate() > new Date());
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

function getCartTotal() {
  let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (appliedPromo) {
    total *= 1 - appliedPromo.discount / 100;
  }
  return total * (adminData.exchangeRate || 655);
}

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

// ==================== NEWSLETTER IMPROVEMENTS ====================
async function subscribe() {
  const email = document.getElementById('emailInput').value.trim();
  if (!email || !email.includes('@')) {
    showToast('❌ Email invalide', 'error');
    return;
  }

  try {
    await db.collection('newsletter').add({
      email,
      subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
      source: 'website'
    });
    document.getElementById('emailInput').value = '';
    showToast('✅ Merci de votre inscription !', 'success');
  } catch (e) {
    console.error('Erreur inscription:', e);
    showToast('⚠️ Erreur, réessayez plus tard', 'error');
  }
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
    <div class="modal-content" style="position:relative; background:var(--black); border-radius:16px; padding:40px; max-width:600px; max-height:80vh; overflow-y:auto;">
      <button style="position:absolute; top:20px; right:20px; background:none; border:none; color:#fff; font-size:24px; cursor:pointer;" onclick="this.closest('.product-detail-modal').remove()">✕</button>
      <img src="${product.image || product.icon}" alt="${product.name}" style="width:100%; height:300px; object-fit:cover; border-radius:12px; margin-bottom:20px;">
      <h2 style="font-size:1.8rem; margin-bottom:8px;">${product.name}</h2>
      <p style="color:#aaa; margin-bottom:16px;">${product.category}</p>
      <p style="font-size:1.2rem; color:var(--accent2); margin-bottom:16px; font-weight:700;">${priceFCFA} FCFA</p>
      <p style="margin-bottom:16px; line-height:1.6;">${product.desc}</p>
      ${stock <= 5 ? `<div class="stock-indicator low">⚠️ ${stock} articles restants</div>` : stock > 0 ? `<div class="stock-indicator available">✓ En stock</div>` : `<div class="stock-indicator">Rupture de stock</div>`}
      <button class="add-btn" style="width:100%; margin-top:20px; padding:12px;" onclick="addToCart('${product.id}'); this.closest('.product-detail-modal').remove();">Ajouter au panier</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== INIT ALL FEATURES ====================
function initializeAllFeatures() {
  loadBestSellers();
  loadPromoCodesFromFirestore();
  loadCartFromLocalStorage();
  initLazyLoading();
  
  // Save cart whenever it changes
  const originalAddToCart = window.addToCart;
  window.addToCart = function(productId) {
    originalAddToCart(productId);
    saveCartToLocalStorage();
  };
  
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
