const { 
  EvaluacionEnfermeria,
  Paciente, 
  Usuario, 
  Enfermero, 
  Medico, 
  ProcedimientoEnfermeria, 
  ProcedimientoPreQuirurgico, 
  EvaluacionMedica, 
  ControlEnfermeria, 
  ListaEspera } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar evaluaciones de enfermería
exports.listarEvaluaciones = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { fecha_inicio, fecha_fin, paciente, estado } = req.query;
    
    const whereCondition = {};
    
    if (req.query.solo_mias === 'true') {
      whereCondition.enfermero_id = enfermeroId;
    }

    if (fecha_inicio && fecha_fin) {
      whereCondition.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      whereCondition.fecha = {
        [Op.gte]: new Date(fecha_inicio)
      };
    }

    if (estado) {
      whereCondition.tipo_egreso = estado;
    }

    const includeOptions = [
      {
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
        }],
        where: paciente ? {
          [Op.or]: [
            { '$paciente.usuario.nombre$': { [Op.like]: `%${paciente}%` } },
            { '$paciente.usuario.apellido$': { [Op.like]: `%${paciente}%` } },
            { '$paciente.usuario.dni$': { [Op.like]: `%${paciente}%` } }
          ]
        } : {}
      },
      {
        model: Enfermero,
        as: 'enfermero',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      },
      {
        model: Medico,
        as: 'medico',
        required: false,
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      },
      {
        model: ProcedimientoEnfermeria,
        as: 'procedimiento_enfermeria',
        required: false
      },
      {
        model: ProcedimientoPreQuirurgico,
        as: 'procedimiento_pre_quirurgico',
        required: false
      },
      {
        model: EvaluacionMedica,
        as: 'evaluacion_medica',
        required: false
      }
    ];

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: includeOptions,
      order: [['fecha', 'DESC']],
      subQuery: false
    });

    const estadisticas = {
      total: evaluaciones.length,
      pendientes: evaluaciones.filter(e => e.tipo_egreso === 'PENDIENTE_EVALUACION').length,
      completadas: evaluaciones.filter(e => e.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO').length,
      derivadas_medico: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_MEDICO').length,
      derivadas_urgencia: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_URGENCIA').length
    };

    res.render('dashboard/enfermero/evaluaciones', {
      title: 'Evaluaciones de Enfermería',
      user: req.user,
      evaluaciones,
      estadisticas,
      filtros: { fecha_inicio, fecha_fin, paciente, estado }
    });

  } catch (error) {
    console.error('Error al listar evaluaciones:', error);
    res.status(500).render('error', {
      message: 'Error al cargar las evaluaciones',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de evaluación
exports.verEvaluacion = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, {
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
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: ProcedimientoEnfermeria,
          as: 'procedimiento_enfermeria',
          required: false
        },
        {
          model: ProcedimientoPreQuirurgico,
          as: 'procedimiento_pre_quirurgico',
          required: false
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
        },
        {
          model: ControlEnfermeria,
          as: 'control_enfermeria',
          required: false
        },
        {
          model: ListaEspera,
          as: 'lista_espera_generada',
          required: false
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación no encontrada'
      });
    }

    res.render('dashboard/enfermero/evaluaciones-detalle', {
      title: 'Detalle de Evaluación',
      user: req.user,
      evaluacion
    });

  } catch (error) {
    console.error('Error al ver evaluación:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle de la evaluación',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para nueva evaluación
exports.formularioNuevaEvaluacion = async (req, res) => {
  try {
    const { paciente_id } = req.query;
    
    let paciente = null;
    if (paciente_id) {
      paciente = await Paciente.findByPk(paciente_id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
        }]
      });
    }

    res.render('dashboard/enfermero/evaluaciones-nueva', {
      title: 'Nueva Evaluación de Enfermería',
      user: req.user,
      paciente
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Crear nueva evaluación
exports.crearEvaluacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const {
      paciente_id,
      signos_vitales,
      observaciones,
      nivel_triaje,
      presion_arterial,
      frecuencia_cardiaca,
      temperatura,
      saturacion_oxigeno,
      frecuencia_respiratoria,
      tipo_egreso
    } = req.body;

    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const signosVitalesTexto = signos_vitales || `PA: ${presion_arterial || 'N/A'}, FC: ${frecuencia_cardiaca || 'N/A'}, T: ${temperatura || 'N/A'}°C, SpO2: ${saturacion_oxigeno || 'N/A'}%, FR: ${frecuencia_respiratoria || 'N/A'}`;

    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id,
      enfermero_id: enfermeroId,
      fecha: new Date(),
      signos_vitales: signosVitalesTexto,
      observaciones,
      nivel_triaje: nivel_triaje || null,
      tipo_egreso: tipo_egreso || 'PENDIENTE_EVALUACION'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación registrada correctamente',
      evaluacion_id: evaluacion.id,
      redirect: `dashboard/enfermero/evaluaciones/${evaluacion.id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la evaluación',
      error: error.message
    });
  }
};

// Actualizar evaluación
exports.actualizarEvaluacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      signos_vitales,
      observaciones,
      nivel_triaje,
      tipo_egreso,
      medico_id
    } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    const updateData = {};
    if (signos_vitales) updateData.signos_vitales = signos_vitales;
    if (observaciones) updateData.observaciones = observaciones;
    if (nivel_triaje) updateData.nivel_triaje = nivel_triaje;
    if (tipo_egreso) updateData.tipo_egreso = tipo_egreso;
    if (medico_id) updateData.medico_id = medico_id;

    await evaluacion.update(updateData, { transaction });

    if (tipo_egreso === 'DERIVACION_MEDICO' || tipo_egreso === 'DERIVACION_URGENCIA') {
      const prioridad = tipo_egreso === 'DERIVACION_URGENCIA' ? 'ALTA' : 'MEDIA';
      
      let listaEspera = await ListaEspera.findOne({
        where: { 
          paciente_id: evaluacion.paciente_id,
          estado: 'PENDIENTE'
        },
        order: [['created_at', 'DESC']],
        transaction
      });

      if (listaEspera) {
        await listaEspera.update({ prioridad }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación actualizada correctamente',
      redirect: `dashboard/enfermero/evaluaciones/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la evaluación',
      error: error.message
    });
  }
};

// Completar evaluación
exports.completarEvaluacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observaciones_finales } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    if (evaluacion.tipo_egreso !== 'PENDIENTE_EVALUACION') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta evaluación ya fue completada'
      });
    }

    await evaluacion.update({
      tipo_egreso: 'PROCEDIMIENTO_COMPLETADO',
      observaciones: `${evaluacion.observaciones}\n\n--- Observaciones finales ---\n${observaciones_finales || 'Ninguna'}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación completada correctamente',
      redirect: 'dashboard/enfermero/evaluaciones'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al completar evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar la evaluación',
      error: error.message
    });
  }
};

// Derivar a médico
exports.derivarMedico = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { medico_id, motivo_derivacion, urgente } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    if (medico_id) {
      const medico = await Medico.findByPk(medico_id, { transaction });
      if (!medico) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Médico no encontrado'
        });
      }
    }

    const tipoEgreso = urgente === 'true' ? 'DERIVACION_URGENCIA' : 'DERIVACION_MEDICO';

    await evaluacion.update({
      medico_id: medico_id || null,
      tipo_egreso: tipoEgreso,
      observaciones: `${evaluacion.observaciones}\n\n--- Derivado a médico ---\nMotivo: ${motivo_derivacion}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Paciente derivado correctamente',
      redirect: 'dashboard/enfermero/evaluaciones'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al derivar a médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al derivar al paciente',
      error: error.message
    });
  }
};

// Buscar médicos disponibles
exports.buscarMedicos = async (req, res) => {
  try {
    const { especialidad_id } = req.query;

    const whereCondition = {};
    if (especialidad_id) {
      whereCondition.especialidad_id = especialidad_id;
    }

    const medicos = await Medico.findAll({
      where: whereCondition,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
      }]
    });

    res.json({
      success: true,
      medicos: medicos.map(m => ({
        id: m.id,
        nombre: `${m.usuario.nombre} ${m.usuario.apellido}`,
        matricula: m.matricula
      }))
    });

  } catch (error) {
    console.error('Error al buscar médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar médicos'
    });
  }
};

// Exportar evaluaciones a PDF
exports.exportarPDF = async (req, res) => {
  try {
    const { ids } = req.body;
    
    res.json({
      success: true,
      message: 'Funcionalidad en desarrollo'
    });

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar PDF'
    });
  }
};

module.exports = exports;