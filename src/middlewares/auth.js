const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/env');

// Proteger rutas - Verificar token JWT
exports.protect = async (req, res, next) => {
  let token;

  // Verificar si el token viene en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar que el token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado para acceder a esta ruta',
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Obtener usuario del token
    req.user = await Usuario.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

// Autorizar roles específicos
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no tiene permisos para acceder a esta ruta`,
      });
    }
    next();
  };
};

// Verificar plataforma (web o mobile)
exports.checkPlatform = (platform) => {
  return (req, res, next) => {
    if (req.user.platform !== platform) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Esta ruta es solo para plataforma ${platform}`,
      });
    }
    next();
  };
};
