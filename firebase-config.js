// Centralisation de la configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBEyZ7Lr79bRfLTyezU3lGp6QfapnFBSt4",
  authDomain: "tech-acces-galsen.firebaseapp.com",
  projectId: "tech-acces-galsen",
  storageBucket: "tech-acces-galsen.firebasestorage.app",
  messagingSenderId: "586222995096",
  appId: "1:586222995096:web:ce3fb1e384b2e69ca032ed",
  measurementId: "G-735V82LY58"
};

// Initialisation unique
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();