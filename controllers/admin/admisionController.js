const { Op } = require('sequelize');
const db = require('../../database/db');
const bcrypt = require('bcryptjs');
const { 
    validarHorarioDisponible,
   calcularHoraFin } = require('../../services/horariosUtils');
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
  TurnoPersonal,
  TipoDeServicio,
  EvaluacionEnfermeria,
  Notificacion
} = require('../../models');

// ============================================================================
// BUSCAR PACIENTE POR DNI CON HISTORIAL
// ============================================================================

const buscarPacientePorDNI = async (req, res, next) => {
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

    //  Obtener servicios disponibles para mostrar en el formulario
    const sectores = await Sector.findAll({
      include: [{
        model: TipoDeServicio,
        as: 'tipos_de_servicio',
        attributes: ['id', 'nombre', 'descripcion']
      }]
    });

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
      sectores, 
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
    next(error);
  }
};
// ============================================================================
// OBTENER SERVICIOS POR SECTOR (PARA FORMULARIO DE ADMISIONES)
// ============================================================================
const getServiciosPorSector = async (req, res, next) => {
  try {
    const { sector_id } = req.query;
    
    console.log('🔍 DEBUG getServiciosPorSector - sector_id:', sector_id);
    
    if (!sector_id) {
      console.log('❌ sector_id es requerido');
      return res.status(400).json({ 
        success: false,
        message: 'sector_id es requerido' 
      });
    }

    // Convertir a número y validar
    const sectorIdInt = parseInt(sector_id);
    console.log('🔍 sectorIdInt (parsed):', sectorIdInt);
    
    if (isNaN(sectorIdInt)) {
      console.log('❌ sector_id no es número:', sector_id);
      return res.status(400).json({ 
        success: false,
        message: 'sector_id debe ser un número válido' 
      });
    }

    console.log('🔍 Buscando servicios para sector:', sectorIdInt);
    
    const servicios = await TipoDeServicio.findAll({
      where: { sector_id: sectorIdInt },
      attributes: ['id', 'nombre', 'descripcion'],
      include: [
        { 
          model: Sector, 
          as: 'sector',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Servicios encontrados:', servicios.length);
    
    res.json({
      success: true,
      servicios,
      total: servicios.length
    });

  } catch (error) {
    console.error('❌ ERROR en getServiciosPorSector:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
};
// ============================================================================
// OBTENER MÉDICOS POR SECTOR
// ============================================================================
const getMedicosPorSector = async (req, res, next) => {
  try {
    const { sector_id } = req.query;
    
    console.log('🔍 DEBUG getMedicosPorSector - sector_id:', sector_id);
    
    if (!sector_id) {
      console.log('❌ sector_id es requerido');
      return res.status(400).json({ message: 'sector_id es requerido' });
    }

    // Convertir a número y validar
    const sectorIdInt = parseInt(sector_id);
    console.log('🔍 sectorIdInt (parsed):', sectorIdInt);
    
    if (isNaN(sectorIdInt)) {
      console.log('❌ sector_id no es número:', sector_id);
      return res.status(400).json({ message: 'sector_id debe ser un número válido' });
    }

    console.log('🔍 Buscando médicos para sector:', sectorIdInt);
    
    const medicos = await Medico.findAll({
      where: { sector_id: sectorIdInt },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
        { model: Especialidad, as: 'especialidad', attributes: ['id', 'nombre'] }
      ]
    });

    console.log('✅ Médicos encontrados:', medicos.length);
    
    res.json({ medicos });
  } catch (error) {
    console.error('❌ ERROR en getMedicosPorSector:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
};

// ============================================================================
// OBTENER MÉDICOS POR ESPECIALIDAD
// ============================================================================
const getMedicosPorEspecialidad = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// OBTENER HORARIOS DISPONIBLES DE UN MÉDICO
// ============================================================================
const getHorariosDisponiblesMedico = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// CREAR PACIENTE
// ============================================================================
const crearPaciente = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// CREAR ADMISIÓN DE URGENCIA
// ============================================================================
const crearAdmisionUrgencia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { dni } = req.body;
    const administrativoId = req.user?.id;
    const usuarioLogueadoId = req.user?.usuario_id;

    if (!administrativoId) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'No se pudo identificar al administrativo' 
      });
    }

    // ✅ PASO 1: Determinar el DNI a usar
    let dniLimpio;

    if (!dni || String(dni).trim() === '') {
      // No vino DNI → generar uno temporal secuencial
      const totalTemporales = await Usuario.count({
        where: { nombre: 'URGENCIA' },
        transaction,
        lock: transaction.LOCK.UPDATE  // evita duplicados si dos urgencias llegan al mismo tiempo
      });
      const siguiente = totalTemporales + 1;
      dniLimpio = String(siguiente).padStart(8, '0'); // → "00000001", "00000002"...
    } else {
      // Vino DNI → limpiar y validar
      dniLimpio = String(dni).trim().replace(/\D/g, ''); // elimina todo lo que no sea dígito
      if (dniLimpio.length < 7 || dniLimpio.length > 8) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'DNI inválido. Debe tener entre 7 y 8 dígitos numéricos.'
        });
      }
    }

    // PASO 2: Buscar o crear paciente
    let usuario = await Usuario.findOne({ where: { dni: dniLimpio }, transaction });
    let paciente;

    if (!usuario) {
      const rolPaciente = await Rol.findOne({ 
        where: { nombre: 'PACIENTE' }, 
        transaction 
      });

      if (!rolPaciente) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'No se encontró el rol PACIENTE en la base de datos.'
        });
      }

      usuario = await Usuario.create({
        dni: dniLimpio,
        nombre: 'URGENCIA',
        apellido: `TEMPORAL-${dniLimpio}`,
        email: `urgencia${dniLimpio}@hospital.com`, 
        password: await bcrypt.hash('temporal234', 10),
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

    // PASO 3: Buscar motivo y forma de ingreso
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

    // PASO 4: Crear admisión
    const admision = await Admision.create({
      paciente_id: paciente.id,
      administrativo_id: administrativoId,
      motivo_id: motivoUrgencia?.id || 1,
      forma_ingreso_id: formaUrgencia?.id || 1,
      fecha: new Date(),
      estado: 'Pendiente'
    }, { transaction });

    // PASO 5: Crear evaluación de enfermería
    const evaluacionEnfermeria = await EvaluacionEnfermeria.create({
      paciente_id: paciente.id,
      fecha: new Date(),
      signos_vitales: 'Pendiente de evaluación',
      nivel_triaje: 'Amarillo',
      tipo_egreso: 'DERIVACION_URGENCIA',
      prioridad: 'ALTA',
      estado: 'Pendiente',
      observaciones: 'Urgencia registrada por admisión'
    }, { transaction });

    // PASO 6: Crear lista de espera
    const listaEspera = await ListaEspera.create({
      paciente_id: paciente.id,
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      fecha_registro: new Date(),
      creador_id: usuarioLogueadoId,
      creador_tipo: 'ADMINISTRATIVO',
      tipo_turno_id: 5,
      observaciones: `Urgencia de admisión - DNI: ${dniLimpio}`
    }, { transaction });

    // PASO 7: Notificar médicos
    const medicosEmergencia = await Medico.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        where: { estado: 'Activo' },
        required: true
      }],
      limit: 5,
      transaction
    });

    for (const medico of medicosEmergencia) {
      try {
        await Notificacion.create({
          usuario_id: medico.usuario.id, //  era medico.usuario.usuario_id (incorrecto)
          remitente_id: usuarioLogueadoId,
          mensaje: `🚨 NUEVA URGENCIA\n\nPaciente: ${usuario.nombre} ${usuario.apellido}\nDNI: ${dniLimpio}`,
          leida: false,
          tipo: 'URGENCIA_EMERGENCIA'
        }, { transaction });
      } catch (notifError) {
        // No romper la transacción si falla una notificación
        console.error('Error notificando a médico:', notifError.message);
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      mensaje: '🚨 Admisión de urgencia creada',
      pacienteId: paciente.id,
      admisionId: admision.id,
      evaluacionId: evaluacionEnfermeria.id,
      listaEsperaId: listaEspera.id,
      dniAsignado: dniLimpio 
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// ============================================================================
// CREAR ADMISIÓN NORMAL 
// ============================================================================

const crearAdmision = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      paciente_id, motivo_id, forma_ingreso_id, fecha,
      tipo_turno_id, prioridad, medico_id, sector_id,
      especialidad_id, tipo_estudio_id, motivo_consulta_id,
      turno_fecha, turno_hora, observaciones,
      tipo_servicio_id 
    } = req.body;

    const administrativoId = req.user?.id;
    const usuarioLogueadoId = req.user?.usuario_id;

    console.log('=== CREAR ADMISION DEBUG ===');
    console.log('Tiene médico+fecha+hora para turno?:', {
      medico_id: !!medico_id,
      turno_fecha: !!turno_fecha,
      turno_hora: !!turno_hora,
      tiene_todo: !!(medico_id && turno_fecha && turno_hora)
    });

    // ✅ PASO 1: Validar administrativo
    if (!administrativoId) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'No se pudo identificar al administrativo' 
      });
    }

    // ✅ PASO 2: Validar campos obligatorios
    if (!paciente_id || !motivo_id || !forma_ingreso_id || !tipo_servicio_id) { 
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Campos obligatorios: paciente_id, motivo_id, forma_ingreso_id, tipo_servicio_id' 
      });
    }

    // ✅ PASO 3: Convertir IDs a números PRIMERO (antes de usarlos)
    const pacienteIdInt = parseInt(paciente_id);
    const motivoIdInt = parseInt(motivo_id);
    const formaIngresoIdInt = parseInt(forma_ingreso_id);
    const medicoIdInt = medico_id ? parseInt(medico_id) : null;
    const sectorIdInt = sector_id ? parseInt(sector_id) : null;
    const especialidadIdInt = especialidad_id ? parseInt(especialidad_id) : null;
    const tipoEstudioIdInt = tipo_estudio_id ? parseInt(tipo_estudio_id) : null;
    const motivoConsultaIdInt = motivo_consulta_id ? parseInt(motivo_consulta_id) : null;
    const tipoTurnoIdInt = tipo_turno_id ? parseInt(tipo_turno_id) : null;
    const tipoServicioIdInt = parseInt(tipo_servicio_id);

    // ✅ PASO 4: Verificar estado del paciente
    const paciente = await Paciente.findByPk(pacienteIdInt, { transaction });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      });
    }

    if (paciente.estado === 'Baja') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente está dado de baja del sistema. Contacte al administrador para rehabilitarlo.'
      });
    }

    if (paciente.estado === 'Inactivo') {
      await paciente.update({ 
        estado: 'Activo',
        fecha_ingreso: new Date(),
        observaciones: paciente.observaciones 
          ? `${paciente.observaciones} | Reingreso: ${new Date().toLocaleDateString('es-AR')}`
          : `Reingreso: ${new Date().toLocaleDateString('es-AR')}`
      }, { transaction });
      console.log(`♻️ Paciente ${pacienteIdInt} reactivado por reingreso`);
    }

    // ✅ PASO 5: Verificar que no tenga internación activa
    const internacionActiva = await Internacion.findOne({
      where: { paciente_id: pacienteIdInt, fecha_alta: null },
      transaction
    });

    if (internacionActiva) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente ya tiene una internación activa. Debe darse el alta primero.'
      });
    }

    // =================================================================
    // PASO 6: DECISIÓN CRÍTICA: ¿TURNO DIRECTO O LISTA DE ESPERA?
    // =================================================================
    
    let turno = null;
    let listaEspera = null;
    let estadoAdmision = 'Pendiente';

    // FLUJO A: TIENE TURNO (médico + fecha + hora) COMPLETO
    if (medicoIdInt && turno_fecha && turno_hora) {
      console.log('FLUJO: TURNO DIRECTO - Validando disponibilidad...');
      
      try {
        const validacionHorario = await validarHorarioDisponible(
          medicoIdInt,
          turno_fecha,
          turno_hora,
          30,
          tipoServicioIdInt
        );

        console.log('Resultado validación horario:', validacionHorario);

        if (!validacionHorario.disponible) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: validacionHorario.mensaje,
            error: 'horario_no_disponible',
            validacion: validacionHorario
          });
        }
      } catch (error) {
        console.error('❌ Error al validar horario:', error);
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Error al validar disponibilidad del horario',
          error: error.message
        });
      }

      // Obtener sector del servicio si no vino en el body
      let sectorFinalId = sectorIdInt;
      if (!sectorFinalId) {
        const servicio = await TipoDeServicio.findByPk(tipoServicioIdInt, { 
          transaction,
          attributes: ['id', 'sector_id']
        });
        if (servicio) {
          sectorFinalId = servicio.sector_id;
          console.log('Usando sector del servicio:', sectorFinalId);
        }
      }

      const hora_fin = calcularHoraFin(turno_hora, 30);
      
      console.log('Horario calculado:', {
        inicio: turno_hora,
        fin: hora_fin,
        duracion: '30 minutos'
      });

      turno = await Turno.create({
        fecha: turno_fecha,
        hora_inicio: turno_hora,
        hora_fin: hora_fin,
        estado: 'CONFIRMADO',
        paciente_id: pacienteIdInt,
        medico_id: medicoIdInt,
        sector_id: sectorFinalId,
        tipo_servicio_id: tipoServicioIdInt,
        tipo_estudio_id: tipoEstudioIdInt,
        usuario_id: usuarioLogueadoId,
        origen: 'ADMINISTRATIVO_DIRECTO'
      }, { transaction });
      
      console.log('✅ Turno creado ID:', turno.id);
      estadoAdmision = 'CON_TURNO';

    } 
    // FLUJO B: NO TIENE TURNO COMPLETO → VA A LISTA DE ESPERA
    else if (tipoTurnoIdInt) {
      console.log('FLUJO: LISTA DE ESPERA - Sin turno programado completo');
      console.log('Faltan datos para turno:', {
        falta_medico: !medicoIdInt,
        falta_fecha: !turno_fecha,
        falta_hora: !turno_hora
      });
      
      let sectorListaEsperaId = sectorIdInt;
      if (!sectorListaEsperaId) {
        const servicio = await TipoDeServicio.findByPk(tipoServicioIdInt, { 
          transaction,
          attributes: ['id', 'sector_id']
        });
        if (servicio) {
          sectorListaEsperaId = servicio.sector_id;
        }
      }

      listaEspera = await ListaEspera.create({
        paciente_id: pacienteIdInt,
        tipo_turno_id: tipoTurnoIdInt,
        especialidad_id: especialidadIdInt,
        tipo_estudio_id: tipoEstudioIdInt,
        tipo_servicio_id: tipoServicioIdInt,
        sector_id: sectorListaEsperaId,
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE',
        creador_tipo: 'ADMINISTRATIVO',
        creador_id: usuarioLogueadoId,
        fecha_registro: new Date(),
        observaciones: observaciones || 'En espera de asignación de turno'
      }, { transaction });
      
      console.log('Lista de espera creada ID:', listaEspera.id);
      estadoAdmision = 'EN_ESPERA';
    }
    // FLUJO C: ADMISIÓN BÁSICA SIN TURNO NI LISTA DE ESPERA
    else {
      console.log('FLUJO: ADMISIÓN BÁSICA - Sin turno ni lista de espera');
      estadoAdmision = 'REGISTRADO';
    }

    // =================================================================
    // PASO 7: CREAR ADMISIÓN
    // =================================================================
    console.log('Creando admisión con estado:', estadoAdmision);
    
    const admision = await Admision.create({
      paciente_id: pacienteIdInt,
      administrativo_id: administrativoId,
      motivo_id: motivoIdInt,
      forma_ingreso_id: formaIngresoIdInt,
      fecha: fecha || new Date(),
      estado: estadoAdmision,
      medico_id: medicoIdInt,
      sector_id: sectorIdInt,
      especialidad_id: especialidadIdInt,
      tipo_estudio_id: tipoEstudioIdInt,
      motivo_consulta_id: motivoConsultaIdInt,
      tipo_servicio_id: tipoServicioIdInt,
      turno_id: turno?.id || null,
      lista_espera_id: listaEspera?.id || null,
      observaciones: observaciones || null
    }, { transaction });

    console.log('Admisión creada ID:', admision.id);

    await transaction.commit();
    console.log('✅ Transacción completada exitosamente');

    res.status(201).json({
      success: true,
      mensaje: estadoAdmision === 'CON_TURNO' 
        ? 'Admisión con turno creada exitosamente' 
        : estadoAdmision === 'EN_ESPERA'
        ? 'Paciente puesto en lista de espera'
        : 'Admisión registrada',
      admision_id: admision.id,
      turno_id: turno?.id || null,
      lista_espera_id: listaEspera?.id || null,
      estado: estadoAdmision,
      flujo: turno ? 'TURNO_DIRECTO' : listaEspera ? 'LISTA_ESPERA' : 'REGISTRO_BASICO',
      detalles: {
        tiene_turno: !!turno,
        tiene_lista_espera: !!listaEspera,
        medico_asignado: medicoIdInt,
        fecha_turno: turno_fecha,
        hora_turno: turno_hora
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ ERROR en crearAdmision:', error);
    next(error);
  }
};


// ============================================================================
// OBTENER ADMISIONES (API)
// ============================================================================
const getAdmisiones = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// OBTENER ADMISIÓN POR ID
// ============================================================================
const getAdmisionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 DEBUG getAdmisionById - ID recibido:', id);
    
    // Validar que sea un número
    const idInt = parseInt(id);
    if (isNaN(idInt)) {
      console.log('❌ ID no es un número válido:', id);
      return res.status(400).json({ 
        success: false,
        message: 'ID de admisión no válido' 
      });
    }

    console.log('🔍 Buscando admisión ID:', idInt);
    
    const admision = await Admision.findByPk(idInt, {
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
    console.error('❌ ERROR en getAdmisionById:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
};

// ============================================================================
// ACTUALIZAR ESTADO DE ADMISIÓN
// ============================================================================
const updateEstadoAdmision = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// GENERAR PACIENTE TEMPORAL
// ============================================================================
const generarPacienteTemporal = async (req, res, next) => {
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
    next(error);
  }
};

// ============================================================================
// BUSCAR PACIENTES (autocomplete)
// ============================================================================
const searchPacientes = async (req, res, next) => {
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
   next(error);
  }
};

// ============================================================================
// RENDERIZAR VISTA DE ADMISIONES
// ============================================================================
const renderAdmisiones = async (req, res, next) => {
  try {
    const [motivos, formas, tiposTurno, especialidades, sectores, tiposEstudio, motivosConsulta, obrasSociales, tiposDeServicio] = await Promise.all([
      MotivoAdmision.findAll(),
      FormaIngreso.findAll(),
      TipoTurno.findAll(),
      Especialidad.findAll(),
      Sector.findAll({
        include: [{
          model: TipoDeServicio,
          as: 'tipos_de_servicio',
          attributes: ['id', 'nombre']
        }]
      }),
      TipoEstudio.findAll(),
      MotivoConsulta.findAll(),
      ObraSocial.findAll(),
      TipoDeServicio.findAll({ 
        attributes: ['id', 'nombre', 'sector_id']
      })
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
      obrasSociales,
      tiposDeServicio 
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================================
// RENDERIZAR LISTA DE ADMISIONES
// ============================================================================

const renderListaAdmisiones = async (req, res, next) => {
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
          const sectores = await Sector.findAll({
            include: [{
              model: TipoDeServicio,
              as: 'tipos_de_servicio',
              attributes: ['id', 'nombre']
            }]
          });
          
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
            sectores
          });
        }
      } else {
        const sectores = await Sector.findAll({
          include: [{
            model: TipoDeServicio,
            as: 'tipo_servicio',
            attributes: ['id', 'nombre']
          }]
        });
        
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
          sectores
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
          { model: Medico, as: 'medico', required: false, include: [{ model: Usuario, as: 'usuario' }] },
          { model: TipoDeServicio, as: 'tipo_servicio', attributes: ['id', 'nombre'], required: false } 
        ]
      },
      { 
        model: Medico, 
        as: 'medico', 
        required: false, 
        include: [{ model: Usuario, as: 'usuario' }] 
      },
      { 
        model: Sector, 
        as: 'sector', 
        required: false,
        include: [{ 
          model: TipoDeServicio,
          as: 'tipos_de_servicio',  
          attributes: ['id', 'nombre', 'descripcion']
        }]
      },
      { 
        model: Especialidad, 
        as: 'especialidad', 
        required: false 
      },
      
     
    ];

    const offset = (page - 1) * limit;

    const { count, rows: admisiones } = await Admision.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true 
    });

    const totalPages = Math.ceil(count / limit);
    
    const sectores = await Sector.findAll({
      include: [{
        model: TipoDeServicio,
        as: 'tipos_de_servicio',
        attributes: ['id', 'nombre']
      }]
    });

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
    next(error);
    
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
  getServiciosPorSector,
  renderListaAdmisiones
};
