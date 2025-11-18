require('dotenv').config();
const mongoose = require('mongoose');
const Turno = require('../../../../models/Turno');
const Especialidad = require('../../../../models/Especialidad');
const Usuario = require('../../../../models/Usuario');

async function consultarTurnos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const turnos = await Turno.find({})
      .populate('especialidad', 'nombre codigo')
      .populate('medico', 'nombre')
      .populate('paciente', 'nombre')
      .sort({ fecha: -1, horaLlegada: 1 })
      .limit(30);

    console.log(`\n📊 Total de turnos encontrados: ${turnos.length}\n`);

    // Agrupar por fecha
    const turnosPorFecha = {};
    turnos.forEach(turno => {
      const fecha = turno.fecha.toISOString().split('T')[0];
      if (!turnosPorFecha[fecha]) {
        turnosPorFecha[fecha] = [];
      }
      turnosPorFecha[fecha].push(turno);
    });

    // Mostrar por fecha
    Object.keys(turnosPorFecha).sort().reverse().forEach(fecha => {
      console.log(`\n📅 Fecha: ${fecha}`);
      console.log('─'.repeat(80));
      
      turnosPorFecha[fecha].forEach(turno => {
        console.log(`  ${turno.turno} | ${turno.especialidad?.nombre || 'Sin especialidad'} (${turno.especialidad?.codigo || '?'}) | ${turno.estado.padEnd(12)} | Pos: ${turno.posicionEnFila} | ${turno.medico?.nombre || 'Sin médico'} | ${turno.horaLlegada}`);
      });
      
      console.log(`  Total: ${turnosPorFecha[fecha].length} turnos`);
    });

    // Resumen por estado
    console.log('\n📈 Resumen por estado:');
    console.log('─'.repeat(80));
    const estados = {};
    turnos.forEach(turno => {
      estados[turno.estado] = (estados[turno.estado] || 0) + 1;
    });
    Object.entries(estados).forEach(([estado, count]) => {
      console.log(`  ${estado.padEnd(15)}: ${count} turnos`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

consultarTurnos();
