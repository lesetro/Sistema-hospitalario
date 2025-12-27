const { Op } = require('sequelize');
const db = require('../database/db');
const bcrypt = require('bcryptjs');
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
  TipoEstudio, 
  Especialidad, 
  ListaEspera,
  Rol,
  EstudioSolicitado,
  IntervencionQuirurgica,
  MotivoConsulta,
  TurnoPersonal
} = require('../models');

// ============================================================================
// BUSCAR PACIENTE POR DNI CON HISTORIAL
// ============================================================================
const buscarPacientePorDNI = async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni) {
      return res.status(400).json({ message: 'DNI es requerido' });
    }

    const usuario = await Usuario.findOne({
      where: { dni },
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ 
        message: 'No existe un usuario con ese DNI',
        existe: false,
        action: 'crear_paciente'
      });
    }

    const paciente = await Paciente.findOne({
      where: { usuario_id: usuario.id },
      include: [
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!paciente) {
      return res.status(200).json({
        existe: false,
        usuario: {
          id: usuario.id,
          dni: usuario.dni,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          fecha_nacimiento: usuario.fecha_nacimiento,
          sexo: usuario.sexo,
          rol: usuario.rol_principal?.nombre
        },
        action: 'crear_paciente',
        mensaje: 'Usuario encontrado pero no tiene registro como paciente.'
      });
    }

    // Buscar historial de turnos y evaluaciones
    const [turnosActivos, ultimaEvaluacion, estudiosActivos, admisionesActivas] = await Promise.all([
      Turno.findAll({
        where: { 
          paciente_id: paciente.id,
          estado: ['PENDIENTE', 'CONFIRMADO']
        },
        include: [
          { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] },
          { model: Sector, as: 'sector' },
          { model: TipoEstudio, as: 'tipo_estudio' }
        ],
        order: [['fecha', 'DESC']],
        limit: 3
      }),
      
      EvaluacionMedica.findOne({
        where: { paciente_id: paciente.id },
        include: [
          { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] },
          { model: EstudioSolicitado, as: 'estudio_solicitado', include: [{ model: TipoEstudio, as: 'tipo_estudio' }] }
        ],
        order: [['fecha', 'DESC']]
      }),

      EstudioSolicitado.findAll({
        where: { 
          paciente_id: paciente.id,
          estado: 'Pendiente'
        },
        include: [
          { model: TipoEstudio, as: 'tipo_estudio' },
          { model: EvaluacionMedica, as: 'evaluacion_medica', include: [
            { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] }
          ]}
        ]
      }),

      Admision.findAll({
        where: {
          paciente_id: paciente.id,
          estado: 'Pendiente'
        },
        include: [
          { model: MotivoAdmision, as: 'motivo' },
          { model: Turno, as: 'turno' }
        ],
        order: [['fecha', 'DESC']],
        limit: 3
      })
    ]);

    const tieneTurnosActivos = turnosActivos.length > 0;
    const tieneEstudiosActivos = estudiosActivos.length > 0;
    const tieneAdmisionesActivas = admisionesActivas.length > 0;

    return res.status(200).json({
      existe: true,
      paciente: {
        id: paciente.id,
        usuario_id: usuario.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        sexo: usuario.sexo,
        fecha_nacimiento: usuario.fecha_nacimiento,
        obra_social: paciente.obraSocial
      },
      historial: {
        tiene_turnos: tieneTurnosActivos,
        turnos_activos: turnosActivos,
        tiene_estudios: tieneEstudiosActivos,
        estudios_activos: estudiosActivos,
        tiene_admisiones: tieneAdmisionesActivas,
        admisiones_activas: admisionesActivas,
        ultima_evaluacion: ultimaEvaluacion
      },
      action: (tieneTurnosActivos || tieneEstudiosActivos) ? 'ver_historial' : 'crear_admision'
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar paciente', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER MÉDICOS POR SECTOR
// ============================================================================
const getMedicosPorSector = async (req, res) => {
  try {
    const { sector_id } = req.query;
    
    if (!sector_id) {
      return res.status(400).json({ message: 'sector_id es requerido' });
    }

    const medicos = await Medico.findAll({
      where: { sector_id: parseInt(sector_id) },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
        { model: Especialidad, as: 'especialidad', attributes: ['id', 'nombre'] }
      ]
    });

    res.json({ medicos });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ message: 'Error al obtener médicos' });
  }
};

// ============================================================================
// OBTENER MÉDICOS POR ESPECIALIDAD
// ============================================================================
const getMedicosPorEspecialidad = async (req, res) => {
  try {
    const { especialidad_id } = req.query;
    
    if (!especialidad_id) {
      return res.status(400).json({ message: 'especialidad_id es requerido' });
    }

    const medicos = await Medico.findAll({
      where: { especialidad_id: parseInt(especialidad_id) },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
      ]
    });

    res.json({ medicos });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ message: 'Error al obtener médicos' });
  }
};

// ============================================================================
// OBTENER HORARIOS DISPONIBLES DE UN MÉDICO
// ============================================================================
const getHorariosDisponiblesMedico = async (req, res) => {
  try {
    const { fecha, medico_id } = req.query;
    
    if (!fecha || !medico_id) {
      return res.status(400).json({ message: 'fecha y medico_id son requeridos' });
    }

    // Obtener turnos del médico para ese día
    const turnosOcupados = await Turno.findAll({
      where: {
        medico_id: parseInt(medico_id),
        fecha,
        estado: ['PENDIENTE', 'CONFIRMADO']
      },
      attributes: ['hora_inicio']
    });

    const horasOcupadas = turnosOcupados.map(t => t.hora_inicio);

    // Generar horarios disponibles (08:00 - 18:00, cada 30 min)
    const horariosDisponibles = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        // Comparar sin segundos
        const horaConSegundos = hora + ':00';
        if (!horasOcupadas.includes(hora) && !horasOcupadas.includes(horaConSegundos)) {
          horariosDisponibles.push(hora);
        }
      }
    }

    res.json({ 
      horariosDisponibles,
      total: horariosDisponibles.length
    });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ message: 'Error al obtener horarios' });
  }
};

// ============================================================================
// CREAR PACIENTE
// ============================================================================
const crearPaciente = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      dni, nombre, apellido, email, password, telefono,
      fecha_nacimiento, sexo, obra_social_id, observaciones
    } = req.body;

    // Verificar si ya existe el DNI
    const existeDNI = await Usuario.findOne({ where: { dni }, transaction });
    if (existeDNI) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con ese DNI' 
      });
    }

    // Verificar si ya existe el email
    const existeEmail = await Usuario.findOne({ where: { email }, transaction });
    if (existeEmail) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con ese email' 
      });
    }

    // Buscar rol de paciente
    const rolPaciente = await Rol.findOne({ 
      where: { nombre: 'PACIENTE' }, 
      transaction 
    });

    if (!rolPaciente) {
      await transaction.rollback();
      return res.status(500).json({ 
        success: false,
        message: 'No se encontró el rol de paciente en el sistema' 
      });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password || 'temporal123', 10);

    // Crear usuario
    const usuario = await Usuario.create({
      dni,
      nombre,
      apellido,
      email,
      password: hashedPassword,
      telefono,
      fecha_nacimiento,
      sexo,
      rol_principal_id: rolPaciente.id,
      estado: 'Activo'
    }, { transaction });

    // Crear paciente
    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      obra_social_id: obra_social_id ? parseInt(obra_social_id) : null,
      fecha_ingreso: new Date(),
      estado: 'Activo',
      observaciones
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      mensaje: 'Paciente creado exitosamente',
      paciente: {
        id: paciente.id,
        usuario_id: usuario.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        sexo: usuario.sexo
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear paciente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear paciente', 
      error: error.message 
    });
  }
};

// ============================================================================
// CREAR ADMISIÓN DE URGENCIA
// ============================================================================
const crearAdmisionUrgencia = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { dni } = req.body;
    const administrativoId = req.user?.id;

    if (!administrativoId) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'No se pudo identificar al administrativo' 
      });
    }

    // Buscar o crear paciente
    let usuario = await Usuario.findOne({ where: { dni }, transaction });
    let paciente;

    if (!usuario) {
      // Crear usuario temporal
      const rolPaciente = await Rol.findOne({ 
        where: { nombre: 'PACIENTE' }, 
        transaction 
      });

      usuario = await Usuario.create({
        dni,
        nombre: 'URGENCIA',
        apellido: `TEMPORAL-${dni}`,
        email: `urgencia${dni}@hospital.temp`,
        password: await bcrypt.hash('temporal123', 10),
        telefono: null,
        fecha_nacimiento: new Date('1990-01-01'),
        sexo: 'Otro',
        rol_principal_id: rolPaciente.id,
        estado: 'Pendiente'
      }, { transaction });

      paciente = await Paciente.create({
        usuario_id: usuario.id,
        fecha_ingreso: new Date(),
        estado: 'Activo',
        observaciones: 'Paciente de URGENCIA - Datos pendientes'
      }, { transaction });
    } else {
      paciente = await Paciente.findOne({ 
        where: { usuario_id: usuario.id }, 
        transaction 
      });

      if (!paciente) {
        paciente = await Paciente.create({
          usuario_id: usuario.id,
          fecha_ingreso: new Date(),
          estado: 'Activo'
        }, { transaction });
      }
    }

    // Buscar motivo y forma de ingreso de urgencia
    const [motivoUrgencia, formaUrgencia] = await Promise.all([
      MotivoAdmision.findOne({ 
        where: { nombre: { [Op.like]: '%urgencia%' } }, 
        transaction 
      }),
      FormaIngreso.findOne({ 
        where: { nombre: { [Op.like]: '%urgencia%' } }, 
        transaction 
      })
    ]);

    // Crear admisión SIN turno
    const admision = await Admision.create({
      paciente_id: paciente.id,
      administrativo_id: administrativoId,
      motivo_id: motivoUrgencia?.id || 1,
      forma_ingreso_id: formaUrgencia?.id || 1,
      fecha: new Date(),
      estado: 'Pendiente'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      mensaje: 'Admisión de urgencia creada',
      pacienteId: paciente.id,
      admisionId: admision.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en admisión de urgencia:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear admisión de urgencia', 
      error: error.message 
    });
  }
};

// ============================================================================
// CREAR ADMISIÓN NORMAL - ✅ CORREGIDO
// ============================================================================
const crearAdmision = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      paciente_id, motivo_id, forma_ingreso_id, fecha,
      tipo_turno_id, prioridad, medico_id, sector_id,
      especialidad_id, tipo_estudio_id, motivo_consulta_id,
      turno_fecha, turno_hora, observaciones
    } = req.body;

    const administrativoId = req.user?.id;
    const usuarioLogueadoId = req.user?.usuario_id;

    console.log('=== CREAR ADMISION DEBUG ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    if (!administrativoId) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'No se pudo identificar al administrativo' 
      });
    }

    // Validar campos obligatorios
    if (!paciente_id || !motivo_id || !forma_ingreso_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Campos obligatorios: paciente_id, motivo_id, forma_ingreso_id' 
      });
    }

    // ✅ CORRECCIÓN CRÍTICA: Convertir TODOS los IDs a números
    const pacienteIdInt = parseInt(paciente_id);
    const motivoIdInt = parseInt(motivo_id);
    const formaIngresoIdInt = parseInt(forma_ingreso_id);
    const medicoIdInt = medico_id ? parseInt(medico_id) : null;
    const sectorIdInt = sector_id ? parseInt(sector_id) : null;
    const especialidadIdInt = especialidad_id ? parseInt(especialidad_id) : null;
    const tipoEstudioIdInt = tipo_estudio_id ? parseInt(tipo_estudio_id) : null;
    const motivoConsultaIdInt = motivo_consulta_id ? parseInt(motivo_consulta_id) : null;
    const tipoTurnoIdInt = tipo_turno_id ? parseInt(tipo_turno_id) : null;

    console.log('IDs convertidos:', { pacienteIdInt, motivoIdInt, formaIngresoIdInt, medicoIdInt });

    // Crear turno si se proporcionan datos
    let turno = null;
    if (medicoIdInt && turno_fecha && turno_hora) {
      console.log('Creando turno con paciente_id:', pacienteIdInt);
      
      turno = await Turno.create({
        fecha: turno_fecha,
        hora_inicio: turno_hora,
        estado: 'CONFIRMADO',
        paciente_id: pacienteIdInt, // ✅ Usar entero
        medico_id: medicoIdInt,
        sector_id: sectorIdInt,
        usuario_id: usuarioLogueadoId
      }, { transaction });
      
      console.log('Turno creado ID:', turno.id, 'paciente_id:', turno.paciente_id);
    }

    // Crear admisión
    console.log('Creando admisión con paciente_id:', pacienteIdInt);
    
    const admision = await Admision.create({
      paciente_id: pacienteIdInt, // ✅ Usar entero
      administrativo_id: administrativoId,
      motivo_id: motivoIdInt,
      forma_ingreso_id: formaIngresoIdInt,
      fecha: fecha || new Date(),
      estado: 'Pendiente',
      medico_id: medicoIdInt,
      sector_id: sectorIdInt,
      especialidad_id: especialidadIdInt,
      tipo_estudio_id: tipoEstudioIdInt,
      motivo_consulta_id: motivoConsultaIdInt,
      turno_id: turno?.id || null
    }, { transaction });

    console.log('Admisión creada ID:', admision.id);

    // Crear lista de espera si hay tipo de turno
    if (tipoTurnoIdInt) {
      await ListaEspera.create({
        paciente_id: pacienteIdInt,
        tipo_turno_id: tipoTurnoIdInt,
        especialidad_id: especialidadIdInt,
        tipo_estudio_id: tipoEstudioIdInt,
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE',
        creador_tipo: 'ADMINISTRATIVO',
        creador_id: usuarioLogueadoId,
        fecha_registro: new Date()
      }, { transaction });
    }

    await transaction.commit();

    console.log('✅ Admisión creada exitosamente');

    res.status(201).json({
      success: true,
      mensaje: 'Admisión creada exitosamente',
      admision_id: admision.id,
      turno_id: turno?.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear admisión:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear admisión'
    });
  }
};

// ============================================================================
// OBTENER ADMISIONES (API)
// ============================================================================
const getAdmisiones = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, paciente_dni } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (estado) {
      whereClause.estado = estado;
    }

    // Si hay filtro por DNI, buscar primero los pacientes
    if (paciente_dni) {
      const usuarios = await Usuario.findAll({
        where: {
          dni: { [Op.like]: `%${paciente_dni}%` }
        },
        attributes: ['id']
      });
      
      const usuarioIds = usuarios.map(u => u.id);
      
      if (usuarioIds.length > 0) {
        const pacientes = await Paciente.findAll({
          where: {
            usuario_id: { [Op.in]: usuarioIds }
          },
          attributes: ['id']
        });
        const pacienteIds = pacientes.map(p => p.id);
        
        if (pacienteIds.length > 0) {
          whereClause.paciente_id = { [Op.in]: pacienteIds };
        } else {
          return res.json({
            success: true,
            admisiones: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            }
          });
        }
      } else {
        return res.json({
          success: true,
          admisiones: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        });
      }
    }

    const { count, rows: admisiones } = await Admision.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni', 'sexo'] },
            { model: ObraSocial, as: 'obraSocial', attributes: ['nombre'] }
          ]
        },
        { model: MotivoAdmision, as: 'motivo' },
        { model: FormaIngreso, as: 'forma_ingreso' },
        { 
          model: Medico, 
          as: 'medico',
          required: false,
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
        },
        { model: Sector, as: 'sector', required: false }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      admisiones,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener admisiones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener admisiones', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER ADMISIÓN POR ID
// ============================================================================
const getAdmisionById = async (req, res) => {
  try {
    const { id } = req.params;

    const admision = await Admision.findByPk(parseInt(id), {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario' },
            { model: ObraSocial, as: 'obraSocial' }
          ]
        },
        { model: MotivoAdmision, as: 'motivo' },
        { model: FormaIngreso, as: 'forma_ingreso' },
        { 
          model: Medico, 
          as: 'medico',
          include: [{ model: Usuario, as: 'usuario' }]
        },
        { model: Sector, as: 'sector' },
        { model: Especialidad, as: 'especialidad' },
        { 
          model: Turno, 
          as: 'turno',
          include: [
            { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] }
          ]
        },
        { model: Internacion, as: 'internacion', include: [
          { model: Habitacion, as: 'habitacion' },
          { model: Cama, as: 'cama' },
          { model: TipoInternacion, as: 'tipoInternacion' }
        ]}
      ]
    });

    if (!admision) {
      return res.status(404).json({ 
        success: false,
        message: 'Admisión no encontrada' 
      });
    }

    res.json(admision);

  } catch (error) {
    console.error('Error al obtener admisión:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener admisión', 
      error: error.message 
    });
  }
};

// ============================================================================
// ACTUALIZAR ESTADO DE ADMISIÓN
// ============================================================================
const updateEstadoAdmision = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    const admision = await Admision.findByPk(parseInt(id), { transaction });

    if (!admision) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Admisión no encontrada' 
      });
    }

    await admision.update({ estado }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Admisión ${estado.toLowerCase()} correctamente`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar admisión:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar admisión', 
      error: error.message 
    });
  }
};

// ============================================================================
// GENERAR PACIENTE TEMPORAL
// ============================================================================
const generarPacienteTemporal = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const dniTemporal = `TEMP${Date.now().toString().slice(-8)}`;
    
    const rolPaciente = await Rol.findOne({ 
      where: { nombre: 'PACIENTE' }, 
      transaction 
    });

    const usuario = await Usuario.create({
      dni: dniTemporal,
      nombre: 'TEMPORAL',
      apellido: dniTemporal,
      email: `${dniTemporal}@hospital.temp`,
      password: await bcrypt.hash('temporal123', 10),
      fecha_nacimiento: new Date('1990-01-01'),
      sexo: 'Otro',
      rol_principal_id: rolPaciente.id,
      estado: 'Pendiente'
    }, { transaction });

    const paciente = await Paciente.create({
      usuario_id: usuario.id,
      fecha_ingreso: new Date(),
      estado: 'Activo',
      observaciones: 'Paciente TEMPORAL - Actualizar datos'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      mensaje: 'Paciente temporal creado',
      paciente: {
        id: paciente.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al generar paciente temporal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al generar paciente temporal', 
      error: error.message 
    });
  }
};

// ============================================================================
// BUSCAR PACIENTES (autocomplete)
// ============================================================================
const searchPacientes = async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni || dni.length < 2) {
      return res.json({ pacientes: [] });
    }

    const usuarios = await Usuario.findAll({
      where: {
        dni: { [Op.like]: `${dni}%` }
      },
      include: [{
        model: Paciente,
        as: 'paciente',
        required: true
      }],
      limit: 10
    });

    const pacientes = usuarios.map(u => ({
      id: u.paciente.id,
      dni: u.dni,
      nombre: u.nombre,
      apellido: u.apellido,
      nombre_completo: `${u.nombre} ${u.apellido} (${u.dni})`
    }));

    res.json({ pacientes });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ pacientes: [] });
  }
};

// ============================================================================
// RENDERIZAR VISTA DE ADMISIONES
// ============================================================================
const renderAdmisiones = async (req, res) => {
  try {
    const [motivos, formas, tiposTurno, especialidades, sectores, tiposEstudio, motivosConsulta, obrasSociales] = await Promise.all([
      MotivoAdmision.findAll(),
      FormaIngreso.findAll(),
      TipoTurno.findAll(),
      Especialidad.findAll(),
      Sector.findAll(),
      TipoEstudio.findAll(),
      MotivoConsulta.findAll(),
      ObraSocial.findAll()
    ]);

    res.render('dashboard/admin/admisiones/admisiones', {
      title: 'Gestión de Admisiones',
      user: req.user,
      motivos,
      formas,
      tiposTurno,
      especialidades,
      sectores,
      tiposEstudio,
      motivosConsulta,
      obrasSociales
    });

  } catch (error) {
    console.error('Error al renderizar admisiones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la página de admisiones',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// RENDERIZAR LISTA DE ADMISIONES
// ============================================================================
const renderListaAdmisiones = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, desde, hasta, paciente_dni } = req.query;
    
    const whereClause = {};
    
    if (estado) {
      whereClause.estado = estado;
    }
    
    if (desde && hasta) {
      whereClause.fecha = {
        [Op.between]: [desde, hasta]
      };
    }

    // Buscar pacientes por DNI de forma separada
    if (paciente_dni) {
      const usuarios = await Usuario.findAll({
        where: {
          dni: { [Op.like]: `%${paciente_dni}%` }
        },
        attributes: ['id']
      });
      
      const usuarioIds = usuarios.map(u => u.id);
      
      if (usuarioIds.length > 0) {
        const pacientes = await Paciente.findAll({
          where: {
            usuario_id: { [Op.in]: usuarioIds }
          },
          attributes: ['id']
        });
        const pacienteIds = pacientes.map(p => p.id);
        
        if (pacienteIds.length > 0) {
          whereClause.paciente_id = { [Op.in]: pacienteIds };
        } else {
          return res.render('dashboard/admin/admisiones/lista-admisiones', {
            title: 'Lista de Admisiones',
            user: req.user,
            admisiones: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            },
            filtros: req.query,
            sectores: await Sector.findAll()
          });
        }
      } else {
        return res.render('dashboard/admin/admisiones/lista-admisiones', {
          title: 'Lista de Admisiones',
          user: req.user,
          admisiones: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          },
          filtros: req.query,
          sectores: await Sector.findAll()
        });
      }
    }

    const includeClause = [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] },
          { model: ObraSocial, as: 'obraSocial', attributes: ['nombre'] }
        ]
      },
      { model: Administrativo, as: 'administrativo', required: false },
      { model: MotivoAdmision, as: 'motivo' },
      { model: FormaIngreso, as: 'forma_ingreso' },
      {
        model: Turno,
        as: 'turno',
        required: false,
        include: [
          { model: Medico, as: 'medico', required: false, include: [{ model: Usuario, as: 'usuario' }] }
        ]
      },
      { model: Medico, as: 'medico', required: false, include: [{ model: Usuario, as: 'usuario' }] },
      { model: Sector, as: 'sector', required: false },
      { model: Especialidad, as: 'especialidad', required: false }
    ];

    const offset = (page - 1) * limit;

    const { count, rows: admisiones } = await Admision.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);
    
    const sectores = await Sector.findAll();

    res.render('dashboard/admin/admisiones/lista-admisiones', {
      title: 'Lista de Admisiones',
      user: req.user,
      admisiones,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      filtros: req.query,
      sectores
    });

  } catch (error) {
    console.error('Error al renderizar lista de admisiones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la lista de admisiones',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

module.exports = {
  buscarPacientePorDNI,
  getMedicosPorSector,
  getMedicosPorEspecialidad,
  getHorariosDisponiblesMedico,
  crearPaciente,
  crearAdmisionUrgencia,
  crearAdmision,
  getAdmisiones,
  getAdmisionById,
  updateEstadoAdmision,
  generarPacienteTemporal,
  searchPacientes,
  renderAdmisiones,
  renderListaAdmisiones
};
