const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

// Rutas de autenticación móvil
router.use('/auth', authRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Mobile funcionando correctamente',
    platform: 'Android',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
