// ============================================
// AUTHENTIFICATION UTILISATEUR TECH ACCESS
// ============================================

// État global utilisateur
let currentUser = null;
let userProfile = null;

// ============================================
// 1. GESTION DE LA SESSION
// ============================================

/**
 * Initialise la gestion de session au chargement de la page
 * Vérifie si l'utilisateur est déjà connecté
 */
function initAuthSession() {
  if (!window.auth) {
    console.error("Firebase auth non initialisé. Vérifiez firebase-config.js");
    return;
  }

  // Écouter les changements d'authentification
  window.auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Utilisateur connecté
      currentUser = user;
      await loadUserProfile(user.uid);
      updateAuthUI(true);
      
      // Charger l'historique des commandes
      if (typeof loadUserOrderHistory === 'function') {
        loadUserOrderHistory(user.uid);
      }
    } else {
      // Utilisateur déconnecté
      currentUser = null;
      userProfile = null;
      updateAuthUI(false);
    }
  });
}

/**
 * Charge le profil utilisateur depuis Firestore
 */
async function loadUserProfile(uid) {
  try {
    if (!window.db) {
      console.warn('⚠️ Firestore not yet initialized for user profile');
      return;
    }
    const docRef = window.db.collection('users').doc(uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      userProfile = docSnap.data();
    } else {
      console.log("Profil utilisateur n'existe pas encore");
      userProfile = {
        uid: uid,
        email: currentUser.email,
        firstName: '',
        lastName: '',
        phone: '',
        quartier: '',
        createdAt: new Date(),
        loyaltyPoints: 0,
        totalSpent: 0,
        orderCount: 0,
        tierLevel: 'Bronze'
      };
    }
    
    updateAccountUI(userProfile);
  } catch (error) {
    console.error("Erreur chargement profil:", error);
    showToast("Erreur: impossible de charger le profil");
  }
}

/**
 * Met à jour l'UI en fonction de l'état d'authentification
 */
function updateAuthUI(isLoggedIn) {
  const loginBtn = document.getElementById('loginBtn');
  const userAccountBtn = document.getElementById('userAccountBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');

  if (isLoggedIn && currentUser && userProfile) {
    // Utilisateur connecté
    if (loginBtn) loginBtn.style.display = 'none';
    if (userAccountBtn) userAccountBtn.style.display = 'flex';
    if (userNameDisplay) {
      const displayName = userProfile.firstName && userProfile.lastName 
        ? `${userProfile.firstName} ${userProfile.lastName}` 
        : currentUser.email;
      userNameDisplay.textContent = displayName;
    }
  } else {
    // Utilisateur déconnecté
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userAccountBtn) userAccountBtn.style.display = 'none';
    if (userNameDisplay) userNameDisplay.textContent = 'Compte';
  }
}

/**
 * Met à jour l'affichage du tableau de bord utilisateur
 */
function updateAccountUI(profile) {
  // Infos utilisateur
  document.getElementById('dashEmail').textContent = profile.email || '-';
  document.getElementById('dashPhone').textContent = profile.phone || '-';
  document.getElementById('dashQuartier').textContent = profile.quartier || '-';

  // Fidélité
  if (typeof updateLoyaltyUI === 'function' && profile) {
    updateLoyaltyUI(profile);
  }
}

// ============================================
// 2. GESTION DES MODALES
// ============================================

/**
 * Ouvre la modal d'authentification
 */
function openAuthModal() {
  const modal = document.getElementById('authModalOverlay');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Afficher le formulaire de login par défaut
    toggleAuthMode('login');
  }
}

/**
 * Ferme la modal d'authentification
 */
function closeAuthModal() {
  const modal = document.getElementById('authModalOverlay');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  // Réinitialiser les formulaires
  resetAuthForms();
}

/**
 * Bascule entre login et register
 */
function toggleAuthMode(mode) {
  const loginContainer = document.getElementById('loginFormContainer');
  const registerContainer = document.getElementById('registerFormContainer');
  const authTitle = document.getElementById('authTitle');

  if (mode === 'login') {
    if (loginContainer) loginContainer.style.display = 'block';
    if (registerContainer) registerContainer.style.display = 'none';
    if (authTitle) authTitle.textContent = 'SE CONNECTER';
  } else if (mode === 'register') {
    if (loginContainer) loginContainer.style.display = 'none';
    if (registerContainer) registerContainer.style.display = 'block';
    if (authTitle) authTitle.textContent = 'CRÉER MON COMPTE';
  }
}

/**
 * Réinitialise les formulaires d'authentification
 */
function resetAuthForms() {
  // Login
  const loginEmail = document.getElementById('loginEmail');
  const loginPass = document.getElementById('loginPass');
  if (loginEmail) loginEmail.value = '';
  if (loginPass) loginPass.value = '';

  // Register
  const regFirstName = document.getElementById('regFirstName');
  const regName = document.getElementById('regName');
  const regPhone = document.getElementById('regPhone');
  const regQuartier = document.getElementById('regQuartier');
  const regEmail = document.getElementById('regEmail');
  const regPass = document.getElementById('regPass');
  const regPassConfirm = document.getElementById('regPassConfirm');

  if (regFirstName) regFirstName.value = '';
  if (regName) regName.value = '';
  if (regPhone) regPhone.value = '';
  if (regQuartier) regQuartier.value = '';
  if (regEmail) regEmail.value = '';
  if (regPass) regPass.value = '';
  if (regPassConfirm) regPassConfirm.value = '';
}

// ============================================
// 3. AUTHENTIFICATION - LOGIN
// ============================================

/**
 * Gère la connexion utilisateur
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;

  // Validation basique
  if (!email || !password) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  try {
    // Afficher un loader
    showLoadingState(true);

    // Connexion Firebase
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Charger le profil
    await loadUserProfile(user.uid);

    // Fermer la modal
    closeAuthModal();

    // Message de succès
    showToast(`Bienvenue ${userProfile?.firstName || user.email}! 🎉`);

  } catch (error) {
    console.error("Erreur login:", error);
    
    let message = 'Erreur de connexion';
    if (error.code === 'auth/user-not-found') {
      message = 'Cet email n\'existe pas';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Mot de passe incorrect';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email invalide';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Trop de tentatives. Réessayez plus tard';
    }
    
    showToast(message);
  } finally {
    showLoadingState(false);
  }
}

// ============================================
// 4. AUTHENTIFICATION - INSCRIPTION
// ============================================

/**
 * Gère l'inscription utilisateur
 */
async function handleRegister(event) {
  event.preventDefault();

  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const quartier = document.getElementById('regQuartier').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPass').value;
  const passwordConfirm = document.getElementById('regPassConfirm').value;

  // Validation
  if (!firstName || !lastName || !phone || !quartier || !email || !password || !passwordConfirm) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  if (password !== passwordConfirm) {
    showToast('Les mots de passe ne correspondent pas');
    return;
  }

  if (password.length < 6) {
    showToast('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  // Validation email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Email invalide');
    return;
  }

  // Validation téléphone (au moins 8 chiffres)
  const phoneRegex = /^\d{8,}$/;
  if (!phoneRegex.test(phone.replace(/[^\d]/g, ''))) {
    showToast('Numéro de téléphone invalide');
    return;
  }

  try {
    showLoadingState(true);

    // Créer le compte Firebase
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Créer le profil Firestore
    const newProfile = {
      uid: user.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      quartier: quartier,
      createdAt: new Date(),
      loyaltyPoints: 0,
      totalSpent: 0,
      orderCount: 0,
      tierLevel: 'Bronze',
      referralCode: generateReferralCode(user.uid),
      referredBy: null
    };

    // Sauvegarder dans Firestore
    await db.collection('users').doc(user.uid).set(newProfile);

    userProfile = newProfile;
    currentUser = user;

    // Fermer la modal
    closeAuthModal();

    // Message de succès
    showToast(`Bienvenue ${firstName}! Compte créé avec succès 🎉`);

    // Mettre à jour l'UI
    updateAuthUI(true);
    updateAccountUI(newProfile);

  } catch (error) {
    console.error("Erreur inscription:", error);
    
    let message = 'Erreur lors de l\'inscription';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Cet email est déjà utilisé';
    } else if (error.code === 'auth/weak-password') {
      message = 'Le mot de passe est trop faible';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email invalide';
    }
    
    showToast(message);
  } finally {
    showLoadingState(false);
  }
}

// ============================================
// 5. GESTION DU COMPTE - LOGOUT & UPDATE
// ============================================

/**
 * Déconnexion utilisateur
 */
async function handleLogout() {
  if (!confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
    return;
  }

  try {
    await auth.signOut();
    
    // Réinitialiser les variables
    currentUser = null;
    userProfile = null;

    // Fermer le panel
    toggleAccountDashboard();

    // Message
    showToast('Vous êtes déconnecté');

  } catch (error) {
    console.error("Erreur logout:", error);
    showToast('Erreur lors de la déconnexion');
  }
}

/**
 * Met à jour le profil utilisateur
 */
async function updateUserProfile(updateData) {
  if (!currentUser) {
    showToast('Vous devez être connecté');
    return;
  }

  try {
    showLoadingState(true);

    // Mettre à jour Firestore
    await db.collection('users').doc(currentUser.uid).update(updateData);

    // Mettre à jour la variable locale
    userProfile = { ...userProfile, ...updateData };

    // Mettre à jour l'UI
    updateAccountUI(userProfile);

    showToast('Profil mis à jour');

  } catch (error) {
    console.error("Erreur update profil:", error);
    showToast('Erreur lors de la mise à jour');
  } finally {
    showLoadingState(false);
  }
}

// ============================================
// 6. TABLEAU DE BORD - ESPACE CLIENT
// ============================================

/**
 * Bascule l'affichage du tableau de bord utilisateur
 */
function toggleAccountDashboard() {
  const accountOverlay = document.getElementById('accountOverlay');
  const accountPanel = document.getElementById('accountPanel');

  if (!accountOverlay || !accountPanel) {
    console.error("Éléments du tableau de bord non trouvés");
    return;
  }

  const isVisible = accountPanel.style.right === '0px' || accountPanel.style.right === '0';

  if (isVisible) {
    // Fermer
    accountPanel.style.right = '-400px';
    accountOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
  } else {
    // Ouvrir
    accountPanel.style.right = '0px';
    accountOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Ferme le tableau de bord si on clique sur l'overlay
 */
document.addEventListener('DOMContentLoaded', function() {
  const accountOverlay = document.getElementById('accountOverlay');
  if (accountOverlay) {
    accountOverlay.addEventListener('click', toggleAccountDashboard);
  }
});

// ============================================
// 7. CODE DE PARRAINAGE
// ============================================

/**
 * Génère un code de parrainage unique
 */
function generateReferralCode(uid) {
  // Format: TECH-XXXX (8 caractères)
  const hash = uid.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `TECH-${hash}${random}`;
  return code;
}

/**
 * Copie le code de parrainage aux presse-papiers
 */
function copyReferral() {
  const referralCode = document.getElementById('referralCode');
  if (!referralCode) return;

  const code = referralCode.value;
  
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Code copié: ${code} 📋`);
  }).catch(err => {
    console.error('Erreur copie:', err);
    showToast('Erreur lors de la copie');
  });
}

// ============================================
// 8. UTILITAIRES
// ============================================

/**
 * Affiche/cache un loader
 */
function showLoadingState(isLoading) {
  const buttons = document.querySelectorAll('[onclick*="handleLogin"], [onclick*="handleRegister"]');
  buttons.forEach(btn => {
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? '0.6' : '1';
  });
}

/**
 * Affiche un message toast (si fonction disponible)
 */
function showToast(message) {
  // Si la fonction showToast existe (depuis main.js), l'utiliser
  if (typeof window.showToast === 'function') {
    window.showToast(message);
  } else {
    // Sinon, utiliser alert comme fallback
    console.log(message);
    alert(message);
  }
}

// ============================================
// 9. INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialiser la gestion de session
  if (db && auth) {
    initAuthSession();
  } else {
    console.warn("Firebase non disponible. Vérifiez firebase-config.js");
  }
});
