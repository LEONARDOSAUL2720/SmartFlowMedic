const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');

// POST /api/mobile/calificaciones - Calificar a un médico
router.post('/', calificacionesController.calificarMedico);

// GET /api/mobile/calificaciones/:medicoId - Obtener calificación de un médico
router.get('/:medicoId', calificacionesController.getCalificacionMedico);

module.exports = router;