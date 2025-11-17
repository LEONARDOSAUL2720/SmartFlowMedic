/**
 * Script para consultar especialidades en la base de datos
 * Uso: node src/modules/mobile/scripts/especialidades/consultarEspecialidades.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const Especialidad = require('../../../../models/Especialidad');

async function consultarEspecialidades() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Consultar todas las especialidades
    const especialidades = await Especialidad.find({});
    
    console.log('\n📊 ESPECIALIDADES EN LA BASE DE DATOS:');
    console.log(`Total: ${especialidades.length}\n`);

    if (especialidades.length === 0) {
      console.log('⚠️  No hay especialidades registradas');
    } else {
      especialidades.forEach((esp, index) => {
        console.log(`${index + 1}. ${esp.nombre}`);
        console.log(`   - ID: ${esp._id}`);
        console.log(`   - Descripción: ${esp.descripcion}`);
        console.log(`   - Activa: ${esp.activa ? 'Sí' : 'No'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

consultarEspecialidades();
