//seed.js – Carga datos base iniciales node seed.js

const db = require("./models");

module.exports = async () => {
  try {
    console.log("🌱 Iniciando carga de datos iniciales...");

    // Roles (opcional si hay tabla de roles)

    // Especialidades
    await db.Especialidad.bulkCreate([
      { nombre: "Clínica Médica" },
      { nombre: "Cardiología" },
      { nombre: "Traumatología" },
      { nombre: "Cirugía General" },
      { nombre: "Pediatría" },
    ]);

    // Sectores
    await db.Sector.bulkCreate([
      { nombre: "Guardia" },
      { nombre: "Terapia Intensiva" },
      { nombre: "Administración" },
      { nombre: "Ambulatoria" },
      { nombre: "Cirugía" },
    ]);

    // Turnos
    await db.TurnoPersonal.bulkCreate([
      { descripcion: "Mañana", hora_inicio: "08:00", hora_fin: "14:00" },
      { descripcion: "Tarde", hora_inicio: "14:00", hora_fin: "20:00" },
      { descripcion: "Noche", hora_inicio: "20:00", hora_fin: "08:00" },
    ]);

    // Obras Sociales
    await db.ObraSocial.bulkCreate([
      { nombre: "PAMI", descripcion: "Jubilados" },
      { nombre: "OSDE", descripcion: "Ejecutivos" },
      { nombre: "IOMA", descripcion: "Provincia de Buenos Aires" },
    ]);

    // Usuarios
    const usuarios = await db.Usuario.bulkCreate(
      [
        {
          dni: "11111111",
          nombre: "Paciente Uno",
          email: "paciente1@mail.com",
          password: "1234",
          rol: "Paciente",
        },
        {
          dni: "22222222",
          nombre: "Dr. Clinico",
          email: "clinico@mail.com",
          password: "1234",
          rol: "Medico",
        },
        {
          dni: "33333333",
          nombre: "Enfermero Uno",
          email: "enfermero1@mail.com",
          password: "1234",
          rol: "Enfermero",
        },
        {
          dni: "44444444",
          nombre: "Admin Uno",
          email: "admin@mail.com",
          password: "1234",
          rol: "Administrativo",
        },
      ],
      { returning: true }
    );

    // Médicos y Enfermeros
    const [paciente, medico, enfermero, admin] = usuarios;

    await db.Medico.create({
      usuario_id: medico.id,
      matricula: "MED123",
      especialidad_id: 1,
      sector_id: 1,
    });
    await db.Enfermero.create({ usuario_id: enfermero.id, sector_id: 2 });
    await db.Administrativo.create({
      usuario_id: admin.id,
      sector_id: 3,
      turno_id: 1,
    });
    await db.Paciente.create({
      usuario_id: paciente.id,
      obra_social_id: 1,
      codigo_biometrico: "BIO123",
    });

    // Tipo de internación
    await db.TipoInternacion.bulkCreate([
      {
        nombre: "Ambulatoria",
        tipo_habitacion: "Colectiva",
        cantidad_camas: 20,
        cantidad_enfermeros: 2,
      },
      {
        nombre: "Cirugía General",
        tipo_habitacion: "Doble",
        cantidad_camas: 2,
        cantidad_enfermeros: 3,
      },
      {
        nombre: "Terapia Intensiva",
        tipo_habitacion: "Colectiva",
        cantidad_camas: 10,
        cantidad_enfermeros: 5,
      },
    ]);

    // Habitaciones y camas
    const habitacion = await db.Habitacion.create({
      codigo: "H101",
      tipo: "Doble",
      sexo_permitido: "Femenino",
      tipo_internacion_id: 2,
    });
    await db.Cama.bulkCreate([
      { habitacion_id: habitacion.id, numero: "C1" },
      { habitacion_id: habitacion.id, numero: "C2" },
    ]);

    // Turnos personales
    await db.TurnoPersonal.create({ usuario_id: medico.id, turno_id: 1 });
    await db.TurnoPersonal.create({ usuario_id: enfermero.id, turno_id: 2 });

    // Lista de Espera
    await db.ListaEspera.create({
      paciente_id: paciente.id,
      especialidad_id: 1,
      fecha: new Date(),
      prioridad: "Alta",
    });

    // Internación
    const cama = await db.Cama.findOne();
    await db.Internacion.create({
      paciente_id: paciente.id,
      medico_id: medico.id,
      cama_id: cama.id,
      tipo_internacion_id: 2,
      estado_operacion: "Prequirurgico",
      estado_estudios: "Pendientes",
      estado_paciente: "Estable",
      fecha_inicio: new Date(),
    });

    // Evaluaciones
    await db.EvaluacionMedica.create({
      paciente_id: paciente.id,
      medico_id: medico.id,
      fecha: new Date(),
      diagnostico: "Dolor abdominal agudo",
      tratamiento_propuesto: "Cirugía laparoscópica",
      estudios_solicitados: "Ecografía, Hemograma",
    });
    // seed.js
    await db.Tratamiento.bulkCreate([
      {
        nombre: "Tratamiento para fiebre",
        descripcion: "Administrar antipirético y monitorear",
      },
    ]);

    await db.ProcedimientoEnfermeria.bulkCreate([
      {
        nombre: "Administrar antipirético",
        descripcion: "Inyección de 500 mg de paracetamol IV",
        tratamiento_id: 1,
      },
      {
        nombre: "Monitoreo de signos vitales",
        descripcion: "Revisar temperatura cada 2 horas",
        tratamiento_id: 1,
      },
    ]);

    await db.EvaluacionEnfermeria.create({
      paciente_id: 1,
      enfermero_id: 1,
      medico_id: 2, // Dr. Clínico
      fecha: new Date(),
      signos_vitales: { temp: 38.5, pulso: 90, presion: "130/85" },
      nivel_triaje: "Amarillo",
      observaciones:
        "Fiebre alta, administrado antipirético. Evolución a monitorear.",
      procedimiento_enfermeria_id: 1, // Administrar antipirético
    });

    await db.EvaluacionEnfermeria.create({
      paciente_id: paciente.id,
      enfermero_id: enfermero.id,
      fecha: new Date(),
      signos_vitales: { temp: 37.2, pulso: 80, presion: "120/80" },
      observaciones: "Paciente consciente y estable",
    });

    // Recetas y Reclamos
    await db.RecetaCertificado.create({
      paciente_id: paciente.id,
      tipo: "Receta",
      contenido: "Paracetamol 500mg",
      fecha: new Date(),
    });
    await db.Reclamo.create({
      usuario_id: paciente.id,
      texto: "Demora en atención",
      fecha: new Date(),
      estado: "Pendiente",
    });

    // Factura
    await db.Factura.create({
      paciente_id: paciente.id,
      monto: 1500.0,
      descripcion: "Internación cirugía",
      fecha_emision: new Date(),
    });

    // Solicitud derivación
    await db.SolicitudDerivacion.create({
      paciente_id: paciente.id,
      origen_id: 1,
      destino_id: 2,
      tipo: "Interna",
      estado: "Pendiente",
      fecha: new Date(),
      motivo: "Derivación a cirugía especializada",
    });
    // Notificaciones
    await db.Notificacion.bulkCreate([
      {
        usuario_id: paciente.id,
        mensaje: "Su evaluación médica ha sido registrada.",
        leida: false,
      },
      {
        usuario_id: medico.id,
        mensaje: "Nuevo paciente asignado.",
        leida: false,
      },
      {
        usuario_id: enfermero.id,
        mensaje: "Nueva tarea asignada.",
        leida: false,
      },
      {
        usuario_id: admin.id,
        mensaje: "Nuevo reclamo recibido.",
        leida: false,
      },
    ]);
    // Estudios
    await db.Estudio.create({
      paciente_id: paciente.id,
      descripcion: "Radiografía de tórax",
      fecha: new Date(),
      resultado: "Normal",
    });
    // Alta médica
    await db.AltaMedica.create({
      paciente_id: paciente.id,
      medico_id: medico.id,
      fecha: new Date(),
      motivo: "Mejora clínica",
      observaciones: "Paciente estable, se recomienda seguimiento ambulatorio",
    });
    // Historial médico
    await db.HistorialMedico.create({
      paciente_id: paciente.id,
      descripcion:
        "Paciente con antecedentes de hipertensión y diabetes tipo 2.",
      fecha: new Date(),
    });
    // Motivos de consulta
    await db.MotivoConsulta.bulkCreate([
      { nombre: "Fiebre", descripcion: "Temperatura > 38°C" },
      { nombre: "Dolor torácico", descripcion: "Dolor en el pecho" },
      {
        nombre: "Dificultad respiratoria",
        descripcion: "Problemas para respirar",
      },
      { nombre: "Dolor abdominal", descripcion: "Dolor en el abdomen" },
      { nombre: "Cefalea", descripcion: "Dolor de cabeza" },
    ]);

    const motivos = await db.MotivoConsulta.findAll();
    await db.HistorialMedico.bulkCreate([
      {
        paciente_id: paciente.id,
        motivo_consulta_id: motivos[0].id, // Fiebre
        descripcion: "Paciente con fiebre alta",
        tipo_evento: "Consulta",
        fecha: new Date(),
      },
      {
        paciente_id: paciente.id,
        motivo_consulta_id: null,
        descripcion: "Internación por cirugía",
        tipo_evento: "Internacion",
        fecha: new Date(),
      },
    ]);
    //Noticia
    await db.Noticia.bulkCreate([
      {
        titulo: "Nueva sala de emergencias",
        texto: "Abrimos una nueva sala de emergencias el 01/06/2025.",
        fecha: new Date(),
        autor_id: admin.id,
      },
      {
        titulo: "Horarios extendidos",
        texto: "Extendimos los horarios de atención en guardia.",
        fecha: new Date(),
        autor_id: admin.id,
      },
    ]);

    console.log("✅ Seeders ejecutados con éxito.");
  } catch (error) {
    console.error("❌ Error en seed.js:", error);
  }
};
