const { 
  Diagnostico,
  TipoDiagnostico,
  EvaluacionMedica,
  Paciente,
  Usuario,
  Medico
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA DE DIAGNÓSTICOS
// ========================================
exports.renderDiagnosticos = async (req, res, next) => {
  try {
    console.log('🔍 renderDiagnosticos - usuario_id:', req.user.usuario_id);
    
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [{ model: require('../../models').Especialidad, as: 'especialidad' }]
        }
      ]
    });

    if (!usuario || !usuario.medico) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando vista de diagnósticos...');

    res.render('dashboard/medico/diagnosticos', {
      title: 'Diagnósticos',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar diagnósticos:', error);
    next(error);
  }
};

// ========================================
// BUSCAR DIAGNÓSTICOS
// ========================================
exports.buscarDiagnosticos = async (req, res, next) => {
  try {
    console.log('🔍 buscarDiagnosticos');
    
    const { busqueda } = req.query;
    const whereClause = {};

    if (busqueda) {
      whereClause[Op.or] = [
        { codigo: { [Op.like]: `%${busqueda}%` } },
        { nombre: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const diagnosticos = await Diagnostico.findAll({
      where: whereClause,
      include: [
        { model: TipoDiagnostico, as: 'tipoDiagnostico' }
      ],
      limit: 10,
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Diagnósticos encontrados:', diagnosticos.length);

    res.json({
      success: true,
      data: diagnosticos
    });
  } catch (error) {
    console.error('❌ Error al buscar diagnósticos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER DIAGNÓSTICOS MÁS UTILIZADOS
// ========================================
exports.obtenerDiagnosticosMasUtilizados = async (req, res, next) => {
  try {
    console.log('📊 obtenerDiagnosticosMasUtilizados - usuario_id:', req.user.usuario_id);
    
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

    const { limite = 10 } = req.query;

    //  SIN GROUP BY - Traer todos los registros
    console.log('🔍 Obteniendo evaluaciones con diagnósticos...');
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { 
        medico_id: medico.id,
        diagnostico_id: { [Op.ne]: null }
      },
      include: [
        { 
          model: Diagnostico, 
          as: 'diagnostico',
          include: [{ model: TipoDiagnostico, as: 'tipoDiagnostico' }]
        }
      ],
      attributes: ['diagnostico_id'],
      raw: false
    });

    console.log('✅ Evaluaciones obtenidas:', evaluaciones.length);

    // ✅ CONTAR EN JAVASCRIPT
    const diagnosticosMap = new Map();
    evaluaciones.forEach(ev => {
      if (!diagnosticosMap.has(ev.diagnostico_id)) {
        diagnosticosMap.set(ev.diagnostico_id, {
          diagnostico: ev.diagnostico,
          total_usos: 0
        });
      }
      diagnosticosMap.get(ev.diagnostico_id).total_usos++;
    });

    // ✅ ORDENAR Y LIMITAR
    const resultado = Array.from(diagnosticosMap.values())
      .sort((a, b) => b.total_usos - a.total_usos)
      .slice(0, parseInt(limite));

    console.log('✅ Diagnósticos más utilizados procesados:', resultado.length);

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Error al obtener diagnósticos más utilizados:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER DIAGNÓSTICOS RECIENTES
// ========================================
exports.obtenerDiagnosticosRecientes = async (req, res, next) => {
  try {
    console.log('📅 obtenerDiagnosticosRecientes - usuario_id:', req.user.usuario_id);
    
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

    const { limite = 10 } = req.query;

    const evaluaciones = await EvaluacionMedica.findAll({
      where: { 
        medico_id: medico.id,
        diagnostico_id: { [Op.ne]: null }
      },
      include: [
        { 
          model: Diagnostico, 
          as: 'diagnostico',
          include: [{ model: TipoDiagnostico, as: 'tipoDiagnostico' }]
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limite)
    });

    console.log('✅ Diagnósticos recientes obtenidos:', evaluaciones.length);

    res.json({
      success: true,
      data: evaluaciones.map(ev => ({
        diagnostico: ev.diagnostico,
        paciente: ev.paciente,
        fecha: ev.fecha
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener diagnósticos recientes:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER DIAGNÓSTICO POR ID
// ========================================
exports.obtenerDiagnosticoPorId = async (req, res, next) => {
  try {
    console.log('🔍 obtenerDiagnosticoPorId - usuario_id:', req.user.usuario_id);
    
    const diagnostico = await Diagnostico.findOne({
      where: { id: req.params.id },
      include: [
        { model: TipoDiagnostico, as: 'tipoDiagnostico' }
      ]
    });

    if (!diagnostico) {
      console.error('❌ Diagnóstico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Diagnóstico no encontrado' 
      });
    }

    // ✅ Obtener estadísticas del diagnóstico
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    const usosPorMedico = await EvaluacionMedica.count({
      where: {
        diagnostico_id: req.params.id,
        medico_id: medico.id
      }
    });

    const pacientesConDiagnostico = await EvaluacionMedica.findAll({
      where: { diagnostico_id: req.params.id },
      attributes: ['paciente_id'],
      raw: true,
      group: 'paciente_id'
    });

    console.log('✅ Diagnóstico encontrado:', diagnostico.id);

    res.json({
      success: true,
      data: {
        diagnostico: diagnostico,
        estadisticas: {
          usosPorMedico: usosPorMedico,
          pacientesConDiagnostico: pacientesConDiagnostico.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener diagnóstico:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER PACIENTES CON DIAGNÓSTICO
// ========================================
exports.obtenerPacientesConDiagnostico = async (req, res, next) => {
  try {
    console.log('👥 obtenerPacientesConDiagnostico');
    
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { diagnostico_id: req.params.id },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni'] }]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // ✅ Agrupar por paciente
    const pacientesMap = new Map();
    evaluaciones.forEach(ev => {
      if (!pacientesMap.has(ev.paciente_id)) {
        pacientesMap.set(ev.paciente_id, {
          paciente: ev.paciente,
          totalEvaluaciones: 0,
          ultimaEvaluacion: ev.fecha
        });
      }
      const item = pacientesMap.get(ev.paciente_id);
      item.totalEvaluaciones++;
      if (new Date(ev.fecha) > new Date(item.ultimaEvaluacion)) {
        item.ultimaEvaluacion = ev.fecha;
      }
    });

    const resultado = Array.from(pacientesMap.values());

    console.log('✅ Pacientes con diagnóstico encontrados:', resultado.length);

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER DIAGNÓSTICOS (CON FILTROS Y PAGINACIÓN)
// ========================================
exports.obtenerDiagnosticos = async (req, res, next) => {
  try {
    console.log('📋 obtenerDiagnosticos');
    
    const { busqueda, tipoDiagnostico, page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (busqueda) {
      whereClause[Op.or] = [
        { codigo: { [Op.like]: `%${busqueda}%` } },
        { nombre: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (tipoDiagnostico && tipoDiagnostico !== 'TODOS') {
      whereClause.tipo_diagnostico_id = tipoDiagnostico;
    }

    const { count, rows: diagnosticos } = await Diagnostico.findAndCountAll({
      where: whereClause,
      include: [
        { model: TipoDiagnostico, as: 'tipoDiagnostico' }
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Diagnósticos encontrados:', count);

    res.json({
      success: true,
      data: diagnosticos,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener diagnósticos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER TIPOS DE DIAGNÓSTICO
// ========================================
exports.obtenerTiposDiagnostico = async (req, res, next) => {
  try {
    console.log('🔍 obtenerTiposDiagnostico');
    
    const tipos = await TipoDiagnostico.findAll({
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Tipos encontrados:', tipos.length);

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ Error al obtener tipos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS DE DIAGNÓSTICOS
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

    console.log('🔍 Contando diagnósticos únicos utilizados...');
    // Diagnósticos únicos utilizados
    const diagnosticosUtilizados = await EvaluacionMedica.findAll({
      where: { 
        medico_id: medico.id,
        diagnostico_id: { [Op.ne]: null }
      },
      attributes: ['diagnostico_id'],
      raw: true,
      group: 'diagnostico_id'
    });

    console.log('✅ Diagnósticos utilizados:', diagnosticosUtilizados.length);

    console.log('🔍 Contando evaluaciones con diagnóstico...');
    // Evaluaciones con diagnóstico
    const evaluacionesConDiagnostico = await EvaluacionMedica.count({
      where: { 
        medico_id: medico.id,
        diagnostico_id: { [Op.ne]: null }
      }
    });

    console.log('✅ Evaluaciones con diagnóstico:', evaluacionesConDiagnostico);

    console.log('🔍 Contando evaluaciones sin diagnóstico...');
    // Evaluaciones sin diagnóstico
    const evaluacionesSinDiagnostico = await EvaluacionMedica.count({
      where: { 
        medico_id: medico.id,
        diagnostico_id: { [Op.eq]: null }
      }
    });

    console.log('✅ Evaluaciones sin diagnóstico:', evaluacionesSinDiagnostico);

    console.log('🔍 Contando diagnósticos del mes...');
    // Diagnósticos este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const diagnosticosMes = await EvaluacionMedica.findAll({
      where: {
        medico_id: medico.id,
        diagnostico_id: { [Op.ne]: null },
        fecha: { [Op.gte]: inicioMes }
      },
      attributes: ['diagnostico_id'],
      raw: true,
      group: 'diagnostico_id'
    });

    console.log('✅ Diagnósticos este mes:', diagnosticosMes.length);

    const finalResult = {
      diagnosticosUtilizados: diagnosticosUtilizados.length,
      evaluacionesConDiagnostico: evaluacionesConDiagnostico,
      evaluacionesSinDiagnostico: evaluacionesSinDiagnostico,
      diagnosticosMes: diagnosticosMes.length
    };

    console.log('✅ Estadísticas calculadas:', finalResult);

    res.json({
      success: true,
      data: finalResult
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    next(error);
  }
};