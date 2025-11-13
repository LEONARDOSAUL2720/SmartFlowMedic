const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema(
  {
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cita',
      required: [true, 'La referencia a la cita es requerida'],
      description: 'Referencia a la cita pagada',
    },
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del paciente es requerido'],
      description: 'ID del paciente que paga',
    },
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del médico es requerido'],
      description: 'ID del médico que brinda el servicio',
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      description: 'Monto total de la consulta',
    },
    metodo: {
      type: String,
      enum: ['MercadoPago', 'BBVA', 'efectivo'],
      required: [true, 'El método de pago es requerido'],
      description: 'Método de pago utilizado',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'fallido'],
      required: [true, 'El estado es requerido'],
      default: 'pendiente',
      description: 'Estado de la transacción',
    },
    fechaPago: {
      type: Date,
      required: [true, 'La fecha de pago es requerida'],
      default: Date.now,
      description: 'Fecha en que se registró el pago',
    },
    transaccionId: {
      type: String,
      default: null,
      description: 'ID de la transacción de la pasarela (si aplica)',
    },
  },
  {
    timestamps: true,
    collection: 'Pagos',
  }
);

module.exports = mongoose.model('Pago', pagoSchema);
