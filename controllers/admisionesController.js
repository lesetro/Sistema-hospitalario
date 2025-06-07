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

    // Generar horarios posibles (8:00 a 17:00 cada 20 mins)
    const horariosPosibles = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 20) {
        horariosPosibles.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }

    // Filtrar horarios ocupados
    const ocupados = turnosOcupados.map(t => t.hora_inicio);
    const horariosDisponibles = horariosPosibles.filter(h => !ocupados.includes(h));

    res.json({ horariosDisponibles });

  } catch (error) {
    console.error('Error en getHorariosDisponibles:', error);
    res.status(500).json({ message: 'Error al obtener horarios' });
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
      rol_id: 1,
      fecha_nacimiento: new Date('1990-01-01'),
      sexo: 'Otro',
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction });
    console.log('Usuario creado:', usuario.id);

    // Crear paciente
    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      administrativo_id: 1, // Asegúrate de que este ID exista
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
      turno_hora, 
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

    // Crear lista de espera si es necesario
    if (lista_espera_tipo && prioridad) {
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
    
    return res.status(201).json({ 
      success: true, 
      message: 'Admisión creada exitosamente', 
      admisionId: admision.id,
      turnoId: turno ? turno.id : null
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

// Obtener admisiones
const getAdmisiones = async (req, res) => {
  try {
    const admisiones = await Admision.findAll({
      include: [
        { 
          model: Paciente, 
          as: 'paciente', 
          attributes: ['id'], 
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }
          ]
        },
        { model: Administrativo, as: 'administrativo', attributes: ['id', 'responsabilidad'] },
        { model: MotivoAdmision, as: 'motivo', attributes: ['id', 'nombre'] },
        { model: FormaIngreso, as: 'forma_ingreso', attributes: ['id', 'nombre'] },
        { 
          model: Turno, 
          as: 'turno', 
          attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'lista_espera_id'], 
          include: [
            { model: TipoTurno, as: 'tipoTurno', attributes: ['id', 'nombre'] }
          ]
        },
        { model: Medico, as: 'medico', attributes: ['id'], include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] },
        
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] },
        { model: TipoEstudio, as: 'tipo_estudio', attributes: ['id', 'nombre'] },
        { model: Especialidad, as: 'especialidad', attributes: ['id', 'nombre'] }
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
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }
      ]
    });

   
    const administrativos = await Administrativo.findAll({ attributes: ['id', 'responsabilidad'] });
    const motivos = await MotivoAdmision.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const formas = await FormaIngreso.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    const obrasSociales = await ObraSocial.findAll({ attributes: ['id', 'nombre'] });
    const tiposTurno = await TipoTurno.findAll({ attributes: ['id', 'nombre'] });
    const medicos = await Medico.findAll({ attributes: ['id'], include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] });
    console.log('Médico encontrado:', medicos);
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
 
};