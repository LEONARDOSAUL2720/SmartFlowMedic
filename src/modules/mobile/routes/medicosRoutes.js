const express = require('express');
const router = express.Router();
const medicosController = require('../controllers/medicosController');

// GET - Obtener médico por ID (debe ir ANTES de /especialidad para evitar conflictos)
router.get('/:medicoId', medicosController.getMedicoById);

// GET - Obtener todos los médicos activos
router.get('/', medicosController.getMedicos);

// GET - Obtener médicos por especialidad
router.get('/especialidad/:especialidadId', medicosController.getMedicosPorEspecialidad);

module.exports = router;
