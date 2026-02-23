const { ControlEnfermeria, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Enfermero, 
    EvaluacionMedica } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Para validad los datos, esta en el frontend pero es correcto hacer en el backend
const extraerDatosControl = (body) => ({
  alergias:                body.alergias                || null,
  antecedentes_familiares: body.antecedentes_familiares || null,
  antecedentes_personales: body.antecedentes_personales || null,
  grupo_sanguineo:         body.grupo_sanguineo         || null,
  factor_rh:               body.factor_rh               || null,
  peso:                    body.peso                    || null,
  altura:                  body.altura                  || null,
  presion_arterial:        body.presion_arterial        || null,
  frecuencia_cardiaca:     body.frecuencia_cardiaca     || null,
  frecuencia_respiratoria: body.frecuencia_respiratoria || null,
  temperatura:             body.temperatura             || null,
  nivel_oxigeno:           body.nivel_oxigeno           || null,
  nivel_glucosa:           body.nivel_glucosa           || null,
  nivel_colesterol:        body.nivel_colesterol        || null,
  nivel_trigliceridos:     body.nivel_trigliceridos     || null,
  nivel_creatinina:        body.nivel_creatinina        || null,
  nivel_urea:              body.nivel_urea              || null,
  nivel_acido_urico:       body.nivel_acido_urico       || null,
  nivel_hb:                body.nivel_hb                || null,
  nivel_hct:               body.nivel_hct               || null,
  nivel_leucocitos:        body.nivel_leucocitos        || null,
  nivel_plaquetas:         body.nivel_plaquetas         || null,
  nivel_proteinas:         body.nivel_proteinas         || null,
  nivel_albumina:          body.nivel_albumina          || null,
  nivel_globulina:         body.nivel_globulina         || null,
  nivel_fosfatasa:         body.nivel_fosfatasa         || null
});


// Listar controles de enfermería
exports.listarControles = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, paciente, con_evaluacion } = req.query;
    
    const whereCondition = {};

    // Filtro por fecha del CONTROL
    if (fecha_inicio && fecha_fin) {
      const fechaFinAjustada = new Date(fecha_fin);
      fechaFinAjustada.setDate(fechaFinAjustada.getDate() + 1);
      
      whereCondition.created_at = {
        [Op.gte]: new Date(fecha_inicio),
        [Op.lt]: fechaFinAjustada
      };
    }

    // Filtro por controles con evaluación médica
    if (con_evaluacion === 'true') {
      whereCondition.evaluacion_medica_id = { [Op.ne]: null };
    }

    // Include de paciente directo (para filtro por nombre/dni)
    const includePacienteDirecto = {
      model: Paciente,
      as: 'paciente',
      required: false,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
      }]
    };

    //  Si hay filtro por paciente, aplicar al paciente directo
    if (paciente) {
      includePacienteDirecto.required = true;
      includePacienteDirecto.include[0].where = {
        [Op.or]: [
          { nombre: { [Op.like]: `%${paciente}%` } },
          { apellido: { [Op.like]: `%${paciente}%` } },
          { dni: { [Op.like]: `%${paciente}%` } }
        ]
      };
    }

    const controles = await ControlEnfermeria.findAll({
      where: whereCondition,
      include: [
        //  Evaluación de enfermería → enfermero
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
          required: false,
          include: [
            {
              model: Enfermero,
              as: 'enfermero',
              required: false,
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }]
            }
          ]
        },
        // Paciente directo (desde control.paciente_id)
        includePacienteDirecto,
        // Evaluación médica asociada
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
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
    next(error);
  }
};

// Ver detalle de control
exports.verControl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const control = await ControlEnfermeria.findByPk(id, {
      include: [
        //  Evaluación de enfermería → enfermero
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
          required: false,
          include: [
            {
              model: Enfermero,
              as: 'enfermero',
              required: false,
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }]
            }
          ]
        },
        // Paciente directo
        {
          model: Paciente,
          as: 'paciente',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
          }]
        },
        //  Evaluación médica asociada
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
    next(error);
  }
};
// Formulario para nuevo control
exports.formularioNuevoControl = async (req, res, next) => {
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
    next(error);
  }
};

// Crear nuevo control
exports.crearControl = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { evaluacion_enfermeria_id } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(evaluacion_enfermeria_id, { transaction });
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    const control = await ControlEnfermeria.create({
      evaluacion_enfermeria_id,
      paciente_id: evaluacion.paciente_id,
      estado: 'COMPLETADO',
      ...extraerDatosControl(req.body) 
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Control registrado correctamente',
      control_id: control.id,
      redirect: `/enfermero/controles/${control.id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear control:', error);
    next(error);
  }
};

// Actualizar control
exports.actualizarControl = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const control = await ControlEnfermeria.findByPk(id, { transaction });
    if (!control) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Control no encontrado' });
    }

    //  Buscar el enfermero logueado
    const enfermero = await Enfermero.findOne({
      where: { usuario_id: req.user.usuario_id },
      transaction
    });

    // Si el control estaba SOLICITADO, buscar o crear evaluación de enfermería
    let evaluacionEnfermeriaId = control.evaluacion_enfermeria_id;
    
    if (control.estado === 'SOLICITADO' && !evaluacionEnfermeriaId && enfermero) {
      const nuevaEvaluacion = await EvaluacionEnfermeria.create({
        paciente_id: control.paciente_id,
        enfermero_id: enfermero.id,
        evaluacion_medica_id: control.evaluacion_medica_id || null,
        fecha: new Date(),
        estado: 'Completado',
        observaciones: 'Control de enfermería completado'
      }, { transaction });
      
      evaluacionEnfermeriaId = nuevaEvaluacion.id;
    }

    await control.update({
      ...extraerDatosControl(req.body),
      evaluacion_enfermeria_id: evaluacionEnfermeriaId,
      estado: control.estado === 'SOLICITADO' ? 'COMPLETADO' : control.estado
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Control actualizado correctamente',
      redirect: `/enfermero/controles`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar control:', error);
    next(error);
  }
};
// Buscar evaluaciones sin control
exports.buscarEvaluacionesSinControl = async (req, res, next) => {
  try {
    const { busqueda } = req.query;

    // Paso 1: Obtener todas las evaluaciones con evaluación médica
    const evaluaciones = await EvaluacionEnfermeria.findAll({
      include: [
        {
          model: Paciente,
          as: 'paciente',
          required: true,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni'],
            where: busqueda ? {
              [Op.or]: [
                { nombre: { [Op.like]: `%${busqueda}%` } },
                { apellido: { [Op.like]: `%${busqueda}%` } },
                { dni: { [Op.like]: `%${busqueda}%` } }
              ]
            } : {}
          }]
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: true  // ← Solo si tiene evaluación médica
        },
        {
          model: ControlEnfermeria,
          as: 'control_enfermeria',
          required: false
          
        }
      ],
      limit: 10,
      subQuery: false
    });

    //  Filtrar en JavaScript - solo las SIN CONTROL o con control NO COMPLETADO
    const evaluacionesPendientes = evaluaciones.filter(e => {
      // Si no tiene control, la incluye
      if (!e.control_enfermeria) {
        return true;
      }
      // Si tiene control pero NO está COMPLETADO, la incluye
      return e.control_enfermeria.estado !== 'COMPLETADO';
    });

    console.log(' Evaluaciones encontradas:', evaluacionesPendientes.length);

    res.json({
      success: true,
      evaluaciones: evaluacionesPendientes.map(e => ({
        id: e.id,
        paciente: {
          id: e.paciente.id,
          nombre: `${e.paciente.usuario.nombre} ${e.paciente.usuario.apellido}`,
          dni: e.paciente.usuario.dni
        },
        fecha: e.fecha ? new Date(e.fecha).toLocaleString('es-AR') : 'N/A',
        estado_control: e.control_enfermeria?.estado || 'SIN SOLICITAR'
      }))
    });

  } catch (error) {
    console.error('Error al buscar evaluaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar evaluaciones'
    });
  }
};
// Calcular IMC (Índice de Masa Corporal)
exports.calcularIMC = async (req, res, next) => {
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
    next(error);
  }
};

// Obtener historial de controles de un paciente
exports.historialPaciente = async (req, res, next) => {
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
      controles: controles.map(c => {
        const fecha = c.createdAt || c.evaluacion?.created_at;
        const fechaFormato = fecha 
          ? new Date(fecha).toLocaleDateString('es-AR') 
          : 'N/A';
        
        return {
          id: c.id,
          fecha: fechaFormato,
          enfermero: `${c.evaluacion.enfermero.usuario.nombre} ${c.evaluacion.enfermero.usuario.apellido}`,
          peso: c.peso,
          altura: c.altura,
          presion_arterial: c.presion_arterial,
          temperatura: c.temperatura,
          grupo_sanguineo: c.grupo_sanguineo,
          factor_rh: c.factor_rh
        };
      })
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    next(error);
  }
};
exports.formularioEditarControl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const control = await ControlEnfermeria.findByPk(id, {
      include: [
        
        {
          model: Paciente,
          as: 'paciente',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
          }]
        },
        //  Evaluación de enfermería (opcional)
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion',
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

    if (!control) {
      return res.status(404).render('error', {
        message: 'Control de enfermería no encontrado'
      });
    }

    res.render('dashboard/enfermero/controles-editar', {
      title: 'Editar Control',
      user: req.user,
      control
    });

  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    next(error);
  }
};
module.exports = exports;