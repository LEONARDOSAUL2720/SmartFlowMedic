const Usuario = require('../../../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const { verifyFirebaseToken } = require('../../../config/firebase');

// @desc    Login con Google (Firebase)
// @route   POST /api/mobile/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, rol, telefono } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de Firebase requerido',
      });
    }

    // Verificar el token de Firebase
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Buscar si el usuario ya existe por firebaseUid
    let user = await Usuario.findOne({ firebaseUid: uid });

    if (!user) {
      // Si no existe, crear nuevo usuario
      // Para nuevos usuarios, requerimos que especifiquen su rol
      if (!rol || !['paciente', 'medico'].includes(rol)) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el rol: paciente o medico',
          requiresUserType: true,
        });
      }

      // Validar teléfono
      if (!telefono) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono es requerido para el registro',
          requiresPhone: true,
        });
      }

      // Extraer nombre y apellido del displayName de Google
      const nombreCompleto = name || email.split('@')[0];
      const partesNombre = nombreCompleto.split(' ');
      const nombre = partesNombre[0] || nombreCompleto;
      const apellido = partesNombre.slice(1).join(' ') || 'Sin apellido';

      const userData = {
        nombre,
        apellido,
        email,
        telefono,
        firebaseUid: uid,
        platform: 'mobile',
        rol,
        foto: picture || null,
        fechaRegistro: new Date(),
        activo: true,
      };

      // Si es médico, inicializar medicoInfo vacío (se completará después)
      if (rol === 'medico') {
        userData.medicoInfo = {
          calificacionPromedio: 0,
          totalCitasAtendidas: 0
        };
      }

      user = await Usuario.create(userData);
    }

    // Generar JWT propio del backend
    const token = jwt.sign(
      { 
        id: user._id, 
        platform: 'mobile',
        rol: user.rol,
        firebaseUid: uid 
      }, 
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        foto: user.foto,
        platform: user.platform,
        ...(user.rol === 'medico' && user.medicoInfo && {
          medicoInfo: user.medicoInfo
        })
      },
    });
  } catch (error) {
    console.error('Error en googleLogin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al autenticar con Google',
      error: error.message,
    });
  }
};

// @desc    Login de usuario móvil con credenciales
// @route   POST /api/mobile/auth/login
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

    // Buscar usuario con password (puede ser web o mobile)
    const user = await Usuario.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador',
      });
    }

    // Si el usuario se registró con Google, no tiene password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta fue creada con Google. Por favor usa "Continuar con Google"',
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

    // Actualizar platform a mobile si está logueándose desde móvil
    if (user.platform !== 'mobile') {
      user.platform = 'mobile';
      await user.save();
    }

    // Crear token
    const token = jwt.sign(
      { 
        id: user._id, 
        platform: 'mobile',
        rol: user.rol 
      }, 
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        foto: user.foto,
        platform: user.platform,
        ...(user.rol === 'medico' && user.medicoInfo && { 
          medicoInfo: user.medicoInfo
        }),
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

// @desc    Registro de usuario móvil (Android)
// @route   POST /api/mobile/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password, rol, medicoInfo } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !telefono || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido, email, teléfono y contraseña son requeridos',
      });
    }

    // Validar rol
    if (!rol || !['paciente', 'medico'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el rol: paciente o medico',
      });
    }

    // Validar campos específicos para médico
    if (rol === 'medico') {
      if (!medicoInfo || !medicoInfo.cedula) {
        return res.status(400).json({
          success: false,
          message: 'Los médicos deben proporcionar su cédula profesional',
        });
      }
    }

    // Verificar si el usuario ya existe
    const userExists = await Usuario.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe',
      });
    }

    // Crear usuario móvil
    const userData = {
      nombre,
      apellido,
      email,
      telefono,
      password,
      platform: 'mobile',
      rol,
      fechaRegistro: new Date(),
      activo: true,
    };

    // Agregar información de médico si aplica
    if (rol === 'medico') {
      userData.medicoInfo = {
        cedula: medicoInfo.cedula,
        especialidades: medicoInfo.especialidades || [],
        tarifaConsulta: medicoInfo.tarifaConsulta || 0,
        descripcion: medicoInfo.descripcion || '',
        experiencia: medicoInfo.experiencia || '',
        calificacionPromedio: 0,
        totalCitasAtendidas: 0,
        ...(medicoInfo.ubicacion && { ubicacion: medicoInfo.ubicacion }),
        ...(medicoInfo.horariosDisponibles && { horariosDisponibles: medicoInfo.horariosDisponibles }),
      };
    }

    const user = await Usuario.create(userData);

    // Crear token
    const token = jwt.sign(
      { 
        id: user._id, 
        platform: 'mobile',
        rol: user.rol 
      }, 
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        platform: user.platform,
        ...(user.rol === 'medico' && user.medicoInfo && { 
          medicoInfo: user.medicoInfo
        }),
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

// @desc    Obtener perfil de usuario móvil
// @route   GET /api/mobile/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).populate('medicoInfo.especialidades');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        foto: user.foto,
        activo: user.activo,
        fechaRegistro: user.fechaRegistro,
        ...(user.rol === 'medico' && user.medicoInfo && { 
          medicoInfo: user.medicoInfo
        }),
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

// @desc    Actualizar perfil móvil
// @route   PUT /api/mobile/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      telefono: req.body.telefono,
      foto: req.body.foto,
    };

    // Remover campos undefined
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Si es médico y envía medicoInfo, actualizar
    if (req.user.rol === 'medico' && req.body.medicoInfo) {
      const user = await Usuario.findById(req.user.id);
      
      // Actualizar campos de medicoInfo
      if (user.medicoInfo) {
        Object.assign(user.medicoInfo, req.body.medicoInfo);
        Object.assign(user, fieldsToUpdate);
        await user.save();
        
        return res.json({
          success: true,
          data: user,
        });
      }
    }

    const user = await Usuario.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message,
    });
  }
};
