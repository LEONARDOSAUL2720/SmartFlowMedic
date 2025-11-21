/**
 * Script para agregar horarios disponibles a médicos que no los tienen
 * Asigna horarios por defecto: Lunes a Viernes 08:00 - 17:00
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');

// Horarios por defecto (lunes a viernes)
const HORARIOS_DEFAULT = [
  { dia: 'Lunes', horaInicio: '08:00', horaFin: '17:00' },
  { dia: 'Martes', horaInicio: '08:00', horaFin: '17:00' },
  { dia: 'Miércoles', horaInicio: '08:00', horaFin: '17:00' },
  { dia: 'Jueves', horaInicio: '08:00', horaFin: '17:00' },
  { dia: 'Viernes', horaInicio: '08:00', horaFin: '17:00' }
];

async function agregarHorariosMedicos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener médicos sin horarios
    const medicos = await Usuario.find({ 
      rol: 'medico',
      $or: [
        { 'medicoInfo.horariosDisponibles': { $exists: false } },
        { 'medicoInfo.horariosDisponibles': null },
        { 'medicoInfo.horariosDisponibles': { $size: 0 } }
      ]
    });

    console.log(`📊 Médicos sin horarios encontrados: ${medicos.length}\n`);

    if (medicos.length === 0) {
      console.log('✅ Todos los médicos ya tienen horariosDisponibles asignados.');
      return;
    }

    let actualizados = 0;

    for (const medico of medicos) {
      console.log(`🔄 Actualizando: ${medico.nombre} ${medico.apellido} (${medico.email})`);
      console.log(`   Horarios: Lunes a Viernes 08:00 - 17:00`);

      await Usuario.findByIdAndUpdate(medico._id, {
        $set: { 'medicoInfo.horariosDisponibles': HORARIOS_DEFAULT }
      });

      actualizados++;
      console.log('   ✅ Actualizado\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Proceso completado: ${actualizados} médicos actualizados`);
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

agregarHorariosMedicos();
