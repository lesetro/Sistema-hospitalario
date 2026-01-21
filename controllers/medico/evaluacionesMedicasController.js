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
  HistorialMedico,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA DE EVALUACIONES
// ========================================
exports.renderEvaluaciones = async (req, res) => {
  try {
    console.log('🔍 renderEvaluaciones - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER EVALUACIONES MÉDICAS
// ========================================
exports.obtenerEvaluaciones = async (req, res) => {
  try {
    console.log('📋 obtenerEvaluaciones - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    console.log('✅ Médico encontrado:', medico.id);

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

    if (paciente_id) {
      whereClause.paciente_id = paciente_id;
      console.log('🔍 Filtrando por paciente:', paciente_id);
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fecha = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
      console.log('🔍 Filtrando por rango de fechas');
    } else if (fechaDesde) {
      whereClause.fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha = { [Op.lte]: fechaHasta };
    }

    const includeClause = [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'dni']
          }
        ]
      },
      {
        model: Diagnostico,
        as: 'diagnostico',
        attributes: ['id', 'codigo', 'nombre'],
        where: diagnostico ? {
          [Op.or]: [
            { nombre: { [Op.like]: `%${diagnostico}%` } },
            { codigo: { [Op.like]: `%${diagnostico}%` } }
          ]
        } : undefined,
        required: !!diagnostico
      },
      {
        model: Tratamiento,
        as: 'tratamiento',
        attributes: ['id', 'nombre', 'descripcion'],
        required: false
      },
      {
        model: Turno,
        as: 'turnos',
        attributes: ['id', 'fecha', 'hora_inicio'],
        required: false
      }
    ];

    console.log('🔍 Buscando evaluaciones...');
    const { count, rows: evaluaciones } = await EvaluacionMedica.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Evaluaciones encontradas:', count);

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
    console.error('❌ Error al obtener evaluaciones:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER EVALUACIÓN POR ID
// ========================================
exports.obtenerEvaluacionPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerEvaluacionPorId - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR NUEVA EVALUACIÓN MÉDICA
// ========================================
exports.crearEvaluacion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearEvaluacion - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// ACTUALIZAR EVALUACIÓN MÉDICA
// ========================================
exports.actualizarEvaluacion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 actualizarEvaluacion - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER DIAGNÓSTICOS
// ========================================
exports.obtenerDiagnosticos = async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER TRATAMIENTOS
// ========================================
exports.obtenerTratamientos = async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER PACIENTES PARA FILTRO
// ========================================
exports.obtenerPacientesParaFiltro = async (req, res) => {
  try {
    console.log('🔍 obtenerPacientesParaFiltro - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    const { busqueda } = req.query;

    // Obtener pacientes únicos del médico
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { medico_id: medico.id },
      attributes: ['paciente_id'],
      raw: true
    });

    const pacientesIds = [...new Set(evaluaciones.map(e => e.paciente_id))];

    if (pacientesIds.length === 0) {
      console.log('⚠️ Sin pacientes encontrados');
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    const whereClause = { id: { [Op.in]: pacientesIds } };

    const includeClause = {
      model: Usuario,
      as: 'usuario',
      attributes: ['id', 'nombre', 'apellido', 'dni'],
      where: busqueda ? {
        [Op.or]: [
          { nombre: { [Op.like]: `%${busqueda}%` } },
          { apellido: { [Op.like]: `%${busqueda}%` } },
          { dni: { [Op.like]: `%${busqueda}%` } }
        ]
      } : undefined
    };

    const pacientes = await Paciente.findAll({
      where: whereClause,
      include: [includeClause],
      limit: 20,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    console.log('✅ Pacientes encontrados:', pacientes.length);

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ESTADÍSTICAS DE EVALUACIONES
// ========================================
// ✅ VERSIÓN CORREGIDA - SIN sequelize.fn()
exports.obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 obtenerEstadisticas - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};