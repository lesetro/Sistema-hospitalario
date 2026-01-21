const { 
  EstudioSolicitado,
  TipoEstudio,
  Paciente,
  Usuario,
  Medico,
  EvaluacionMedica,
  TurnoEstudio,
  ListaEspera,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderEstudiosSolicitados = async (req, res) => {
  try {
    console.log('🔍 renderEstudiosSolicitados - usuario_id:', req.user.usuario_id);
    
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
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando vista de estudios solicitados...');

    res.render('dashboard/medico/estudios-solicitados', {
      title: 'Estudios Solicitados',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER ESTUDIOS
// ========================================
exports.obtenerEstudios = async (req, res) => {
  try {
    console.log('📋 obtenerEstudios - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { 
      paciente_id, 
      tipoEstudio,
      estado,
      urgencia,
      fechaDesde,
      fechaHasta,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (paciente_id) {
      whereClause.paciente_id = paciente_id;
    }

    if (tipoEstudio && tipoEstudio !== 'TODOS') {
      whereClause.tipo_estudio_id = tipoEstudio;
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }

    if (urgencia && urgencia !== 'TODAS') {
      whereClause.urgencia = urgencia;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.created_at = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
    }

    const { count, rows: estudios } = await EstudioSolicitado.findAndCountAll({
      where: whereClause,
      include: [
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
          model: TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['id', 'nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          attributes: ['id', 'fecha'],
          required: true
        },
        {
          model: TurnoEstudio,
          as: 'turno_estudio',
          attributes: ['id', 'fecha', 'hora', 'estado', 'resultado'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: estudios,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estudios:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ESTUDIO POR ID
// ========================================
exports.obtenerEstudioPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerEstudioPorId - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const estudio = await EstudioSolicitado.findOne({
      where: { id: req.params.id },
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
          model: TipoEstudio,
          as: 'tipo_estudio'
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          include: [
            {
              model: require('../../models').Diagnostico,
              as: 'diagnostico',
              attributes: ['codigo', 'nombre']
            }
          ]
        },
        {
          model: TurnoEstudio,
          as: 'turno_estudio',
          include: [
            {
              model: ListaEspera,
              as: 'lista_espera',
              attributes: ['id', 'estado', 'prioridad']
            }
          ]
        }
      ]
    });

    if (!estudio) {
      return res.status(404).json({ 
        success: false,
        message: 'Estudio no encontrado' 
      });
    }

    res.json({
      success: true,
      data: estudio
    });
  } catch (error) {
    console.error('❌ Error al obtener estudio:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR ESTUDIO
// ========================================
exports.crearEstudio = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearEstudio - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const {
      evaluacion_medica_id,
      paciente_id,
      tipo_estudio_id,
      urgencia,
      observaciones
    } = req.body;

    const evaluacion = await EvaluacionMedica.findOne({
      where: {
        id: evaluacion_medica_id,
        medico_id: medico.id
      },
      transaction
    });

    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Evaluación médica no encontrada' 
      });
    }

    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    const tipoEstudio = await TipoEstudio.findByPk(tipo_estudio_id, { transaction });
    if (!tipoEstudio) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Tipo de estudio no encontrado' 
      });
    }

    const estudio = await EstudioSolicitado.create({
      evaluacion_medica_id,
      paciente_id,
      tipo_estudio_id,
      urgencia: urgencia || 'Normal',
      estado: 'Pendiente',
      observaciones
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estudio solicitado correctamente',
      data: estudio
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear estudio:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// ACTUALIZAR ESTUDIO
// ========================================
exports.actualizarEstudio = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 actualizarEstudio - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const estudio = await EstudioSolicitado.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id }
        }
      ],
      transaction
    });

    if (!estudio) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Estudio no encontrado' 
      });
    }

    if (estudio.estado !== 'Pendiente') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Solo se pueden actualizar estudios pendientes' 
      });
    }

    const { urgencia, observaciones } = req.body;

    await estudio.update({
      urgencia,
      observaciones
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estudio actualizado correctamente',
      data: estudio
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar estudio:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CANCELAR ESTUDIO
// ========================================
exports.cancelarEstudio = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('❌ cancelarEstudio - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const estudio = await EstudioSolicitado.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id }
        }
      ],
      transaction
    });

    if (!estudio) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Estudio no encontrado' 
      });
    }

    if (estudio.estado === 'Cancelado') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'El estudio ya está cancelado' 
      });
    }

    if (estudio.estado === 'Realizado') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'No se puede cancelar un estudio realizado' 
      });
    }

    await estudio.update({ estado: 'Cancelado' }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estudio cancelado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cancelar estudio:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER TIPOS DE ESTUDIO
// ========================================
exports.obtenerTiposEstudio = async (req, res) => {
  try {
    console.log('🔍 obtenerTiposEstudio');
    
    const { busqueda, categoria } = req.query;
    
    const whereClause = {};

    if (busqueda) {
      whereClause.nombre = { [Op.like]: `%${busqueda}%` };
    }

    if (categoria && categoria !== 'TODAS') {
      whereClause.categoria = categoria;
    }

    const tiposEstudio = await TipoEstudio.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Tipos de estudio encontrados:', tiposEstudio.length);

    res.json({
      success: true,
      data: tiposEstudio
    });
  } catch (error) {
    console.error('❌ Error al obtener tipos de estudio:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ESTADÍSTICAS
// ========================================
exports.obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 obtenerEstadisticas - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    console.log('🔍 Obteniendo estudios por estado...');
    const estudiosData = await EstudioSolicitado.findAll({
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          attributes: []
        }
      ],
      attributes: ['estado'],
      raw: true
    });

    const result = {
      Pendiente: 0,
      Realizado: 0,
      Cancelado: 0
    };

    estudiosData.forEach(estudio => {
      if (result.hasOwnProperty(estudio.estado)) {
        result[estudio.estado]++;
      }
    });

    console.log('🔍 Obteniendo estudios por urgencia...');
    const urgenciaData = await EstudioSolicitado.findAll({
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          attributes: []
        }
      ],
      attributes: ['urgencia'],
      raw: true
    });

    const urgenciaResult = {
      Normal: 0,
      Alta: 0
    };

    urgenciaData.forEach(estudio => {
      if (urgenciaResult.hasOwnProperty(estudio.urgencia)) {
        urgenciaResult[estudio.urgencia]++;
      }
    });

    const totalEstudios = Object.values(result).reduce((a, b) => a + b, 0);

    console.log('🔍 Contando estudios del mes...');
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const estudiosMes = await EstudioSolicitado.count({
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          attributes: []
        }
      ],
      where: {
        created_at: { [Op.gte]: inicioMes }
      }
    });

    const finalResult = {
      ...result,
      totalEstudios,
      estudiosMes,
      porUrgencia: urgenciaResult
    };

    console.log('✅ Estadísticas calculadas:', finalResult);

    res.json({
      success: true,
      data: finalResult
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ESTUDIOS POR CATEGORÍA
// ========================================
// ✅ CORREGIDO - SIN sequelize.query()
exports.obtenerEstudiosPorCategoria = async (req, res) => {
  try {
    console.log('📊 obtenerEstudiosPorCategoria - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    console.log('🔍 Obteniendo estudios por categoría...');
    // ✅ SIN GROUP BY - traer todo
    const estudios = await EstudioSolicitado.findAll({
      include: [
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['categoria']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          attributes: []
        }
      ],
      attributes: ['id'],
      raw: true
    });

    console.log('✅ Estudios obtenidos:', estudios.length);

    // ✅ CONTAR EN JAVASCRIPT
    const categoriaMap = new Map();
    estudios.forEach(estudio => {
      const categoria = estudio['tipo_estudio.categoria'];
      if (!categoriaMap.has(categoria)) {
        categoriaMap.set(categoria, 0);
      }
      categoriaMap.set(categoria, categoriaMap.get(categoria) + 1);
    });

    const distribucion = Array.from(categoriaMap.entries()).map(([categoria, total]) => ({
      categoria,
      total
    }));

    console.log('✅ Distribución procesada:', distribucion);

    res.json({
      success: true,
      data: distribucion
    });
  } catch (error) {
    console.error('❌ Error al obtener distribución:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};