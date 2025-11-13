const { body } = require('express-validator');

// Validaciones para registro
exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

// Validaciones para login
exports.loginValidation = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

// Validaciones para productos
exports.productValidation = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es requerido'),
  body('description').trim().notEmpty().withMessage('La descripción es requerida'),
  body('price').isNumeric().withMessage('El precio debe ser un número'),
  body('category').trim().notEmpty().withMessage('La categoría es requerida'),
];
