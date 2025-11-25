const Usuario = require('../../../models/Usuario');
const Receta = require('../../../models/Receta');
const Calificacion = require('../../../models/Calificacion');

/**
 * Crear o actualizar calificación de un médico
 * POST /api/mobile/calificaciones
 */
exports.calificarMedico = async (req, res) => {
  try {
    const { medicoId, pacienteId, calificacion, comentario } = req.body;

    console.log('📊 Datos recibidos:', { medicoId, pacienteId, calificacion, comentario });

    // Validaciones
    if (!medicoId || !pacienteId || !calificacion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos (medicoId, pacienteId, calificacion)',
      });
    }

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5',
      });
    }

    // Verificar que el médico existe
    const medico = await Usuario.findById(medicoId);
    if (!medico || medico.rol !== 'medico') {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado',
      });
    }

    // Verificar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado',
      });
    }

    // ✅ VERIFICAR SI YA CALIFICÓ ANTES
    const calificacionExistente = await Calificacion.findOne({
      medicoId: medicoId,
      pacienteId: pacienteId,
    });

    if (calificacionExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya has calificado a este médico anteriormente',
      });
    }

    // Verificar que el paciente tuvo al menos una cita con este médico
    const recetaExistente = await Receta.findOne({
      medicoId: medicoId,
      pacienteId: pacienteId,
    });

    if (!recetaExistente) {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes calificar a médicos que te han atendido',
      });
    }

    // ✅ GUARDAR LA CALIFICACIÓN EN LA COLECCIÓN
    const nuevaCalificacion = new Calificacion({
      medicoId,
      pacienteId,
      recetaId: recetaExistente._id,
      calificacion,
      comentario: comentario || null,
    });

    await nuevaCalificacion.save();
    console.log('💾 Calificación guardada en BD');

    // ✅ CALCULAR NUEVA CALIFICACIÓN PROMEDIO DESDE LA COLECCIÓN
    const todasLasCalificaciones = await Calificacion.find({ medicoId });
    const totalCalificaciones = todasLasCalificaciones.length;
    const sumaCalificaciones = todasLasCalificaciones.reduce((sum, cal) => sum + cal.calificacion, 0);
    const nuevaCalificacionPromedio = sumaCalificaciones / totalCalificaciones;

    console.log(`📈 Total calificaciones: ${totalCalificaciones}, Promedio: ${nuevaCalificacionPromedio}`);

    // Actualizar médico
    medico.medicoInfo.calificacionPromedio = parseFloat(nuevaCalificacionPromedio.toFixed(2));
    medico.medicoInfo.totalCitasAtendidas = totalCalificaciones;

    await medico.save();
    console.log('✅ Médico actualizado');

    console.log(`⭐ Nueva calificación: ${calificacion} estrellas de ${paciente.nombre}`);
    if (comentario) {
      console.log(`📝 Comentario: "${comentario}"`);
    }

    res.status(200).json({
      success: true,
      message: 'Calificación registrada exitosamente',
      data: {
        medicoId: medico._id,
        nuevaCalificacionPromedio: medico.medicoInfo.calificacionPromedio,
        totalCalificaciones: medico.medicoInfo.totalCitasAtendidas,
      },
    });
  } catch (error) {
    console.error('❌ Error al calificar médico:', error);
    
    // Manejar error de duplicado (por si acaso)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya has calificado a este médico anteriormente',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar calificación',
      error: error.message,
    });
  }
};

/**
 * Obtener calificación promedio de un médico
 * GET /api/mobile/calificaciones/:medicoId
 */
exports.getCalificacionMedico = async (req, res) => {
  try {
    const { medicoId } = req.params;

    const medico = await Usuario.findById(medicoId);
    if (!medico || medico.rol !== 'medico') {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        medicoId: medico._id,
        calificacionPromedio: medico.medicoInfo?.calificacionPromedio || 0,
        totalCalificaciones: medico.medicoInfo?.totalCitasAtendidas || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificación',
      error: error.message,
    });
  }
};