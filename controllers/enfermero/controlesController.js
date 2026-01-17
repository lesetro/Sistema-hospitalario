const { ControlEnfermeria, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Enfermero, 
    EvaluacionMedica } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar controles de enfermería
exports.listarControles = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, paciente, con_evaluacion } = req.query;
    
    const whereCondition = {};
    const includeEvaluacion = {
      model: EvaluacionEnfermeria,
      as: 'evaluacion',
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
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
        }
      ]
    };

    // Filtro por paciente
    if (paciente) {
      includeEvaluacion.include[0].include[0].where = {
        [Op.or]: [
          { nombre: { [Op.like]: `%${paciente}%` } },
          { apellido: { [Op.like]: `%${paciente}%` } },
          { dni: { [Op.like]: `%${paciente}%` } }
        ]
      };
    }

    // Filtro por fecha
    if (fecha_inicio && fecha_fin) {
      includeEvaluacion.where = {
        fecha: {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        }
      };
    }

    // Filtro por controles con evaluación médica
    if (con_evaluacion === 'true') {
      whereCondition.evaluacion_medica_id = { [Op.ne]: null };
    }

    const controles = await ControlEnfermeria.findAll({
      where: whereCondition,
      include: [
        includeEvaluacion,
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false,
          include: [{
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni']
            }]
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    // Estadísticas
    const estadisticas = {
      total: controles.length,
      con_alergias: controles.filter(c => c.alergias && c.alergias.trim() !== '').length,
      con_grupo_sanguineo: controles.filter(c => c.grupo_sanguineo).length,
      con_evaluacion_medica: controles.filter(c => c.evaluacion_medica_id).length
    };

    res.render('dashboard/enfermero/controles', {
      title: 'Controles de Enfermería',
      user: req.user,
      controles,
      estadisticas,
      filtros: { fecha_inicio, fecha_fin, paciente, con_evaluacion }
    });

  } catch (error) {
    console.error('Error al listar controles:', error);
    res.status(500).render('error', {
      message: 'Error al cargar los controles',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de control
exports.verControl = async (req, res) => {
  try {
    const { id } = req.params;

    const control = await ControlEnfermeria.findByPk(id, {
      include: [
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
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
              model: Enfermero,
              as: 'enfermero',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }]
            }
          ]
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
        }
      ]
    });

    if (!control) {
      return res.status(404).render('error', {
        message: 'Control de enfermería no encontrado'
      });
    }

    res.render('dashboard/enfermero/controles-detalle', {
      title: 'Detalle de Control',
      user: req.user,
      control
    });

  } catch (error) {
    console.error('Error al ver control:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle del control',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para nuevo control
exports.formularioNuevoControl = async (req, res) => {
  try {
    const { evaluacion_id } = req.query;
    
    let evaluacion = null;
    if (evaluacion_id) {
      evaluacion = await EvaluacionEnfermeria.findByPk(evaluacion_id, {
        include: [{
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
          }]
        }]
      });
    }

    res.render('dashboard/enfermero/controles-nuevo', {
      title: 'Nuevo Control de Enfermería',
      user: req.user,
      evaluacion
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Crear nuevo control
exports.crearControl = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      evaluacion_enfermeria_id,
      alergias,
      antecedentes_familiares,
      antecedentes_personales,
      grupo_sanguineo,
      factor_rh,
      peso,
      altura,
      presion_arterial,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      temperatura,
      nivel_oxigeno,
      nivel_glucosa,
      nivel_colesterol,
      nivel_trigliceridos,
      nivel_creatinina,
      nivel_urea,
      nivel_acido_urico,
      nivel_hb,
      nivel_hct,
      nivel_leucocitos,
      nivel_plaquetas,
      nivel_proteinas,
      nivel_albumina,
      nivel_globulina,
      nivel_fosfatasa
    } = req.body;

    // Validar que la evaluación existe
    const evaluacion = await EvaluacionEnfermeria.findByPk(evaluacion_enfermeria_id, { transaction });
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación de enfermería no encontrada'
      });
    }

    // Verificar que no exista ya un control para esta evaluación
    const controlExistente = await ControlEnfermeria.findOne({
      where: { evaluacion_enfermeria_id },
      transaction
    });

    if (controlExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya existe un control de enfermería para esta evaluación'
      });
    }

    // Crear control
    const control = await ControlEnfermeria.create({
      evaluacion_enfermeria_id,
      alergias: alergias || null,
      antecedentes_familiares: antecedentes_familiares || null,
      antecedentes_personales: antecedentes_personales || null,
      grupo_sanguineo: grupo_sanguineo || null,
      factor_rh: factor_rh || null,
      peso: peso || null,
      altura: altura || null,
      presion_arterial: presion_arterial || null,
      frecuencia_cardiaca: frecuencia_cardiaca || null,
      frecuencia_respiratoria: frecuencia_respiratoria || null,
      temperatura: temperatura || null,
      nivel_oxigeno: nivel_oxigeno || null,
      nivel_glucosa: nivel_glucosa || null,
      nivel_colesterol: nivel_colesterol || null,
      nivel_trigliceridos: nivel_trigliceridos || null,
      nivel_creatinina: nivel_creatinina || null,
      nivel_urea: nivel_urea || null,
      nivel_acido_urico: nivel_acido_urico || null,
      nivel_hb: nivel_hb || null,
      nivel_hct: nivel_hct || null,
      nivel_leucocitos: nivel_leucocitos || null,
      nivel_plaquetas: nivel_plaquetas || null,
      nivel_proteinas: nivel_proteinas || null,
      nivel_albumina: nivel_albumina || null,
      nivel_globulina: nivel_globulina || null,
      nivel_fosfatasa: nivel_fosfatasa || null
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Control de enfermería registrado correctamente',
      control_id: control.id,
      redirect: `dashboard/enfermero/controles/${control.id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear control:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el control',
      error: error.message
    });
  }
};

// Actualizar control
exports.actualizarControl = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    const control = await ControlEnfermeria.findByPk(id, { transaction });
    
    if (!control) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Control no encontrado'
      });
    }

    // Actualizar solo los campos proporcionados
    await control.update(datosActualizacion, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Control actualizado correctamente',
      redirect: `dashboard/enfermero/controles/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar control:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el control',
      error: error.message
    });
  }
};

// Buscar evaluaciones sin control
exports.buscarEvaluacionesSinControl = async (req, res) => {
  try {
    const { busqueda } = req.query;

    const whereCondition = {};
    const includeOptions = [
      {
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }
    ];

    if (busqueda) {
      includeOptions[0].include[0].where = {
        [Op.or]: [
          { nombre: { [Op.like]: `%${busqueda}%` } },
          { apellido: { [Op.like]: `%${busqueda}%` } },
          { dni: { [Op.like]: `%${busqueda}%` } }
        ]
      };
    }

    // Buscar evaluaciones que no tienen control
    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: [
        ...includeOptions,
        {
          model: ControlEnfermeria,
          as: 'control_enfermeria',
          required: false,
          where: { id: null }
        }
      ],
      having: db.sequelize.literal('control_enfermeria.id IS NULL'),
      limit: 10,
      subQuery: false
    });

    res.json({
      success: true,
      evaluaciones: evaluaciones.map(e => ({
        id: e.id,
        paciente: {
          id: e.paciente.id,
          nombre: `${e.paciente.usuario.nombre} ${e.paciente.usuario.apellido}`,
          dni: e.paciente.usuario.dni
        },
        fecha: e.fecha
      }))
    });

  } catch (error) {
    console.error('Error al buscar evaluaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar evaluaciones',
      error: error.message
    });
  }
};

// Calcular IMC (Índice de Masa Corporal)
exports.calcularIMC = async (req, res) => {
  try {
    const { peso, altura } = req.query;

    if (!peso || !altura) {
      return res.status(400).json({
        success: false,
        message: 'Peso y altura son requeridos'
      });
    }

    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura) / 100; // convertir cm a metros

    if (isNaN(pesoNum) || isNaN(alturaNum) || alturaNum === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valores inválidos'
      });
    }

    const imc = pesoNum / (alturaNum * alturaNum);
    let categoria = '';

    if (imc < 18.5) {
      categoria = 'Bajo peso';
    } else if (imc < 25) {
      categoria = 'Peso normal';
    } else if (imc < 30) {
      categoria = 'Sobrepeso';
    } else if (imc < 35) {
      categoria = 'Obesidad grado I';
    } else if (imc < 40) {
      categoria = 'Obesidad grado II';
    } else {
      categoria = 'Obesidad grado III';
    }

    res.json({
      success: true,
      imc: imc.toFixed(2),
      categoria
    });

  } catch (error) {
    console.error('Error al calcular IMC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular IMC'
    });
  }
};

// Obtener historial de controles de un paciente
exports.historialPaciente = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const controles = await ControlEnfermeria.findAll({
      include: [
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
          where: { paciente_id },
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
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      controles: controles.map(c => ({
        id: c.id,
        fecha: c.created_at,
        enfermero: `${c.evaluacion.enfermero.usuario.nombre} ${c.evaluacion.enfermero.usuario.apellido}`,
        peso: c.peso,
        altura: c.altura,
        presion_arterial: c.presion_arterial,
        temperatura: c.temperatura,
        grupo_sanguineo: c.grupo_sanguineo,
        factor_rh: c.factor_rh
      }))
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

module.exports = exports;