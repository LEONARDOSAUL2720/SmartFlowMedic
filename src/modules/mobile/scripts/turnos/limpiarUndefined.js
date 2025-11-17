const mongoose = require('mongoose');
require('dotenv').config();
const Turno = require('../../../../models/Turno');

const limpiarTurnosUndefined = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const result = await Turno.deleteMany({
      turno: { $regex: /^undefined/ }
    });

    console.log(`✅ Eliminados ${result.deletedCount} turnos con 'undefined'`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

limpiarTurnosUndefined();
