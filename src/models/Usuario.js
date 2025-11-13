const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sub-esquema para ubicación del médico
const ubicacionSchema = new mongoose.Schema({
  direccion: { type: String },
  ciudad: { type: String },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false });

// Sub-esquema para horarios disponibles
const horarioSchema = new mongoose.Schema({
  dia: { type: String },
  horaInicio: { type: String },
  horaFin: { type: String }
}, { _id: false });

// Sub-esquema para información del médico
const medicoInfoSchema = new mongoose.Schema({
  cedula: { type: String },
  especialidades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Especialidad' }],
  tarifaConsulta: { type: Number },
  descripcion: { type: String },
  experiencia: { type: String },
  ubicacion: ubicacionSchema,
  horariosDisponibles: [horarioSchema],
  calificacionPromedio: { type: Number, default: 0 },
  totalCitasAtendidas: { type: Number, default: 0 }
}, { _id: false });

// Esquema principal de Usuario (debe llamarse "Usuarios" para coincidir con tu colección)
const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es requerido'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es requerido'],
    },
    password: {
      type: String,
      // Password no es requerido si el usuario se autentica con Google
      required: function() {
        return !this.firebaseUid;
      },
      select: false,
    },
    rol: {
      type: String,
      enum: ['paciente', 'medico', 'admin'],
      required: [true, 'El rol es requerido'],
      default: 'paciente',
    },
    foto: {
      type: String,
      default: null,
    },
    fechaRegistro: {
      type: Date,
      required: true,
      default: Date.now,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    medicoInfo: {
      type: medicoInfoSchema,
      default: null,
    },
    // Campo adicional para usuarios autenticados con Google
    firebaseUid: {
      type: String,
      sparse: true, // Permite valores null pero únicos si existen
      unique: true,
    },
    // Campo para identificar la plataforma (web/mobile)
    platform: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'mobile',
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'Usuarios' // Nombre exacto de tu colección en MongoDB
  }
);

// Encriptar password antes de guardar (solo si hay password)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Usuario', userSchema);
