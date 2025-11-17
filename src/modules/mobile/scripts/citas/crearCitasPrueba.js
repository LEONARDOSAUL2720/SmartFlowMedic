/**
 * Script para crear citas de prueba
 * Uso: node -r dotenv/config src/modules/mobile/scripts/citas/crearCitasPrueba.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const Cita = require('../../../../models/Cita');
const Usuario = require('../../../../models/Usuario');

async function crearCitasPrueba() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI no está definida');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener el paciente Leonardo
    const paciente = await Usuario.findOne({ 
      email: 'avilasanchezleonardosaul2@gmail.com' 
    });

    if (!paciente) {
      console.log('❌ No se encontró el paciente Leonardo');
      return;
    }

    console.log(`✅ Paciente: ${paciente.nombre} ${paciente.apellido}`);
    console.log(`   ID: ${paciente._id}\n`);

    // Obtener médicos
    const medicos = await Usuario.find({ rol: 'medico' }).limit(3);
    
    if (medicos.length === 0) {
      console.log('❌ No hay médicos en la BD');
      return;
    }

    console.log(`✅ Médicos disponibles: ${medicos.length}\n`);

    // Crear citas de prueba
    const hoy = new Date();
    const citas = [
      {
        pacienteId: paciente._id,
        medicoId: medicos[0]._id,
        fecha: new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000), // En 2 días
        hora: '10:00',
        estado: 'confirmada',
        motivo: 'Consulta de rutina',
        modoPago: 'online',
        pagado: true,
        monto: 500
      },
      {
        pacienteId: paciente._id,
        medicoId: medicos[1]._id,
        fecha: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
        hora: '15:30',
        estado: 'pendiente',
        motivo: 'Dolor de cabeza persistente',
        modoPago: 'efectivo',
        pagado: false,
        monto: 600
      },
      {
        pacienteId: paciente._id,
        medicoId: medicos[2]._id,
        fecha: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000), // Hace 10 días
        hora: '11:00',
        estado: 'completada',
        motivo: 'Revisión anual',
        modoPago: 'online',
        pagado: true,
        monto: 700,
        calificacion: 5,
        comentarios: 'Excelente atención'
      },
      {
        pacienteId: paciente._id,
        medicoId: medicos[0]._id,
        fecha: new Date(hoy.getTime() + 10 * 24 * 60 * 60 * 1000), // En 10 días
        hora: '09:00',
        estado: 'pendiente',
        motivo: 'Seguimiento de tratamiento',
        modoPago: 'online',
        pagado: false,
        monto: 500
      }
    ];

    const resultado = await Cita.insertMany(citas);
    
    console.log('✅ Citas creadas exitosamente:\n');
    resultado.forEach((cita, index) => {
      const medico = medicos.find(m => m._id.equals(cita.medicoId));
      console.log(`${index + 1}. Cita con Dr. ${medico.nombre} ${medico.apellido}`);
      console.log(`   Fecha: ${cita.fecha.toLocaleDateString()}`);
      console.log(`   Hora: ${cita.hora}`);
      console.log(`   Estado: ${cita.estado}`);
      console.log(`   Motivo: ${cita.motivo}`);
      console.log(`   Monto: $${cita.monto}`);
      console.log('');
    });

    console.log(`📊 Total creadas: ${resultado.length}`);
    console.log(`   - Confirmadas: ${resultado.filter(c => c.estado === 'confirmada').length}`);
    console.log(`   - Pendientes: ${resultado.filter(c => c.estado === 'pendiente').length}`);
    console.log(`   - Completadas: ${resultado.filter(c => c.estado === 'completada').length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

crearCitasPrueba();
