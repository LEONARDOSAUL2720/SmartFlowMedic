require('dotenv').config();
const mongoose = require('mongoose');
const Turno = require('../../../../models/Turno');
const Especialidad = require('../../../../models/Especialidad');
const Usuario = require('../../../../models/Usuario');

async function actualizarTurnosHoy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Fecha de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    console.log(`\n📅 Actualizando turnos para: ${hoy.toISOString().split('T')[0]}`);

    // Eliminar turnos viejos
    const deleted = await Turno.deleteMany({});
    console.log(`🗑️  Eliminados ${deleted.deletedCount} turnos antiguos`);

    // Obtener especialidades
    const especialidades = await Especialidad.find({ codigo: { $in: ['M', 'A', 'B', 'C'] } });
    if (especialidades.length === 0) {
      throw new Error('No se encontraron especialidades');
    }

    // Obtener médicos por especialidad
    const medicos = {};
    for (const esp of especialidades) {
      const medico = await Usuario.findOne({
        rol: 'medico',
        'medicoInfo.especialidades': esp._id
      });
      if (medico) {
        medicos[esp.codigo] = medico;
      }
    }

    console.log(`\n👨‍⚕️ Médicos encontrados: ${Object.keys(medicos).length}`);

    // Obtener pacientes para asignar a los turnos
    const pacientes = await Usuario.find({ rol: 'paciente' }).limit(10);
    if (pacientes.length === 0) {
      throw new Error('No se encontraron pacientes');
    }
    console.log(`👤 Pacientes encontrados: ${pacientes.length}`);

    // Crear turnos para hoy
    const turnos = [];
    const ahora = new Date();
    const horaInicio = new Date(hoy);
    horaInicio.setHours(8, 0, 0, 0); // Inicio a las 8:00 AM

    for (const esp of especialidades) {
      const medico = medicos[esp.codigo];
      if (!medico) {
        console.log(`⚠️  Sin médico para ${esp.nombre} (${esp.codigo})`);
        continue;
      }

      // Crear 5 turnos por especialidad
      for (let i = 1; i <= 5; i++) {
        const horaLlegada = new Date(horaInicio);
        horaLlegada.setMinutes(horaLlegada.getMinutes() + ((i - 1) * 10));

        const estado = i === 1 ? 'atendiendo' : 'en_espera';
        
        // Asignar paciente de forma rotativa
        const paciente = pacientes[(turnos.length) % pacientes.length];
        
        const turno = new Turno({
          paciente: paciente._id,
          medico: medico._id,
          especialidad: esp._id,
          turno: `${esp.codigo}-${i.toString().padStart(2, '0')}`,
          posicionEnFila: i,
          tiempoEstimadoMin: (i - 1) * 5, // 5 min por turno
          estado: estado,
          esTurnoVirtual: true,
          horaLlegada: horaLlegada,
          fecha: hoy
        });

        turnos.push(turno);
      }
    }

    // Guardar todos los turnos
    const result = await Turno.insertMany(turnos);
    console.log(`✅ Creados ${result.length} turnos nuevos para hoy\n`);

    // Mostrar resumen
    console.log('📊 Resumen por especialidad:');
    console.log('─'.repeat(60));
    for (const esp of especialidades) {
      const count = turnos.filter(t => t.turno.startsWith(esp.codigo)).length;
      const medico = medicos[esp.codigo];
      console.log(`  ${esp.codigo} - ${esp.nombre.padEnd(20)} : ${count} turnos (Dr. ${medico?.nombre || 'N/A'})`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

actualizarTurnosHoy();
