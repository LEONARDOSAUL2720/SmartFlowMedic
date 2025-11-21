/**
 * Script para agregar tarifas de consulta a médicos que no las tienen
 * Asigna tarifas base según especialidad
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

// Tarifas sugeridas por especialidad (puedes ajustarlas)
const TARIFAS_POR_ESPECIALIDAD = {
  'Cardiología': 80,
  'Dermatología': 60,
  'Pediatría': 55,
  'Medicina General': 45,
  'Neurología': 85,
  'Ginecología': 70,
  'Traumatología': 75,
  'Psiquiatría': 90,
  'Oftalmología': 65
};

const TARIFA_DEFAULT = 50; // Tarifa por defecto si no está en la lista

async function agregarTarifasMedicos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener médicos sin tarifa
    const medicos = await Usuario.find({ 
      rol: 'medico',
      $or: [
        { 'medicoInfo.tarifaConsulta': { $exists: false } },
        { 'medicoInfo.tarifaConsulta': null },
        { 'medicoInfo.tarifaConsulta': 0 }
      ]
    }).populate('medicoInfo.especialidades', 'nombre');

    console.log(`📊 Médicos sin tarifa encontrados: ${medicos.length}\n`);

    if (medicos.length === 0) {
      console.log('✅ Todos los médicos ya tienen tarifaConsulta asignada.');
      return;
    }

    let actualizados = 0;

    for (const medico of medicos) {
      // Determinar tarifa según especialidad
      let tarifa = TARIFA_DEFAULT;
      
      if (medico.medicoInfo?.especialidades && medico.medicoInfo.especialidades.length > 0) {
        const especialidadNombre = medico.medicoInfo.especialidades[0].nombre;
        tarifa = TARIFAS_POR_ESPECIALIDAD[especialidadNombre] || TARIFA_DEFAULT;
      }

      // Actualizar médico
      const especialidades = medico.medicoInfo?.especialidades?.map(e => e.nombre).join(', ') || 'Sin especialidad';
      
      console.log(`🔄 Actualizando: ${medico.nombre} ${medico.apellido}`);
      console.log(`   Especialidad: ${especialidades}`);
      console.log(`   Tarifa asignada: $${tarifa}`);

      await Usuario.findByIdAndUpdate(medico._id, {
        $set: { 'medicoInfo.tarifaConsulta': tarifa }
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

agregarTarifasMedicos();
