const { ProcedimientoEnfermeria, 
    EvaluacionMedica, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero, 
    Tratamiento } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar procedimientos de enfermería
exports.listarProcedimientos = async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin, paciente } = req.query;
    
    const whereCondition = {};
    
    // ✅ IMPORTANTE: Cambiar a plural porque el modelo usa hasMany
    const includeEvaluacionEnfermeria = {
      model: EvaluacionEnfermeria,
      as: 'evaluaciones_enfermeria',  // Plural
      required: false,
      where: estado ? { tipo_egreso: estado } : {}
    };

    const procedimientos = await ProcedimientoEnfermeria.findAll({
      where: whereCondition,
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: true,
          where: fecha_inicio && fecha_fin ? {
            fecha: {
              [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
            }
          } : {},
          include: [
            {
              model: Paciente,
              as: 'paciente',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo'],
                where: paciente ? {
                  [Op.or]: [
                    { nombre: { [Op.like]: `%${paciente}%` } },
                    { apellido: { [Op.like]: `%${paciente}%` } },
                    { dni: { [Op.like]: `%${paciente}%` } }
                  ]
                } : {}
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
            }
          ]
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          required: false
        },
        includeEvaluacionEnfermeria
      ],
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    // ✅ Estadísticas corregidas para array
    const estadisticas = {
      total: procedimientos.length,
      pendientes: procedimientos.filter(p => 
        !p.evaluaciones_enfermeria || p.evaluaciones_enfermeria.length === 0
      ).length,
      completados: procedimientos.filter(p => 
        p.evaluaciones_enfermeria && p.evaluaciones_enfermeria.some(e => e.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO')
      ).length,
      requiere_preparacion: procedimientos.filter(p => p.requiere_preparacion).length
    };

    res.render('dashboard/enfermero/procedimientos', {
      title: 'Procedimientos',
      user: req.user,
      procedimientos,
      estadisticas,
      filtros: { estado, fecha_inicio, fecha_fin, paciente }
    });

  } catch (error) {
    console.error('Error al listar procedimientos:', error);
    res.status(500).render('error', {
      message: 'Error al cargar procedimientos',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de procedimiento
exports.verProcedimiento = async (req, res) => {
  try {
    const { id } = req.params;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, {
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
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
            }
          ]
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          required: false
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',  // ✅ Plural
          required: false,
          include: [{
            model: Enfermero,
            as: 'enfermero',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          }]
        }
      ]
    });

    if (!procedimiento) {
      return res.status(404).render('error', {
        message: 'Procedimiento no encontrado'
      });
    }

    res.render('dashboard/enfermero/procedimientos-detalle', {
      title: 'Detalle de Procedimiento',
      user: req.user,
      procedimiento
    });

  } catch (error) {
    console.error('Error al ver procedimiento:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle del procedimiento',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para ejecutar procedimiento
exports.formularioEjecutar = async (req, res) => {
  try {
    const { id } = req.params;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, {
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [{
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
            }]
          }]
        },
        {
          model: Tratamiento,
          as: 'tratamiento'
        }
      ]
    });

    if (!procedimiento) {
      return res.status(404).render('error', {
        message: 'Procedimiento no encontrado'
      });
    }

    // Verificar si ya fue ejecutado
    const evaluacionExistente = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id }
    });

    if (evaluacionExistente) {
      return res.redirect(`dashboard/enfermero/procedimientos/${id}`);
    }

    res.render('dashboard/enfermero/procedimientos-ejecutar', {
      title: 'Ejecutar Procedimiento',
      user: req.user,
      procedimiento
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ejecutar procedimiento
exports.ejecutarProcedimiento = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;
    const {
      signos_vitales,
      observaciones,
      complicaciones,
      materiales_utilizados,
      resultado
    } = req.body;

    // Validar procedimiento
    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, {
      include: [{
        model: EvaluacionMedica,
        as: 'evaluacion_medica'
      }],
      transaction
    });

    if (!procedimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    // Verificar si ya fue ejecutado
    const evaluacionExistente = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id },
      transaction
    });

    if (evaluacionExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este procedimiento ya fue ejecutado'
      });
    }

    // Construir observaciones completas
    const observacionesCompletas = `
=== PROCEDIMIENTO DE ENFERMERÍA ===
Procedimiento: ${procedimiento.nombre}
Duración: ${procedimiento.duracion_estimada || 'N/A'} minutos

${procedimiento.descripcion || ''}

=== EJECUCIÓN ===
${observaciones || ''}

${complicaciones ? `\n=== COMPLICACIONES ===\n${complicaciones}` : ''}

${materiales_utilizados ? `\n=== MATERIALES UTILIZADOS ===\n${materiales_utilizados}` : ''}

=== RESULTADO ===
${resultado || 'Procedimiento completado'}
    `.trim();

    // Crear evaluación de enfermería
    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id: procedimiento.evaluacion_medica.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: procedimiento.evaluacion_medica.medico_id,
      fecha: new Date(),
      signos_vitales: signos_vitales || null,
      procedimiento_enfermeria_id: id,
      observaciones: observacionesCompletas,
      tipo_egreso: 'PROCEDIMIENTO_COMPLETADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Procedimiento ejecutado correctamente',
      evaluacion_id: evaluacion.id,
      redirect: `/dashboard/enfermero/procedimientos/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al ejecutar procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar el procedimiento',
      error: error.message
    });
  }
};

// Buscar procedimientos pendientes
exports.procedimientosPendientes = async (req, res) => {
  try {
    const procedimientos = await ProcedimientoEnfermeria.findAll({
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: true,
          include: [{
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni']
            }]
          }]
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',  // ✅ Plural
          required: false
        }
      ],
      where: {
        '$evaluaciones_enfermeria.id$': null  // ✅ Plural
      },
      limit: 20,
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      procedimientos: procedimientos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        duracion_estimada: p.duracion_estimada,
        requiere_preparacion: p.requiere_preparacion,
        paciente: {
          id: p.evaluacion_medica.paciente.id,
          nombre: `${p.evaluacion_medica.paciente.usuario.nombre} ${p.evaluacion_medica.paciente.usuario.apellido}`,
          dni: p.evaluacion_medica.paciente.usuario.dni
        },
        fecha_solicitud: p.created_at
      }))
    });

  } catch (error) {
    console.error('Error al buscar procedimientos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar procedimientos'
    });
  }
};

// Obtener tipos de procedimientos comunes
exports.tiposProcedimientos = async (req, res) => {
  try {
    // Obtener procedimientos más frecuentes
    const procedimientos = await ProcedimientoEnfermeria.findAll({
      attributes: [
        'nombre',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cantidad']
      ],
      group: ['nombre'],
      order: [[db.sequelize.literal('cantidad'), 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      tipos: procedimientos.map(p => ({
        nombre: p.nombre,
        cantidad: p.get('cantidad')
      }))
    });

  } catch (error) {
    console.error('Error al obtener tipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de procedimientos'
    });
  }
};

// Registrar complicación
exports.registrarComplicacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { tipo_complicacion, descripcion, accion_tomada } = req.body;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, { transaction });
    
    if (!procedimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    // Buscar evaluación de enfermería asociada
    const evaluacion = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id },
      transaction
    });

    if (!evaluacion) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El procedimiento no ha sido ejecutado aún'
      });
    }

    // Actualizar observaciones con la complicación
    const complicacionTexto = `
\n=== COMPLICACIÓN REGISTRADA ===
Fecha: ${new Date().toLocaleString('es-AR')}
Tipo: ${tipo_complicacion}
Descripción: ${descripcion}
Acción tomada: ${accion_tomada}
    `;

    await evaluacion.update({
      observaciones: evaluacion.observaciones + complicacionTexto,
      tipo_egreso: 'DERIVACION_MEDICO' // Cambiar estado para revisión médica
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Complicación registrada. Se derivará al médico.',
      redirect: `/dashboard/enfermero/procedimientos/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar complicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la complicación',
      error: error.message
    });
  }
};

// Cancelar procedimiento
exports.cancelarProcedimiento = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;
    const { motivo_cancelacion } = req.body;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, {
      include: [{
        model: EvaluacionMedica,
        as: 'evaluacion_medica'
      }],
      transaction
    });

    if (!procedimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    // Verificar si ya fue ejecutado
    const evaluacionExistente = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id },
      transaction
    });

    if (evaluacionExistente && evaluacionExistente.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar un procedimiento ya completado'
      });
    }

    // Registrar cancelación
    if (!evaluacionExistente) {
      await EvaluacionEnfermeria.create({
        paciente_id: procedimiento.evaluacion_medica.paciente_id,
        enfermero_id: enfermeroId,
        medico_id: procedimiento.evaluacion_medica.medico_id,
        fecha: new Date(),
        procedimiento_enfermeria_id: id,
        observaciones: `PROCEDIMIENTO CANCELADO\nMotivo: ${motivo_cancelacion}`,
        tipo_egreso: 'DERIVACION_MEDICO'
      }, { transaction });
    } else {
      await evaluacionExistente.update({
        observaciones: evaluacionExistente.observaciones + `\n\nPROCEDIMIENTO CANCELADO\nMotivo: ${motivo_cancelacion}`,
        tipo_egreso: 'DERIVACION_MEDICO'
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Procedimiento cancelado',
      redirect: 'dashboard/enfermero/procedimientos'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar el procedimiento',
      error: error.message
    });
  }
};

module.exports = exports;