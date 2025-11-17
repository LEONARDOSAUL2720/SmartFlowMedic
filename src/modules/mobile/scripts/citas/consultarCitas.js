/**
 * Script para consultar citas en la base de datos
 * Uso: node src/modules/mobile/scripts/citas/consultarCitas.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const Cita = require('../../../../models/Cita');

async function consultarCitas() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Consultar todas las citas
    const citas = await Cita.find({})
      .populate('pacienteId', 'nombre apellido email')
      .populate('medicoId', 'nombre apellido email');
    
    console.log('\n📊 CITAS EN LA BASE DE DATOS:');
    console.log(`Total: ${citas.length}\n`);

    if (citas.length === 0) {
      console.log('⚠️  No hay citas registradas');
    } else {
      citas.forEach((cita, index) => {
        console.log(`${index + 1}. Cita ${cita._id}`);
        console.log(`   - Fecha: ${cita.fecha.toLocaleDateString()}`);
        console.log(`   - Hora: ${cita.hora}`);
        console.log(`   - Estado: ${cita.estado}`);
        console.log(`   - Paciente: ${cita.pacienteId?.nombre} ${cita.pacienteId?.apellido}`);
        console.log(`   - Médico: ${cita.medicoId?.nombre} ${cita.medicoId?.apellido}`);
        console.log(`   - Motivo: ${cita.motivo}`);
        console.log(`   - Monto: $${cita.monto}`);
        console.log(`   - Pagado: ${cita.pagado ? 'Sí' : 'No'}`);
        console.log('');
      });

      // Resumen por estado
      const pendientes = citas.filter(c => c.estado === 'pendiente').length;
      const confirmadas = citas.filter(c => c.estado === 'confirmada').length;
      const completadas = citas.filter(c => c.estado === 'completada').length;
      const canceladas = citas.filter(c => c.estado === 'cancelada').length;

      console.log('📈 RESUMEN POR ESTADO:');
      console.log(`   Pendientes: ${pendientes}`);
      console.log(`   Confirmadas: ${confirmadas}`);
      console.log(`   Completadas: ${completadas}`);
      console.log(`   Canceladas: ${canceladas}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

consultarCitas();
