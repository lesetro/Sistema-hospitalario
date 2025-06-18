const { Op } = require('sequelize');
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
  TipoEstudio, 
  Especialidad, 
  ListasEsperas
} = require('../models');


console.log('sequelize:', db.sequelize);
console.log("Sequelize en admisionesController:", sequelize);

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

    const pacientes = await Paciente.findAll({
      where: { '$usuario.dni$': { [Op.like]: `%${dni}%` } },
      include: [{ model: usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'], required: true }],
      limit: 5
    });

    res.status(200).json({ pacientes });
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ message: 'Error al buscar paciente', error: error.message });
  }
};

// Obtener horarios disponibles
const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, medico_id, sector_id } = req.query;
    if (!fecha || !medico_id || !sector_id) {
      return res.status(400).json({ message: 'Fecha, médico y sector son requeridos' });
    }

    const turnosOcupados = await Turno.findAll({
      where: { fecha, medico_id, sector_id, estado: 'PENDIENTE' },
      attributes: ['hora_inicio']
    });

    const horariosOcupados = turnosOcupados.map(t => t.hora_inicio);
    res.status(200).json({ horariosOcupados });
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error);
    res.status(500).json({ message: 'Error al obtener horarios disponibles', error: error.message });
  }
};

// Generar paciente temporal para el botón "Generar"
const generarPacienteTemporal = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const timestamp = Date.now();
    const dni = `TEMP${timestamp}`;

    // Crear usuario temporal
    const usuario = await Usuario.create({
      dni,
      nombre: 'Temporal',
      apellido: 'Paciente',
      email: `temp+${timestamp}@generico.com`,
      password: `temp${timestamp}`,
      rol_id: 1,
      fecha_nacimiento: new Date('1990-01-01'),
      sexo: 'Otro',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    // Crear paciente
    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      administrativo_id: 1,
      fecha_ingreso: new Date(),
      estado: 'Activo',
      observaciones: 'Paciente temporal generado automáticamente',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      success: 'true',
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
    if (transaction) await transaction.rollback();
    console.error('Error al generar paciente temporal:', error);
    res.status(500).json({ message: 'Error al generar paciente temporal', error: error.message });
  }
};
// Crear nuevo paciente
const crearPaciente = async (req, res) => {
  let transaction;
  try {
    if (!sequelize) {
      throw new Error('Sequelize no está inicializado');
    }
    transaction = await sequelize.transaction();

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
      rol_id: 1,
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
  const transaction = await sequelize.transaction();
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
        rol_id: 1,
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

    // Crear admisión
    const admision = await Admision.create({
      paciente_id: paciente.id,
      administrativo_id: 1,
      motivo_id: 1,
      forma_ingreso_id: 1,
      sector_id: 1,
      tipo_estudio_id: null,
      fecha: new Date(),
      estado: 'Pendiente',
    }, { transaction });
    console.log('Admisión creada:', admision.id);

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

const crearAdmision1 = async (req, res) => {
  
  
  const transaction = await db.sequelize.transaction();
  try {
    const { 
      paciente_id, 
      tipo_turno_id, 
      medico_id, 
      sector_id, 
      fecha, 
      turno_hora, 
      motivo_id, 
      forma_ingreso_id, 
      administrativo_id, 
      lista_espera_tipo, 
      tipo_estudio_id, 
      especialidad_id, 
      prioridad 
    } = req.body;

    // Validación mejorada de campos requeridos
    const requiredFields = {
      paciente_id: 'Paciente',
      administrativo_id: 'Administrativo',
      motivo_id: 'Motivo',
      forma_ingreso_id: 'Forma de ingreso',
      fecha: 'Fecha',
      tipo_turno_id: 'Tipo de turno',
      medico_id: 'Médico',
      sector_id: 'Sector',
      turno_hora: 'Hora de turno',
      lista_espera_tipo: 'Tipo de lista de espera',
      prioridad: 'Prioridad'
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

    // Verificar existencia de todas las entidades relacionadas
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
        include: [{ model: usuario, as: 'usuario' }], 
        transaction 
      }),
      TipoTurno.findByPk(tipo_turno_id, { transaction }),
      Medico.findByPk(medico_id, { 
        include: [{ model: usuario, as: 'usuario' }],
        transaction 
      }),
      Sector.findByPk(sector_id, { transaction }),
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

    if (paciente.usuario.rol_id !== 4) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El usuario no tiene rol de paciente' });
    }

    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    // Verificar disponibilidad del turno
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

    // Calcular hora fin (asumiendo turnos de 1 hora)
    const [hours, minutes] = turno_hora.split(':');
    let totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 20; 
    const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const newMinutes = String(totalMinutes % 60).padStart(2, '0');
    const horaFin = `${newHours}:${newMinutes}`;

    // Crear turno
    const turno = await Turno.create({
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

    // Crear admisión
    const admision = await Admision.create({
      paciente_id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      turno_id: turno.id,
      fecha,
      medico_id,
      sector_id,
      tipo_estudio_id: tipo_estudio_id || null,
      especialidad_id: especialidad_id || null,
      estado: 'Pendiente',
      prioridad,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    // Crear lista de espera si es necesario
    if (lista_espera_tipo && prioridad) {
      await ListasEsperas.create({
        paciente_id,
        turno_id: turno.id,
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
    
    return res.status(201).json({ 
      success: true, 
      message: 'Admisión creada exitosamente', 
      admisionId: admision.id,
      turnoId: turno.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear admisión:', error);
    return res.status(500).json({ 
      message: 'Error al crear admisión', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Crear nueva admisión
const crearAdmision2 = async (req, res) => {
  console.log('Llegó solicitud a crearAdmision');
 
  
  if (!sequelize) {
    console.error('ERROR: sequelize no está definido');
    return res.status(500).json({ message: 'Error de configuración del servidor' });
  }
  
  const transaction = await db.sequelize.transaction();
  try {
    
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
    } = req.body;

    if (!paciente_id || !administrativo_id || !motivo_id || !forma_ingreso_id || !fecha || !tipo_turno_id || !medico_id || !sector_id || !turno_fecha || !turno_hora || !prioridad || !lista_espera_tipo) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Campos obligatorios faltantes' });
    }

    // Verificar que el paciente exista
    const paciente = await Paciente.findByPk(paciente_id, { include: [{ model: usuario, as: 'usuario' }], transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    // Verificar si el turno ya está ocupado
    const turnoExistente = await Turno.findOne({
      where: {
        medico_id,
        sector_id,
        fecha: turno_fecha,
        hora_inicio: turno_hora,
        estado: 'PENDIENTE',
        paciente_id: { [Op.ne]: paciente.id }
      },
      transaction
    });

    if (turnoExistente) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El turno ya está asignado a otro paciente' });
    }

    // Crear el turno
    const turno = await Turno.create({
      tipo_turno_id,
      fecha: turno_fecha,
      hora_inicio: turno_hora,
      hora_fin: `${parseInt(turno_hora.split(':')[0]) + 1}:${turno_hora.split(':')[1]}:00`,
      estado: 'PENDIENTE',
      paciente_id: paciente.id,
      medico_id,
      sector_id
    }, { transaction });

    // Crear la admisión
    const admision = await Admision.create({
      paciente_id: paciente.id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      turno_id: turno.id,
      fecha,
      medico_id,
      sector_id,
      tipo_estudio_id: tipo_estudio_id || null,
      especialidad_id: especialidad_id || null,
      estado: 'Pendiente'
    }, { transaction });

    // Crear entrada en listas de espera
    if (lista_espera_tipo && prioridad) {
      await ListasEsperas.create({
        paciente_id: paciente.id,
        turno_id: turno.id,
        tipo: lista_espera_tipo,
        tipo_estudio_id: tipo_estudio_id || null,
        especialidad_id: especialidad_id || null,
        prioridad,
        estado: 'PENDIENTE',
        fecha_registro: new Date()
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ success: true, message: 'Admisión creada exitosamente', admisionId: admision.id });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear admisión:', error);
    res.status(500).json({ message: 'Error al crear admisión', error: error.message });
  }
};

// Obtener admisiones
const getAdmisiones = async (req, res) => {
  try {
    const admisiones = await Admision.findAll({
      include: [
        { 
          model: paciente, 
          as: 'paciente', 
          attributes: ['id'], 
          include: [
            { model: usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }
          ]
        },
        { model: administrativo, as: 'administrativo', attributes: ['id', 'responsabilidad'] },
        { model: motivoadmision, as: 'motivo', attributes: ['id', 'nombre'] },
        { model: formaingreso, as: 'forma_ingreso', attributes: ['id', 'nombre'] },
        { 
          model: turno, 
          as: 'turno', 
          attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'lista_espera_id'], 
          include: [
            { model: tipoturno, as: 'tipoTurno', attributes: ['id', 'nombre'] }
          ]
        },
        { model: medico, as: 'medico', attributes: ['id'], include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] },
        { model: sector, as: 'sector', attributes: ['id', 'nombre'] },
        { model: tipoestudio, as: 'tipo_estudio', attributes: ['id', 'nombre'] },
        { model: especialidad, as: 'especialidad', attributes: ['id', 'nombre'] }
      ]
    });

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
        { model: usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }
      ]
    });
    const administrativos = await Administrativo.findAll({ attributes: ['id', 'responsabilidad'] });
    const motivos = await MotivoAdmision.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const formas = await FormaIngreso.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const obrasSociales = await ObraSocial.findAll({ attributes: ['id', 'nombre'] });
    const tiposTurno = await TipoTurno.findAll({ attributes: ['id', 'nombre'] });
    const medicos = await Medico.findAll({ attributes: ['id'], include: [{ model: usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] });
    const sectores = await Sector.findAll({ attributes: ['id', 'nombre'] });
    const tiposDeServicio = await TipoEstudio.findAll({ attributes: ['id', 'nombre'] });
    const especialidades = await Especialidad.findAll({ attributes: ['id', 'nombre'] });
    const tiposEstudio = await TipoEstudio.findAll({ attributes: ['id', 'nombre'] });

    res.render('dashboard/admin/admisiones', {
      title: 'Admisiones',
      admisiones,
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
      tiposEstudio
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
      include: [{ model: usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }],
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
  const transaction = await sequelize.transaction();
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
    res.json({ message: 'Admisión actualizada con éxito', admision });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar admisión:', error);
    res.status(500).json({ message: 'Error al actualizar admisión', error: error.message });
  }
};
const crearAdmision3 = async (req, res) => {
  console.log('🛠️ Se ejecutó crearAdmision');
  console.log('📝 Datos recibidos:', req.body);

  try {
    const {
      paciente_id,
      tipo_turno_id,
      medico_id,
      sector_id,
      fecha,
      turno_hora,
      motivo_id,
      forma_ingreso_id,
      administrativo_id,
      lista_espera_tipo,
      tipo_estudio_id,
      especialidad_id,
      prioridad
    } = req.body;

    console.log('🔍 Paso 1: Buscando paciente...');
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{ model: usuario, as: 'usuario' }]
    });
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });

    console.log('🧑‍⚕️ Paciente OK:', paciente.id);

    console.log('🔍 Paso 2: Buscando tipo de turno...');
    const tipoTurno = await TipoTurno.findByPk(tipo_turno_id);
    if (!tipoTurno) return res.status(404).json({ message: 'Tipo de turno no encontrado' });

    console.log('⏰ Tipo de turno OK:', tipoTurno.id);

    console.log('🔍 Paso 3: Buscando médico...');
    const medico = await Medico.findByPk(medico_id, {
      include: [{ model: usuario, as: 'usuario' }]
    });
    if (!medico) return res.status(404).json({ message: 'Médico no encontrado' });

    console.log('🩺 Médico OK:', medico.id);

    console.log('🔍 Paso 4: Buscando sector...');
    const sector = await Sector.findByPk(sector_id);
    if (!sector) return res.status(404).json({ message: 'Sector no encontrado' });

    console.log('🏥 Sector OK:', sector.id);

    console.log('🔍 Paso 5: Buscando motivo...');
    const motivo = await MotivoAdmision.findByPk(motivo_id);
    if (!motivo) return res.status(404).json({ message: 'Motivo no encontrado' });

    console.log('📄 Motivo OK:', motivo.id);

    console.log('🔍 Paso 6: Buscando forma de ingreso...');
    const formaIngreso = await FormaIngreso.findByPk(forma_ingreso_id);
    if (!formaIngreso) return res.status(404).json({ message: 'Forma de ingreso no encontrada' });

    console.log('🚪 Forma de ingreso OK:', formaIngreso.id);

    console.log('🔍 Paso 7: Buscando administrativo...');
    const administrativo = await Administrativo.findByPk(administrativo_id);
    if (!administrativo) return res.status(404).json({ message: 'Administrativo no encontrado' });

    console.log('🗂️ Administrativo OK:', administrativo.id);

    if (tipo_estudio_id) {
      console.log('🔍 Paso 8: Buscando tipo de estudio...');
      const tipoEstudio = await TipoEstudio.findByPk(tipo_estudio_id);
      if (!tipoEstudio) return res.status(404).json({ message: 'Tipo de estudio no encontrado' });
      console.log('📊 Tipo de estudio OK:', tipoEstudio.id);
    }

    if (especialidad_id) {
      console.log('🔍 Paso 9: Buscando especialidad...');
      const especialidad = await Especialidad.findByPk(especialidad_id);
      if (!especialidad) return res.status(404).json({ message: 'Especialidad no encontrada' });
      console.log('🧠 Especialidad OK:', especialidad.id);
    }

    console.log('✅ Todos los datos cargados correctamente. Podés continuar con la lógica de creación.');

    return res.status(200).json({ message: 'Prueba exitosa: todos los datos cargados correctamente.' });

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error(error.stack);
    return res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

// Eliminar una admisión
const deleteAdmision = async (req, res) => {
  const transaction = await sequelize.transaction();
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
// controllers/admisionesController.js
const { TipoTurno, Turno, Paciente, Medico, Sector, Admision, MotivoAdmision, FormaIngreso, Administrativo, TipoEstudio, Especialidad } = require('../models');

exports.crearAdmision = async (req, res) => {
 
  try {
    const { paciente_id, tipo_turno_id, medico_id, sector_id, fecha, turno_hora, motivo_id, forma_ingreso_id, administrativo_id, lista_espera_tipo, tipo_estudio_id, especialidad_id, prioridad } = req.body;

    // Verificar paciente_id
    const paciente = await Paciente.findByPk(paciente_id);
    if (!paciente) {
      return res.status(400).json({ message: `El paciente_id ${paciente_id} no existe` });
    }

    // Verificar que el usuario asociado es paciente (rol_id: 1)
    const usuario = await Usuario.findByPk(paciente.usuario_id);
    if (!usuario || usuario.rol_id !== 1) {
      return res.status(400).json({ message: `El usuario asociado al paciente_id ${paciente_id} no es un paciente` });
    }

    // Verificar tipo_turno_id
    const tipoTurno = await TipoTurno.findByPk(tipo_turno_id);
    if (!tipoTurno) {
      return res.status(400).json({ message: `El tipo_turno_id ${tipo_turno_id} no existe` });
    }

    // Verificar medico_id
    const medico = await Medico.findOne({ where: { usuario_id: medico_id } });
    if (!medico) {
      return res.status(400).json({ message: `El medico_id ${medico_id} no existe` });
    }

    // Verificar sector_id
    const sector = await Sector.findByPk(sector_id);
    if (!sector) {
      return res.status(400).json({ message: `El sector_id ${sector_id} no existe` });
    }

    // Verificar otros IDs
    const motivo = await MotivoAdmision.findByPk(motivo_id);
    if (!motivo) {
      return res.status(400).json({ message: `El motivo_id ${motivo_id} no existe` });
    }

    const formaIngreso = await FormaIngreso.findByPk(forma_ingreso_id);
    if (!formaIngreso) {
      return res.status(400).json({ message: `El forma_ingreso_id ${forma_ingreso_id} no existe` });
    }

    const administrativo = await Administrativo.findOne({ where: { usuario_id: administrativo_id } });
    if (!administrativo) {
      return res.status(400).json({ message: `El administrativo_id ${administrativo_id} no existe` });
    }

    const tipoEstudio = tipo_estudio_id ? await TipoEstudio.findByPk(tipo_estudio_id) : true;
    if (!tipoEstudio) {
      return res.status(400).json({ message: `El tipo_estudio_id ${tipo_estudio_id} no existe` });
    }

    const especialidad = especialidad_id ? await Especialidad.findByPk(especialidad_id) : true;
    if (!especialidad) {
      return res.status(400).json({ message: `El especialidad_id ${especialidad_id} no existe` });
    }

    // Crear el turno
    const turno = await Turno.create({
      tipo_turno_id,
      fecha,
      hora_inicio: turno_hora,
      hora_fin: '09:00', // Ajusta según lógica
      estado: 'PENDIENTE',
      paciente_id,
      medico_id,
      sector_id,
      tipo_estudio_id,
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('Turno creado:', turno);

    // Crear la admisión
    const admision = await Admision.create({
      paciente_id,
      administrativo_id,
      motivo_id,
      forma_ingreso_id,
      fecha,
      turno_id: turno.id,
      medico_id,
      sector_id,
      lista_espera_tipo,
      tipo_estudio_id,
      especialidad_id,
      prioridad,
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('Admisión creada:', admision);

    res.status(200).json({ message: 'Admisión creada con éxito', turno, admision });
  } catch (error) {
    console.error('Error en crearAdmision:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};
module.exports = {
  obtenerUltimoIdPaciente,
  buscarPacientePorDNI,
  obtenerHorariosDisponibles,
  generarPacienteTemporal,
  crearPaciente,
  crearAdmisionUrgencia,
  crearAdmision,
  getAdmisiones,
  searchPacientes,
  updateAdmision,
  deleteAdmision,
};
