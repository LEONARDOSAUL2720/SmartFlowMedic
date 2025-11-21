const Cita = require('../../../models/Cita');
const Usuario = require('../../../models/Usuario');
const Especialidad = require('../../../models/Especialidad');
const mongoose = require('mongoose');

/**
 * @desc    Obtener todas las citas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId
 * @access  Private
 */
exports.getCitasPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { estado } = req.query; // Filtro opcional por estado

    // Validar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado',
      });
    }

    // Construir query
    const query = { pacienteId };
    if (estado) {
      query.estado = estado;
    }

    // Obtener citas con información del médico y especialidades
    const citas = await Cita.find(query)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.especialidades medicoInfo.tarifaConsulta',
        populate: {
          path: 'medicoInfo.especialidades',
          model: 'Especialidad',
          select: 'nombre descripcion'
        }
      })
      .sort({ fecha: 1, hora: 1 }); // Ordenar por fecha y hora ascendente

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => {
      const medico = cita.medicoId;
      const especialidades = medico?.medicoInfo?.especialidades || [];
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        monto: cita.monto,
        pagado: cita.pagado,
        modoPago: cita.modoPago,
        medico: {
          _id: medico?._id,
          nombre: medico?.nombre,
          apellido: medico?.apellido,
          foto: medico?.foto,
          especialidades: especialidades.map(esp => ({
            _id: esp._id,
            nombre: esp.nombre,
            descripcion: esp.descripcion
          })),
          tarifaConsulta: medico?.medicoInfo?.tarifaConsulta
        },
        recetaId: cita.recetaId,
        calificacion: cita.calificacion,
        comentarios: cita.comentarios,
        creadoEn: cita.creadoEn
      };
    });

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('Error al obtener citas del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener citas pendientes/confirmadas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId/proximas
 * @access  Private
 */
exports.getCitasProximas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const citas = await Cita.find({
      pacienteId,
      estado: { $in: ['pendiente', 'confirmada'] },
      fecha: { $gte: new Date() } // Solo citas futuras
    })
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.especialidades',
        populate: {
          path: 'medicoInfo.especialidades',
          model: 'Especialidad',
          select: 'nombre'
        }
      })
      .sort({ fecha: 1, hora: 1 });

    const citasFormateadas = citas.map(cita => {
      const medico = cita.medicoId;
      const especialidades = medico?.medicoInfo?.especialidades || [];
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        monto: cita.monto,
        medico: {
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidades[0]?.nombre || 'Médico General'
        }
      };
    });

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('Error al obtener citas próximas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas próximas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de citas completadas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId/historial
 * @access  Private
 */
exports.getHistorialCitas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const citas = await Cita.find({
      pacienteId,
      estado: 'completada'
    })
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.especialidades',
        populate: {
          path: 'medicoInfo.especialidades',
          model: 'Especialidad',
          select: 'nombre'
        }
      })
      .populate('recetaId')
      .sort({ fecha: -1 }); // Más recientes primero

    const citasFormateadas = citas.map(cita => {
      const medico = cita.medicoId;
      const especialidades = medico?.medicoInfo?.especialidades || [];
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        motivo: cita.motivo,
        medico: {
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidades[0]?.nombre || 'Médico General'
        },
        tieneReceta: !!cita.recetaId,
        calificacion: cita.calificacion
      };
    });

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('Error al obtener historial de citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener TODAS las citas del día actual (fila virtual)
 * @route   GET /api/mobile/citas/hoy
 * @access  Private
 */
exports.getCitasHoy = async (req, res) => {
  try {
    const { especialidadId, medicoId } = req.query;

    // Obtener fecha de hoy (inicio y fin del día)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    // Construir query
    const query = {
      fecha: { $gte: hoy, $lt: mañana },
      estado: { $in: ['pendiente', 'confirmada', 'completada'] }
    };

    if (medicoId) {
      query.medicoId = medicoId;
    }

    // Obtener citas con populate
    let citas = await Cita.find(query)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.especialidades',
        populate: {
          path: 'medicoInfo.especialidades',
          model: 'Especialidad',
          select: '_id nombre codigo'
        }
      })
      .populate('pacienteId', 'nombre apellido foto')
      .sort({ hora: 1 });

    // Filtrar por especialidad si se proporciona
    if (especialidadId) {
      citas = citas.filter(cita => {
        const especialidades = cita.medicoId?.medicoInfo?.especialidades || [];
        return especialidades.some(esp => esp._id.toString() === especialidadId);
      });
    }

    // Agrupar por hora
    const citasPorHora = {};
    citas.forEach(cita => {
      const hora = cita.hora;
      if (!citasPorHora[hora]) {
        citasPorHora[hora] = [];
      }

      const medico = cita.medicoId;
      const paciente = cita.pacienteId;
      const especialidades = medico?.medicoInfo?.especialidades || [];

      citasPorHora[hora].push({
        _id: cita._id,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        medico: {
          _id: medico?._id,
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidades[0]?.nombre || 'General',
          especialidadCodigo: especialidades[0]?.codigo || 'M'
        },
        paciente: {
          _id: paciente?._id,
          nombre: `${paciente?.nombre} ${paciente?.apellido}`,
          foto: paciente?.foto
        }
      });
    });

    // Convertir a array ordenado
    const resultado = Object.keys(citasPorHora)
      .sort()
      .map(hora => ({
        hora,
        citas: citasPorHora[hora]
      }));

    res.status(200).json({
      success: true,
      fecha: hoy,
      totalCitas: citas.length,
      data: resultado
    });

  } catch (error) {
    console.error('Error al obtener citas de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas de hoy',
      error: error.message
    });
  }
};

/**
 * @desc    Crear una nueva cita
 * @route   POST /api/mobile/citas/crear
 * @access  Private
 */
exports.crearCita = async (req, res) => {
  try {
    const { pacienteId, medicoId, fecha, hora, motivo, modoPago } = req.body;

    // 1. Validar campos requeridos
    if (!pacienteId || !medicoId || !fecha || !hora || !motivo || !modoPago) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: pacienteId, medicoId, fecha, hora, motivo, modoPago'
      });
    }

    // 2. Validar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado o rol inválido'
      });
    }

    // 3. Validar que el médico existe y obtener su info
    const medico = await Usuario.findById(medicoId).populate('medicoInfo.especialidades');
    if (!medico || medico.rol !== 'medico') {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado o rol inválido'
      });
    }

    // 4. Validar que el médico tenga tarifaConsulta
    if (!medico.medicoInfo?.tarifaConsulta) {
      return res.status(400).json({
        success: false,
        message: 'El médico no tiene tarifa de consulta configurada'
      });
    }

    // 5. Validar fecha (debe ser hoy o futura)
    const fechaCita = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de la cita no puede ser anterior a hoy'
      });
    }

    // 6. Validar que el médico trabaje ese día y hora
    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaCita.getDay()];
    const horariosDisponibles = medico.medicoInfo?.horariosDisponibles || [];
    
    const trabajaEseDia = horariosDisponibles.find(h => h.dia === diaSemana);
    if (!trabajaEseDia) {
      return res.status(400).json({
        success: false,
        message: `El médico no trabaja los días ${diaSemana}`
      });
    }

    // 7. Validar que la hora esté dentro del horario del médico
    const [horaInicio, minutoInicio] = trabajaEseDia.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = trabajaEseDia.horaFin.split(':').map(Number);
    const [horaCita, minutoCita] = hora.split(':').map(Number);
    
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = horaFin * 60 + minutoFin;
    const minutosCita = horaCita * 60 + minutoCita;
    
    if (minutosCita < minutosInicio || minutosCita >= minutosFin) {
      return res.status(400).json({
        success: false,
        message: `El médico trabaja de ${trabajaEseDia.horaInicio} a ${trabajaEseDia.horaFin} los ${diaSemana}`
      });
    }

    // 8. Verificar que no exista otra cita en ese horario
    const citaExistente = await Cita.findOne({
      medicoId,
      fecha: fechaCita,
      hora,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (citaExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cita en ese horario. Por favor selecciona otra hora.'
      });
    }

    // 9. Crear la cita
    const nuevaCita = await Cita.create({
      pacienteId,
      medicoId,
      fecha: fechaCita,
      hora,
      estado: 'pendiente',
      motivo,
      modoPago,
      pagado: false,
      monto: medico.medicoInfo.tarifaConsulta
    });

    // 10. Populate para devolver datos completos
    const citaCompleta = await Cita.findById(nuevaCita._id)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.especialidades medicoInfo.tarifaConsulta',
        populate: {
          path: 'medicoInfo.especialidades',
          model: 'Especialidad',
          select: 'nombre codigo descripcion'
        }
      })
      .populate('pacienteId', 'nombre apellido email foto');

    // 11. Formatear respuesta
    const medico_data = citaCompleta.medicoId;
    const paciente_data = citaCompleta.pacienteId;
    const especialidades = medico_data?.medicoInfo?.especialidades || [];

    const respuesta = {
      _id: citaCompleta._id,
      fecha: citaCompleta.fecha,
      hora: citaCompleta.hora,
      estado: citaCompleta.estado,
      motivo: citaCompleta.motivo,
      monto: citaCompleta.monto,
      pagado: citaCompleta.pagado,
      modoPago: citaCompleta.modoPago,
      medico: {
        _id: medico_data?._id,
        nombre: medico_data?.nombre,
        apellido: medico_data?.apellido,
        foto: medico_data?.foto,
        especialidades: especialidades.map(esp => ({
          _id: esp._id,
          nombre: esp.nombre,
          codigo: esp.codigo,
          descripcion: esp.descripcion
        })),
        tarifaConsulta: medico_data?.medicoInfo?.tarifaConsulta
      },
      paciente: {
        _id: paciente_data?._id,
        nombre: paciente_data?.nombre,
        apellido: paciente_data?.apellido,
        email: paciente_data?.email,
        foto: paciente_data?.foto
      },
      creadoEn: citaCompleta.creadoEn
    };

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: respuesta
    });

  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la cita',
      error: error.message
    });
  }
};

/**
 * @desc    Verificar si hay cambios en las citas desde la última actualización (Polling inteligente)
 * @route   GET /api/mobile/citas/verificar-cambios/:userId
 * @access  Private
 */
exports.verificarCambiosCitas = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ultimaActualizacion } = req.query;

    // Validar parámetros
    if (!userId || !ultimaActualizacion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos (userId y ultimaActualizacion)'
      });
    }

    // ✅ Validar que userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'El userId proporcionado no es un ObjectId válido'
      });
    }

    // Convertir timestamp a fecha
    const ultimaActualizacionDate = new Date(parseInt(ultimaActualizacion));

    // Validar que la fecha sea válida
    if (isNaN(ultimaActualizacionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'El timestamp proporcionado no es válido'
      });
    }

    // Buscar citas que se crearon o actualizaron después de la última verificación
    const citasNuevas = await Cita.find({
      pacienteId: userId,
      $or: [
        { createdAt: { $gt: ultimaActualizacionDate } },
        { updatedAt: { $gt: ultimaActualizacionDate } }
      ]
    });

    res.json({
      success: true,
      data: {
        hayNuevas: citasNuevas.length > 0,
        cantidad: citasNuevas.length,
        ultimaActualizacion: Date.now()
      }
    });

  } catch (error) {
    console.error('Error al verificar cambios en citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar cambios',
      error: error.message
    });
  }
}; 