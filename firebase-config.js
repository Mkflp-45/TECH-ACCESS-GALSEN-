// Centralisation de la configuration Firebase
// Configuration pour le contexte navigateur (compatibility mode)

const firebaseConfig = {
  apiKey: "AIzaSyBEyZ7Lr79bRfLTyezU3lGp6QfapnFBSt4",
  authDomain: "tech-acces-galsen.firebaseapp.com",
  projectId: "tech-acces-galsen",
  storageBucket: "tech-acces-galsen.firebasestorage.app",
  messagingSenderId: "586222995096",
  appId: "1:586222995096:web:ce3fb1e384b2e69ca032ed",
  measurementId: "G-735V82LY58"
};

// Initialisation Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose to global window scope for access across scripts
window.db = firebase.firestore();
// Le SDK Auth n'est chargé que sur admin.html ; le site client n'en a plus besoin.
window.auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;

// Analytics : uniquement chargé sur index.html (site client), pas sur
// admin.html, pour ne pas polluer les statistiques de visite avec l'usage
// de l'admin lui-même sur son propre panel.
if (typeof firebase.analytics === 'function') {
  window.analytics = firebase.analytics();
}

// Also create module-level constants for backward compatibility
const db = window.db;
const auth = window.auth;
