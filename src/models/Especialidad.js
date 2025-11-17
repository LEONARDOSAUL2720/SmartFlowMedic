const mongoose = require('mongoose');

const especialidadSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'Debe ser el nombre de la especialidad médica'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'Breve descripción de la especialidad'],
      trim: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      maxlength: 1,
      description: 'Letra para identificar turnos (A, B, C, etc.)'
    },
    activa: {
      type: Boolean,
      default: true,
      description: 'Define si la especialidad está activa o deshabilitada',
    },
  },
  {
    timestamps: true,
    collection: 'Especialidades'
  }
);

module.exports = mongoose.model('Especialidad', especialidadSchema);
