const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const citasRoutes = require('./citasRoutes');
const turnosRoutes = require('./turnosRoutes');

// Rutas de autenticación móvil
router.use('/auth', authRoutes);

// Rutas de citas
router.use('/citas', citasRoutes);

// Rutas de turnos virtuales
router.use('/turnos', turnosRoutes);

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
