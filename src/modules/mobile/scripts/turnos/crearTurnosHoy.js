const mongoose = require('mongoose');
require('dotenv').config();
const Turno = require('../../../../models/Turno');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

const crearTurnosHoy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Fecha de HOY
    const hoy = new Date();
    console.log(`📅 Creando turnos para: ${hoy.toLocaleString()}\n`);

    // Buscar todas las especialidades activas
    const especialidades = await Especialidad.find({ activa: true });
    console.log(`✅ Encontradas ${especialidades.length} especialidades\n`);

    // Buscar todos los pacientes
    const pacientes = await Usuario.find({ rol: 'paciente' }).limit(10);
    console.log(`✅ Encontrados ${pacientes.length} pacientes\n`);

    let turnosCreados = 0;

    for (const esp of especialidades) {
      // Buscar médicos de esta especialidad
      const medicos = await Usuario.find({
        rol: 'medico',
        'medicoInfo.especialidades': esp._id
      });

      if (medicos.length === 0) {
        console.log(`⚠️  ${esp.nombre}: No hay médicos, saltando...`);
        continue;
      }

      const medico = medicos[0];
      console.log(`🏥 ${esp.nombre} (Código ${esp.codigo}) - Dr. ${medico.nombre}`);

      // Crear 5 turnos para esta especialidad
      for (let i = 1; i <= 5; i++) {
        const paciente = pacientes[i % pacientes.length];
        
        const turno = new Turno({
          paciente: paciente._id,
          medico: medico._id,
          especialidad: esp._id,
          fecha: hoy,
          turno: `${esp.codigo}-${String(i).padStart(2, '0')}`,
          posicionEnFila: i,
          estado: i === 1 ? 'atendiendo' : 'en_espera',
          motivo: `Consulta ${i}`,
          horaLlegada: new Date(hoy.getTime() - (60 - i * 10) * 60000),
          tiempoEstimadoMin: (i - 1) * 15
        });

        await turno.save();
        console.log(`   ✅ Turno ${esp.codigo}-${String(i).padStart(2, '0')} - ${turno.estado}`);
        turnosCreados++;
      }
      console.log('');
    }

    console.log(`\n🎉 Total de turnos creados: ${turnosCreados}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

crearTurnosHoy();
