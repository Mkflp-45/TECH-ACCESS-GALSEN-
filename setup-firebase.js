#!/usr/bin/env node
/**
 * Script pour générer firebase-config.js depuis .env.local
 * Usage: node setup-firebase.js
 */

const fs = require('fs');
const path = require('path');

// Charger les variables depuis .env.local
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local non trouvé!');
  console.error('📝 Crée un fichier .env.local avec tes clés Firebase');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

// Valider les clés
if (!envVars.FIREBASE_API_KEY || envVars.FIREBASE_API_KEY.includes('xxx')) {
  console.error('❌ ERREUR: FIREBASE_API_KEY vide ou non configurée dans .env.local');
  console.error('📝 Entre ta vraie clé API depuis Firebase Console');
  process.exit(1);
}

// Générer firebase-config.js
const configContent = `// AUTO-GENERATED - Generated from .env.local
// DO NOT EDIT - Use setup-firebase.js to regenerate

const firebaseConfig = {
  apiKey: "${envVars.FIREBASE_API_KEY || ''}",
  authDomain: "${envVars.FIREBASE_AUTH_DOMAIN || 'tech-acces-galsen.firebaseapp.com'}",
  projectId: "${envVars.FIREBASE_PROJECT_ID || 'tech-acces-galsen'}",
  storageBucket: "${envVars.FIREBASE_STORAGE_BUCKET || 'tech-acces-galsen.firebasestorage.app'}",
  messagingSenderId: "${envVars.FIREBASE_MESSAGING_SENDER_ID || '586222995096'}",
  appId: "${envVars.FIREBASE_APP_ID || ''}",
  measurementId: "${envVars.FIREBASE_MEASUREMENT_ID || ''}"
};

console.log('✅ Firebase Config Loaded');

// Initialisation unique
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Expose to global window scope for access across scripts
window.db = firebase.firestore();
window.auth = firebase.auth();

// Also create module-level constants for backward compatibility
const db = window.db;
const auth = window.auth;
`;

fs.writeFileSync(
  path.join(__dirname, 'firebase-config.js'),
  configContent
);

console.log('✅ firebase-config.js générée avec succès!');
console.log('🔑 Clés configurées:');
console.log(`   - API Key: ${envVars.FIREBASE_API_KEY.substring(0, 20)}...`);
console.log(`   - Project: ${envVars.FIREBASE_PROJECT_ID}`);
