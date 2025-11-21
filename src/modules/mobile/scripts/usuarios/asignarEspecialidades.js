/**
 * Script para asignar especialidades a médicos
 * Uso: node -r dotenv/config src/modules/mobile/scripts/usuarios/asignarEspecialidades.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../../.env') });
const mongoose = require('mongoose');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

async function asignarEspecialidades() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI no está definida');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener médicos
    const medicos = await Usuario.find({ rol: 'medico' });
    console.log(`📋 Médicos encontrados: ${medicos.length}\n`);

    // Obtener especialidades
    const especialidades = await Especialidad.find({});
    if (especialidades.length === 0) {
      console.log('❌ No hay especialidades creadas. Ejecuta primero crearEspecialidades.js');
      return;
    }

    console.log(`📋 Especialidades disponibles: ${especialidades.length}\n`);

    // Asignar especialidades a cada médico
    for (let i = 0; i < medicos.length; i++) {
      const medico = medicos[i];
      
      // Asignar 1-2 especialidades aleatorias a cada médico
      const numEspecialidades = Math.floor(Math.random() * 2) + 1; // 1 o 2
      const especialidadesAsignadas = [];
      
      for (let j = 0; j < numEspecialidades; j++) {
        const randomIndex = Math.floor(Math.random() * especialidades.length);
        const espId = especialidades[randomIndex]._id;
        
        if (!especialidadesAsignadas.includes(espId)) {
          especialidadesAsignadas.push(espId);
        }
      }

      // Actualizar médico con especialidades y otros datos
      medico.medicoInfo = {
        cedula: `CED-${1000 + i}`,
        especialidades: especialidadesAsignadas,
        tarifaConsulta: 500 + (i * 100), // 500, 600, 700...
        descripcion: `Médico especialista con amplia experiencia`,
        experiencia: `${5 + i} años de experiencia`,
        ubicacion: {
          direccion: `Consultorio ${i + 1}, Centro Médico SmartFlow`,
          ciudad: 'Guadalajara',
          lat: 20.6597 + (i * 0.01),
          lng: -103.3496 + (i * 0.01)
        },
        horariosDisponibles: [
          { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' },
          { dia: 'Martes', horaInicio: '09:00', horaFin: '13:00' },
          { dia: 'Miércoles', horaInicio: '14:00', horaFin: '18:00' },
          { dia: 'Jueves', horaInicio: '09:00', horaFin: '13:00' },
          { dia: 'Viernes', horaInicio: '09:00', horaFin: '13:00' }
        ],
        calificacionPromedio: 4.5 + (Math.random() * 0.5),
        totalCitasAtendidas: Math.floor(Math.random() * 100) + 50
      };

      await medico.save();

      // Mostrar resultado
      console.log(`✅ ${medico.nombre} ${medico.apellido}`);
      console.log(`   Especialidades: ${especialidadesAsignadas.length}`);
      especialidadesAsignadas.forEach(espId => {
        const esp = especialidades.find(e => e._id.equals(espId));
        console.log(`   - ${esp.nombre}`);
      });
      console.log(`   Tarifa: $${medico.medicoInfo.tarifaConsulta}`);
      console.log('');
    }

    console.log('✅ Especialidades asignadas correctamente a todos los médicos');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

asignarEspecialidades();
