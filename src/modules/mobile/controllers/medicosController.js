const Usuario = require('../../../models/Usuario');
const Cita = require('../../../models/Cita');

/**
 * GET /api/mobile/medicos/especialidad/:especialidadId
 * Obtener médicos por especialidad
 */
exports.getMedicosPorEspecialidad = async (req, res) => {
  try {
    const { especialidadId } = req.params;

    const medicos = await Usuario.find({
      rol: 'medico',
      activo: true,
      'medicoInfo.especialidades': especialidadId
    })
      .select('_id nombre apellido foto medicoInfo.cedula medicoInfo.calificacionPromedio medicoInfo.tarifaConsulta')
      .sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: medicos
    });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener médicos',
      error: error.message
    });
  }
};

/**
 * GET /api/mobile/medicos
 * Obtener todos los médicos activos
 */
exports.getMedicos = async (req, res) => {
  try {
    const medicos = await Usuario.find({
      rol: 'medico',
      activo: true
    })
      .populate('medicoInfo.especialidades', 'nombre codigo')
      .select('_id nombre apellido foto medicoInfo')
      .sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: medicos
    });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener médicos',
      error: error.message
    });
  }
};

exports.getMedicoById = async (req, res) => {
  try {
    const { medicoId } = req.params;

    const medico = await Usuario.findOne({
      _id: medicoId,
      rol: 'medico',
      activo: true
    })
      .populate('medicoInfo.especialidades', 'nombre codigo descripcion')
      .select('_id nombre apellido email telefono foto medicoInfo');

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: medico
    });
  } catch (error) {
    console.error('Error al obtener médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del médico',
      error: error.message
    });
  }
};

// ... (tus métodos existentes) ...

/**
 * GET /api/mobile/medicos/:medicoId/disponibilidad
 * Obtener disponibilidad REAL del médico (fechas y horas libres)
 */
exports.getDisponibilidad = async (req, res) => {
  try {
    const { medicoId } = req.params;

    console.log('═══════════════════════════════════');
    console.log('=== GET DISPONIBILIDAD REAL ===');
    console.log('medicoId:', medicoId);

    // Validar que el médico existe
    const medico = await Usuario.findOne({
      _id: medicoId,
      rol: 'medico',
      activo: true
    }).select('nombre apellido medicoInfo.horariosDisponibles');

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    const horariosDisponibles = medico.medicoInfo?.horariosDisponibles || [];
    
    if (horariosDisponibles.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    console.log('⏰ Horarios configurados del médico:', horariosDisponibles);

    // Generar próximos 30 días de disponibilidad
    const diasAGenerar = 30;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const disponibilidadPorDia = [];

    // Iterar sobre los próximos 30 días
    for (let i = 0; i < diasAGenerar; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
      
      // Verificar si el médico trabaja este día
      const horarioDia = horariosDisponibles.find(h => h.dia === diaSemana);
      
      if (!horarioDia) {
        continue; // El médico no trabaja este día
      }

      // Generar slots de tiempo cada 30 minutos
      const slots = generarSlotsDeHorario(horarioDia.horaInicio, horarioDia.horaFin);
      
      // Formatear fecha como YYYY-MM-DD
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Consultar citas ocupadas para este día y médico
      const citasOcupadas = await Cita.find({
        medicoId: medicoId,
        fecha: fecha,
        estado: { $in: ['pendiente', 'confirmada'] }
      }).select('hora');

      // Extraer solo las horas ocupadas
      const horasOcupadas = citasOcupadas.map(c => c.hora);
      
      console.log(`📅 ${fechaStr} (${diaSemana}): ${horasOcupadas.length} citas ocupadas`);

      // Filtrar slots libres
      const slotsLibres = slots.filter(slot => !horasOcupadas.includes(slot));
      
      // Solo agregar si hay slots libres
      if (slotsLibres.length > 0) {
        disponibilidadPorDia.push({
          fecha: fechaStr,
          dia: diaSemana,
          horarios: slotsLibres
        });
      }
    }

    console.log(`✅ Se generaron ${disponibilidadPorDia.length} días con disponibilidad`);
    console.log('═══════════════════════════════════');

    res.status(200).json({
      success: true,
      data: disponibilidadPorDia
    });

  } catch (error) {
    console.error('❌ Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

/**
 * Función auxiliar para generar slots de tiempo cada 30 minutos
 * @param {string} horaInicio - Formato "HH:MM"
 * @param {string} horaFin - Formato "HH:MM"
 * @returns {string[]} Array de horarios en formato "HH:MM"
 */
function generarSlotsDeHorario(horaInicio, horaFin) {
  const slots = [];
  
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
  
  let minutosActual = horaInicioH * 60 + horaInicioM;
  const minutosFin = horaFinH * 60 + horaFinM;
  
  const intervalo = 30; // Intervalo de 30 minutos entre citas
  
  while (minutosActual < minutosFin) {
    const horas = Math.floor(minutosActual / 60);
    const minutos = minutosActual % 60;
    
    const horaFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    slots.push(horaFormateada);
    
    minutosActual += intervalo;
  }
  
  return slots;
}
