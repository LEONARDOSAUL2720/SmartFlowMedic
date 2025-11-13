const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del médico es requerido'],
      description: 'ID del médico reseñado',
    },
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del paciente es requerido'],
      description: 'ID del paciente que deja la reseña',
    },
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      required: [true, 'La referencia a la cita es requerida'],
      description: 'Referencia a la cita correspondiente',
    },
    calificacion: {
      type: Number,
      required: [true, 'La calificación es requerida'],
      min: 1,
      max: 5,
      description: 'Calificación del 1 al 5',
    },
    comentario: {
      type: String,
      maxlength: 500,
      default: null,
      description: 'Comentario opcional del paciente',
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
      description: 'Fecha en que se emitió la reseña',
    },
  },
  {
    timestamps: true,
    collection: 'Reviews',
  }
);

// Índice compuesto para evitar múltiples reviews de la misma cita
reviewSchema.index({ citaId: 1, pacienteId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
