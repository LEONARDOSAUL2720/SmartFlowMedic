const mongoose = require('mongoose');
require('dotenv').config();
const Turno = require('../../../../models/Turno');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

const crearTurnosPrueba = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const hoy = new Date();
    hoy.setHours(8, 0, 0, 0);

    // Buscar solo las especialidades que tienen médicos asignados
    const especialidades = await Especialidad.find({ activa: true });
    const pacientes = await Usuario.find({ rol: 'paciente' }).limit(10);

    if (pacientes.length === 0) {
      console.log('⚠️  No hay pacientes en la base de datos');
      return;
    }

    console.log(`\n📋 Creando turnos de prueba para hoy (${hoy.toLocaleDateString()})...\n`);

    let totalTurnosCreados = 0;

    for (const esp of especialidades) {
      // Buscar médicos de esta especialidad
      const medicos = await Usuario.find({
        rol: 'medico',
        'medicoInfo.especialidades': esp._id
      });

      if (medicos.length === 0) {
        console.log(`⏭️  Saltando ${esp.nombre} (sin médicos asignados)`);
        continue;
      }

      console.log(`\n📌 ${esp.nombre} (Código ${esp.codigo}):`);
      
      // Crear 3-5 turnos por especialidad
      const numTurnos = Math.min(5, pacientes.length);
      
      for (let i = 0; i < numTurnos; i++) {
        const numeroTurno = `${esp.codigo}-${(i + 1).toString().padStart(2, '0')}`;
        const paciente = pacientes[i % pacientes.length];
        const medico = medicos[i % medicos.length];

        // Variar estados
        let estado = 'en_espera';
        let extras = {};

        if (i === 0) {
          estado = 'completado';
          extras = {
            horaLlamado: new Date(hoy.getTime() + (i * 20 + 5) * 60000),
            horaAtencion: new Date(hoy.getTime() + (i * 20 + 10) * 60000),
            horaCompletado: new Date(hoy.getTime() + (i * 20 + 25) * 60000)
          };
        } else if (i === 1) {
          estado = 'atendiendo';
          extras = {
            horaLlamado: new Date(hoy.getTime() + (i * 20 + 5) * 60000),
            horaAtencion: new Date(hoy.getTime() + (i * 20 + 10) * 60000)
          };
        }

        const turno = new Turno({
          paciente: paciente._id,
          medico: medico._id,
          especialidad: esp._id,
          fecha: hoy,
          turno: numeroTurno,
          posicionEnFila: i + 1,
          estado: estado,
          motivo: `Consulta ${estado === 'completado' ? 'realizada' : 'programada'}`,
          horaLlegada: new Date(hoy.getTime() + (i * 20) * 60000),
          tiempoEstimadoMin: (numTurnos - i) * 15,
          ...extras
        });

        await turno.save();
        console.log(`   ✅ ${numeroTurno} - ${estado} (${paciente.nombre})`);
        totalTurnosCreados++;
      }
    }

    console.log(`\n✅ Se crearon ${totalTurnosCreados} turnos de prueba en total\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

crearTurnosPrueba();
