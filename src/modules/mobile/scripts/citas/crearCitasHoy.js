require('dotenv').config({ path: '../../../../../.env' });
const mongoose = require('mongoose');
const Cita = require('../../../../models/Cita');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

async function crearCitasHoy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener médicos y pacientes
    const medicos = await Usuario.find({ rol: 'medico', activo: true }).populate('medicoInfo.especialidades');
    const pacientes = await Usuario.find({ rol: 'paciente', activo: true }).limit(10);

    if (medicos.length === 0 || pacientes.length === 0) {
      console.log('❌ No hay médicos o pacientes en la BD');
      process.exit(1);
    }

    console.log(`📊 Encontrados ${medicos.length} médicos y ${pacientes.length} pacientes`);

    // Borrar citas existentes de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const eliminadas = await Cita.deleteMany({
      fecha: { $gte: hoy, $lt: mañana }
    });
    console.log(`🗑️  Eliminadas ${eliminadas.deletedCount} citas antiguas de hoy`);

    // Crear 20 citas para hoy en diferentes horarios
    const horarios = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    const estados = ['pendiente', 'confirmada', 'completada'];
    const motivos = [
      'Consulta general',
      'Revisión de resultados',
      'Control rutinario',
      'Dolor de cabeza',
      'Malestar general',
      'Chequeo anual'
    ];

    const citasCreadas = [];

    for (let i = 0; i < 18; i++) {
      const medico = medicos[i % medicos.length];
      const paciente = pacientes[i % pacientes.length];
      const especialidades = medico.medicoInfo?.especialidades || [];
      const tarifaConsulta = medico.medicoInfo?.tarifaConsulta || 500;

      const nuevaCita = new Cita({
        pacienteId: paciente._id,
        medicoId: medico._id,
        fecha: hoy,
        hora: horarios[i],
        estado: estados[i % estados.length],
        motivo: motivos[i % motivos.length],
        modoPago: i % 2 === 0 ? 'online' : 'efectivo',
        pagado: i % 2 === 0,
        monto: tarifaConsulta
      });

      await nuevaCita.save();
      citasCreadas.push({
        hora: horarios[i],
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        medico: `${medico.nombre} ${medico.apellido}`,
        especialidad: especialidades[0]?.nombre || 'General',
        estado: estados[i % estados.length]
      });
    }

    console.log('\n✅ Citas creadas para hoy:');
    console.table(citasCreadas);

    console.log(`\n🎉 Total de citas creadas: ${citasCreadas.length}`);
    console.log('\n📅 Ahora puedes probar:');
    console.log('GET http://192.168.1.12:3000/api/mobile/citas/hoy');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearCitasHoy();
