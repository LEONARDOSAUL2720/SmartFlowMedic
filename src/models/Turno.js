const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  medico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  especialidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Especialidad',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  turno: {
    type: String,
    required: true,
    // Formato: "A-01", "B-05", etc.
  },
  posicionEnFila: {
    type: Number,
    required: true,
    default: 1
  },
  tiempoEstimadoMin: {
    type: Number,
    default: 15 // minutos estimados por turno
  },
  estado: {
    type: String,
    enum: ['en_espera', 'llamando', 'atendiendo', 'completado', 'cancelado'],
    default: 'en_espera'
  },
  esTurnoVirtual: {
    type: Boolean,
    default: true
  },
  horaLlegada: {
    type: Date,
    default: Date.now
  },
  horaLlamado: {
    type: Date
  },
  horaAtencion: {
    type: Date
  },
  horaCompletado: {
    type: Date
  },
  motivo: {
    type: String,
    default: 'Consulta sin cita previa'
  },
  notas: {
    type: String
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
turnoSchema.index({ fecha: 1, especialidad: 1, estado: 1 });
turnoSchema.index({ paciente: 1, estado: 1 });
turnoSchema.index({ medico: 1, fecha: 1 });

// Método para generar número de turno
turnoSchema.statics.generarNumeroTurno = async function(especialidadId, fecha) {
  // Buscar el último turno del día para esa especialidad
  const inicioDelDia = new Date(fecha);
  inicioDelDia.setHours(0, 0, 0, 0);
  
  const finDelDia = new Date(fecha);
  finDelDia.setHours(23, 59, 59, 999);

  const ultimoTurno = await this.findOne({
    especialidad: especialidadId,
    fecha: {
      $gte: inicioDelDia,
      $lte: finDelDia
    }
  }).sort({ turno: -1 });

  // Obtener la letra de la especialidad (esto se puede mapear desde la especialidad)
  const especialidad = await mongoose.model('Especialidad').findById(especialidadId);
  const letra = especialidad.codigo || 'A'; // Debe tener un código de letra

  if (!ultimoTurno) {
    return `${letra}-01`;
  }

  // Extraer el número del último turno y sumar 1
  const partes = ultimoTurno.turno.split('-');
  const numero = parseInt(partes[1]) + 1;
  return `${letra}-${numero.toString().padStart(2, '0')}`;
};

// Método para calcular posición en fila
turnoSchema.statics.calcularPosicionEnFila = async function(especialidadId, fecha) {
  const inicioDelDia = new Date(fecha);
  inicioDelDia.setHours(0, 0, 0, 0);
  
  const finDelDia = new Date(fecha);
  finDelDia.setHours(23, 59, 59, 999);

  const turnosEnEspera = await this.countDocuments({
    especialidad: especialidadId,
    fecha: {
      $gte: inicioDelDia,
      $lte: finDelDia
    },
    estado: { $in: ['en_espera', 'llamando'] }
  });

  return turnosEnEspera + 1;
};

module.exports = mongoose.model('Turno', turnoSchema);
