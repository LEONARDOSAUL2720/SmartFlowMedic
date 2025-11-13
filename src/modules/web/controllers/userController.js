const Usuario = require('../../../models/Usuario');

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/web/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Usuario.find({ platform: 'web' });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/web/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await Usuario.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/web/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const user = await Usuario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message,
    });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/web/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await Usuario.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message,
    });
  }
};
