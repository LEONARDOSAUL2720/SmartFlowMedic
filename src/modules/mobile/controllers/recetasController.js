const Receta = require('../../../models/Receta');
const Usuario = require('../../../models/Usuario');

/**
 * Obtener todas las recetas de un paciente
 * GET /api/mobile/recetas/:pacienteId
 */
exports.getRecetasPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // Validar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado',
      });
    }

    // Obtener recetas del paciente con información del médico y cita
    const recetas = await Receta.find({ pacienteId })
      .populate({
  path: 'medicoId',
  select: 'nombre apellido email foto medicoInfo',  // ✅ Agregado 'apellido'
})
      .populate({
        path: 'citaId',
        select: 'fecha hora estado',
      })
      .sort({ fecha: -1 }); // Más recientes primero

    // Formatear respuesta
    const recetasFormateadas = recetas.map((receta) => ({
      _id: receta._id,
      fecha: receta.fecha,
      medicamentos: receta.medicamentos,
      observaciones: receta.observaciones,
      pdfUrl: receta.pdfUrl,
      qrCode: receta.qrCode,
      medico: {
        _id: receta.medicoId._id,
  nombre: `${receta.medicoId.nombre} ${receta.medicoId.apellido}`, // ✅ Nombre completo
  email: receta.medicoId.email,
  foto: receta.medicoId.foto || null,
  especialidad: receta.medicoId.medicoInfo?.especialidades?.[0]?.nombre || 'Sin especialidad',
  cedulaProfesional: receta.medicoId.medicoInfo?.cedula || null, // ✅ Cambiado a 'cedula'
      },
      cita: {
        _id: receta.citaId._id,
        fecha: receta.citaId.fecha,
        hora: receta.citaId.hora,
        estado: receta.citaId.estado,
      },
    }));

    res.status(200).json({
      success: true,
      count: recetasFormateadas.length,
      data: recetasFormateadas,
    });
  } catch (error) {
    console.error('❌ Error obteniendo recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas',
      error: error.message,
    });
  }
};

/**
 * Obtener una receta específica por ID
 * GET /api/mobile/recetas/detalle/:recetaId
 */
exports.getRecetaDetalle = async (req, res) => {
  try {
    const { recetaId } = req.params;

    const receta = await Receta.findById(recetaId)
      .populate({
  path: 'medicoId',
  select: 'nombre apellido email foto medicoInfo',  // ✅ Agregado 'apellido'
})
      .populate({
        path: 'citaId',
        select: 'fecha hora estado',
      });

    if (!receta) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada',
      });
    }

    const recetaFormateada = {
      _id: receta._id,
      fecha: receta.fecha,
      medicamentos: receta.medicamentos,
      observaciones: receta.observaciones,
      pdfUrl: receta.pdfUrl,
      qrCode: receta.qrCode,
      medico: {
       _id: receta.medicoId._id,
  nombre: `${receta.medicoId.nombre} ${receta.medicoId.apellido}`, // ✅ Nombre completo
  email: receta.medicoId.email,
  foto: receta.medicoId.foto || null,
  especialidad: receta.medicoId.medicoInfo?.especialidades?.[0]?.nombre || 'Sin especialidad',
  cedulaProfesional: receta.medicoId.medicoInfo?.cedula || null, // ✅ Cambiado a 'cedula'
      },
      cita: {
        _id: receta.citaId._id,
        fecha: receta.citaId.fecha,
        hora: receta.citaId.hora,
        estado: receta.citaId.estado,
      },
    };

    res.status(200).json({
      success: true,
      data: recetaFormateada,
    });
  } catch (error) {
    console.error('❌ Error obteniendo detalle de receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de receta',
      error: error.message,
    });
  }
};