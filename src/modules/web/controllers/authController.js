const Usuario = require('../../../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../../../config/env');

// @desc    Login de usuario web
// @route   POST /api/web/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña',
      });
    }

    // Buscar usuario con password
    const user = await Usuario.findOne({ email, platform: 'web' }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Crear token
    const token = jwt.sign({ id: user._id, platform: 'web' }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Registro de usuario web
// @route   POST /api/web/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await Usuario.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
      });
    }

    // Crear usuario
    const user = await Usuario.create({
      name,
      email,
      password,
      platform: 'web',
    });

    // Crear token
    const token = jwt.sign({ id: user._id, platform: 'web' }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/web/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};
