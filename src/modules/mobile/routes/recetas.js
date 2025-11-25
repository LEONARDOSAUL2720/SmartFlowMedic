const express = require('express');
const router = express.Router();
const recetasController = require('../controllers/recetasController');

/**
 * @route   GET /api/mobile/recetas/:pacienteId
 * @desc    Obtener todas las recetas de un paciente
 * @access  Public (debería ser Private con JWT en producción)
 */
router.get('/:pacienteId', recetasController.getRecetasPaciente);

/**
 * @route   GET /api/mobile/recetas/detalle/:recetaId
 * @desc    Obtener detalle de una receta específica
 * @access  Public (debería ser Private con JWT en producción)
 */
router.get('/detalle/:recetaId', recetasController.getRecetaDetalle);

module.exports = router;