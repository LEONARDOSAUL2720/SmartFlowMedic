/**
 * Script para consultar los horarios disponibles de un médico específico
 * Útil para verificar la estructura de datos antes de implementar generar cita
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');

async function consultarHorariosMedico(emailMedico = null) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    let query = { rol: 'medico' };
    if (emailMedico) {
      query.email = emailMedico;
    }

    const medicos = await Usuario.find(query)
      .populate('medicoInfo.especialidades', 'nombre codigo')
      .limit(5); // Limitar a 5 para no saturar la consola

    if (medicos.length === 0) {
      console.log('❌ No se encontraron médicos');
      return;
    }

    console.log(`📋 Mostrando horarios de ${medicos.length} médico(s):\n`);

    medicos.forEach((medico, index) => {
      console.log('═══════════════════════════════════════════════════');
      console.log(`${index + 1}. ${medico.nombre} ${medico.apellido}`);
      console.log('═══════════════════════════════════════════════════');
      console.log(`📧 Email: ${medico.email}`);
      console.log(`🆔 ID: ${medico._id}`);
      
      if (medico.medicoInfo) {
        // Especialidades
        if (medico.medicoInfo.especialidades && medico.medicoInfo.especialidades.length > 0) {
          const especialidades = medico.medicoInfo.especialidades.map(e => e.nombre).join(', ');
          console.log(`🏥 Especialidad(es): ${especialidades}`);
        }

        // Tarifa
        if (medico.medicoInfo.tarifaConsulta) {
          console.log(`💰 Tarifa de consulta: $${medico.medicoInfo.tarifaConsulta}`);
        }

        // Horarios
        if (medico.medicoInfo.horariosDisponibles && medico.medicoInfo.horariosDisponibles.length > 0) {
          console.log(`\n🕒 Horarios disponibles:`);
          medico.medicoInfo.horariosDisponibles.forEach(h => {
            console.log(`   ${h.dia}: ${h.horaInicio} - ${h.horaFin}`);
          });
        } else {
          console.log(`\n❌ No tiene horarios disponibles definidos`);
        }

        // Experiencia
        if (medico.medicoInfo.experiencia) {
          console.log(`\n📝 Experiencia: ${medico.medicoInfo.experiencia}`);
        }

        // Calificación
        if (medico.medicoInfo.calificacionPromedio) {
          console.log(`⭐ Calificación: ${medico.medicoInfo.calificacionPromedio}/5`);
        }

        // Citas atendidas
        if (medico.medicoInfo.totalCitasAtendidas) {
          console.log(`📊 Citas atendidas: ${medico.medicoInfo.totalCitasAtendidas}`);
        }
      }
      console.log('');
    });

    // Ejemplo de cómo usar estos datos para generar horarios de citas
    console.log('═══════════════════════════════════════════════════');
    console.log('💡 EJEMPLO: Horarios para generar citas');
    console.log('═══════════════════════════════════════════════════');
    
    const ejemploMedico = medicos[0];
    if (ejemploMedico.medicoInfo?.horariosDisponibles && ejemploMedico.medicoInfo.horariosDisponibles.length > 0) {
      const primerHorario = ejemploMedico.medicoInfo.horariosDisponibles[0];
      console.log(`\nSi hoy es ${primerHorario.dia}:`);
      console.log(`Horario: ${primerHorario.horaInicio} - ${primerHorario.horaFin}`);
      console.log(`\nHorarios de citas cada 30 min:`);
      
      // Generar slots de 30 minutos
      const inicio = parseInt(primerHorario.horaInicio.split(':')[0]);
      const fin = parseInt(primerHorario.horaFin.split(':')[0]);
      const slots = [];
      
      for (let hora = inicio; hora < fin; hora++) {
        slots.push(`${hora.toString().padStart(2, '0')}:00`);
        slots.push(`${hora.toString().padStart(2, '0')}:30`);
      }
      
      console.log(slots.slice(0, 10).join(', '), '...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

// Ejecutar (puedes pasar un email específico como parámetro)
const emailBuscar = process.argv[2]; // node consultarHorariosMedico.js email@ejemplo.com
consultarHorariosMedico(emailBuscar);
