const Usuario = require('../../../models/Usuario');

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
