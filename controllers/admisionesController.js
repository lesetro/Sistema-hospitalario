const { Op } = require('sequelize');
const FilterService = require('../services/FilterService');
const db = require('../database/db');
const { 
  Admision, 
  Paciente, 
  Administrativo, 
  MotivoAdmision, 
  FormaIngreso, 
  Turno, 
  Usuario, 
  ObraSocial, 
  TipoTurno, 
  Medico, 
  Sector, 
  Cama,
  EvaluacionMedica,
  Habitacion,
  Internacion,
  TipoInternacion,
  TipoDeServicio,
  TipoEstudio, 
  Especialidad, 
  ListasEsperas,
 

} = require('../models');

// Obtener el último ID de paciente
const obtenerUltimoIdPaciente = async (req, res) => {
  try {
    const ultimoPaciente = await Paciente.findOne({ order: [['id', 'DESC']] });
    const ultimoId = ultimoPaciente ? ultimoPaciente.id : 0;
    res.status(200).json({ ultimoId });
  } catch (error) {
    console.error('Error al obtener último ID:', error);
    res.status(500).json({ message: 'Error al obtener último ID', error: error.message });
  }
};

// Buscar paciente por DNI

const buscarPacientePorDNI = async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ message: 'DNI es requerido' });
    }

    // Buscar al usuario con rol de paciente
    const usuario = await Usuario.findOne({
      where: { dni, rol_id: 4 },
      attributes: ['id', 'dni', 'nombre', 'apellido']
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario con ese DNI no es paciente' });
    }

    // Buscar el paciente vinculado a ese usuario
    const paciente = await Paciente.findOne({
      where: { usuario_id: usuario.id }
    });

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado en la tabla pacientes' });
    }

    res.status(200).json({
      paciente: {
        id: paciente.id, 
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      }
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Obtener horarios disponibles

const getHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, medico_id, sector_id } = req.query;

    // Validación básica
    if (!fecha || !medico_id || !sector_id) {
      return res.status(400).json({ message: 'Faltan parámetros requeridos' });
    }
    console.log('parametros:', fecha, medico_id, sector_id);

    // Verificar que médico y sector existen
    const [medico, sector] = await Promise.all([
      Medico.findByPk(medico_id),
      Sector.findByPk(sector_id)
    ]);

    if (!medico || !sector) {
      return res.status(404).json({ message: 'Médico o sector no encontrado' });
    }

    // Obtener turnos ocupados
    const turnosOcupados = await Turno.findAll({
      where: { 
        fecha, 
        medico_id, 
        sector_id, 
        estado: ['PENDIENTE', 'CONFIRMADO'] 
      },
      attributes: ['hora_inicio'],
      raw: true
    });
    console.log('Turnos ocupados:', turnosOcupados);

    // Generar horarios posibles (8:00 a 17:00 cada 20 mins)
    const horariosPosibles = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 20) {
        horariosPosibles.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }

    // Filtrar horarios ocupados
    const ocupados = turnosOcupados
      .map(t => t.hora_inicio?.substring(0, 5) || '')
      .filter(h => h);
    const horariosDisponibles = horariosPosibles.filter(h => !ocupados.includes(h));
    console.log('HorariosDisponibles:', horariosDisponibles);

    res.json({ horariosDisponibles: horariosDisponibles || [] });

  } catch (error) {
    console.error('Error en getHorariosDisponibles:', error);
    res.status(500).json({ 
      message: 'Error al obtener horarios',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Generar paciente temporal para el botón "Generar"
const generarPacienteTemporal = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const timestamp = Date.now();
    const dni = `TEMP${timestamp}`;
    
    console.log('Generando paciente temporal con DNI:', dni);

    // Crear usuario temporal
    const usuario = await Usuario.create({
      dni,
      nombre: 'Temporal',
      apellido: 'Paciente',
      email: `temp+${timestamp}@generico.com`,
      password: `temp${timestamp}`,
      rol_id: 4,
      fecha_nacimiento: new Date('1990-01-01'),
      sexo: 'Otro',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });
    console.log('Usuario creado:', usuario.id);
   

    // Crear paciente
    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      //administrativo_id: 1,
      fecha_ingreso: new Date(),
      estado: 'Activo',
      observaciones: 'Paciente temporal generado automáticamente',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });
    console.log('Paciente creado:', paciente.id);
 
    await transaction.commit();
    res.status(201).json({
      success: true,
      paciente: {
        id: paciente.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        password: `temp${timestamp}`,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al generar paciente temporal:', error);
    res.status(500).json({ success: false, message: 'Error al generar paciente temporal', error: error.message });
  }
};

// Crear nuevo paciente
const crearPaciente = async (req, res) => {
   console.log('Datos recibidos en req.body:', req.body);
  const transaction = await db.sequelize.transaction();
  try {
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      telefono,
      administrativo_id,
      obra_social_id,
      fecha_nacimiento,
      sexo,
      fecha_ingreso,
      estado,
      observaciones,
    } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !administrativo_id || !fecha_ingreso || !fecha_nacimiento || !sexo) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Campos obligatorios faltantes: nombre, apellido, DNI, email, contraseña, administrativo_id, fecha_ingreso, fecha_nacimiento y sexo son requeridos' });
    }

    // Verificar si ya existe un usuario con ese DNI o email
    const usuarioExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { dni },
          { email }
        ]
      },
      transaction
    });
    if (usuarioExistente) {
      await transaction.rollback();
      if (usuarioExistente.dni === dni) {
        return res.status(400).json({ message: 'Ya existe un usuario con este DNI' });
      }
      if (usuarioExistente.email === email) {
        return res.status(400).json({ message: 'Ya existe un usuario con este email' });
      }
    }

    // Crear el usuario
    const usuario = await Usuario.create({
      dni,
      nombre,
      apellido,
      email,
      password, 
      rol_id: 4, // Rol "Paciente"
      telefono: telefono || null,
      fecha_nacimiento,
      sexo,
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    // Crear el paciente
    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      administrativo_id,
      obra_social_id: obra_social_id || null,
      fecha_ingreso,
      estado: estado || 'Activo',
      observaciones: observaciones || null,
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      success: true,
      paciente: { id: paciente.id, dni: usuario.dni, nombre: usuario.nombre, apellido: usuario.apellido },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear paciente:', error);
    res.status(500).json({ success: false, message: 'Error al crear paciente', error: error.message });
  }
};

// Crear admisión de urgencia
const crearAdmisionUrgencia = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { dni } = req.body;
    console.log('Creando admisión de urgencia para DNI:', dni);

    if (!dni) {
      await transaction.rollback();
      return res.status(400).json({ message: 'DNI es requerido' });
    }

    // Buscar o crear usuario
    let usuario = await Usuario.findOne({ where: { dni }, transaction });
    if (!usuario) {
      usuario = await Usuario.create({
        dni,
        nombre: 'Urgencia',
        apellido: 'Desconocido',
        email: `urgencia+${Date.now()}@generico.com`,
        password: 'temp123',
        rol_id: 4,
        fecha_nacimiento: new Date('1990-01-01'),
        sexo: 'Otro',
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
      console.log('Usuario creado para urgencia:', usuario.id);
    }

    // Buscar o crear paciente
    let paciente = await Paciente.findOne({ where: { usuario_id: usuario.id }, transaction });
    if (!paciente) {
      paciente = await Paciente.create({
        usuario_id: usuario.id,
        administrativo_id: 1,
        fecha_ingreso: new Date(),
        estado: 'Activo',
        observaciones: 'Paciente registrado por urgencias',
        created_at: new Date(),
        updated_at: new Date(),
      }, { transaction });
      console.log('Paciente creado para urgencia:', paciente.id);
    }

    // Crear admisión urgencia
    const admision = await Admision.create({
      paciente_id: paciente.id,
      administrativo_id: 1, 
      motivo_id: 1, 
      forma_ingreso_id: 1, 
      sector_id: 1, 
      tipo_estudio_id: null,
      fecha: new Date(),
      estado: 'Pendiente',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    // Crear lista de espera para emergencia

    console.log('Admisión creada:', admision.id);
    await ListasEsperas.create({
    paciente_id: paciente.id,
    tipo: 'EVALUACION', // Las emergencias van primero a evaluación
    prioridad: 'ALTA', 
    estado: 'PENDIENTE',
    fecha_registro: new Date(),
    created_at: new Date(),
    updated_at: new Date()
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      success: true,
      message: `Paciente creado con éxito, número identificación ${dni}`,
      pacienteId: paciente.id,
      admisionId: admision.id,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear paciente o admisión:', error);
    res.status(500).json({ success: false, message: 'Error al crear paciente o admisión', error: error.message });
  }
};
// Crear nueva admisión
const crearAdmision = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  console.log(`crear admision depues de await controller`,transaction);
  try {
    const { 
      paciente_id, 
      tipo_turno_id, 
      medico_id, 
      sector_id, 
      fecha, 
      turno_hora, //no tengo dato tengo que revisar esto null por el momento  
      motivo_id, 
      forma_ingreso_id, 
      administrativo_id, 
      lista_espera_tipo, 
      tipo_estudio_id, 
      especialidad_id, 
      prioridad 
    } = req.body;

    // Validación de campos requeridos
    const requiredFields = {
      paciente_id: 'Paciente',
      administrativo_id: 'Administrativo',
      motivo_id: 'Motivo',
      forma_ingreso_id: 'Forma de ingreso',
      fecha: 'Fecha',
      tipo_turno_id: 'Tipo de turno'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !req.body[key])
      .map(([_, name]) => name);

    if (missingFields.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Campos obligatorios faltantes: ${missingFields.join(', ')}` 
      });
    }

    // Verificar existencia de entidades relacionadas
    const [
      paciente, 
      tipoTurno, 
      medico, 
      sector, 
      motivo, 
      formaIngreso, 
      administrativo,
      tipoEstudio,
      especialidad
    ] = await Promise.all([
      Paciente.findByPk(paciente_id, { 
        include: [{ model: Usuario, as: 'usuario' }], 
        transaction 
      }),
      TipoTurno.findByPk(tipo_turno_id, { transaction }),
      medico_id ? Medico.findByPk(medico_id, { 
        include: [{ model: Usuario, as: 'usuario' }],
        transaction 
      }) : Promise.resolve(null),
      sector_id ? Sector.findByPk(sector_id, { transaction }) : Promise.resolve(null),
      MotivoAdmision.findByPk(motivo_id, { transaction }),
      FormaIngreso.findByPk(forma_ingreso_id, { transaction }),
      Administrativo.findByPk(administrativo_id, { transaction }),
      tipo_estudio_id ? TipoEstudio.findByPk(tipo_estudio_id, { transaction }) : Promise.resolve(null),
      especialidad_id ? Especialidad.findByPk(especialidad_id, { transaction }) : Promise.resolve(null)
    ]);

    // Validaciones específicas
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    if (!paciente.usuario || paciente.usuario.rol_id !== 4) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El usuario no tiene rol de paciente' });
    }

    if (medico_id && !medico) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    if (sector_id && !sector) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Sector no encontrado' });
    }

    if (!motivo) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Motivo no encontrado' });
    }

    if (!formaIngreso) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Forma de ingreso no encontrada' });
    }

    if (!administrativo) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Administrativo no encontrado' });
    }
    
let internacionCreada = null;
    let mensajeAdicional = '';

    const esInternacionAutomatica = async () => {
      try {
        const [tipoTurno, formaIngreso] = await Promise.all([
          TipoTurno.findByPk(tipo_turno_id, { transaction }),
          FormaIngreso.findByPk(forma_ingreso_id, { transaction })
        ]);
        console.log("tipo turno ", tipoTurno,"  " , formaIngreso);
        if (!tipoTurno) throw new Error(`Tipo de turno con ID ${tipo_turno_id} no encontrado`);
        if (!formaIngreso) throw new Error(`Forma de ingreso con ID ${forma_ingreso_id} no encontrada`);

        const isProgramado = (
          tipoTurno.nombre.toLowerCase() === 'programado' &&
          formaIngreso.nombre.toLowerCase() === 'programado' &&
          lista_espera_tipo?.toUpperCase() === 'INTERNACION'
        );

        console.log('esInternacion  ***************    Automatica:', {
          tipoTurno: tipoTurno.nombre,
          formaIngreso: formaIngreso.nombre,
          lista_espera_tipo,
          isProgramado
        });
        
        return isProgramado;
      } catch (error) {
        console.error('Error en esInternacionAutomatica:', error.message);
        throw error;
      }
    };

    // Crear internación si es automática
    if (await esInternacionAutomatica()) {
      console.log(`verifico si es internacionacion`,esInternacionAutomatica);
      const { internacionId, mensaje } = await asignarCamaInternacion({
        
        paciente,
        medico_id,
        administrativo_id,
        sector_id,
        transaction,
        admision_id: admision.id
      });

      internacionCreada = { id: internacionId };
      mensajeAdicional = mensaje;
    }
    console.log('verifico paciente medico administrados sector transaction:', {
            paciente,
            medico_id,
            administrativo_id,
            sector_id,
            transaction,
            internacionCreada,
            mensajeAdicional
        });

    // Verificar disponibilidad del turno
    if (turno_hora && medico_id && sector_id) {
      const turnoExistente = await Turno.findOne({
        where: {
          medico_id,
          sector_id,
          fecha,
          hora_inicio: turno_hora,
          estado: ['PENDIENTE', 'CONFIRMADO'],
          paciente_id: { [Op.ne]: paciente_id }
        },
        transaction
      });

      if (turnoExistente) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El turno ya está asignado a otro paciente' });
      }
    }

    // Calcular hora fin (turnos de 20 minutos)
    let horaFin = null;
    if (turno_hora) {
      const [hours, minutes] = turno_hora.split(':');
      let totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 20;
      const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
      const newMinutes = String(totalMinutes % 60).padStart(2, '0');
      horaFin = `${newHours}:${newMinutes}`;
    }

    // Crear turno
    let turno = null;
    if (tipo_turno_id && turno_hora) {
      turno = await Turno.create({
        tipo_turno_id,
        fecha,
        hora_inicio: turno_hora,
        hora_fin: horaFin,
        estado: 'PENDIENTE',
        paciente_id,
        medico_id,
        sector_id,
        tipo_estudio_id: tipo_estudio_id || null,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
    }

    // Crear admisión
    const admision = await Admision.create({
      paciente_id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      turno_id: turno ? turno.id : null,
      fecha,
      medico_id: medico_id || null,
      sector_id: sector_id || null,
      tipo_estudio_id: tipo_estudio_id || null,
      especialidad_id: especialidad_id || null,
      estado: 'Pendiente',
      prioridad,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    // Crear lista de espera solo si no es internación automática
    if (lista_espera_tipo && prioridad && !internacionCreada) {
      await ListasEsperas.create({
        paciente_id,
        turno_id: turno ? turno.id : null,
        tipo: lista_espera_tipo,
        tipo_estudio_id: tipo_estudio_id || null,
        especialidad_id: especialidad_id || null,
        prioridad,
        estado: 'PENDIENTE',
        fecha_registro: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
    }

    await transaction.commit();
    const response = {
      success: true,
      message: 'Admisión creada exitosamente' + (mensajeAdicional ? ` - ${mensajeAdicional}` : ''),
      admisionId: admision.id,
      turnoId: turno ? turno.id : null
    };

    if (internacionCreada) {
      response.internacionId = internacionCreada.id;
      response.direccionPaciente = mensajeAdicional;
    }

    return res.status(201).json(response);
  } catch (error) {
    await transaction.rollback();
    console.error('Error completo al crear admisión:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      errorDetails: error.errors || error
    });
    return res.status(500).json({
      success: false,
      message: 'Error al crear admisión',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? { stack: error.stack, fullError: JSON.stringify(error) } : undefined
    });
  }
};

// Obtener todas las admisiones para editar o mostrar
const getAdmisiones = async (req, res) => {
  try {
    const { id } = req.params;
    const filtros = FilterService.cleanFilters(req.query);
    
    let whereClause = {};
    if (id) {
      whereClause.id = id;
    } else {
      whereClause = FilterService.applyFilters(filtros, 'admisiones');
    }
    
    const admisiones = await Admision.findAll({
    where: whereClause,
      include: [
        { 
          model: Paciente, as: 'paciente', attributes: ['id'], include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] } ]
        },
        { model: Administrativo, as: 'administrativo', attributes: ['id', 'responsabilidad'] },
        { model: MotivoAdmision, as: 'motivo', attributes: ['id', 'nombre'] },
        { model: FormaIngreso, as: 'forma_ingreso', attributes: ['id', 'nombre'] },
        { 
          model: Turno, as: 'turno', 
          attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'lista_espera_id'], 
          include: [
            { model: TipoTurno, as: 'tipoTurno', attributes: ['id', 'nombre'] }
          ]
        },
        { model: Medico, as: 'medico', attributes: ['id'], include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] },
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] },
        { model: TipoEstudio, as: 'tipo_estudio', attributes: ['id', 'nombre'] },
        { model: Especialidad, as: 'especialidad', attributes: ['id', 'nombre'] },
        
      ]
    }); 

    // Si es para editar y no encuentra la admisión
    if (id && admisiones.length === 0) {
      return res.status(404).render('error', { message: 'Admisión no encontrada' });
    }

    console.log("Admisiones encontradas:", admisiones.map(a => a.id));
    
    const listaEsperaIds = admisiones
      .filter(admision => admision.turno && admision.turno.lista_espera_id)
      .map(admision => admision.turno.lista_espera_id);

    const listasEsperas = listaEsperaIds.length > 0 ? await ListasEsperas.findAll({
      where: { id: { [Op.in]: listaEsperaIds } },
      attributes: ['id', 'tipo', 'prioridad', 'estado']
    }) : [];

    const listasEsperasMap = new Map(listasEsperas.map(lista => [lista.id, lista]));
    admisiones.forEach(admision => {
      if (admision.turno && admision.turno.lista_espera_id) {
        admision.turno.dataValues.listaEsperaTurno = listasEsperasMap.get(admision.turno.lista_espera_id) || null;
      } else {
        admision.turno = admision.turno || {};
        admision.turno.dataValues = admision.turno.dataValues || {};
        admision.turno.dataValues.listaEsperaTurno = null;
      }
    });

    const pacientes = await Paciente.findAll({ 
      attributes: ['id'],
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }
      ]
    });

    const administrativos = await Administrativo.findAll({ attributes: ['id', 'responsabilidad'] });
    const motivos = await MotivoAdmision.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const formas = await FormaIngreso.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const obrasSociales = await ObraSocial.findAll({ attributes: ['id', 'nombre'] });
    const tiposTurno = await TipoTurno.findAll({ attributes: ['id', 'nombre'] });
    const medicos = await Medico.findAll({ attributes: ['id'], include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] });
    const sectores = await Sector.findAll({ attributes: ['id', 'nombre'] });
    const tiposDeServicio = await TipoEstudio.findAll({ attributes: ['id', 'nombre'] });
    const especialidades = await Especialidad.findAll({ attributes: ['id', 'nombre'] });
    const tiposEstudio = await TipoEstudio.findAll({ attributes: ['id', 'nombre'] });
    const tipoTurnos = await TipoTurno.findAll({ attributes: ['id', 'nombre'] });


    // Decidir qué vista renderizar
    const vista = id ? 'dashboard/admin/editar-admision' : 'dashboard/admin/admisiones';
    const titulo = id ? 'Editar Admisión' : 'Admisiones';
    const admision = id ? admisiones[0] : null; // Para editar, pasar solo la admisión específica

    res.render(vista, {
      title: titulo,
      admisiones: id ? null : admisiones, // Para listar
      admision: admision, // Para editar
      pacientes,
      administrativos,
      motivos,
      formas,
      obrasSociales,
      tiposTurno,
      medicos,
      sectores,
      tiposDeServicio,
      especialidades,
      tiposEstudio,
      tipoTurnos,
      filtros,
    });
  } catch (error) {
    console.error('Error en getAdmisiones:', error);
    res.status(500).json({ message: 'Error al obtener admisiones', error: error.message });
  }
};
// Búsqueda de pacientes para el formulario
const searchPacientes = async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) {
      return res.status(400).json({ message: 'DNI es requerido' });
    }

    const pacientes = await Paciente.findAll({
      where: { '$usuario.dni$': { [Op.like]: `%${dni}%` } },
      include: [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }],
      limit: 5
    });

    res.json({ pacientes });
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    res.status(500).json({ message: 'Error al buscar pacientes', error: error.message });
  }
};

// Actualizar una admisión
const updateAdmision = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      paciente_id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      fecha,
      tipo_turno_id,
      medico_id,
      sector_id,
      turno_fecha,
      turno_hora,
      lista_espera_tipo,
      tipo_estudio_id,
      especialidad_id,
      prioridad,
      estado
    } = req.body;

    const admision = await Admision.findByPk(id, { transaction });
    console.log("Amision encontrada ", admision);
    if (!admision) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Admisión no encontrada' });
    }

    let turnoId = admision.turno_id;
    if (turno_fecha && turno_hora) {
      const turnoExistente = await Turno.findOne({
        where: {
          medico_id,
          sector_id,
          fecha: turno_fecha,
          hora_inicio: turno_hora,
          estado: 'PENDIENTE',
          id: { [Op.ne]: turnoId }
        },
        transaction
      });

      if (turnoExistente) {
        await transaction.rollback();
        return res.status(400).json({ message: 'El turno ya está asignado a otro paciente' });
      }

      if (turnoId) {
        const turno = await Turno.findByPk(turnoId, { transaction });
        await turno.update({
          tipo_turno_id,
          fecha: turno_fecha,
          hora_inicio: turno_hora,
          hora_fin: `${parseInt(turno_hora.split(':')[0]) + 1}:${turno_hora.split(':')[1]}:00`,
          medico_id,
          sector_id
        }, { transaction });
      } else {
        const turno = await Turno.create({
          tipo_turno_id,
          fecha: turno_fecha,
          hora_inicio: turno_hora,
          hora_fin: `${parseInt(turno_hora.split(':')[0]) + 1}:${turno_hora.split(':')[1]}:00`,
          estado: 'PENDIENTE',
          paciente_id,
          medico_id,
          sector_id
        }, { transaction });
        turnoId = turno.id;
      }
    }

    await admision.update({
      paciente_id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      turno_id: turnoId,
      fecha,
      medico_id,
      sector_id,
      tipo_estudio_id: tipo_estudio_id || null,
      especialidad_id: especialidad_id || null,
      estado
    }, { transaction });

    if (lista_espera_tipo && prioridad && turnoId) {
      const listaEspera = await ListasEsperas.findOne({ where: { turno_id: turnoId }, transaction });
      if (listaEspera) {
        await listaEspera.update({
          tipo: lista_espera_tipo,
          tipo_estudio_id: tipo_estudio_id || null,
          especialidad_id: especialidad_id || null,
          prioridad,
          estado: 'PENDIENTE'
        }, { transaction });
      } else {
        await ListasEsperas.create({
          paciente_id,
          turno_id: turnoId,
          tipo: lista_espera_tipo,
          tipo_estudio_id: tipo_estudio_id || null,
          especialidad_id: especialidad_id || null,
          prioridad,
          estado: 'PENDIENTE',
          fecha_registro: new Date()
        }, { transaction });
      }
    }

   await transaction.commit();
  // Si es una petición AJAX, devolver JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
  return res.json({ message: 'Admisión actualizada con éxito', admision });
  }
  // Si es un formulario web, redirigir
  res.redirect('/');
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar admisión:', error);
    res.status(500).json({ message: 'Error al actualizar admisión', error: error.message });
  }
};
// Obtener una admisión por ID para el Editar

const getAdmisionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Buscando admisión ID:', id);

    // SOLO DATOS BÁSICOS - sin includes complejos
    const admision = await Admision.findByPk(id, {
      attributes: [
        'id', 'paciente_id', 'administrativo_id', 'motivo_id', 
        'forma_ingreso_id', 'turno_id', 'fecha', 'estado',
        'medico_id', 'sector_id', 'tipo_estudio_id', 'especialidad_id'
      ]
    });
    console.log(admision, "datos para trabajarlos en el frontend");

    if (!admision) {
      return res.status(404).json({ error: 'Admisión no encontrada' });
    }

    console.log('Admisión encontrada:', admision.id);
    res.json(admision);
    
  } catch (error) {
    console.error('Error en getAdmisionById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar una admisión
const deleteAdmision = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const admision = await Admision.findByPk(id, { transaction });
    if (!admision) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Admisión no encontrada' });
    }
    if (admision.turno_id) {
      await Turno.destroy({ where: { id: admision.turno_id }, transaction });
    }
    await admision.destroy({ transaction });
    await transaction.commit();
    res.json({ message: 'Admisión eliminada con éxito' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar admisión:', error);
    res.status(500).json({ message: 'Error al eliminar admisión', error: error.message });
  }
};

const getMedicos = async (req, res) => {
  try {
    const medicos = await Medico.findAll({
      include: [
        { model: Usuario, attributes: ['id', 'nombre', 'apellido'] },
        { model: Especialidad, attributes: ['id', 'nombre'] },
        { model: Sector, attributes: ['id', 'nombre'] }
      ]
    });
    res.status(200).json(medicos);
  } catch (error) {
    console.error('Error en getMedicos:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

//logica para la internacion

const asignarCamaInternacion = async ({
  paciente,
  medico_id,
  administrativo_id,
  sector_id,
  transaction
}) => {
  try {
    console.log('Buscando cama disponible en sector:', sector_id);

    // Validar datos del paciente
    if (!paciente || !paciente.usuario || !paciente.usuario.sexo) {
      throw new Error('No se pudo determinar el sexo del paciente');
    }
    const sexoPaciente = paciente.usuario.sexo;
    console.log("Sexo del paciente:", sexoPaciente);

    // Buscar SOLO en el sector específico solicitado
    const sector = await Sector.findByPk(sector_id, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas',
          where: { estado: 'Libre' }
        }]
      }],
      transaction
    });

    console.log('Sector encontrado:', sector?.nombre);
    console.log('Habitaciones con camas libres:', sector?.habitaciones?.length || 0);

    // Buscar cama apropiada según tipo de habitación y sexo
    let camaEncontrada = null;
    let habitacionSeleccionada = null;

    if (sector && sector.habitaciones && sector.habitaciones.length > 0) {
      for (const habitacion of sector.habitaciones) {
        if (habitacion.camas && habitacion.camas.length > 0) {
          
          // Verificar compatibilidad de sexo según tipo de habitación
          const esCompatible = await verificarCompatibilidadHabitacion(
            habitacion, 
            sexoPaciente, 
            transaction
          );
          
          if (esCompatible) {
            camaEncontrada = habitacion.camas[0];
            habitacionSeleccionada = habitacion;
            console.log(`Cama asignada: Habitación ${habitacion.numero}, Cama ${camaEncontrada.numero}`);
            break;
          } else {
            console.log(`Habitación ${habitacion.numero} no compatible por sexo`);
          }
        }
      }
    }

    // Si NO hay camas disponibles en el sector - NO CREAR NI BUSCAR EN OTROS
    if (!camaEncontrada) {
      console.log(`No hay camas disponibles en el sector: ${sector?.nombre || sector_id}`);
      
      // Crear entrada en lista de espera
      await ListasEsperas.create({
        paciente_id: paciente.id,
        tipo: 'INTERNACION',
        prioridad: 'ALTA',
        estado: 'PENDIENTE',
        sector_id: sector_id, // Específico del sector solicitado
        fecha_registro: new Date(),
        observaciones: `Esperando cama en sector ${sector?.nombre || sector_id}`,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });

      // Lanzar error específico para manejar en el frontend
      throw new Error(`No hay camas disponibles en el sector ${sector?.nombre || sector_id}. El paciente ha sido agregado a la lista de espera.`);
    }

    // PASO 4: Proceder con la internación
    const tipoInternacion = await TipoInternacion.findByPk(1, { transaction });
    if (!tipoInternacion) throw new Error('Tipo de internación no encontrado');
    
    const tipoServicio = await TipoDeServicio.findByPk(
      habitacionSeleccionada.tipo_de_servicio_id || 1, 
      { transaction }
    );
    if (!tipoServicio) throw new Error('Tipo de servicio no encontrado');

    // Crear evaluación médica
    const evaluacionMedica = await EvaluacionMedica.create({
      paciente_id: paciente.id,
      medico_id,
      diagnostico: 'Ingreso programado',
      observaciones: 'Paciente admitido para internación programada',
      fecha: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    // Crear internación
    const internacion = await Internacion.create({
      paciente_id: paciente.id,
      medico_id,
      tipo_de_servicio_id: habitacionSeleccionada.tipo_de_servicio_id || 1,
      cama_id: camaEncontrada.id,
      tipo_internacion_id: tipoInternacion.id,
      administrativo_id,
      evaluacion_medica_id: evaluacionMedica.id,
      intervencion_quirurgica_id: null,
      es_prequirurgica: false,
      estado_operacion: 'No aplica',
      estado_estudios: 'Pendientes',
      estado_paciente: 'Estable',
      fecha_inicio: new Date(),
      fecha_cirugia: null,
      fecha_alta: null,
      lista_espera_id: null,
      admision_id: null
    }, { transaction });

    // Actualizar estado de la cama
    await camaEncontrada.update({
      estado: 'Ocupada',
      sexo_ocupante: sexoPaciente,
      updated_at: new Date()
    }, { transaction });

    // Crear registro en lista de espera como COMPLETADO
    const listaEspera = await ListasEsperas.create({
      paciente_id: paciente.id,
      tipo: 'INTERNACION',
      prioridad: 'ALTA',
      estado: 'COMPLETADO',
      habitacion_id: habitacionSeleccionada.id,
      fecha_registro: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    await internacion.update({ lista_espera_id: listaEspera.id }, { transaction });

    const mensaje = `Paciente internado en ${tipoServicio.nombre}, sector ${sector.nombre}, habitación ${habitacionSeleccionada.numero}, cama ${camaEncontrada.numero}.`;
    return { internacionId: internacion.id, mensaje };

  } catch (error) {
    console.error('Error en asignarCamaInternacion:', error.message);
    throw error;
  }
};

// FUNCIÓN AUXILIAR: Verificar compatibilidad de habitación según sexo
const verificarCompatibilidadHabitacion = async (habitacion, sexoPaciente, transaction) => {
  try {
    // Habitaciones colectivas: siempre mixtas, cualquier sexo
    if (habitacion.tipo === 'Colectiva') {
      return true;
    }

    // Habitaciones individuales: cualquier sexo
    if (habitacion.tipo === 'Individual') {
      return true;
    }

    // Habitaciones dobles: verificar compatibilidad de sexo
    if (habitacion.tipo === 'Doble') {
      // Si permite mixto, cualquier sexo
      if (habitacion.sexo_permitido === 'Mixto') {
        return true;
      }

      // Si tiene restricción de sexo específico
      if (habitacion.sexo_permitido !== 'Mixto') {
        // Verificar si hay otra cama ocupada en la habitación
        const camaOcupada = await Cama.findOne({
          where: {
            habitacion_id: habitacion.id,
            estado: 'Ocupada'
          },
          transaction
        });

        if (camaOcupada) {
          // Si hay cama ocupada, el sexo debe coincidir
          return camaOcupada.sexo_ocupante === sexoPaciente;
        } else {
          // Si no hay cama ocupada, verificar restricción de la habitación
          return habitacion.sexo_permitido === sexoPaciente || habitacion.sexo_permitido === 'Mixto';
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error en verificarCompatibilidadHabitacion:', error);
    return false;
  }
};

// FUNCIÓN PARA LIBERAR CAMA (cuando se da de alta a un paciente)
const liberarCama = async (cama_id, transaction) => {
  try {
    // Cambiar estado de cama a En Limpieza
    await Cama.update({
      estado: 'EnLimpieza',
      sexo_ocupante: null,
      fecha_fin_limpieza: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas después
      updated_at: new Date()
    }, {
      where: { id: cama_id },
      transaction
    });

    console.log(`Cama ${cama_id} liberada y en limpieza`);

    // Buscar si hay pacientes en lista de espera para esta habitación/sector
    const cama = await Cama.findByPk(cama_id, {
      include: [{
        model: Habitacion,
        as: 'habitacion',
        include: [{
          model: Sector,
          as: 'sector'
        }]
      }],
      transaction
    });

    if (cama) {
      // Notificar que hay cama disponible (esto se puede implementar con jobs o notificaciones)
      console.log(`Cama disponible en sector ${cama.habitacion.sector.nombre} después de limpieza`);
      
      // Aquí se podría implementar un job para procesar lista de espera
      // procesarListaEspera(cama.habitacion.sector_id);
    }

    return true;
  } catch (error) {
    console.error('Error al liberar cama:', error);
    throw error;
  }
};

// FUNCIÓN PARA FINALIZAR LIMPIEZA Y ACTIVAR CAMA
const finalizarLimpiezaCama = async (cama_id, transaction) => {
  try {
    await Cama.update({
      estado: 'Libre',
      fecha_fin_limpieza: null,
      updated_at: new Date()
    }, {
      where: { id: cama_id },
      transaction
    });

    console.log(`Cama ${cama_id} lista para nuevo paciente`);
    
    // Procesar lista de espera automáticamente
    // procesarListaEspera(sector_id);
    
    return true;
  } catch (error) {
    console.error('Error al finalizar limpieza:', error);
    throw error;
  }
};


module.exports = {
  obtenerUltimoIdPaciente,
  buscarPacientePorDNI,
  getHorariosDisponibles,
  generarPacienteTemporal,
  crearPaciente,
  crearAdmisionUrgencia,
  crearAdmision,
  getAdmisiones,
  searchPacientes,
  updateAdmision,
  deleteAdmision,
  getAdmisionById,
  
};