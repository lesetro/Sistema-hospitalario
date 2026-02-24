const { 
  Paciente, 
  Usuario, 
  Medico,
  EvaluacionMedica,
  ObraSocial,
  HistorialMedico,
  Internacion,
  AltaMedica,
  Diagnostico,
  ListaEspera ,
  EvaluacionEnfermeria,
  Enfermero,
  TipoTurno,
  Especialidad, 
  ControlEnfermeria,
  MotivoConsulta,
  Habitacion,
  ProcedimientoPreQuirurgico,
  Sector,
  Notificacion,
  Tratamiento,
  Turno,
  TipoInternacion,
  Cama
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA DE PACIENTES
// ========================================
exports.renderPacientes = async (req, res, next) => {
  try {
    console.log('🔍 renderPacientes - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Especialidad, as: 'especialidad' }
          ]
        }
      ]
    });

    if (!usuario || !usuario.medico) {
      console.error('❌ Usuario o Medico no encontrado');
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    res.render('dashboard/medico/pacientes', {
      title: 'Mis Pacientes',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar pacientes:', error);
    next(error);
  }
};

// ========================================
// OBTENER PACIENTES DEL MÉDICO
// ========================================
exports.obtenerPacientes = async (req, res, next) => {
  try {
    console.log(' obtenerPacientes - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    console.log(' Médico encontrado:', medico.id);

    const { busqueda, estado, obraSocial, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const wherePaciente = {};

    if (estado && estado !== 'TODOS') {
      wherePaciente.estado = estado;
    }

    if (obraSocial && obraSocial !== 'TODAS') {
      wherePaciente.obra_social_id = obraSocial;
    }

    // Las 4 fuentes: evaluaciones, internaciones, urgencias, turnos 
    console.log(' Buscando pacientes del médico...');
    const [porEvaluacion, porInternacion, porUrgencia, porTurno] = await Promise.all([
      EvaluacionMedica.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      Internacion.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      ListaEspera.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      Turno.findAll({
        where: { 
          medico_id: medico.id,
          paciente_id: { [Op.ne]: null }
        },
        attributes: ['paciente_id'],
        raw: true
      })
    ]);

    const todosLosIds = [
      ...porEvaluacion.map(e => e.paciente_id),
      ...porInternacion.map(i => i.paciente_id),
      ...porUrgencia.map(u => u.paciente_id),
      ...porTurno.map(t => t.paciente_id)
    ];

    const pacientesIds = [...new Set(todosLosIds)];
    console.log(' Pacientes encontrados (incluyendo turnos):', pacientesIds.length);

    if (pacientesIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), totalPages: 0 }
      });
    }

    wherePaciente.id = { [Op.in]: pacientesIds };

    // ========================================
    // SI HAY BÚSQUEDA, FILTRAR PRIMERO POR USUARIO
    // ========================================
    let pacientesFiltrados = null;
    
    if (busqueda) {
      // Buscar usuarios que coincidan con la búsqueda
      const usuariosCoincidentes = await Usuario.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${busqueda}%` } },
            { apellido: { [Op.like]: `%${busqueda}%` } },
            { dni: { [Op.like]: `%${busqueda}%` } }
          ]
        },
        attributes: ['id'],
        raw: true
      });

      const userIds = usuariosCoincidentes.map(u => u.id);
      
      if (userIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: { total: 0, page: parseInt(page), totalPages: 0 }
        });
      }

      // Ahora buscar pacientes que pertenezcan a esos usuarios Y estén en la lista del médico
      pacientesFiltrados = await Paciente.findAll({
        where: {
          ...wherePaciente,
          usuario_id: { [Op.in]: userIds }
        },
        attributes: ['id'],
        raw: true
      });

      const pacientesFiltradosIds = pacientesFiltrados.map(p => p.id);
      
      if (pacientesFiltradosIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: { total: 0, page: parseInt(page), totalPages: 0 }
        });
      }

      // Actualizar wherePaciente con los IDs filtrados
      wherePaciente.id = { [Op.in]: pacientesFiltradosIds };
    }

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: wherePaciente,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          required: true,
          attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono', 'email', 'fecha_nacimiento', 'sexo']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    console.log(' Total de pacientes encontrados después de filtros:', count);

    const pacientesConInfo = await Promise.all(pacientes.map(async (paciente) => {
      const ultimaEvaluacion = await EvaluacionMedica.findOne({
        where: { paciente_id: paciente.id, medico_id: medico.id },
        order: [['fecha', 'DESC']],
        attributes: ['fecha', 'observaciones_diagnostico']
      });

      const totalEvaluaciones = await EvaluacionMedica.count({
        where: { paciente_id: paciente.id, medico_id: medico.id }
      });

      // Internación activa CONMIGO
      const internacionActiva = await Internacion.findOne({
        where: { paciente_id: paciente.id, medico_id: medico.id, fecha_alta: null }
      });

      // ========================================
      // VERIFICAR SI FUE TRANSFERIDO A OTRO SECTOR
      // ========================================
      let transferido = false;
      let transferidoA = null;
      let medicoActual = null;
      
      // Buscar internación activa con OTRO médico
      const internacionOtroMedico = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          fecha_alta: null,
          medico_id: { [Op.ne]: medico.id }
        },
        include: [
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
          },
          {
            model: Habitacion,
            as: 'habitacion',
            include: [{ model: Sector, as: 'sector', attributes: ['nombre'] }]
          }
        ]
      });
      
      if (internacionOtroMedico) {
        transferido = true;
        transferidoA = internacionOtroMedico.habitacion?.sector?.nombre || 'Otro sector';
        medicoActual = internacionOtroMedico.medico?.usuario 
          ? `Dr. ${internacionOtroMedico.medico.usuario.nombre} ${internacionOtroMedico.medico.usuario.apellido}`
          : 'Otro médico';
      }

      return {
        ...paciente.toJSON(),
        ultimaEvaluacion,
        totalEvaluaciones,
        internacionActiva: !!internacionActiva,
        transferido,
        transferidoA,
        medicoActual
      };
    }));

    if (pacientesConInfo.length > 0) {
      console.log('Paciente ejemplo con info:', JSON.stringify(pacientesConInfo[0], null, 2));
    }
    
    res.json({
      success: true,
      data: pacientesConInfo,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error.message);
    next(error);
  }
};
// ========================================
// OBTENER DETALLE DE UN PACIENTE
// ========================================

exports.renderDetallePaciente = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) return res.status(404).render('error', { message: 'Médico no encontrado' });

    const paciente = await Paciente.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: { exclude: ['password'] } },
        { model: ObraSocial, as: 'obraSocial', attributes: ['id', 'nombre'] }
      ]
    });

    if (!paciente) return res.status(404).render('error', { message: 'Paciente no encontrado' });

    const [evaluaciones, internaciones, historial, controles] = await Promise.all([
      EvaluacionMedica.findAll({
        where: { paciente_id: paciente.id },
        include: [
          { model: Diagnostico, as: 'diagnostico', attributes: ['id', 'nombre', 'codigo'] },
          { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] }
        ],
        order: [['fecha', 'DESC']],
        limit: 10
      }),
      Internacion.findAll({
        where: { paciente_id: paciente.id },
        include: [
          { model: Cama, as: 'cama', include: [{ model: Habitacion, as: 'habitacion', attributes: ['numero', 'tipo'] }] },
          { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] }
        ],
        order: [['fecha_inicio', 'DESC']],
        limit: 5
      }),
      HistorialMedico.findAll({
        where: { paciente_id: paciente.id },
        include: [{ model: MotivoConsulta, as: 'motivo_consulta', attributes: ['nombre'] }],
        order: [['fecha', 'DESC']],
        limit: 10
      }),
      ControlEnfermeria.findAll({
        where: { paciente_id: paciente.id },
        include: [{
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
          required: false,
          include: [{ model: Enfermero, as: 'enfermero', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] }]
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    res.render('dashboard/medico/paciente-detalle', {
      title: `Detalle - ${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
      user: req.user,
      paciente,
      evaluaciones,
      internaciones,
      historial,
      controles,
      pacienteDni: paciente.usuario.dni,
      estadisticas: {
        totalEvaluaciones: evaluaciones.length,
        totalInternaciones: internaciones.length,
        totalControles: controles.length
      }
    });

  } catch (error) {
    console.error('❌ Error al renderizar detalle paciente:', error);
    next(error);
  }
};
// ========================================
// OBTENER HISTORIAL MÉDICO DEL PACIENTE
// ========================================
exports.obtenerHistorialPaciente = async (req, res, next) => {
  try {
    console.log('📋 obtenerHistorialPaciente - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { pacienteId } = req.params;

    // Verificar que el médico haya atendido al paciente
    const haAtendido = await EvaluacionMedica.findOne({
      where: {
        paciente_id: pacienteId,
        medico_id: medico.id
      }
    });

    if (!haAtendido) {
      console.error('❌ Médico no ha atendido este paciente');
      return res.status(403).json({ 
        success: false,
        message: 'No tiene permiso para ver este historial' 
      });
    }

    const historial = await HistorialMedico.findAll({
      where: { paciente_id: pacienteId },
      include: [
        {
          model: MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    console.log('✅ Historial obtenido:', historial.length);

    res.json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER EVALUACIONES DEL PACIENTE
// ========================================
exports.obtenerEvaluacionesPaciente = async (req, res, next) => {
  try {
    console.log('📊 obtenerEvaluacionesPaciente - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { pacienteId } = req.params;

    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
        paciente_id: pacienteId,
        medico_id: medico.id
      },
      include: [
        {
          model: Diagnostico,
          as: 'diagnostico',
          attributes: ['id', 'nombre', 'codigo']
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    console.log('✅ Evaluaciones obtenidas:', evaluaciones.length);

    res.json({
      success: true,
      data: evaluaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluaciones:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER OBRAS SOCIALES PARA FILTRO
// ========================================
exports.obtenerObrasSociales = async (req, res, next) => {
  try {
    console.log('🏥 obtenerObrasSociales');
    
    const obrasSociales = await ObraSocial.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Obras sociales obtenidas:', obrasSociales.length);

    res.json({
      success: true,
      data: obrasSociales
    });
  } catch (error) {
    console.error('❌ Error al obtener obras sociales:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS DE PACIENTES
// ========================================
exports.obtenerEstadisticasPacientes = async (req, res, next) => {
  try {
    console.log('📈 obtenerEstadisticasPacientes - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    // Total de pacientes únicos
    const [porEvaluacion, porInternacion, porUrgencia] = await Promise.all([
     EvaluacionMedica.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
     }),
      Internacion.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      ListaEspera.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
     })
    ]);

    const totalPacientes = new Set([
      ...porEvaluacion.map(e => e.paciente_id),
      ...porInternacion.map(i => i.paciente_id),
      ...porUrgencia.map(u => u.paciente_id)
    ]).size;

    // Pacientes internados actualmente
    const pacientesInternados = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_alta: null
      }
    });

    // Evaluaciones este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const evaluacionesMes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioMes }
      }
    });

    console.log('✅ Estadísticas:', {
      totalPacientes,
      pacientesInternados,
      evaluacionesMes
    });

    res.json({
      success: true,
      data: {
        totalPacientes,
        pacientesInternados,
        evaluacionesMes
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    next(error);
  }
};
// solicitar un control para luego poder hacer una evaluacion del paciente 
exports.solicitarControlesEnfermeria = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const pacienteId = req.params.id;

    const paciente = await Paciente.findByPk(pacienteId, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    // Evitar duplicados — si ya hay uno SOLICITADO, no crear otro
    const controlExistente = await ControlEnfermeria.findOne({
      where: { paciente_id: pacienteId, estado: 'SOLICITADO' },
      transaction
    });

    if (controlExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Ya existe un control solicitado para ${paciente.usuario.apellido}, ${paciente.usuario.nombre}`
      });
    }

    //  Crear control con solo paciente_id y estado SOLICITADO
    await ControlEnfermeria.create({
      paciente_id: pacienteId,
      estado: 'SOLICITADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Control solicitado para ${paciente.usuario.apellido}, ${paciente.usuario.nombre}. Visible para enfermería.`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al solicitar controles:', error);
    next(error);
  }
};

exports.derivarACirugiaUrgencia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id: pacienteId } = req.params;
    const { observaciones, prioridad = 'ALTA' } = req.body;
    const medicoId = req.user.medico_id;
    const usuarioId = req.user.usuario_id;
    
    console.log(`🔪 Derivando paciente ${pacienteId} a cirugía de urgencia`);
    
    // 1. Validar paciente
    const paciente = await Paciente.findByPk(pacienteId, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'apellido', 'dni']
      }],
      transaction
    });
    
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    // 2. Verificar que no tenga ya una lista de espera de cirugía pendiente
    const tipoTurnoCirugia = await TipoTurno.findOne({
      where: { nombre: { [Op.like]: '%CIRUG%' } },
      transaction
    });
    
    if (!tipoTurnoCirugia) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No existe el tipo de turno de cirugía en el sistema'
      });
    }
    
    const listaExistente = await ListaEspera.findOne({
      where: {
        paciente_id: pacienteId,
        tipo_turno_id: tipoTurnoCirugia.id,
        estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] }
      },
      transaction
    });
    
    if (listaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente ya tiene una derivación a cirugía pendiente'
      });
    }
    
    // ========================================
    // BUSCAR Y LIBERAR CAMA DEL PACIENTE
    // ========================================
    let camaLiberada = null;
    
    // Opción 1: Buscar internación activa
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: pacienteId,
        fecha_alta: null
      },
      include: [{ model: Cama, as: 'cama' }],
      transaction
    });
    
    if (internacionActiva?.cama) {
      camaLiberada = internacionActiva.cama;
    } else {
      // Opción 2: Buscar cama ocupada por este paciente (por ListaEspera con habitacion_id)
      const listaConCama = await ListaEspera.findOne({
        where: {
          paciente_id: pacienteId,
          estado: 'ASIGNADO',
          habitacion_id: { [Op.ne]: null }
        },
        transaction
      });
      
      if (listaConCama?.habitacion_id) {
        camaLiberada = await Cama.findOne({
          where: {
            habitacion_id: listaConCama.habitacion_id,
            estado: 'Ocupada'
          },
          transaction
        });
      }
    }
    
    // Liberar la cama (poner en limpieza)
    if (camaLiberada) {
      await camaLiberada.update({
        estado: 'EnLimpieza',
        sexo_ocupante: null
      }, { transaction });
      
      console.log(` Cama ${camaLiberada.numero} liberada para limpieza (paciente va a cirugía)`);
    }
    
    // ========================================
    // 3. Crear lista de espera tipo CIRUGIA
    // ========================================
    const listaEspera = await ListaEspera.create({
      paciente_id: pacienteId,
      tipo_turno_id: tipoTurnoCirugia.id,
      prioridad: prioridad,
      estado: 'PENDIENTE',
      fecha_registro: new Date(),
      creador_id: usuarioId,
      creador_tipo: 'MEDICO',
      observaciones: ` CIRUGÍA DE URGENCIA\n` +
                     `Derivado por: Dr. ${req.user.nombre}\n` +
                     `Motivo: ${observaciones || 'Requiere intervención quirúrgica urgente'}`
    }, { transaction });
    
    console.log(` Lista de espera para cirugía creada: ${listaEspera.id}`);
    
    // ========================================
    // 4. Actualizar ListaEspera anterior (si existe)
    // ========================================
    await ListaEspera.update(
      { estado: 'COMPLETADO' },
      {
        where: {
          paciente_id: pacienteId,
          estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] },
          id: { [Op.ne]: listaEspera.id }  // No actualizar la nueva
        },
        transaction
      }
    );
    
    // ========================================
    // 5. Notificar a cirujanos del sector Emergencias
    // ========================================
    const sectorEmergencias = await Sector.findOne({
      where: { nombre: { [Op.like]: '%Emergencia%' } },
      transaction
    });
    
    if (sectorEmergencias) {
      const cirujanos = await Medico.findAll({
        where: { sector_id: sectorEmergencias.id },
        include: [
          { model: Usuario, as: 'usuario' },
          { 
            model: Especialidad, 
            as: 'especialidad',
            where: { nombre: { [Op.like]: '%Cirug%' } },
            required: false
          }
        ],
        transaction
      });
      
      console.log(` Médicos del sector emergencias encontrados: ${cirujanos.length}`);
      
      const mensajeCirugia = 
        `🔪 **CIRUGÍA DE URGENCIA**\n\n` +
        `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
        `DNI: ${paciente.usuario.dni}\n` +
        `Prioridad: ${prioridad}\n` +
        `Derivado por: Dr. ${req.user.nombre}\n` +
        `Fecha: ${new Date().toLocaleString('es-AR')}\n\n` +
        `Motivo: ${observaciones || 'Requiere evaluación quirúrgica urgente'}`;
      
      for (const cirujano of cirujanos) {
        await Notificacion.create({
          usuario_id: cirujano.usuario_id,
          remitente_id: usuarioId,
          mensaje: mensajeCirugia,
          leida: false,
          tipo: 'CIRUGIA_URGENCIA'
        }, { transaction });
        
        console.log(` Notificación enviada a Dr. ${cirujano.usuario.nombre}`);
      }
    }
    
    // ========================================
    // 6. Crear registro en historial médico
    // ========================================
    await HistorialMedico.create({
      paciente_id: pacienteId,
      descripcion: `Derivado a cirugía de urgencia. Prioridad: ${prioridad}. ${observaciones || ''}${camaLiberada ? ` Cama ${camaLiberada.numero} liberada.` : ''}`,
      tipo_evento: 'Derivacion',
      fecha: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    console.log(`✅ Paciente derivado a cirugía exitosamente`);
    
    res.json({
      success: true,
      message: `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} derivado a cirugía de urgencia.${camaLiberada ? ` Cama ${camaLiberada.numero} en limpieza.` : ''} Se notificó a los cirujanos.`,
      data: {
        lista_espera_id: listaEspera.id,
        prioridad: prioridad,
        cama_liberada: camaLiberada?.numero || null
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al derivar a cirugía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al derivar paciente a cirugía',
      error: error.message
    });
  }
};

exports.derivarAPrequirurgico = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id: pacienteId } = req.params;
    const { 
      evaluacion_medica_id,
      nombre,
      descripcion,
      prioridad = 'ALTA',
      checklist_requerido,
      observaciones_especiales 
    } = req.body;
    
    const medicoId = req.user.medico_id;
    const usuarioId = req.user.usuario_id;
    
    console.log(` Derivando paciente ${pacienteId} a pre-quirúrgico`);
    
    // ========================================
    // 1. VALIDAR PACIENTE
    // ========================================
    const paciente = await Paciente.findByPk(pacienteId, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'dni', 'sexo'] },
        { model: ObraSocial, as: 'obraSocial', attributes: ['id', 'nombre'] }
      ],
      transaction
    });
    
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    // ========================================
    // 2. VALIDAR EVALUACIÓN MÉDICA (REQUERIDA)
    // ========================================
    let evaluacionMedicaId = evaluacion_medica_id;

    // Si no se proporciona, buscar la última evaluación del paciente con este médico
    if (!evaluacionMedicaId) {
      const ultimaEvaluacion = await EvaluacionMedica.findOne({
        where: { 
          paciente_id: pacienteId,
          medico_id: medicoId
        },
        order: [['fecha', 'DESC']],
        transaction
      });
  
      if (ultimaEvaluacion) {
        evaluacionMedicaId = ultimaEvaluacion.id;
        console.log(` Usando última evaluación médica: ${evaluacionMedicaId}`);
      } else {
        // NO tiene evaluación médica - ERROR
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El paciente no tiene evaluación médica previa. Debe realizar una evaluación antes de derivar a pre-quirúrgico.',
          tipo: 'SIN_EVALUACION'
        });
      }
    }
    
    // ========================================
    // 3. VERIFICAR SI YA TIENE INTERNACIÓN ACTIVA
    // ========================================
    let internacion = await Internacion.findOne({
      where: {
        paciente_id: pacienteId,
        fecha_alta: null
      },
      include: [
        { model: Cama, as: 'cama' },
        { model: Habitacion, as: 'habitacion' }
      ],
      transaction
    });
    
    let camaAsignada = null;
    let yaEstadaInternado = false;
    
    if (internacion) {
      // ══════════════════════════════════════════════
      // ESCENARIO A: YA TIENE CAMA - Solo actualizar
      // ══════════════════════════════════════════════
      yaEstadaInternado = true;
      
      await internacion.update({
        es_prequirurgica: true,
        estado_operacion: 'Prequirurgico',
        evaluacion_medica_id: evaluacion_medica_id || internacion.evaluacion_medica_id
      }, { transaction });
      
      camaAsignada = internacion.cama;
      console.log(` Paciente ya internado. Cama actual: ${camaAsignada?.numero}`);
      
    } else {
      // ══════════════════════════════════════════════
      // ESCENARIO B: NO TIENE CAMA - Buscar y asignar
      // ══════════════════════════════════════════════
      
      // Obtener sector del médico
      const medico = await Medico.findByPk(medicoId, {
        include: [{ model: Sector, as: 'sector' }],
        transaction
      });
      
      if (!medico?.sector_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El médico no tiene sector asignado'
        });
      }
      
      const sectorId = medico.sector_id;
      const sexoPaciente = paciente.usuario.sexo;
      
      // Buscar cama libre en el sector del médico
      const camaLibre = await Cama.findOne({
        where: { estado: 'Libre' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorId },
          include: [{ model: Sector, as: 'sector' }]
        }],
        transaction
      });
      
      if (!camaLibre) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'No hay camas disponibles en su sector para pre-quirúrgico. Contacte al administrativo.',
          tipo: 'SIN_CAMAS'
        });
      }
      
      // Validar compatibilidad de sexo en habitaciones dobles
      if (camaLibre.habitacion.tipo === 'Doble') {
        const camaOcupada = await Cama.findOne({
          where: {
            habitacion_id: camaLibre.habitacion_id,
            estado: 'Ocupada',
            id: { [Op.ne]: camaLibre.id }
          },
          transaction
        });
        
        if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Incompatibilidad de sexo en habitación doble. Contacte al administrativo.`,
            tipo: 'INCOMPATIBILIDAD_SEXO'
          });
        }
      }
      
      // Crear lista de espera (requerida por internación)
      const listaEspera = await ListaEspera.create({
        paciente_id: pacienteId,
        tipo_turno_id: 1, // Ajustar según tu BD
        prioridad: prioridad,
        estado: 'ASIGNADO',
        habitacion_id: camaLibre.habitacion_id,
        creador_tipo: 'MEDICO',
        creador_id: usuarioId,
        fecha_registro: new Date(),
        observaciones: `Derivación a pre-quirúrgico por Dr. ${req.user.nombre}`
      }, { transaction });
      
      // Buscar tipo de internación pre-quirúrgica
      const tipoInternacion = await TipoInternacion.findOne({
        where: { 
          nombre: { [Op.like]: '%Pre%Quir%' }
        },
        transaction
      });
      
      // Crear internación pre-quirúrgica
      internacion = await Internacion.create({
        paciente_id: pacienteId,
        medico_id: medicoId,
        cama_id: camaLibre.id,
        habitacion_id: camaLibre.habitacion_id,
        tipo_internacion_id: tipoInternacion?.id || 1,
        administrativo_id: null, // Médico puede crear sin administrativo
        evaluacion_medica_id: evaluacion_medica_id || null,
        es_prequirurgica: true,
        estado_operacion: 'Prequirurgico',
        estado_estudios: 'Pendientes',
        estado_paciente: 'Sin_Evaluar',
        fecha_inicio: new Date(),
        obra_social_id: paciente.obra_social_id,
        lista_espera_id: listaEspera.id
      }, { transaction });
      
      // Marcar cama como ocupada
      await camaLibre.update({
        estado: 'Ocupada',
        sexo_ocupante: sexoPaciente
      }, { transaction });
      
      camaAsignada = camaLibre;
      console.log(`✅ Nueva internación pre-quirúrgica. Cama asignada: ${camaAsignada.numero}`);
    }
    
    // ========================================
    // 4. CREAR PROCEDIMIENTO PRE-QUIRÚRGICO
    // ========================================
    
    // Construir descripción completa
    let descripcionCompleta = descripcion || 'Preparación pre-quirúrgica estándar';
    
    if (observaciones_especiales) {
      descripcionCompleta += `\n\n=== OBSERVACIONES ESPECIALES DEL MÉDICO ===\n${observaciones_especiales}`;
    }
    
    if (checklist_requerido) {
      descripcionCompleta += `\n\n=== CHECKLIST REQUERIDO ===\n${checklist_requerido}`;
    }
    
    const prequirurgico = await ProcedimientoPreQuirurgico.create({
      evaluacion_medica_id: evaluacionMedicaId,  
      medico_id: medicoId,
      paciente_id: pacienteId,
      nombre: nombre || 'Preparación Pre-quirúrgica',
      descripcion: descripcionCompleta,
      estado: 'Pendiente',
      prioridad: prioridad,
      fecha_orden: new Date()
    }, { transaction });
    
    console.log(`✅ Procedimiento pre-quirúrgico creado: ${prequirurgico.id}`);
    
    // ========================================
    // 5. CREAR REGISTRO EN HISTORIAL MÉDICO
    // ========================================
    await HistorialMedico.create({
      paciente_id: pacienteId,
      descripcion: `Derivado a pre-quirúrgico. Prioridad: ${prioridad}. Cama: ${camaAsignada?.numero || 'N/A'}. ${observaciones_especiales || ''}`,
      tipo_evento: 'Derivacion',
      fecha: new Date()
    }, { transaction });
    
    // ========================================
    // 6. NOTIFICAR A ENFERMERÍA
    // ========================================
    const enfermeros = await Enfermero.findAll({
      where: { sector_id: camaAsignada?.habitacion?.sector_id || internacion.habitacion?.sector_id },
      include: [{ model: Usuario, as: 'usuario' }],
      transaction
    });
    
    const mensajeEnfermeria = 
      `🏥 **NUEVO PRE-QUIRÚRGICO**\n\n` +
      `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
      `DNI: ${paciente.usuario.dni}\n` +
      `Cama: ${camaAsignada?.numero || 'N/A'}\n` +
      `Prioridad: ${prioridad}\n` +
      `Médico: Dr. ${req.user.nombre}\n\n` +
      `Se requiere completar checklist pre-quirúrgico.`;
    
    for (const enfermero of enfermeros) {
      await Notificacion.create({
        usuario_id: enfermero.usuario_id,
        remitente_id: usuarioId,
        mensaje: mensajeEnfermeria,
        leida: false,
        tipo: 'PREQUIRURGICO'
      }, { transaction });
    }
    
    await transaction.commit();
    
    console.log(`✅ Paciente derivado a pre-quirúrgico exitosamente`);
    
    res.json({
      success: true,
      message: yaEstadaInternado 
        ? `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} derivado a pre-quirúrgico (ya estaba internado en cama ${camaAsignada?.numero}).`
        : `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} internado y derivado a pre-quirúrgico. Cama ${camaAsignada?.numero} asignada.`,
      data: {
        prequirurgico_id: prequirurgico.id,
        internacion_id: internacion.id,
        cama: camaAsignada?.numero || null,
        ya_estaba_internado: yaEstadaInternado
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al derivar a pre-quirúrgico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al derivar paciente a pre-quirúrgico',
      error: error.message
    });
  }
};






