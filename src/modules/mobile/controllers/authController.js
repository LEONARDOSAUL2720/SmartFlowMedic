const Usuario = require('../../../models/Usuario');
const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const { verifyFirebaseToken } = require('../../../config/firebase');

// @desc    Login con Google (Firebase)
// @route   POST /api/mobile/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, rol, telefono, password } = req.body;

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

      // Validar formato de teléfono (10 dígitos)
      if (!/^\d{10}$/.test(telefono)) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono debe tener exactamente 10 dígitos',
        });
      }

      // Validar que el teléfono no esté registrado
      const telefonoExistente = await Usuario.findOne({ telefono });
      if (telefonoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Este teléfono ya está registrado',
        });
      }

      // Validar que el email no esté registrado
      const emailExistente = await Usuario.findOne({ email });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Este email ya está registrado con otro método de login',
        });
      }

      // Extraer nombre y apellido del displayName de Google
      const nombreCompleto = name || email.split('@')[0];
      const partesNombre = nombreCompleto.split(' ');
      const nombre = partesNombre[0] || nombreCompleto;
      const apellido = partesNombre.slice(1).join(' ') || 'Sin apellido';

      // Validar password si se proporciona
      if (password && password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      const userData = {
        nombre,
        apellido,
        email,
        telefono,
        password: password || '', // Password sin encriptar - el modelo lo encriptará automáticamente
        firebaseUid: uid,
        platform: 'mobile',
        rol,
        foto: picture || null,
        fechaRegistro: new Date(),
        activo: true,
      };

      // Si es médico, agregar campos requeridos de medicoInfo
      if (rol === 'medico') {
        const { cedulaProfesional, especialidad } = req.body;
        
        if (!cedulaProfesional) {
          return res.status(400).json({
            success: false,
            message: 'Cédula profesional es requerida para médicos',
          });
        }

        // Validar formato de cédula (7-8 dígitos)
        if (!/^\d{7,8}$/.test(cedulaProfesional)) {
          return res.status(400).json({
            success: false,
            message: 'La cédula profesional debe tener entre 7 y 8 dígitos',
          });
        }

        // Validar que la cédula no esté registrada
        const cedulaExistente = await Usuario.findOne({ 'medicoInfo.cedula': cedulaProfesional });
        if (cedulaExistente) {
          return res.status(400).json({
            success: false,
            message: 'Esta cédula profesional ya está registrada',
          });
        }

        if (!especialidad) {
          return res.status(400).json({
            success: false,
            message: 'Especialidad es requerida para médicos',
          });
        }

        userData.medicoInfo = {
          cedula: cedulaProfesional,
          especialidad,
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
    const { nombre, apellido, email, telefono, password, foto } = req.body;

    // Buscar el usuario actual
    const user = await Usuario.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Validar email si se proporciona y es diferente al actual
    if (email && email !== user.email) {
      // Verificar que el nuevo email no esté en uso
      const emailExists = await Usuario.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Este email ya está registrado',
        });
      }
      user.email = email;
    }

    // Validar teléfono si se proporciona
    if (telefono && !/^\d{10}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener exactamente 10 dígitos',
      });
    }

    // Actualizar campos básicos
    if (nombre) user.nombre = nombre;
    if (apellido !== undefined) user.apellido = apellido; // Permitir string vacío
    if (telefono) user.telefono = telefono;
    if (foto !== undefined) user.foto = foto;

    // Actualizar contraseña solo si se proporciona
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }
      user.password = password; // El pre-save hook del modelo la encriptará
    }

    // Si es médico y envía medicoInfo, actualizar
    if (req.user.rol === 'medico' && req.body.medicoInfo) {
      if (user.medicoInfo) {
        Object.assign(user.medicoInfo, req.body.medicoInfo);
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        foto: user.foto,
        ...(user.rol === 'medico' && user.medicoInfo && { 
          medicoInfo: user.medicoInfo
        }),
      },
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message,
    });
  }
};
