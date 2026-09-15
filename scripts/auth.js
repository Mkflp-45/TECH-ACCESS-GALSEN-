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

      // Remplir le tableau de bord (infos, fidélité) : sans ça, seul un
      // client qui vient tout juste de s'inscrire voit ses vraies infos —
      // à la reconnexion ou au rechargement, le panneau restait vide.
      if (userProfile && typeof updateAccountUI === 'function') {
        updateAccountUI(userProfile);
      }

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
      userNameDisplay.textContent = userProfile.firstName || 'Mon compte';
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
  // Message d'accueil personnalisé (toujours le prénom, jamais l'email)
  const greetingEl = document.getElementById('userGreetingName');
  if (greetingEl) {
    greetingEl.textContent = profile.firstName || profile.email || 'Client TECH ACCESS';
  }

  // Infos utilisateur
  document.getElementById('dashEmail').textContent = profile.email || '-';
  document.getElementById('dashPhone').textContent = profile.phone || '-';
  document.getElementById('dashQuartier').textContent = profile.quartier || '-';

  // Code de parrainage réel (le HTML contient un placeholder "TECH-XXXX" par défaut)
  const referralInput = document.getElementById('referralCode');
  if (referralInput && profile.referralCode) {
    referralInput.value = profile.referralCode;
  }

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
    showToast(`Bienvenue ${userProfile?.firstName || 'sur TECH ACCESS'}! 🎉`);

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

/**
 * Envoie un email de réinitialisation de mot de passe, via Firebase Auth.
 * Réutilise l'email déjà saisi dans le formulaire de connexion s'il y en a un.
 */
async function handleForgotPassword(event) {
  event.preventDefault();

  const emailInput = document.getElementById('loginEmail');
  let email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    email = prompt('Entrez votre adresse email pour réinitialiser votre mot de passe :');
    if (!email) return;
    email = email.trim();
  }

  try {
    showLoadingState(true);
    await auth.sendPasswordResetEmail(email);
    showToast(`📧 Email envoyé à ${email}. Vérifiez votre boîte de réception (et vos spams).`);
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    let message = 'Erreur lors de l\'envoi de l\'email';
    if (error.code === 'auth/user-not-found') {
      message = 'Aucun compte associé à cet email';
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
  const enteredReferralCode = document.getElementById('regReferralCode').value.trim().toUpperCase();

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

    // Si un code de parrainage a été saisi, chercher le compte correspondant
    // AVANT de créer le nouveau compte, via la table publique referralCodes
    // (le nouvel inscrit n'est pas encore authentifié à ce stade, donc on ne
    // peut pas encore lire la collection users, protégée). Si le code est
    // invalide, on avertit mais on continue quand même l'inscription.
    let referrerUid = null;
    if (enteredReferralCode) {
      try {
        const codeDoc = await db.collection('referralCodes').doc(enteredReferralCode).get();
        if (codeDoc.exists) {
          referrerUid = codeDoc.data().uid;
        } else {
          showToast('⚠️ Code de parrainage introuvable, inscription sans parrainage');
        }
      } catch (e) {
        console.warn('Erreur recherche code parrainage:', e);
      }
    }

    // Créer le compte Firebase
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const myReferralCode = generateReferralCode(user.uid);

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
      referralCode: myReferralCode,
      referredBy: referrerUid
    };

    // Sauvegarder dans Firestore
    await db.collection('users').doc(user.uid).set(newProfile);

    // Publier son propre code dans la table publique, pour que de futurs
    // inscrits puissent le retrouver avant même d'être connectés.
    await db.collection('referralCodes').doc(myReferralCode).set({ uid: user.uid });

    // Récompenser le parrain : +500 points (annoncé dans l'espace client).
    // On utilise un incrément atomique Firestore : impossible de lire le
    // profil du parrain (règles de confidentialité), mais un incrément ne
    // nécessite pas de connaître sa valeur actuelle. Best-effort : si ça
    // échoue, l'inscription reste valide quand même.
    if (referrerUid) {
      const REFERRAL_BONUS = 500;
      try {
        await db.collection('users').doc(referrerUid).update({
          loyaltyPoints: firebase.firestore.FieldValue.increment(REFERRAL_BONUS)
        });
        showToast(`🎉 Parrainage validé ! Votre ami a gagné ${REFERRAL_BONUS} points`);
      } catch (e) {
        console.error('Erreur attribution bonus parrainage:', e);
      }
    }

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

    // Fermer la popup compte si elle est ouverte
    const accountPanel = document.getElementById('accountPanel');
    const accountOverlay = document.getElementById('accountOverlay');
    if (accountPanel) accountPanel.classList.remove('open');
    if (accountOverlay) accountOverlay.classList.remove('open');
    document.body.style.overflow = 'auto';

    showToast('Vous êtes déconnecté');

  } catch (error) {
    console.error("Erreur logout:", error);
    showToast('Erreur lors de la déconnexion');
  }
}

/**
 * Met à jour le profil utilisateur
 */
/**
 * Affiche/masque le formulaire d'édition du profil, pré-rempli avec les
 * valeurs actuelles.
 */
function toggleEditProfile() {
  const form = document.getElementById('editProfileForm');
  const summary = document.getElementById('userInfoSummary');
  const toggleBtn = document.getElementById('editProfileToggleBtn');
  if (!form || !summary) return;

  const isOpen = form.style.display !== 'none';
  if (isOpen) {
    form.style.display = 'none';
    summary.style.display = 'block';
    if (toggleBtn) toggleBtn.textContent = '✏️ Modifier';
  } else {
    document.getElementById('editQuartier').value = userProfile?.quartier || '';
    document.getElementById('editPhone').value = userProfile?.phone || '';
    form.style.display = 'block';
    summary.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '✕ Fermer';
  }
}

/**
 * Gère la soumission du formulaire d'édition du profil.
 */
async function handleUpdateProfile(event) {
  event.preventDefault();
  const quartier = document.getElementById('editQuartier').value.trim();
  const phone = document.getElementById('editPhone').value.trim();

  if (!quartier || !phone) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  const phoneRegex = /^\d{8,}$/;
  if (!phoneRegex.test(phone.replace(/[^\d]/g, ''))) {
    showToast('Numéro de téléphone invalide');
    return;
  }

  await updateUserProfile({ quartier, phone });
  toggleEditProfile();
}

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

  const isOpen = accountPanel.classList.contains('open');

  if (isOpen) {
    accountPanel.classList.remove('open');
    accountOverlay.classList.remove('open');
    document.body.style.overflow = 'auto';
  } else {
    accountPanel.classList.add('open');
    accountOverlay.classList.add('open');
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
// Note : showToast() est définie dans main.js

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
