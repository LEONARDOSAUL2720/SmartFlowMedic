const Cita = require('../../../models/Cita');
const Usuario = require('../../../models/Usuario');
const Especialidad = require('../../../models/Especialidad');
const mongoose = require('mongoose');

/**
 * @desc    Obtener todas las citas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId
 * @access  Private
 */
exports.getCitasPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { estado } = req.query;

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'pacienteId no es válido',
      });
    }

    // Validar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado',
      });
    }

    // Construir query
    const query = { pacienteId: new mongoose.Types.ObjectId(pacienteId) };
    if (estado) {
      query.estado = estado;
    }

    // ✅ Obtener citas con especialidadId
    const citas = await Cita.find(query)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.tarifaConsulta'
      })
      .populate('especialidadId', 'nombre codigo descripcion')  // ✅ NUEVO
      .sort({ fecha: 1, hora: 1 });

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => {
      const medico = cita.medicoId;
      const especialidad = cita.especialidadId;  // ✅ NUEVO
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        monto: cita.monto,
        pagado: cita.pagado,
        modoPago: cita.modoPago,
        medico: {
          _id: medico?._id,
          nombre: medico?.nombre,
          apellido: medico?.apellido,
          foto: medico?.foto,
          tarifaConsulta: medico?.medicoInfo?.tarifaConsulta
        },
        especialidad: {  // ✅ NUEVO
          _id: especialidad?._id,
          nombre: especialidad?.nombre,
          codigo: especialidad?.codigo,
          descripcion: especialidad?.descripcion
        },
        recetaId: cita.recetaId,
        calificacion: cita.calificacion,
        comentarios: cita.comentarios,
        creadoEn: cita.creadoEn
      };
    });

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('Error al obtener citas del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener citas pendientes/confirmadas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId/proximas
 * @access  Private
 */
exports.getCitasProximas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    console.log('═══════════════════════════════════');
    console.log('=== GET CITAS PRÓXIMAS ===');
    console.log('pacienteId recibido:', pacienteId);

    // ✅ Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      console.error('❌ pacienteId inválido:', pacienteId);
      return res.status(400).json({
        success: false,
        message: 'pacienteId no es válido'
      });
    }

    // ✅ Fecha de hoy (inicio del día)
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    console.log('📅 Buscando citas desde:', ahora);

    const citas = await Cita.find({
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
      fecha: { $gte: ahora },
      estado: { $in: ['pendiente', 'confirmada'] }
    })
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.tarifaConsulta'
      })
      .populate('especialidadId', 'nombre codigo')  // ✅ NUEVO
      .sort({ fecha: 1, hora: 1 });

    console.log(`✅ Se encontraron ${citas.length} citas próximas`);

    const citasFormateadas = citas.map((cita, index) => {
      const medico = cita.medicoId;
      const especialidad = cita.especialidadId;  // ✅ NUEVO
      
      console.log(`Cita ${index + 1}:`, {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        medico: `${medico?.nombre} ${medico?.apellido}`,
        especialidad: especialidad?.nombre  // ✅ Ahora es la correcta
      });
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        monto: cita.monto,
        pagado: cita.pagado,
        modoPago: cita.modoPago,
        medico: {
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidad?.nombre || 'Médico General'  // ✅ Correcta
        }
      };
    });

    console.log('═══════════════════════════════════');

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('❌ Error al obtener citas próximas:', error);
    console.error('Stack trace:', error.stack);
    console.log('═══════════════════════════════════');
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas próximas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de citas completadas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId/historial
 * @access  Private
 */
exports.getHistorialCitas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // ✅ Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'pacienteId no es válido'
      });
    }

    const citas = await Cita.find({
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
      estado: 'completada'
    })
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto'
      })
      .populate('especialidadId', 'nombre codigo')  // ✅ NUEVO
      .populate('recetaId')
      .sort({ fecha: -1 });

    const citasFormateadas = citas.map(cita => {
      const medico = cita.medicoId;
      const especialidad = cita.especialidadId;  // ✅ NUEVO
      
      return {
        _id: cita._id,
        fecha: cita.fecha,
        hora: cita.hora,
        motivo: cita.motivo,
        medico: {
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidad?.nombre || 'Médico General'  // ✅ Correcta
        },
        tieneReceta: !!cita.recetaId,
        calificacion: cita.calificacion
      };
    });

    res.status(200).json({
      success: true,
      count: citasFormateadas.length,
      data: citasFormateadas,
    });

  } catch (error) {
    console.error('Error al obtener historial de citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener TODAS las citas del día actual (fila virtual)
 * @route   GET /api/mobile/citas/hoy
 * @access  Private
 */
exports.getCitasHoy = async (req, res) => {
  try {
    const { especialidadId, medicoId } = req.query;

    // Obtener fecha de hoy (inicio y fin del día)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    // Construir query
    const query = {
      fecha: { $gte: hoy, $lt: mañana },
      estado: { $in: ['pendiente', 'confirmada', 'completada'] }
    };

    if (medicoId) {
      if (!mongoose.Types.ObjectId.isValid(medicoId)) {
        return res.status(400).json({
          success: false,
          message: 'medicoId no es válido'
        });
      }
      query.medicoId = new mongoose.Types.ObjectId(medicoId);
    }

    // ✅ Si se proporciona especialidadId, agregarlo al query
    if (especialidadId) {
      if (!mongoose.Types.ObjectId.isValid(especialidadId)) {
        return res.status(400).json({
          success: false,
          message: 'especialidadId no es válido'
        });
      }
      query.especialidadId = new mongoose.Types.ObjectId(especialidadId);  // ✅ NUEVO
    }

    // ✅ Obtener citas con populate de especialidadId
    const citas = await Cita.find(query)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto'
      })
      .populate('especialidadId', 'nombre codigo')  // ✅ NUEVO
      .populate('pacienteId', 'nombre apellido foto')
      .sort({ hora: 1 });

    // Agrupar por hora
    const citasPorHora = {};
    citas.forEach(cita => {
      const hora = cita.hora;
      if (!citasPorHora[hora]) {
        citasPorHora[hora] = [];
      }

      const medico = cita.medicoId;
      const paciente = cita.pacienteId;
      const especialidad = cita.especialidadId;  // ✅ NUEVO

      citasPorHora[hora].push({
        _id: cita._id,
        hora: cita.hora,
        estado: cita.estado,
        motivo: cita.motivo,
        medico: {
          _id: medico?._id,
          nombre: `${medico?.nombre} ${medico?.apellido}`,
          foto: medico?.foto,
          especialidad: especialidad?.nombre || 'General',  // ✅ Correcta
          especialidadCodigo: especialidad?.codigo || 'M'    // ✅ Correcta
        },
        paciente: {
          _id: paciente?._id,
          nombre: `${paciente?.nombre} ${paciente?.apellido}`,
          foto: paciente?.foto
        }
      });
    });

    // Convertir a array ordenado
    const resultado = Object.keys(citasPorHora)
      .sort()
      .map(hora => ({
        hora,
        citas: citasPorHora[hora]
      }));

    res.status(200).json({
      success: true,
      fecha: hoy,
      totalCitas: citas.length,
      data: resultado
    });

  } catch (error) {
    console.error('Error al obtener citas de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas de hoy',
      error: error.message
    });
  }
};

/**
 * @desc    Crear una nueva cita
 * @route   POST /api/mobile/citas/crear
 * @access  Private
 */
exports.crearCita = async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('=== CREAR CITA ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    const { pacienteId, medicoId, especialidadId, fecha, hora, motivo, modoPago } = req.body;  // ✅ Agregar especialidadId

    // ✅ 1. Validar campos requeridos
    if (!pacienteId || !medicoId || !especialidadId || !fecha || !hora || !motivo || !modoPago) {  // ✅ Incluir especialidadId
      console.error('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: pacienteId, medicoId, especialidadId, fecha, hora, motivo, modoPago'
      });
    }

    // ✅ 2. Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      console.error('❌ pacienteId inválido:', pacienteId);
      return res.status(400).json({
        success: false,
        message: 'pacienteId no es válido'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(medicoId)) {
      console.error('❌ medicoId inválido:', medicoId);
      return res.status(400).json({
        success: false,
        message: 'medicoId no es válido'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(especialidadId)) {  // ✅ NUEVO
      console.error('❌ especialidadId inválido:', especialidadId);
      return res.status(400).json({
        success: false,
        message: 'especialidadId no es válido'
      });
    }

    // ✅ 3. Validar que el paciente existe
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente || paciente.rol !== 'paciente') {
      console.error('❌ Paciente no encontrado o rol inválido');
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado o rol inválido'
      });
    }

    // ✅ 4. Validar que el médico existe y obtener su info
    const medico = await Usuario.findById(medicoId).populate('medicoInfo.especialidades');
    if (!medico || medico.rol !== 'medico') {
      console.error('❌ Médico no encontrado o rol inválido');
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado o rol inválido'
      });
    }

    // ✅ 5. Validar que la especialidad exista
    const especialidad = await Especialidad.findById(especialidadId);
    if (!especialidad) {
      console.error('❌ Especialidad no encontrada');
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    console.log('✅ Especialidad encontrada:', especialidad.nombre);

    // ✅ 6. Validar que el médico tenga esa especialidad
    const tieneEspecialidad = medico.medicoInfo?.especialidades?.some(
      esp => esp._id.toString() === especialidadId
    );
    
    if (!tieneEspecialidad) {
      console.error('❌ El médico no tiene esa especialidad');
      console.error('Especialidades del médico:', medico.medicoInfo?.especialidades?.map(e => e.nombre));
      return res.status(400).json({
        success: false,
        message: `El médico no ofrece la especialidad ${especialidad.nombre}`
      });
    }

    console.log('✅ El médico SÍ tiene la especialidad');

    // ✅ 7. Validar que el médico tenga tarifaConsulta
    const tarifaConsulta = medico.medicoInfo?.tarifaConsulta || 700;
    console.log('💰 Tarifa del médico:', tarifaConsulta);

    // ✅ 8. Convertir fecha de "YYYY-MM-DD" a Date
    let fechaCita;
    try {
      if (typeof fecha === 'string') {
        const [year, month, day] = fecha.split('-').map(Number);
        fechaCita = new Date(year, month - 1, day);
        fechaCita.setHours(0, 0, 0, 0);
      } else {
        fechaCita = new Date(fecha);
        fechaCita.setHours(0, 0, 0, 0);
      }

      console.log('📅 Fecha original:', fecha);
      console.log('📅 Fecha convertida:', fechaCita);

      if (isNaN(fechaCita.getTime())) {
        throw new Error('Fecha inválida');
      }
    } catch (error) {
      console.error('❌ Error al convertir fecha:', error);
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    // ✅ 9. Validar fecha (debe ser hoy o futura)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) {
      console.error('❌ Fecha anterior a hoy');
      return res.status(400).json({
        success: false,
        message: 'La fecha de la cita no puede ser anterior a hoy'
      });
    }

    // ✅ 10. Validar que el médico trabaje ese día y hora
    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaCita.getDay()];
    const horariosDisponibles = medico.medicoInfo?.horariosDisponibles || [];
    
    console.log('📆 Día de la semana:', diaSemana);
    console.log('⏰ Horarios disponibles del médico:', horariosDisponibles);

    const trabajaEseDia = horariosDisponibles.find(h => h.dia === diaSemana);
    if (!trabajaEseDia) {
      console.error(`❌ Médico no trabaja los ${diaSemana}`);
      return res.status(400).json({
        success: false,
        message: `El médico no trabaja los días ${diaSemana}`
      });
    }

    // ✅ 11. Validar que la hora esté dentro del horario del médico
    const [horaInicio, minutoInicio] = trabajaEseDia.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = trabajaEseDia.horaFin.split(':').map(Number);
    const [horaCita, minutoCita] = hora.split(':').map(Number);
    
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = horaFin * 60 + minutoFin;
    const minutosCita = horaCita * 60 + minutoCita;
    
    if (minutosCita < minutosInicio || minutosCita >= minutosFin) {
      console.error('❌ Hora fuera del horario del médico');
      return res.status(400).json({
        success: false,
        message: `El médico trabaja de ${trabajaEseDia.horaInicio} a ${trabajaEseDia.horaFin} los ${diaSemana}`
      });
    }

    // ✅ 12. Verificar que no exista otra cita en ese horario
    const citaExistente = await Cita.findOne({
      medicoId: new mongoose.Types.ObjectId(medicoId),
      fecha: fechaCita,
      hora,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (citaExistente) {
      console.error('❌ Ya existe una cita en ese horario');
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cita en ese horario. Por favor selecciona otra hora.'
      });
    }

    // ✅ 13. Crear la cita CON especialidadId
    const ahora = new Date();
    const nuevaCita = new Cita({
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
      medicoId: new mongoose.Types.ObjectId(medicoId),
      especialidadId: new mongoose.Types.ObjectId(especialidadId),  // ✅ NUEVO
      fecha: fechaCita,
      hora: hora,
      estado: 'pendiente',
      motivo: motivo,
      modoPago: modoPago,
      pagado: modoPago === 'online' ? true : false,
      monto: tarifaConsulta,
      creadoEn: ahora,
      actualizadoEn: ahora
    });

    console.log('💾 Cita a guardar:', JSON.stringify(nuevaCita, null, 2));

    // ✅ 14. Guardar en la base de datos
    const citaGuardada = await nuevaCita.save();
    console.log('✅ Cita guardada exitosamente con ID:', citaGuardada._id);

    // ✅ 15. Populate para devolver datos completos
    const citaCompleta = await Cita.findById(citaGuardada._id)
      .populate({
        path: 'medicoId',
        select: 'nombre apellido foto medicoInfo.tarifaConsulta'
      })
      .populate('especialidadId', 'nombre codigo descripcion')  // ✅ NUEVO
      .populate('pacienteId', 'nombre apellido email foto');

    console.log('✅ Cita completa con populate:', citaCompleta);

    // ✅ 16. Formatear respuesta
    const medico_data = citaCompleta.medicoId;
    const paciente_data = citaCompleta.pacienteId;
    const especialidad_data = citaCompleta.especialidadId;  // ✅ NUEVO

    const respuesta = {
      _id: citaCompleta._id,
      fecha: citaCompleta.fecha,
      hora: citaCompleta.hora,
      estado: citaCompleta.estado,
      motivo: citaCompleta.motivo,
      monto: citaCompleta.monto,
      pagado: citaCompleta.pagado,
      modoPago: citaCompleta.modoPago,
      medico: {
        _id: medico_data?._id,
        nombre: medico_data?.nombre,
        apellido: medico_data?.apellido,
        foto: medico_data?.foto,
        tarifaConsulta: medico_data?.medicoInfo?.tarifaConsulta
      },
      especialidad: {  // ✅ NUEVO
        _id: especialidad_data?._id,
        nombre: especialidad_data?.nombre,
        codigo: especialidad_data?.codigo,
        descripcion: especialidad_data?.descripcion
      },
      paciente: {
        _id: paciente_data?._id,
        nombre: paciente_data?.nombre,
        apellido: paciente_data?.apellido,
        email: paciente_data?.email,
        foto: paciente_data?.foto
      },
      creadoEn: citaCompleta.creadoEn
    };

    console.log('✅ Respuesta final:', JSON.stringify(respuesta, null, 2));
    console.log('═══════════════════════════════════');

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: respuesta
    });

  } catch (error) {
    console.error('═══════════════════════════════════');
    console.error('❌ ERROR al crear cita:', error);
    console.error('Mensaje:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('═══════════════════════════════════');
    
    res.status(500).json({
      success: false,
      message: 'Error al crear la cita',
      error: error.message
    });
  }
};

/**
 * @desc    Verificar si hay cambios en las citas desde la última actualización (Polling inteligente)
 * @route   GET /api/mobile/citas/verificar-cambios/:userId
 * @access  Private
 */
exports.verificarCambiosCitas = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ultimaActualizacion } = req.query;

    console.log('=== VERIFICAR CAMBIOS ===');
    console.log('userId:', userId);
    console.log('ultimaActualizacion:', ultimaActualizacion);

    if (!userId || !ultimaActualizacion) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos (userId y ultimaActualizacion)'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'El userId proporcionado no es un ObjectId válido'
      });
    }

    const ultimaActualizacionDate = new Date(parseInt(ultimaActualizacion));

    if (isNaN(ultimaActualizacionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'El timestamp proporcionado no es válido'
      });
    }

    const citasNuevas = await Cita.find({
      pacienteId: new mongoose.Types.ObjectId(userId),
      $or: [
        { creadoEn: { $gt: ultimaActualizacionDate } },
        { actualizadoEn: { $gt: ultimaActualizacionDate } }
      ]
    });

    console.log(`📊 Citas nuevas/modificadas: ${citasNuevas.length}`);

    res.json({
      success: true,
      data: {
        hayNuevas: citasNuevas.length > 0,
        cantidad: citasNuevas.length,
        ultimaActualizacion: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Error al verificar cambios en citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar cambios',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener estadísticas de citas de un paciente
 * @route   GET /api/mobile/citas/paciente/:pacienteId/estadisticas
 * @access  Private
 */
exports.getEstadisticasPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    console.log('═══════════════════════════════════');
    console.log('=== GET ESTADÍSTICAS PACIENTE ===');
    console.log('pacienteId:', pacienteId);

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
      console.error('❌ pacienteId inválido');
      return res.status(400).json({
        success: false,
        message: 'pacienteId no es válido'
      });
    }

    // Obtener paciente para saber la fecha de registro
    const paciente = await Usuario.findById(pacienteId);
    if (!paciente) {
      console.error('❌ Paciente no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Contar citas completadas
    const citasCompletadas = await Cita.countDocuments({
      pacienteId: new mongoose.Types.ObjectId(pacienteId),
      estado: 'completada'
    });

    // Contar todas las citas (para estadística adicional)
    const totalCitas = await Cita.countDocuments({
      pacienteId: new mongoose.Types.ObjectId(pacienteId)
    });

    // Obtener año de registro
    const añoRegistro = paciente.fechaRegistro.getFullYear();

    console.log(`✅ Citas completadas: ${citasCompletadas}`);
    console.log(`📊 Total citas: ${totalCitas}`);
    console.log(`📅 Miembro desde: ${añoRegistro}`);
    console.log('═══════════════════════════════════');

    res.status(200).json({
      success: true,
      data: {
        citasCompletadas: citasCompletadas,
        totalCitas: totalCitas,
        miembroDesde: añoRegistro,
        estadoActivo: paciente.activo ? 'Activo' : 'Inactivo'
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    console.log('═══════════════════════════════════');
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del paciente',
      error: error.message
    });
  }
};
