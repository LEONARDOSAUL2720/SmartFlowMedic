const mongoose = require('mongoose');
require('dotenv').config();
const Especialidad = require('../../../../models/Especialidad');

const actualizarEspecialidadesConCodigos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Mapeo de especialidades a códigos de letra
    const especialidadesConCodigos = [
      { nombre: 'Medicina General', codigo: 'M' },
      { nombre: 'Cardiología', codigo: 'A' },
      { nombre: 'Pediatría', codigo: 'C' },
      { nombre: 'Dermatología', codigo: 'B' },
      { nombre: 'Traumatología', codigo: 'E' },
      { nombre: 'Neurología', codigo: 'F' },
      { nombre: 'Oftalmología', codigo: 'G' },
      { nombre: 'Ginecología', codigo: 'H' },
      { nombre: 'Psiquiatría', codigo: 'I' },
      { nombre: 'Urología', codigo: 'J' },
      { nombre: 'Endocrinología', codigo: 'K' }
    ];

    for (const esp of especialidadesConCodigos) {
      const resultado = await Especialidad.updateOne(
        { nombre: esp.nombre },
        { $set: { codigo: esp.codigo } }
      );
      
      if (resultado.modifiedCount > 0) {
        console.log(`✅ Actualizada: ${esp.nombre} → Código ${esp.codigo}`);
      } else {
        console.log(`⚠️  No encontrada o ya actualizada: ${esp.nombre}`);
      }
    }

    console.log('\n✅ Actualización completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

actualizarEspecialidadesConCodigos();
