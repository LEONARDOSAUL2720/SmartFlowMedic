const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID del paciente es requerido'],
      description: 'ID del paciente',
    },
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'ID del médico es requerido'],
      description: 'ID del médico',
    },
    // ✅ NUEVO CAMPO
    especialidadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Especialidad',
      required: [true, 'ID de la especialidad es requerido'],
      description: 'ID de la especialidad seleccionada para esta cita',
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha de la cita es requerida'],
      description: 'Fecha de la cita',
    },
    hora: {
      type: String,
      required: [true, 'La hora es requerida'],
      description: 'Hora en formato HH:MM',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
      required: [true, 'El estado es requerido'],
      default: 'pendiente',
      description: 'Estado actual de la cita',
    },
    motivo: {
      type: String,
      required: [true, 'El motivo de la consulta es requerido'],
      description: 'Motivo o razón de la consulta',
    },
    modoPago: {
      type: String,
      enum: ['online', 'efectivo'],
      required: [true, 'El modo de pago es requerido'],
      description: 'Método de pago elegido',
    },
    pagado: {
      type: Boolean,
      required: true,
      default: false,
      description: 'Indica si la cita ya fue pagada',
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      description: 'Monto a pagar por la consulta',
    },
    recetaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receta',
      default: null,
      description: 'ID de la receta generada (opcional)',
    },
    calificacion: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
      description: 'Calificación dada por el paciente',
    },
    comentarios: {
      type: String,
      default: null,
      description: 'Comentario opcional del paciente',
    },
    creadoEn: {
      type: Date,
      required: true,
      default: Date.now,
      description: 'Fecha de creación del registro',
    },
    actualizadoEn: {
      type: Date,
      required: true,
      default: Date.now,
      description: 'Última fecha de actualización',
    },
  },
  {
    timestamps: false, // Usamos creadoEn y actualizadoEn personalizados
    collection: 'Citas',
  }
);

// Middleware para actualizar actualizadoEn antes de guardar
citaSchema.pre('save', function (next) {
  this.actualizadoEn = new Date();
  next();
});

// Middleware para actualizar actualizadoEn en findOneAndUpdate
citaSchema.pre('findOneAndUpdate', function (next) {
  this.set({ actualizadoEn: new Date() });
  next();
});

// ✅ ÍNDICES para mejorar el rendimiento de las consultas
citaSchema.index({ pacienteId: 1, fecha: 1 });
citaSchema.index({ medicoId: 1, fecha: 1, hora: 1 });
citaSchema.index({ especialidadId: 1 });

module.exports = mongoose.model('Cita', citaSchema);