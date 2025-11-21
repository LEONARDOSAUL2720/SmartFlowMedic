const express = require('express');
const router = express.Router();
const Usuario = require('../../../models/Usuario');

// Utilidad para obtener el número de día de la semana en español a número JS (0=Domingo, 1=Lunes...)
const diasSemana = {
  'Domingo': 0,
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Miercoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6,
  'Sabado': 6
};

// Genera un array de strings de horas entre horaInicio y horaFin (formato 'HH:mm')
function generarHorarios(horaInicio, horaFin) {
  const horarios = [];
  let [h, m] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  while (h < hFin || (h === hFin && m < mFin)) {
    horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    h++;
    m = 0;
  }
  return horarios;
}

// GET /medicos/:id/disponibilidad
router.get('/:id/disponibilidad', async (req, res) => {
  try {
    const medicoId = req.params.id;
    const medico = await Usuario.findOne({ _id: medicoId, rol: 'medico' });
    if (!medico) return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    const horarios = medico.medicoInfo?.horariosDisponibles || [];

    // Generar próximos 15 días con horarios (incluyendo hoy si hay disponibilidad futura)
    const resultado = [];
    const hoy = new Date();
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes...
      // Buscar si el médico atiende ese día
      const horarioDia = horarios.find(h => diasSemana[h.dia] === diaSemana);
      if (horarioDia) {
        const fechaStr = fecha.toISOString().slice(0, 10); // yyyy-mm-dd
        let horariosDisponibles = generarHorarios(horarioDia.horaInicio, horarioDia.horaFin);
        // Si es hoy, filtra solo horarios futuros
        if (i === 0) {
          const ahora = new Date();
          horariosDisponibles = horariosDisponibles.filter(hora => {
            const [h, m] = hora.split(':').map(Number);
            return h > ahora.getHours() || (h === ahora.getHours() && m > ahora.getMinutes());
          });
        }
        if (horariosDisponibles.length > 0) {
          resultado.push({ fecha: fechaStr, horarios: horariosDisponibles });
        }
      }
    }
    res.json({ success: true, data: resultado });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error del servidor', error: err.message });
  }
});

module.exports = router;
