/**
 * Script para verificar los datos de médicos con problemas
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');

async function verificarMedicos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar médicos con medicoInfo null
    const medicos = await Usuario.find({ 
      rol: 'medico',
      $or: [
        { medicoInfo: null },
        { medicoInfo: { $exists: false } }
      ]
    });

    console.log(`📊 Médicos encontrados: ${medicos.length}\n`);

    medicos.forEach((medico, index) => {
      console.log(`${index + 1}. ${medico.nombre} ${medico.apellido}`);
      console.log(`   Email: ${medico.email}`);
      console.log(`   Teléfono: ${medico.telefono || '❌ NO TIENE'}`);
      console.log(`   Password: ${medico.password ? '✅ Tiene' : '❌ NO TIENE'}`);
      console.log(`   medicoInfo: ${medico.medicoInfo === null ? 'null' : 'existe'}`);
      console.log(`   Rol: ${medico.rol}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

verificarMedicos();
