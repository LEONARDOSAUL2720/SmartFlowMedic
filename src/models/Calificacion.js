const mongoose = require('mongoose');

const calificacionSchema = new mongoose.Schema(
  {
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    recetaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receta',
      required: false,
    },
    calificacion: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comentario: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Calificaciones',
  }
);

// Índice único: Un paciente solo puede calificar una vez a un médico
calificacionSchema.index({ medicoId: 1, pacienteId: 1 }, { unique: true });

module.exports = mongoose.model('Calificacion', calificacionSchema);