/**
 * Script para crear especialidades médicas de prueba
 * Uso: node -r dotenv/config src/modules/mobile/scripts/especialidades/crearEspecialidades.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const Especialidad = require('../../../../models/Especialidad');

const especialidades = [
  {
    nombre: 'Medicina General',
    descripcion: 'Atención médica general y primaria',
    activa: true
  },
  {
    nombre: 'Cardiología',
    descripcion: 'Especialista en enfermedades del corazón y sistema cardiovascular',
    activa: true
  },
  {
    nombre: 'Pediatría',
    descripcion: 'Atención médica especializada para niños y adolescentes',
    activa: true
  },
  {
    nombre: 'Dermatología',
    descripcion: 'Especialista en enfermedades de la piel',
    activa: true
  },
  {
    nombre: 'Traumatología',
    descripcion: 'Especialista en lesiones y enfermedades del sistema musculoesquelético',
    activa: true
  }
];

async function crearEspecialidades() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI no está definida');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya existen especialidades
    const count = await Especialidad.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Ya existen ${count} especialidades en la BD`);
      console.log('¿Deseas continuar y agregar más? (Ctrl+C para cancelar)\n');
    }

    // Insertar especialidades
    const resultado = await Especialidad.insertMany(especialidades);
    
    console.log('✅ Especialidades creadas exitosamente:\n');
    resultado.forEach((esp, index) => {
      console.log(`${index + 1}. ${esp.nombre}`);
      console.log(`   ID: ${esp._id}`);
      console.log(`   Descripción: ${esp.descripcion}\n`);
    });

    console.log(`📊 Total insertadas: ${resultado.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

crearEspecialidades();
