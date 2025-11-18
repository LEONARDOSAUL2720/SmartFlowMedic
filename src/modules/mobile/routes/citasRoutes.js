const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');

// Rutas para citas del paciente
router.get('/paciente/:pacienteId', citasController.getCitasPaciente);
router.get('/paciente/:pacienteId/proximas', citasController.getCitasProximas);
router.get('/paciente/:pacienteId/historial', citasController.getHistorialCitas);

// Nueva ruta para fila virtual de citas HOY
router.get('/hoy', citasController.getCitasHoy);

module.exports = router;
