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

module.exports = {
  getTurnosDelDia,
  getResumenTurnosHoy,
  tomarTurno,
  getMiTurnoActivo,
  cancelarTurno
};
