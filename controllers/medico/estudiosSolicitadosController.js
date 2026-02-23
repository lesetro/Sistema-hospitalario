const { 
  EstudioSolicitado,
  TipoEstudio,
  Paciente,
  Usuario,
  Medico,
  EvaluacionMedica,
  TurnoEstudio,
  ListaEspera,
  Especialidad,
  ObraSocial,
  Diagnostico
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderEstudiosSolicitados = async (req, res, next) => {
  try {
    console.log('🔍 renderEstudiosSolicitados - usuario_id:', req.user.usuario_id);
    
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
    next(error);
  }
};

// ========================================
// OBTENER ESTUDIOS
// ========================================
exports.obtenerEstudios = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({ where: { usuario_id: req.user.usuario_id } });
    if (!medico) return res.status(404).json({ success: false, message: 'Médico no encontrado' });

    const { paciente_id, tipoEstudio, estado, urgencia, fechaDesde, fechaHasta, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { medico_id: medico.id }; 

    if (paciente_id) whereClause.paciente_id = paciente_id;
    if (tipoEstudio && tipoEstudio !== 'TODOS') whereClause.tipo_estudio_id = tipoEstudio;
    if (estado && estado !== 'TODOS') whereClause.estado = estado;
    if (urgencia && urgencia !== 'TODAS') whereClause.urgencia = urgencia;
    if (fechaDesde && fechaHasta) whereClause.created_at = { [Op.between]: [fechaDesde, fechaHasta] };

    const { count, rows: estudios } = await EstudioSolicitado.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Paciente, as: 'paciente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'dni'] }]
        },
        { model: TipoEstudio, as: 'tipo_estudio', attributes: ['id', 'nombre', 'categoria', 'requiere_ayuno'] },
        { model: EvaluacionMedica, as: 'evaluacion_medica', attributes: ['id', 'fecha'], required: false }, 
        { model: TurnoEstudio, as: 'turno_estudio', attributes: ['id', 'fecha', 'hora', 'estado', 'resultado'], required: false }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data: estudios, pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('❌ Error al obtener estudios:', error.message);
    next(error);
  }
};
// ========================================
// OBTENER ESTUDIO POR ID
// ========================================
exports.obtenerEstudioPorId = async (req, res, next) => {
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
      where: { id: req.params.id, medico_id: medico.id },
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
              model: ObraSocial,
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
          required: false,
          include: [
            {
              model: Diagnostico,
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
    next(error);
  }
};

// ========================================
// BUSCAR PACIENTES (POR DNI O NOMBRE)
// ========================================
exports.buscarPacientes = async (req, res, next) => {
  try {
    console.log('🔍 buscarPacientes - usuario_id:', req.user.usuario_id);
    
    const { busqueda } = req.query;
    
    if (!busqueda || busqueda.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Ingrese al menos 2 caracteres para buscar'
      });
    }

    // Buscar pacientes por DNI o nombre
    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'dni'],
          where: {
            [Op.or]: [
              { dni: { [Op.like]: `%${busqueda}%` } },
              { nombre: { [Op.like]: `%${busqueda}%` } },
              { apellido: { [Op.like]: `%${busqueda}%` } }
            ]
          }
        }
      ],
      limit: 10
    });

    const resultado = pacientes.map(p => ({
      id: p.id,
      nombre: p.usuario?.nombre || 'N/A',
      apellido: p.usuario?.apellido || '',
      dni: p.usuario?.dni || 'N/A'
    }));

    console.log('✅ Pacientes encontrados:', resultado.length);

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Error al buscar pacientes:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER EVALUACIONES DE UN PACIENTE (del médico actual)
// ========================================
exports.obtenerEvaluacionesPaciente = async (req, res, next) => {
  try {
    const { pacienteId } = req.params;
    console.log('🔍 obtenerEvaluacionesPaciente - paciente:', pacienteId);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    // Obtener evaluaciones del médico para este paciente
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { 
        medico_id: medico.id,
        paciente_id: pacienteId
      },
      order: [['fecha', 'DESC']],
      limit: 20
    });

    // También obtener info del paciente
    const paciente = await Paciente.findByPk(pacienteId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }
      ]
    });

    console.log('✅ Evaluaciones encontradas:', evaluaciones.length);

    res.json({
      success: true,
      data: {
        paciente: paciente ? {
          id: paciente.id,
          nombre: paciente.usuario?.nombre,
          apellido: paciente.usuario?.apellido,
          dni: paciente.usuario?.dni
        } : null,
        evaluaciones: evaluaciones.map(e => ({
          id: e.id,
          fecha: e.fecha,
          motivo: e.motivo_consulta || 'Sin motivo especificado'
        })),
        tieneEvaluaciones: evaluaciones.length > 0
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    next(error);
  }
};
// ========================================
// CREAR ESTUDIO
// ========================================
// Solo para médicos (estricto)
exports.crearEstudio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    if (req.user.rol !== 'MEDICO' && req.user.rol_id !== 2) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Solo médicos pueden solicitar estudios' });
    }

    const medico = await Medico.findOne({ where: { usuario_id: req.user.usuario_id }, transaction });
    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    const { evaluacion_medica_id, paciente_id, tipo_estudio_id, urgencia, observaciones } = req.body;

    //  Solo paciente y tipo son requeridos
    if (!paciente_id || !tipo_estudio_id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: paciente_id, tipo_estudio_id' });
    }

    //  Si viene evaluacion_medica_id, validar que pertenezca al médico
    if (evaluacion_medica_id) {
      const evaluacion = await EvaluacionMedica.findOne({
        where: { id: parseInt(evaluacion_medica_id), medico_id: medico.id },
        transaction
      });
      if (!evaluacion) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Evaluación médica no encontrada o no pertenece al médico' });
      }
    }

    const paciente = await Paciente.findByPk(parseInt(paciente_id), { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const tipoEstudio = await TipoEstudio.findByPk(parseInt(tipo_estudio_id), { transaction });
    if (!tipoEstudio) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tipo de estudio no encontrado' });
    }

    const estudio = await EstudioSolicitado.create({
      evaluacion_medica_id: evaluacion_medica_id ? parseInt(evaluacion_medica_id) : null, // ✅ opcional
      paciente_id: parseInt(paciente_id),
      tipo_estudio_id: parseInt(tipo_estudio_id),
      medico_id: medico.id, //  guardar siempre
      urgencia: urgencia || 'Normal',
      estado: 'Pendiente',
      observaciones: observaciones || null
    }, { transaction });

    await transaction.commit();
    return res.status(201).json({ success: true, message: 'Estudio solicitado correctamente', data: estudio });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear estudio:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ========================================
// ACTUALIZAR ESTUDIO
// ========================================
exports.actualizarEstudio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

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

    // Buscar estudio verificando que pertenezca al médico
    const estudio = await EstudioSolicitado.findOne({
      where: { id: req.params.id, medico_id: medico.id },
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { medico_id: medico.id },
          required: false,
        }
      ],
      transaction
    });

    if (!estudio) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Estudio no encontrado o no autorizado' 
      });
    }

    // Validar estado
    if (estudio.estado !== 'Pendiente') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Solo se pueden actualizar estudios pendientes' 
      });
    }

    // Validar campos permitidos para actualización
    const { urgencia, observaciones, tipo_estudio_id } = req.body;
    
    const updateData = {};
    
    if (urgencia && ['Normal', 'Alta'].includes(urgencia)) {
      updateData.urgencia = urgencia;
    }
    
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones;
    }
    
    // Solo permitir cambiar tipo de estudio si no tiene turno asignado
    if (tipo_estudio_id) {
      const turno = await TurnoEstudio.findOne({
        where: { estudio_solicitado_id: estudio.id },
        transaction
      });
      
      if (turno) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'No se puede cambiar el tipo de estudio cuando ya tiene un turno asignado' 
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
      
      updateData.tipo_estudio_id = tipo_estudio_id;
    }

    // Actualizar estudio
    await estudio.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estudio actualizado correctamente',
      data: estudio
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar estudio:', error.message);
    next(error);
  }
};

// ========================================
// CANCELAR ESTUDIO
// ========================================
exports.cancelarEstudio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const medico = await Medico.findOne({ where: { usuario_id: req.user.usuario_id } });
    if (!medico) { await transaction.rollback(); return res.status(404).json({ success: false, message: 'Médico no encontrado' }); }

    const estudio = await EstudioSolicitado.findOne({
      where: { id: req.params.id, medico_id: medico.id }, 
      transaction
    });

    if (!estudio) { await transaction.rollback(); return res.status(404).json({ success: false, message: 'Estudio no encontrado o no autorizado' }); }
    if (estudio.estado === 'Cancelado') { await transaction.rollback(); return res.status(400).json({ success: false, message: 'El estudio ya está cancelado' }); }
    if (estudio.estado === 'Realizado') { await transaction.rollback(); return res.status(400).json({ success: false, message: 'No se puede cancelar un estudio realizado' }); }

    const turno = await TurnoEstudio.findOne({ where: { estudio_solicitado_id: estudio.id }, transaction });
    if (turno) await turno.update({ estado: 'Cancelado' }, { transaction });

    await estudio.update({ estado: 'Cancelado' }, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Estudio cancelado correctamente' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// ========================================
// COMPLETAR ESTUDIO
// ========================================

exports.completarEstudio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log(' completarEstudio - usuario_id:', req.user.usuario_id);
    
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
      where: { id: req.params.id, medico_id: medico.id },
      include: [
        { 
          model: EvaluacionMedica, 
          as: 'evaluacion_medica', 
          where: { medico_id: medico.id },
          required: false,
        }
      ],
      transaction
    });

    if (!estudio) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Estudio no encontrado o no autorizado' 
      });
    }

    if (estudio.estado !== 'Pendiente') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Solo se pueden completar estudios pendientes' 
      });
    }

    const { resultados } = req.body;
    
    if (!resultados || resultados.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Los resultados son obligatorios' 
      });
    }

 
    await estudio.update({ 
      estado: 'Realizado',
      resultados: resultados.trim(),
      fecha_realizacion: new Date()
    }, { transaction });

    // Si tiene turno, marcarlo como completado también
    const turno = await TurnoEstudio.findOne({
      where: { estudio_solicitado_id: estudio.id },
      transaction
    });

    if (turno) {
      await turno.update({ 
        estado: 'Realizado',
        resultado: resultados.trim()
      }, { transaction });
    }

    await transaction.commit();

    console.log('✅ Estudio completado:', estudio.id);

    res.json({ 
      success: true, 
      message: 'Estudio completado correctamente', 
      data: estudio 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al completar estudio:', error.message);
    next(error);
  }
};



// ========================================
// OBTENER TIPOS DE ESTUDIO
// ========================================
exports.obtenerTiposEstudio = async (req, res, next) => {
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
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS
// ========================================
exports.obtenerEstadisticas = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({ where: { usuario_id: req.user.usuario_id } });
    if (!medico) return res.status(404).json({ success: false, message: 'Médico no encontrado' });

    const whereBase = { medico_id: medico.id };

    const estudiosData = await EstudioSolicitado.findAll({
      where: whereBase, attributes: ['estado'], raw: true
    });

    const result = { Pendiente: 0, Realizado: 0, Cancelado: 0 };
    estudiosData.forEach(e => { if (result.hasOwnProperty(e.estado)) result[e.estado]++; });

    const urgenciaData = await EstudioSolicitado.findAll({
      where: whereBase, attributes: ['urgencia'], raw: true
    });

    const urgenciaResult = { Normal: 0, Alta: 0 };
    urgenciaData.forEach(e => { if (urgenciaResult.hasOwnProperty(e.urgencia)) urgenciaResult[e.urgencia]++; });

    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const estudiosMes = await EstudioSolicitado.count({
      where: { ...whereBase, created_at: { [Op.gte]: inicioMes } }
    });

    const finalResult = { ...result, totalEstudios: Object.values(result).reduce((a, b) => a + b, 0), estudiosMes, porUrgencia: urgenciaResult };
    res.json({ success: true, data: finalResult });
  } catch (error) {
    next(error);
  }
};

// ========================================
// OBTENER ESTUDIOS POR CATEGORÍA
// ========================================
exports.obtenerEstudiosPorCategoria = async (req, res, next) => {
  try {
    const medico = await Medico.findOne({ where: { usuario_id: req.user.usuario_id } });
    if (!medico) return res.status(404).json({ success: false, message: 'Médico no encontrado' });

    const estudios = await EstudioSolicitado.findAll({
      where: { medico_id: medico.id },
      include: [{ model: TipoEstudio, as: 'tipo_estudio', attributes: ['categoria'] }],
      raw: true
    });

    const distribucion = estudios.reduce((acc, e) => {
      const categoria = e['tipo_estudio.categoria'];
      if (categoria) acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, data: Object.entries(distribucion).map(([categoria, total]) => ({ categoria, total })) });
  } catch (error) {
    next(error);
  }
};