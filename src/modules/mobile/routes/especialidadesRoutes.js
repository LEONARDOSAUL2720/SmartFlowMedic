const express = require('express');
const router = express.Router();
const especialidadesController = require('../controllers/especialidadesController');

// GET - Obtener todas las especialidades activas
router.get('/', especialidadesController.getEspecialidades);

module.exports = router;
