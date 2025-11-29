const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');

// Rutas para citas del paciente
router.get('/paciente/:pacienteId', citasController.getCitasPaciente);
router.get('/paciente/:pacienteId/proximas', citasController.getCitasProximas);
router.get('/paciente/:pacienteId/historial', citasController.getHistorialCitas);
router.get('/paciente/:pacienteId/estadisticas', citasController.getEstadisticasPaciente);

// Nueva ruta para fila virtual de citas HOY
router.get('/hoy', citasController.getCitasHoy);

// POST - Crear nueva cita
router.post('/crear', citasController.crearCita);

//Verificar si hay cambios en las citas (Polling inteligente)
router.get('/verificar-cambios/:userId', citasController.verificarCambiosCitas);

module.exports = router;