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
  ControlEnfermeria,
  MotivoConsulta
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
            { model: require('../../models').Especialidad, as: 'especialidad' }
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
    console.log('👥 obtenerPacientes - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    console.log('✅ Médico encontrado:', medico.id);

    const { busqueda, estado, obraSocial, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereUsuario = {};
    const wherePaciente = {};

    if (busqueda) {
      whereUsuario[Op.or] = [
        { nombre:   { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni:      { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (estado && estado !== 'TODOS') {
      wherePaciente.estado = estado;
    }

    if (obraSocial && obraSocial !== 'TODAS') {
      wherePaciente.obra_social_id = obraSocial;
    }

    // ✅ Las 3 fuentes: evaluaciones, internaciones, urgencias
    console.log('🔍 Buscando pacientes del médico...');
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

    const todosLosIds = [
      ...porEvaluacion.map(e => e.paciente_id),
      ...porInternacion.map(i => i.paciente_id),
      ...porUrgencia.map(u => u.paciente_id)
    ];

    const pacientesIds = [...new Set(todosLosIds)];
    console.log('✅ Pacientes encontrados:', pacientesIds.length);

    if (pacientesIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), totalPages: 0 }
      });
    }

    wherePaciente.id = { [Op.in]: pacientesIds };

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: wherePaciente,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: Object.keys(whereUsuario).length > 0 ? whereUsuario : undefined,
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

    console.log('✅ Total de pacientes encontrados:', count);

    const pacientesConInfo = await Promise.all(pacientes.map(async (paciente) => {
      const ultimaEvaluacion = await EvaluacionMedica.findOne({
        where: { paciente_id: paciente.id, medico_id: medico.id },
        order: [['fecha', 'DESC']],
        attributes: ['fecha', 'observaciones_diagnostico']
      });

      const totalEvaluaciones = await EvaluacionMedica.count({
        where: { paciente_id: paciente.id, medico_id: medico.id }
      });

      const internacionActiva = await Internacion.findOne({
        where: { paciente_id: paciente.id, medico_id: medico.id, fecha_alta: null }
      });

      return {
        ...paciente.toJSON(),
        ultimaEvaluacion,
        totalEvaluaciones,
        internacionActiva: !!internacionActiva
      };
    }));
    console.log('Paciente ejemplo:', JSON.stringify(pacientes[0], null, 2));
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
          { model: require('../../models').Cama, as: 'cama', include: [{ model: require('../../models').Habitacion, as: 'habitacion', attributes: ['numero', 'tipo'] }] },
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
          model: require('../../models').MotivoConsulta,
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
          model: require('../../models').Tratamiento,
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