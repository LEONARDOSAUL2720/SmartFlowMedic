const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
let firebaseApp;
let firebaseInitialized = false;

try {
  // OPCIÓN 1: Intentar desde variable de entorno (PRODUCCIÓN - Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('🔍 Intentando configurar Firebase desde variable de entorno...');
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin configurado desde variable de entorno (PRODUCCIÓN)');
  } 
  // OPCIÓN 2: Intentar desde archivo local (DESARROLLO)
  else {
    console.log('🔍 Variable de entorno no encontrada, intentando archivo local...');
    
    const serviceAccount = require('./serviceAccountKey.json');
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin configurado desde archivo local (DESARROLLO)');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin no configurado. Login con Google deshabilitado.');
  console.warn('Para habilitar:');
  console.warn('  - Producción: configura la variable FIREBASE_SERVICE_ACCOUNT en Render');
  console.warn('  - Desarrollo: descarga serviceAccountKey.json de Firebase Console');
  console.error('Error detallado:', error.message);
}

// Verificar Firebase ID Token
const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseInitialized) {
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
  firebaseInitialized,
};