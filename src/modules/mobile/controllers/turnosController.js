const Turno = require('../../../models/Turno');
const Especialidad = require('../../../models/Especialidad');
const Usuario = require('../../../models/Usuario');

// Obtener turnos del día por especialidad
const getTurnosDelDia = async (req, res) => {
  try {
    const { especialidadId } = req.params;
    const fecha = req.query.fecha ? new Date(req.query.fecha) : new Date();

    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    const turnos = await Turno.find({
      especialidad: especialidadId,
      fecha: {
        $gte: inicioDelDia,
        $lte: finDelDia
      }
    })
    .populate('paciente', 'nombre apellido')
    .populate('medico', 'nombre apellido medicoInfo')
    .populate('especialidad', 'nombre codigo')
    .sort({ posicionEnFila: 1 });

    // Calcular estadísticas
    const enEspera = turnos.filter(t => t.estado === 'en_espera').length;
    const atendiendo = turnos.filter(t => t.estado === 'atendiendo').length;
    const completados = turnos.filter(t => t.estado === 'completado').length;

    res.json({
      success: true,
      count: turnos.length,
      estadisticas: {
        enEspera,
        atendiendo,
        completados,
        tiempoEstimadoTotal: enEspera * 15
      },
      data: turnos
    });
  } catch (error) {
    console.error('Error en getTurnosDelDia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos del día',
      error: error.message
    });
  }
};

// Obtener resumen de turnos por todas las especialidades (para el home)
const getResumenTurnosHoy = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDelDia = new Date(hoy);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(hoy);
    finDelDia.setHours(23, 59, 59, 999);

    const especialidades = await Especialidad.find({ activa: true });
    
    const resumen = await Promise.all(
      especialidades.map(async (esp) => {
        const turnos = await Turno.find({
          especialidad: esp._id,
          fecha: {
            $gte: inicioDelDia,
            $lte: finDelDia
          },
          estado: { $in: ['en_espera', 'llamando', 'atendiendo'] }
        });

        const enEspera = turnos.filter(t => t.estado === 'en_espera').length;
        const atendiendo = turnos.find(t => t.estado === 'atendiendo');

        return {
          especialidad: {
            _id: esp._id,
            nombre: esp.nombre,
            codigo: esp.codigo
          },
          turnosEnEspera: enEspera,
          turnoActual: atendiendo ? atendiendo.turno : null,
          tiempoEstimado: enEspera * 15,
          disponible: true
        };
      })
    );

    res.json({
      success: true,
      count: resumen.length,
      data: resumen.filter(r => r.turnosEnEspera > 0 || r.turnoActual)
    });
  } catch (error) {
    console.error('Error en getResumenTurnosHoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de turnos',
      error: error.message
    });
  }
};

// Tomar un turno virtual
const tomarTurno = async (req, res) => {
  try {
    const { pacienteId, especialidadId, medicoId, motivo } = req.body;

    if (!pacienteId || !especialidadId) {
      return res.status(400).json({
        success: false,
        message: 'pacienteId y especialidadId son requeridos'
      });
    }

    // Verificar que el paciente no tenga ya un turno activo hoy
    const hoy = new Date();
    const inicioDelDia = new Date(hoy);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(hoy);
    finDelDia.setHours(23, 59, 59, 999);

    const turnoExistente = await Turno.findOne({
      paciente: pacienteId,
      especialidad: especialidadId,
      fecha: {
        $gte: inicioDelDia,
        $lte: finDelDia
      },
      estado: { $in: ['en_espera', 'llamando', 'atendiendo'] }
    });

    if (turnoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un turno activo en esta especialidad',
        turno: turnoExistente
      });
    }

    // Buscar médico disponible si no se especificó
    let medico = medicoId;
    if (!medico) {
      const medicosDisponibles = await Usuario.find({
        rol: 'medico',
        'medicoInfo.especialidades': especialidadId,
        activo: true
      });

      if (medicosDisponibles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No hay médicos disponibles para esta especialidad'
        });
      }

      // Seleccionar el médico con menos turnos pendientes
      const turnoPorMedico = await Promise.all(
        medicosDisponibles.map(async (med) => {
          const count = await Turno.countDocuments({
            medico: med._id,
            fecha: {
              $gte: inicioDelDia,
              $lte: finDelDia
            },
            estado: { $in: ['en_espera', 'llamando'] }
          });
          return { medico: med._id, turnos: count };
        })
      );

      medico = turnoPorMedico.sort((a, b) => a.turnos - b.turnos)[0].medico;
    }

    // Generar número de turno y posición
    const numeroTurno = await Turno.generarNumeroTurno(especialidadId, hoy);
    const posicion = await Turno.calcularPosicionEnFila(especialidadId, hoy);

    // Crear el turno
    const nuevoTurno = new Turno({
      paciente: pacienteId,
      medico: medico,
      especialidad: especialidadId,
      fecha: hoy,
      turno: numeroTurno,
      posicionEnFila: posicion,
      tiempoEstimadoMin: posicion * 15,
      motivo: motivo || 'Consulta sin cita previa',
      esTurnoVirtual: true
    });

    await nuevoTurno.save();

    // Popular los datos para la respuesta
    await nuevoTurno.populate('paciente', 'nombre apellido');
    await nuevoTurno.populate('medico', 'nombre apellido medicoInfo');
    await nuevoTurno.populate('especialidad', 'nombre codigo');

    res.status(201).json({
      success: true,
      message: 'Turno tomado exitosamente',
      data: nuevoTurno
    });
  } catch (error) {
    console.error('Error en tomarTurno:', error);
    res.status(500).json({
      success: false,
      message: 'Error al tomar turno',
      error: error.message
    });
  }
};

// Obtener mi turno activo
const getMiTurnoActivo = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const hoy = new Date();
    const inicioDelDia = new Date(hoy);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(hoy);
    finDelDia.setHours(23, 59, 59, 999);

    const turnoActivo = await Turno.findOne({
      paciente: pacienteId,
      fecha: {
        $gte: inicioDelDia,
        $lte: finDelDia
      },
      estado: { $in: ['en_espera', 'llamando', 'atendiendo'] }
    })
    .populate('medico', 'nombre apellido medicoInfo')
    .populate('especialidad', 'nombre codigo')
    .sort({ horaLlegada: -1 });

    if (!turnoActivo) {
      return res.json({
        success: true,
        message: 'No tienes turnos activos',
        data: null
      });
    }

    // Calcular turnos adelante
    const turnosAdelante = await Turno.countDocuments({
      especialidad: turnoActivo.especialidad,
      fecha: {
        $gte: inicioDelDia,
        $lte: finDelDia
      },
      posicionEnFila: { $lt: turnoActivo.posicionEnFila },
      estado: { $in: ['en_espera', 'llamando'] }
    });

    res.json({
      success: true,
      data: {
        ...turnoActivo.toObject(),
        turnosAdelante,
        tiempoEstimadoMin: turnosAdelante * 15
      }
    });
  } catch (error) {
    console.error('Error en getMiTurnoActivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turno activo',
      error: error.message
    });
  }
};

// Cancelar turno
const cancelarTurno = async (req, res) => {
  try {
    const { turnoId } = req.params;

    const turno = await Turno.findById(turnoId);

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    if (turno.estado === 'completado' || turno.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'Este turno ya fue completado o cancelado'
      });
    }

    turno.estado = 'cancelado';
    await turno.save();

    res.json({
      success: true,
      message: 'Turno cancelado exitosamente',
      data: turno
    });
  } catch (error) {
    console.error('Error en cancelarTurno:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar turno',
      error: error.message
    });
  }
};

// Obtener horarios disponibles para tomar turnos hoy
const getHorariosDisponibles = async (req, res) => {
  try {
    const { especialidadId, medicoId } = req.query;

    console.log('═══════════════════════════════════');
    console.log('=== GET HORARIOS DISPONIBLES HOY ===');
    console.log('especialidadId:', especialidadId || 'todos');
    console.log('medicoId:', medicoId || 'todos');

    const hoy = new Date();
    const diaHoy = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][hoy.getDay()];
    const inicioDelDia = new Date(hoy);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(hoy);
    finDelDia.setHours(23, 59, 59, 999);

    console.log('📅 Día:', diaHoy);
    console.log('📅 Fecha:', inicioDelDia);

    // ✅ Construir query de médicos
    const queryMedicos = {
      rol: 'medico',
      activo: true,
      'medicoInfo.horariosDisponibles': {
        $elemMatch: { dia: diaHoy }
      }
    };

    if (especialidadId) {
      queryMedicos['medicoInfo.especialidades'] = especialidadId;
    }

    if (medicoId) {
      queryMedicos._id = medicoId;
    }

    // ✅ Obtener médicos que trabajan HOY
    const medicos = await Usuario.find(queryMedicos)
      .populate('medicoInfo.especialidades', 'nombre codigo')
      .select('nombre apellido foto medicoInfo');

    console.log(`✅ Se encontraron ${medicos.length} médicos que trabajan hoy`);

    if (medicos.length === 0) {
      return res.json({
        success: true,
        message: 'No hay médicos disponibles hoy',
        data: []
      });
    }

    // ✅ Obtener todas las citas de HOY para calcular disponibilidad
    const citasHoy = await require('../../../models/Cita').find({
      fecha: { $gte: inicioDelDia, $lte: finDelDia },
      estado: { $in: ['pendiente', 'confirmada'] }
    }).select('medicoId hora');

    // Crear mapa de horas ocupadas por médico
    const horasOcupadasPorMedico = {};
    citasHoy.forEach(cita => {
      const medicoIdStr = cita.medicoId.toString();
      if (!horasOcupadasPorMedico[medicoIdStr]) {
        horasOcupadasPorMedico[medicoIdStr] = new Set();
      }
      horasOcupadasPorMedico[medicoIdStr].add(cita.hora);
    });

    console.log('📊 Médicos con citas ocupadas:', Object.keys(horasOcupadasPorMedico).length);

    // ✅ Generar horarios disponibles para cada médico
    const horariosDisponibles = [];

    medicos.forEach(medico => {
      const horarios = medico.medicoInfo?.horariosDisponibles || [];
      
      // Filtrar horarios de hoy
      const horariosHoy = horarios.filter(h => h.dia === diaHoy);

      horariosHoy.forEach(horario => {
        // Generar slots de 30 minutos
        const slots = generarSlots(horario.horaInicio, horario.horaFin, 30);
        
        // Filtrar slots ya ocupados
        const medicoIdStr = medico._id.toString();
        const horasOcupadas = horasOcupadasPorMedico[medicoIdStr] || new Set();
        const slotsDisponibles = slots.filter(slot => !horasOcupadas.has(slot));

        if (slotsDisponibles.length > 0) {
          const especialidades = medico.medicoInfo?.especialidades || [];

          horariosDisponibles.push({
            medico: {
              _id: medico._id,
              nombre: `${medico.nombre} ${medico.apellido}`,
              foto: medico.foto,
              especialidades: especialidades.map(esp => ({
                _id: esp._id,
                nombre: esp.nombre,
                codigo: esp.codigo
              }))
            },
            horarioTrabajo: {
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin
            },
            horariosDisponibles: slotsDisponibles,
            cantidadDisponibles: slotsDisponibles.length
          });
        }
      });
    });

    console.log(`✅ ${horariosDisponibles.length} médicos con horarios disponibles`);
    console.log('═══════════════════════════════════');

    res.json({
      success: true,
      fecha: hoy,
      diaSemana: diaHoy,
      data: horariosDisponibles
    });
  } catch (error) {
    console.error('❌ Error en getHorariosDisponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles',
      error: error.message
    });
  }
};

// ✅ Función auxiliar para generar slots de tiempo
function generarSlots(horaInicio, horaFin, intervaloMinutos) {
  const slots = [];
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);

  let minutoActual = horaInicioH * 60 + horaInicioM;
  const minutoFin = horaFinH * 60 + horaFinM;

  while (minutoActual < minutoFin) {
    const horas = Math.floor(minutoActual / 60);
    const minutos = minutoActual % 60;
    const horaFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    slots.push(horaFormateada);
    minutoActual += intervaloMinutos;
  }

  return slots;
}

module.exports = {
  getTurnosDelDia,
  getResumenTurnosHoy,
  tomarTurno,
  getMiTurnoActivo,
  cancelarTurno,
  getHorariosDisponibles
};
