const { 
  RecetaCertificado,
  Paciente,
  Usuario,
  Medico,
  EvaluacionMedica
  
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderRecetasCertificados = async (req, res, next) => {
  try {
    console.log('🔍 renderRecetasCertificados - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de recetas y certificados...');

    res.render('dashboard/medico/recetas-certificados', {
      title: 'Recetas y Certificados',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar recetas y certificados:', error);
    next(error);
  }
};

// ========================================
// OBTENER RECETAS Y CERTIFICADOS
// ========================================
exports.obtenerRecetasCertificados = async (req, res, next) => {
  try {
    console.log('📋 obtenerRecetasCertificados - usuario_id:', req.user.usuario_id);
    
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

    const { 
      tipo,
      pacienteId,
      fechaDesde,
      fechaHasta,
      busqueda,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { medico_id: medico.id };

    if (tipo && tipo !== 'TODOS') {
      whereClause.tipo = tipo;
    }

    if (pacienteId) {
      whereClause.paciente_id = pacienteId;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fecha = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
    } else if (fechaDesde) {
      whereClause.fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha = { [Op.lte]: fechaHasta };
    }

    if (busqueda) {
      whereClause.contenido = { [Op.like]: `%${busqueda}%` };
    }

    const { count, rows: items } = await RecetaCertificado.findAndCountAll({
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
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          attributes: ['id', 'fecha'],
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Items obtenidos:', count);

    res.json({
      success: true,
      data: items,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener recetas/certificados:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER POR ID
// ========================================
exports.obtenerPorId = async (req, res, next) => {
  try {
    console.log('🔍 obtenerPorId - usuario_id:', req.user.usuario_id);
    
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

    const item = await RecetaCertificado.findOne({
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
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          include: [
            {
              model: require('../../models').Diagnostico,
              as: 'diagnostico',
              attributes: ['codigo', 'nombre']
            }
          ]
        }
      ]
    });

    if (!item) {
      console.error('❌ Item no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Receta/Certificado no encontrado' 
      });
    }

    console.log('✅ Item encontrado:', item.id);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('❌ Error al obtener item:', error.message);
    next(error);
  }
};

// ========================================
// CREAR
// ========================================
exports.crear = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('✅ crear - usuario_id:', req.user.usuario_id);
    
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
      tipo,
      contenido,
      evaluacion_medica_id
    } = req.body;

    // Validaciones
    if (!['Receta Medica', 'Certificado'].includes(tipo)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Tipo inválido' 
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

    if (evaluacion_medica_id) {
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
          message: 'Evaluación médica no encontrada o no pertenece a este médico' 
        });
      }
    }

    // Crear receta/certificado
    const item = await RecetaCertificado.create({
      paciente_id,
      tipo,
      contenido,
      fecha: new Date(),
      medico_id: medico.id,
      evaluacion_medica_id
    }, { transaction });

    // Crear registro en historial médico
    await require('../../models').HistorialMedico.create({
      paciente_id,
      descripcion: `${tipo} emitido${tipo === 'Receta Medica' ? 'a' : ''}`,
      tipo_evento: 'Otro',
      fecha: new Date()
    }, { transaction });

    // Crear notificación para el paciente
    await require('../../models').Notificacion.create({
      usuario_id: paciente.usuario_id,
      mensaje: `Se ha emitido ${tipo === 'Receta Medica' ? 'una receta médica' : 'un certificado'} a su nombre`,
      leida: false
    }, { transaction });

    await transaction.commit();

    console.log('✅ Item creado:', item.id);

    res.json({
      success: true,
      message: `${tipo} ${tipo === 'Receta Medica' ? 'creada' : 'creado'} correctamente`,
      data: item
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear item:', error.message);
    next(error);
  }
};

// ========================================
// ACTUALIZAR
// ========================================
exports.actualizar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('🔄 actualizar - usuario_id:', req.user.usuario_id);
    
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

    const item = await RecetaCertificado.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!item) {
      await transaction.rollback();
      console.error('❌ Item no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Receta/Certificado no encontrado' 
      });
    }

    const { contenido } = req.body;

    await item.update({ contenido }, { transaction });

    await transaction.commit();

    console.log('✅ Item actualizado:', item.id);

    res.json({
      success: true,
      message: 'Receta/Certificado actualizado correctamente',
      data: item
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar item:', error.message);
    next(error);
  }
};

// ========================================
// ELIMINAR
// ========================================
exports.eliminar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('🗑️ eliminar - usuario_id:', req.user.usuario_id);
    
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

    const item = await RecetaCertificado.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!item) {
      await transaction.rollback();
      console.error('❌ Item no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Receta/Certificado no encontrado' 
      });
    }

    await item.destroy({ transaction });

    await transaction.commit();

    console.log('✅ Item eliminado:', item.id);

    res.json({
      success: true,
      message: 'Receta/Certificado eliminado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al eliminar item:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS
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

    console.log('🔍 Contando recetas...');
    // Total de recetas
    const totalRecetas = await RecetaCertificado.count({
      where: {
        medico_id: medico.id,
        tipo: 'Receta Medica'
      }
    });

    console.log('🔍 Contando certificados...');
    // Total de certificados
    const totalCertificados = await RecetaCertificado.count({
      where: {
        medico_id: medico.id,
        tipo: 'Certificado'
      }
    });

    console.log('🔍 Contando este mes...');
    // Este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await RecetaCertificado.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Contando esta semana...');
    // Esta semana
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const estaSemana = await RecetaCertificado.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioSemana }
      }
    });

    const finalResult = {
      totalRecetas,
      totalCertificados,
      total: totalRecetas + totalCertificados,
      esteMes,
      estaSemana
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

// ========================================
// OBTENER RECIENTES
// ========================================
exports.obtenerRecientes = async (req, res, next) => {
  try {
    console.log('📅 obtenerRecientes - usuario_id:', req.user.usuario_id);
    
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

    const items = await RecetaCertificado.findAll({
      where: { medico_id: medico.id },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limite)
    });

    console.log('✅ Items recientes obtenidos:', items.length);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('❌ Error al obtener recientes:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER PACIENTES PARA FILTRO
// ========================================
exports.obtenerPacientesParaFiltro = async (req, res, next) => {
  try {
    console.log('👥 obtenerPacientesParaFiltro - usuario_id:', req.user.usuario_id);
    
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

    // Obtener pacientes únicos del médico que tienen recetas/certificados
    const items = await RecetaCertificado.findAll({
      where: { medico_id: medico.id },
      attributes: ['paciente_id'],
      group: ['paciente_id'],
      raw: true
    });

    const pacientesIds = items.map(i => i.paciente_id);

    if (pacientesIds.length === 0) {
      return res.json({ success: true, data: [] });
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

    console.log('✅ Pacientes obtenidos:', pacientes.length);

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error.message);
    next(error);
  }
};

// ========================================
// GENERAR PDF
// ========================================
exports.generarPDF = async (req, res, next) => {
  try {
    console.log('📄 generarPDF - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        },
        {
          model: require('../../models').Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        }
      ]
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const item = await RecetaCertificado.findOne({
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
              attributes: ['nombre', 'apellido', 'dni']
            }
          ]
        }
      ]
    });

    if (!item) {
      console.error('❌ Item no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Receta/Certificado no encontrado' 
      });
    }

    console.log('✅ Datos para PDF generados');

    res.json({
      success: true,
      message: 'Datos para generar PDF',
      data: {
        tipo: item.tipo,
        fecha: item.fecha,
        medico: {
          nombre: `${medico.usuario.nombre} ${medico.usuario.apellido}`,
          matricula: medico.matricula,
          especialidad: medico.especialidad?.nombre
        },
        paciente: {
          nombre: `${item.paciente.usuario.nombre} ${item.paciente.usuario.apellido}`,
          dni: item.paciente.usuario.dni
        },
        contenido: item.contenido
      }
    });
  } catch (error) {
    console.error('❌ Error al generar PDF:', error.message);
    next(error);
  }
};