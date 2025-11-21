/**
 * Script para validar la estructura de datos de médicos
 * Verifica que todos los médicos tengan:
 * 1. tarifaConsulta (monto de consulta)
 * 2. horariosDisponibles (días y horas de atención)
 * 3. especialidades asignadas
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

async function validarEstructuraMedicos() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los médicos
    const medicos = await Usuario.find({ rol: 'medico' })
      .populate('medicoInfo.especialidades', 'nombre codigo');

    console.log(`\n📊 Total de médicos en BD: ${medicos.length}\n`);

    // Análisis de cada médico
    const problemas = [];
    const correctos = [];

    medicos.forEach((medico, index) => {
      const info = {
        nombre: `${medico.nombre} ${medico.apellido}`,
        email: medico.email,
        issues: []
      };

      // Verificar tarifaConsulta
      if (!medico.medicoInfo?.tarifaConsulta) {
        info.issues.push('❌ NO tiene tarifaConsulta');
      } else {
        info.tarifaConsulta = `$${medico.medicoInfo.tarifaConsulta}`;
      }

      // Verificar especialidades
      if (!medico.medicoInfo?.especialidades || medico.medicoInfo.especialidades.length === 0) {
        info.issues.push('❌ NO tiene especialidades asignadas');
      } else {
        info.especialidades = medico.medicoInfo.especialidades.map(e => e.nombre).join(', ');
      }

      // Verificar horarios disponibles
      if (!medico.medicoInfo?.horariosDisponibles || medico.medicoInfo.horariosDisponibles.length === 0) {
        info.issues.push('❌ NO tiene horariosDisponibles');
      } else {
        info.horarios = medico.medicoInfo.horariosDisponibles.map(h => 
          `${h.dia}: ${h.horaInicio} - ${h.horaFin}`
        ).join(' | ');
      }

      if (info.issues.length > 0) {
        problemas.push(info);
      } else {
        correctos.push(info);
      }
    });

    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ MÉDICOS CON DATOS COMPLETOS:');
    console.log('═══════════════════════════════════════════════════\n');
    
    if (correctos.length > 0) {
      correctos.forEach((m, i) => {
        console.log(`${i + 1}. ${m.nombre} (${m.email})`);
        console.log(`   💰 Tarifa: ${m.tarifaConsulta}`);
        console.log(`   🏥 Especialidad(es): ${m.especialidades}`);
        console.log(`   🕒 Horarios: ${m.horarios}`);
        console.log('');
      });
    } else {
      console.log('   Ninguno\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('⚠️  MÉDICOS CON DATOS INCOMPLETOS:');
    console.log('═══════════════════════════════════════════════════\n');
    
    if (problemas.length > 0) {
      problemas.forEach((m, i) => {
        console.log(`${i + 1}. ${m.nombre} (${m.email})`);
        m.issues.forEach(issue => console.log(`   ${issue}`));
        if (m.tarifaConsulta) console.log(`   ✅ Tarifa: ${m.tarifaConsulta}`);
        if (m.especialidades) console.log(`   ✅ Especialidad(es): ${m.especialidades}`);
        if (m.horarios) console.log(`   ✅ Horarios: ${m.horarios}`);
        console.log('');
      });
    } else {
      console.log('   Ninguno\n');
    }

    // Resumen
    console.log('═══════════════════════════════════════════════════');
    console.log('📈 RESUMEN:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total médicos: ${medicos.length}`);
    console.log(`✅ Completos: ${correctos.length}`);
    console.log(`⚠️  Incompletos: ${problemas.length}`);
    
    // Estadísticas específicas
    const sinTarifa = medicos.filter(m => !m.medicoInfo?.tarifaConsulta).length;
    const sinEspecialidad = medicos.filter(m => !m.medicoInfo?.especialidades || m.medicoInfo.especialidades.length === 0).length;
    const sinHorarios = medicos.filter(m => !m.medicoInfo?.horariosDisponibles || m.medicoInfo.horariosDisponibles.length === 0).length;
    
    console.log(`\n📊 Problemas detectados:`);
    console.log(`   - Sin tarifaConsulta: ${sinTarifa}`);
    console.log(`   - Sin especialidades: ${sinEspecialidad}`);
    console.log(`   - Sin horarios: ${sinHorarios}`);

    if (problemas.length > 0) {
      console.log('\n💡 RECOMENDACIÓN: Ejecuta el script de corrección para agregar datos faltantes.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

validarEstructuraMedicos();
