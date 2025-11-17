/**
 * Script para consultar usuarios en la base de datos
 * Uso: node src/modules/mobile/scripts/usuarios/consultarUsuarios.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');

async function consultarUsuarios() {
  try {
    // Debug: verificar que se cargó el .env
    console.log('MONGODB_URI existe?', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI no está definida en .env');
      return;
    }
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Consultar todos los usuarios
    const usuarios = await Usuario.find({});
    
    console.log('\n📊 USUARIOS EN LA BASE DE DATOS:');
    console.log(`Total: ${usuarios.length}\n`);

    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre} ${user.apellido}`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Teléfono: ${user.telefono}`);
      if (user.rol === 'medico' && user.medicoInfo) {
        console.log(`   - Especialidades: ${user.medicoInfo.especialidades.length}`);
        console.log(`   - Tarifa: $${user.medicoInfo.tarifaConsulta || 'No definida'}`);
      }
      console.log('');
    });

    // Separar por rol
    const pacientes = usuarios.filter(u => u.rol === 'paciente');
    const medicos = usuarios.filter(u => u.rol === 'medico');
    const admins = usuarios.filter(u => u.rol === 'admin');

    console.log('📈 RESUMEN POR ROL:');
    console.log(`   Pacientes: ${pacientes.length}`);
    console.log(`   Médicos: ${medicos.length}`);
    console.log(`   Admins: ${admins.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

consultarUsuarios();
