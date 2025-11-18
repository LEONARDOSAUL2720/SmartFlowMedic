const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');

// GET - Obtener resumen de turnos de hoy (todas las especialidades)
router.get('/resumen/hoy', turnosController.getResumenTurnosHoy);

// GET - Obtener horarios disponibles para tomar turnos
router.get('/horarios-disponibles', turnosController.getHorariosDisponibles);

// GET - Obtener turnos del día por especialidad
router.get('/especialidad/:especialidadId', turnosController.getTurnosDelDia);

// POST - Tomar un turno virtual
router.post('/tomar', turnosController.tomarTurno);

// GET - Obtener mi turno activo
router.get('/paciente/:pacienteId/activo', turnosController.getMiTurnoActivo);

// DELETE - Cancelar turno
router.delete('/:turnoId', turnosController.cancelarTurno);

module.exports = router;
