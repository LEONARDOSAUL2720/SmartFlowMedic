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
