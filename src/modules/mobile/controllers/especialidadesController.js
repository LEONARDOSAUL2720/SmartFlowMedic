const Especialidad = require('../../../models/Especialidad');

/**
 * GET /api/mobile/especialidades
 * Obtener todas las especialidades activas
 */
exports.getEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.find({ activa: true })
      .select('_id nombre codigo descripcion')
      .sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: especialidades
    });
  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades',
      error: error.message
    });
  }
};
