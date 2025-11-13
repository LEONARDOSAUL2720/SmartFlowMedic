const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
// Nota: Necesitas descargar el archivo serviceAccountKey.json de Firebase Console
// y colocarlo en src/config/

let firebaseApp;

try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin SDK inicializado');
} catch (error) {
  console.warn('⚠️ Firebase Admin no configurado. Login con Google deshabilitado.');
  console.warn('Para habilitar: descarga serviceAccountKey.json de Firebase Console');
}

// Verificar Firebase ID Token
const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase no está configurado');
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Error verificando token de Firebase: ${error.message}`);
  }
};

module.exports = {
  admin,
  verifyFirebaseToken,
};
