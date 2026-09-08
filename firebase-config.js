// Centralisation de la configuration Firebase
// Configuration pour le contexte navigateur (compatibility mode)
// CLÉS RÉELLES CONFIGURÉES ✅

const firebaseConfig = {
  apiKey: "AIzaSyBEyZ7Lr79bRfLTyezU3lGp6QfapnFBSt4",
  authDomain: "tech-acces-galsen.firebaseapp.com",
  projectId: "tech-acces-galsen",
  storageBucket: "tech-acces-galsen.firebasestorage.app",
  messagingSenderId: "586222995096",
  appId: "1:586222995096:web:ce3fb1e384b2e69ca032ed",
  measurementId: "G-735V82LY58"
};

console.log('✅ Firebase Config Loaded Successfully');
console.log('🔑 API Key: ' + firebaseConfig.apiKey.substring(0, 20) + '...');
console.log('📦 Project: ' + firebaseConfig.projectId);

// Initialisation Firebase
if (!firebase.apps.length) {
  console.log('🔧 Initialisation Firebase...');
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialisé');
}

// Expose to global window scope for access across scripts
window.db = firebase.firestore();
window.auth = firebase.auth();

// Also create module-level constants for backward compatibility
const db = window.db;
const auth = window.auth;

console.log('📦 Firestore disponible:', !!window.db);
console.log('🔐 Auth disponible:', !!window.auth);