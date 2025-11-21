/**
 * Script para inicializar medicoInfo en médicos que lo tienen null
 * Crea la estructura completa de medicoInfo con valores por defecto
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');

async function inicializarMedicoInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener médicos con medicoInfo null o sin inicializar
    const medicos = await Usuario.find({ 
      rol: 'medico',
      $or: [
        { medicoInfo: null },
        { medicoInfo: { $exists: false } }
      ]
    });

    console.log(`📊 Médicos con medicoInfo sin inicializar: ${medicos.length}\n`);

    if (medicos.length === 0) {
      console.log('✅ Todos los médicos ya tienen medicoInfo inicializado.');
      return;
    }

    let actualizados = 0;

    for (const medico of medicos) {
      console.log(`🔄 Inicializando: ${medico.nombre} ${medico.apellido} (${medico.email})`);

      // Actualizar directamente con updateOne (bypass validation)
      await Usuario.collection.updateOne(
        { _id: medico._id },
        {
          $set: {
            medicoInfo: {
              especialidades: [],
              tarifaConsulta: 50,
              horariosDisponibles: [
                { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' },
                { dia: 'Martes', horaInicio: '09:00', horaFin: '13:00' },
                { dia: 'Miércoles', horaInicio: '14:00', horaFin: '18:00' },
                { dia: 'Jueves', horaInicio: '09:00', horaFin: '13:00' },
                { dia: 'Viernes', horaInicio: '09:00', horaFin: '13:00' }
              ],
              calificacionPromedio: 0,
              totalCitasAtendidas: 0
            }
          }
        }
      );

      actualizados++;
      console.log('   ✅ medicoInfo inicializado con valores por defecto\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Proceso completado: ${actualizados} médicos inicializados`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n💡 SIGUIENTE PASO: Ejecuta el script para asignar especialidades y tarifas personalizadas.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

inicializarMedicoInfo();
