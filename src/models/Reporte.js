const mongoose = require('mongoose');

// Sub-esquema para rango de fechas
const rangoFechasSchema = new mongoose.Schema({
  inicio: {
    type: Date,
    required: [true, 'La fecha inicial es requerida'],
    description: 'Fecha inicial del reporte',
  },
  fin: {
    type: Date,
    required: [true, 'La fecha final es requerida'],
    description: 'Fecha final del reporte',
  },
}, { _id: false });

const reporteSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ['global', 'medico'],
      required: [true, 'El tipo de reporte es requerido'],
      description: 'Tipo de reporte: global o por médico',
    },
    rangoFechas: {
      type: rangoFechasSchema,
      required: [true, 'El rango de fechas es requerido'],
    },
    totalCitas: {
      type: Number,
      required: [true, 'El total de citas es requerido'],
      default: 0,
      description: 'Cantidad total de citas en el rango de fechas',
    },
    citasCanceladas: {
      type: Number,
      required: [true, 'Las citas canceladas son requeridas'],
      default: 0,
      description: 'Cantidad de citas canceladas en el rango',
    },
    ingresosTotales: {
      type: Number,
      required: [true, 'Los ingresos totales son requeridos'],
      default: 0,
      description: 'Suma de ingresos por las citas en el rango',
    },
    especialidadesMasSolicitadas: {
      type: [String],
      required: [true, 'Las especialidades más solicitadas son requeridas'],
      default: [],
      description: 'Lista de especialidades más solicitadas en el rango',
    },
    generadasEn: {
      type: Date,
      required: [true, 'La fecha de generación es requerida'],
      default: Date.now,
      description: 'Fecha en que se generó el reporte',
    },
  },
  {
    timestamps: true,
    collection: 'Reportes',
  }
);

module.exports = mongoose.model('Reporte', reporteSchema);
