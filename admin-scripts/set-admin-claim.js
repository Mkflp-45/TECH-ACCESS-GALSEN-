/**
 * set-admin-claim.js
 * ===================
 * Attribue la custom claim `admin: true` à un compte Firebase Auth, pour
 * remplacer la vérification par email en dur dans firestore.rules.
 *
 * ⚠️ Ce script s'exécute UNE SEULE FOIS, en local, sur TON ordinateur.
 * Il ne doit JAMAIS tourner dans le navigateur ni être appelé depuis le site.
 * Il ne doit jamais être commité avec la clé de compte de service à côté.
 *
 * -------------------------------------------------------------------------
 * MODE D'EMPLOI
 * -------------------------------------------------------------------------
 *
 * 1. Récupère ta clé de compte de service Firebase :
 *    - Va sur https://console.firebase.google.com/
 *    - Sélectionne ton projet (tech-acces-galsen)
 *    - ⚙️ Paramètres du projet → onglet "Comptes de service"
 *    - Clique "Générer une nouvelle clé privée" → un fichier .json se télécharge
 *    - Renomme-le "service-account.json" et mets-le dans CE MÊME DOSSIER
 *      (admin-scripts/), à côté de ce script.
 *
 * 2. Installe Node.js si ce n'est pas déjà fait (https://nodejs.org)
 *
 * 3. Dans un terminal, place-toi dans ce dossier et installe la dépendance :
 *      cd admin-scripts
 *      npm init -y
 *      npm install firebase-admin
 *
 * 4. Lance le script en indiquant l'email du compte à promouvoir admin :
 *      node set-admin-claim.js mohameth2051@gmail.com
 *
 *    (Ce compte doit déjà exister dans Firebase Authentication — connecte-toi
 *    au moins une fois sur admin.html avec cet email/mot de passe AVANT de
 *    lancer ce script, sinon Firebase ne le trouvera pas.)
 *
 * 5. Une fois le message "✅ Claim admin attribuée" affiché :
 *    - Déconnecte-toi et reconnecte-toi sur admin.html (le token doit se
 *      rafraîchir pour que la nouvelle claim soit prise en compte)
 *
 * 6. ⚠️ SUPPRIME le fichier service-account.json après usage (ou garde-le
 *    hors du dépôt Git — il donne un accès total à ton projet Firebase).
 *    Il est déjà exclu par .gitignore à la racine du projet si tu le laisses
 *    dans ce dossier.
 * -------------------------------------------------------------------------
 */

const admin = require('firebase-admin');
const path = require('path');

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node set-admin-claim.js <email>');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, 'service-account.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Fichier service-account.json introuvable dans ce dossier.');
  console.error('   Suis l\'étape 1 des instructions en haut de ce fichier.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function main() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Claim admin attribuée à ${email} (uid: ${user.uid})`);
    console.log('   Déconnecte-toi et reconnecte-toi sur admin.html pour que ça prenne effet.');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Aucun compte Firebase Auth trouvé pour ${email}.`);
      console.error('   Connecte-toi au moins une fois sur admin.html avec cet email avant de relancer ce script.');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
