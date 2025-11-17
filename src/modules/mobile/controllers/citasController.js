const Cita = require('../../../models/Cita');
const Usuario = require('../../../models/Usuario');
const Especialidad = require('../../../models/Especialidad');

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
