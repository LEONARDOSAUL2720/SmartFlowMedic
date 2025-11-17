const mongoose = require('mongoose');
require('dotenv').config();
const Turno = require('../../../../models/Turno');
const Usuario = require('../../../../models/Usuario');
const Especialidad = require('../../../../models/Especialidad');

const crearTurnosPrueba = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener fecha de hoy
    const hoy = new Date();
    hoy.setHours(8, 0, 0, 0); // Inicio del día a las 8 AM

    // Buscar especialidades
    const cardiologia = await Especialidad.findOne({ nombre: 'Cardiología' });
    const dermatologia = await Especialidad.findOne({ nombre: 'Dermatología' });
    const pediatria = await Especialidad.findOne({ nombre: 'Pediatría' });

    // Buscar médicos
    const medicosCardio = await Usuario.find({
      rol: 'medico',
      'medicoInfo.especialidades': cardiologia._id
    });

    const medicosDermato = await Usuario.find({
      rol: 'medico',
      'medicoInfo.especialidades': dermatologia._id
    });

    const medicosPedia = await Usuario.find({
      rol: 'medico',
      'medicoInfo.especialidades': pediatria._id
    });

    if (!medicosCardio.length || !medicosDermato.length) {
      console.log('⚠️  No hay suficientes médicos con especialidades asignadas');
      console.log(`   Cardiología: ${medicosCardio.length} médicos`);
      console.log(`   Dermatología: ${medicosDermato.length} médicos`);
      console.log(`   Pediatría: ${medicosPedia.length} médicos`);
      return;
    }

    // Buscar pacientes (Leonardo y otros)
    const pacientes = await Usuario.find({ rol: 'paciente' }).limit(10);

    if (pacientes.length === 0) {
      console.log('⚠️  No hay pacientes en la base de datos');
      return;
    }

    console.log(`\n📋 Creando turnos de prueba para hoy (${hoy.toLocaleDateString()})...\n`);

    // Crear turnos para Cardiología
    const turnosCardiologia = [
      {
        paciente: pacientes[0]._id,
        medico: medicosCardio[0]._id,
        especialidad: cardiologia._id,
        fecha: hoy,
        turno: 'A-01',
        posicionEnFila: 1,
        estado: 'completado',
        motivo: 'Control post-operatorio',
        horaLlegada: new Date(hoy.getTime() + 0 * 60000),
        horaLlamado: new Date(hoy.getTime() + 5 * 60000),
        horaAtencion: new Date(hoy.getTime() + 10 * 60000),
        horaCompletado: new Date(hoy.getTime() + 25 * 60000)
      },
      {
        paciente: pacientes[1]._id,
        medico: medicosCardio[0]._id,
        especialidad: cardiologia._id,
        fecha: hoy,
        turno: 'A-02',
        posicionEnFila: 2,
        estado: 'atendiendo',
        motivo: 'Dolor en el pecho',
        horaLlegada: new Date(hoy.getTime() + 15 * 60000),
        horaLlamado: new Date(hoy.getTime() + 26 * 60000),
        horaAtencion: new Date(hoy.getTime() + 30 * 60000)
      },
      {
        paciente: pacientes[2]._id,
        medico: medicosCardio[0]._id,
        especialidad: cardiologia._id,
        fecha: hoy,
        turno: 'A-03',
        posicionEnFila: 3,
        estado: 'en_espera',
        motivo: 'Consulta de rutina',
        horaLlegada: new Date(hoy.getTime() + 20 * 60000),
        tiempoEstimadoMin: 15
      },
      {
        paciente: pacientes[3]._id,
        medico: medicosCardio[0]._id,
        especialidad: cardiologia._id,
        fecha: hoy,
        turno: 'A-04',
        posicionEnFila: 4,
        estado: 'en_espera',
        motivo: 'Revisión de exámenes',
        horaLlegada: new Date(hoy.getTime() + 25 * 60000),
        tiempoEstimadoMin: 30
      },
      {
        paciente: pacientes[4]._id,
        medico: medicosCardio[0]._id,
        especialidad: cardiologia._id,
        fecha: hoy,
        turno: 'A-05',
        posicionEnFila: 5,
        estado: 'en_espera',
        motivo: 'Presión arterial alta',
        horaLlegada: new Date(hoy.getTime() + 30 * 60000),
        tiempoEstimadoMin: 45
      }
    ];

    // Crear turnos para Dermatología
    const turnosDermatologia = [
      {
        paciente: pacientes[5]._id,
        medico: medicosDermato[0]._id,
        especialidad: dermatologia._id,
        fecha: hoy,
        turno: 'B-01',
        posicionEnFila: 1,
        estado: 'completado',
        motivo: 'Consulta por acné',
        horaLlegada: new Date(hoy.getTime() + 10 * 60000),
        horaLlamado: new Date(hoy.getTime() + 15 * 60000),
        horaAtencion: new Date(hoy.getTime() + 20 * 60000),
        horaCompletado: new Date(hoy.getTime() + 35 * 60000)
      },
      {
        paciente: pacientes[6]._id,
        medico: medicosDermato[0]._id,
        especialidad: dermatologia._id,
        fecha: hoy,
        turno: 'B-02',
        posicionEnFila: 2,
        estado: 'en_espera',
        motivo: 'Irritación en la piel',
        horaLlegada: new Date(hoy.getTime() + 35 * 60000),
        tiempoEstimadoMin: 15
      },
      {
        paciente: pacientes[7]._id,
        medico: medicosDermato[0]._id,
        especialidad: dermatologia._id,
        fecha: hoy,
        turno: 'B-03',
        posicionEnFila: 3,
        estado: 'en_espera',
        motivo: 'Manchas en la cara',
        horaLlegada: new Date(hoy.getTime() + 40 * 60000),
        tiempoEstimadoMin: 30
      }
    ];

    // Crear turnos para Pediatría (solo si hay médicos)
    let turnosPediatria = [];
    if (medicosPedia.length > 0) {
      turnosPediatria = [
        {
          paciente: pacientes[8 % pacientes.length]._id,
          medico: medicosPedia[0]._id,
          especialidad: pediatria._id,
          fecha: hoy,
          turno: 'C-01',
          posicionEnFila: 1,
          estado: 'en_espera',
          motivo: 'Control de niño sano',
          horaLlegada: new Date(hoy.getTime() + 45 * 60000),
          tiempoEstimadoMin: 15
        },
        {
          paciente: pacientes[9 % pacientes.length]._id,
          medico: medicosPedia[0]._id,
          especialidad: pediatria._id,
          fecha: hoy,
          turno: 'C-02',
          posicionEnFila: 2,
          estado: 'en_espera',
          motivo: 'Vacunación',
          horaLlegada: new Date(hoy.getTime() + 50 * 60000),
          tiempoEstimadoMin: 30
        }
      ];
    }

    // Insertar todos los turnos
    const todosTurnos = [...turnosCardiologia, ...turnosDermatologia, ...turnosPediatria];
    
    for (const turnoData of todosTurnos) {
      const turno = new Turno(turnoData);
      await turno.save();
      console.log(`✅ Creado turno ${turnoData.turno} - ${turnoData.estado}`);
    }

    console.log(`\n✅ Se crearon ${todosTurnos.length} turnos de prueba`);
    console.log('\n📊 Resumen:');
    console.log(`   Cardiología (A): ${turnosCardiologia.length} turnos`);
    console.log(`   Dermatología (B): ${turnosDermatologia.length} turnos`);
    console.log(`   Pediatría (C): ${turnosPediatria.length} turnos`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

crearTurnosPrueba();
