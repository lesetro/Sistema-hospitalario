const { 
  EvaluacionMedica,
  Paciente,
  Usuario,
  Medico,
  Diagnostico,
  TipoDiagnostico,
  Tratamiento,
  EstudioSolicitado,
  TipoEstudio,
  Turno,
  ProcedimientoEnfermeria,
  ProcedimientoPreQuirurgico,
  RecetaCertificado,
  Sector,
  ControlEnfermeria,
  EvaluacionEnfermeria,  
  Enfermero,
  HistorialMedico
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA DE EVALUACIONES
// ========================================
exports.renderEvaluaciones = async (req, res, next) => {
  try {
    console.log('🔍 renderEvaluaciones - usuario_id:', req.user.usuario_id);
    
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
      console.error('❌ Usuario o Médico no encontrado');
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando vista de evaluaciones...');

    res.render('dashboard/medico/evaluaciones', {
      title: 'Evaluaciones Médicas',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar evaluaciones:', error);
    next(error);
  }
};
// VER DETALLE DE EVALUACIÓN MÉDICA
exports.verDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const evaluacion = await EvaluacionMedica.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Diagnostico,
          as: 'diagnostico',
          required: false
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          required: false
        },
        {
          model: ProcedimientoEnfermeria,
          as: 'procedimientos_enfermeria',
          required: false
        },
        {
          model: ProcedimientoPreQuirurgico,
          as: 'procedimientos_pre_quirurgicos',
          required: false
        },
        {
          model: RecetaCertificado,
          as: 'recetas_certificados',
          required: false
        },
        {
          model: ControlEnfermeria,
          as: 'controles_enfermeria',
          required: false
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',
          required: false,
          include: [
            {
              model: Enfermero,
              as: 'enfermero',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }]
            }
          ]
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación médica no encontrada',
        user: req.user
      });
    }

    //  Buscar TODOS los controles del paciente (los de asociación + los creados desde pacientes)
    const controlesDelPaciente = await ControlEnfermeria.findAll({
      where: { paciente_id: evaluacion.paciente_id },
      order: [['createdAt', 'DESC']]
    });

    // los que vinieron por asociación + los que vinieron por paciente_id (sin duplicar)
    const idsYaIncluidos = (evaluacion.controles_enfermeria || []).map(c => c.id);
    const controlesFaltantes = controlesDelPaciente.filter(c => !idsYaIncluidos.includes(c.id));
    
    const todosLosControles = [
      ...(evaluacion.controles_enfermeria || []),
      ...controlesFaltantes
    ];

    let edadPaciente = null;
    if (evaluacion.paciente?.usuario?.fecha_nacimiento) {
      const fechaNac = new Date(evaluacion.paciente.usuario.fecha_nacimiento);
      const hoy = new Date();
      edadPaciente = Math.floor((hoy - fechaNac) / (1000 * 60 * 60 * 24 * 365));
    }

    console.log(' Evaluación cargada:', {
      id: evaluacion.id,
      controlesPorAsociacion: evaluacion.controles_enfermeria?.length || 0,
      controlesPorPaciente: controlesDelPaciente.length,
      totalControles: todosLosControles.length
    });

    //  Sobreescribir los controles en la evaluación antes de renderizar
    evaluacion.dataValues.controles_enfermeria = todosLosControles;

    res.render('dashboard/medico/evaluaciones-medicas-detalle', {
      title: 'Detalle de Evaluación Médica',
      user: req.user,
      evaluacion,
      edadPaciente
    });

  } catch (error) {
    console.error('Error al ver detalle de evaluación médica:', error);
    next(error);
  }
};
// ========================================
// OBTENER EVALUACIONES MÉDICAS
// ========================================
exports.obtenerEvaluaciones = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    if (medico.sector?.nombre !== 'Emergencias') {
      return res.status(403).json({ success: false, message: 'Acceso solo para Emergencias' });
    }

    const { 
      paciente_id, 
      fechaDesde, 
      fechaHasta, 
      diagnostico,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { medico_id: medico.id };

    if (paciente_id) whereClause.paciente_id = paciente_id;
    if (fechaDesde && fechaHasta) {
      whereClause.fecha = { [Op.between]: [fechaDesde, fechaHasta] };
    } else if (fechaDesde) {
      whereClause.fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha = { [Op.lte]: fechaHasta };
    }

    const { count, rows: evaluaciones } = await EvaluacionMedica.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Paciente, 
          as: 'paciente', 
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'dni'] }] 
        },
        { model: Diagnostico, as: 'diagnostico', attributes: ['id', 'codigo', 'nombre'] },
        { model: Tratamiento, as: 'tratamiento', attributes: ['id', 'nombre'] },
        { model: Turno, as: 'turnos', attributes: ['id', 'fecha', 'hora_inicio'] }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: evaluaciones,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    next(error);
  }
};

// ========================================
// OBTENER EVALUACIÓN POR ID
// ========================================
exports.obtenerEvaluacionPorId = async (req, res, next) => {
  try {
    console.log('🔍 obtenerEvaluacionPorId - usuario_id:', req.user.usuario_id);
    
    // Usar usuario_id
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

    const evaluacion = await EvaluacionMedica.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: { exclude: ['password'] }
            },
            {
              model: require('../../models').ObraSocial,
              as: 'obraSocial',
              attributes: ['id', 'nombre']
            }
          ]
        },
        {
          model: Diagnostico,
          as: 'diagnostico',
          include: [
            {
              model: TipoDiagnostico,
              as: 'tipoDiagnostico',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: Tratamiento,
          as: 'tratamiento'
        },
        {
          model: EstudioSolicitado,
          as: 'estudio_solicitado',
          include: [
            {
              model: TipoEstudio,
              as: 'tipo_estudio',
              attributes: ['nombre', 'categoria']
            }
          ]
        },
        {
          model: ProcedimientoEnfermeria,
          as: 'procedimientos_enfermeria'
        },
        {
          model: ProcedimientoPreQuirurgico,
          as: 'procedimientos_pre_quirurgicos'
        },
        {
          model: RecetaCertificado,
          as: 'recetas_certificados'
        }
      ]
    });

    if (!evaluacion) {
      console.error('❌ Evaluación no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Evaluación no encontrada' 
      });
    }

    console.log('✅ Evaluación encontrada:', evaluacion.id);

    res.json({
      success: true,
      data: evaluacion
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluación:', error.message);
    next(error);
  }
};

// ========================================
// CREAR NUEVA EVALUACIÓN MÉDICA
// ========================================
exports.crearEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('✅ crearEvaluacion - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const {
      paciente_id,
      turno_id,
      diagnostico_id,
      observaciones_diagnostico,
      tratamiento_id
    } = req.body;

    // Validar que el paciente existe
    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      console.error('❌ Paciente no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    // Si hay turno, validar que esté completado
    if (turno_id) {
      const turno = await Turno.findByPk(turno_id, { transaction });
      if (!turno) {
        await transaction.rollback();
        console.error('❌ Turno no encontrado');
        return res.status(404).json({ 
          success: false,
          message: 'Turno no encontrado' 
        });
      }
      if (turno.estado !== 'COMPLETADO') {
        await transaction.rollback();
        console.error('❌ Turno no está completado');
        return res.status(400).json({ 
          success: false,
          message: 'El turno debe estar completado para crear la evaluación' 
        });
      }
    }

    const evaluacion = await EvaluacionMedica.create({
      paciente_id,
      medico_id: medico.id,
      turno_id,
      diagnostico_id,
      observaciones_diagnostico,
      tratamiento_id,
      fecha: new Date()
    }, { transaction });

    console.log('✅ Evaluación creada:', evaluacion.id);

    // Crear historial médico
    await HistorialMedico.create({
      paciente_id,
      descripcion: `Evaluación médica realizada. ${observaciones_diagnostico || ''}`,
      tipo_evento: 'Consulta',
      fecha: new Date()
    }, { transaction });

    console.log('✅ Historial médico creado');

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación creada correctamente',
      data: evaluacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear evaluación:', error.message);
    next(error);
  }
};

// ========================================
// ACTUALIZAR EVALUACIÓN MÉDICA
// ========================================
exports.actualizarEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('🔄 actualizarEvaluacion - usuario_id:', req.user.usuario_id);
    
    //  Usar usuario_id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const evaluacion = await EvaluacionMedica.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!evaluacion) {
      await transaction.rollback();
      console.error('❌ Evaluación no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Evaluación no encontrada' 
      });
    }

    const {
      diagnostico_id,
      observaciones_diagnostico,
      tratamiento_id
    } = req.body;

    await evaluacion.update({
      diagnostico_id,
      observaciones_diagnostico,
      tratamiento_id
    }, { transaction });

    console.log('✅ Evaluación actualizada');

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación actualizada correctamente',
      data: evaluacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar evaluación:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER DIAGNÓSTICOS
// ========================================
exports.obtenerDiagnosticos = async (req, res, next) => {
  try {
    console.log('🔍 obtenerDiagnosticos');
    
    const { busqueda } = req.query;
    
    const whereClause = busqueda ? {
      [Op.or]: [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { codigo: { [Op.like]: `%${busqueda}%` } }
      ]
    } : {};

    const diagnosticos = await Diagnostico.findAll({
      where: whereClause,
      include: [
        {
          model: TipoDiagnostico,
          as: 'tipoDiagnostico',
          attributes: ['nombre']
        }
      ],
      limit: 20,
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Diagnósticos encontrados:', diagnosticos.length);

    res.json({
      success: true,
      data: diagnosticos
    });
  } catch (error) {
    console.error('❌ Error al obtener diagnósticos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER TRATAMIENTOS
// ========================================
exports.obtenerTratamientos = async (req, res, next) => {
  try {
    console.log('🔍 obtenerTratamientos');
    
    const { busqueda } = req.query;
    
    const whereClause = busqueda ? {
      nombre: { [Op.like]: `%${busqueda}%` }
    } : {};

    const tratamientos = await Tratamiento.findAll({
      where: whereClause,
      limit: 20,
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Tratamientos encontrados:', tratamientos.length);

    res.json({
      success: true,
      data: tratamientos
    });
  } catch (error) {
    console.error('❌ Error al obtener tratamientos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER PACIENTES PARA FILTRO
// ========================================
exports.obtenerPacientesParaFiltro = async (req, res, next) => {
  try {
    const { busqueda } = req.query;

    // Si no hay búsqueda o es muy corta → devolver vacío
    if (!busqueda || busqueda.trim().length < 3) {
      return res.json({
        success: true,
        data: []
      });
    }

    const trimmedBusqueda = busqueda.trim();

    const pacientes = await Paciente.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        where: {
          [Op.or]: [
            { nombre:   { [Op.like]: `%${trimmedBusqueda}%` } },
            { apellido: { [Op.like]: `%${trimmedBusqueda}%` } },
            { dni:      { [Op.like]: `%${trimmedBusqueda}%` } }
          ]
        },
        attributes: ['id', 'nombre', 'apellido', 'dni']
      }],
      limit: 20,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes para filtro:', error.message);
    next(error);
  }
};
// Solicitar control de enfermería
exports.solicitarControlEnfermeria = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const evaluacion_medica_id = req.body.evaluacion_medica_id || req.params.id;

    const evaluacionMedica = await EvaluacionMedica.findByPk(evaluacion_medica_id, {
      transaction
    });

    if (!evaluacionMedica) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación médica no encontrada'
      });
    }

    // Verificar duplicados
    const controlExistente = await ControlEnfermeria.findOne({
      where: {
        evaluacion_medica_id,
        estado: { [Op.in]: ['SOLICITADO', 'PENDIENTE', 'COMPLETADO'] }
      },
      transaction
    });

    if (controlExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya existe un control solicitado para esta evaluación'
      });
    }

    // Buscar evaluación de enfermería (opcional)
    const evaluacionEnfermeria = await EvaluacionEnfermeria.findOne({
      where: { evaluacion_medica_id },
      order: [['created_at', 'DESC']],
      transaction
    });

    //  INCLUIR paciente_id desde la evaluación médica
    await ControlEnfermeria.create({
      paciente_id: evaluacionMedica.paciente_id,           
      evaluacion_enfermeria_id: evaluacionEnfermeria ? evaluacionEnfermeria.id : null,
      evaluacion_medica_id: parseInt(evaluacion_medica_id),
      estado: 'SOLICITADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Control de enfermería solicitado correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al solicitar control:', error);
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS DE EVALUACIONES
// ========================================

exports.obtenerEstadisticas = async (req, res, next) => {
  try {
    console.log('📊 obtenerEstadisticas - usuario_id:', req.user.usuario_id);
    
    
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

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    console.log('🔍 Contando evaluaciones totales...');
    const totalEvaluaciones = await EvaluacionMedica.count({
      where: { medico_id: medico.id }
    });

    console.log('🔍 Contando evaluaciones del mes...');
    const evaluacionesMes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Contando evaluaciones de la semana...');
    const evaluacionesSemana = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioSemana }
      }
    });

    console.log('🔍 Contando evaluaciones de hoy...');
    const evaluacionesHoy = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioHoy }
      }
    });

    const result = {
      totalEvaluaciones,
      evaluacionesMes,
      evaluacionesSemana,
      evaluacionesHoy
    };

    console.log('✅ Estadísticas calculadas:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    next(error);
  }
};