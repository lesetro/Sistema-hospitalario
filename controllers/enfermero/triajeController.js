const { EvaluacionEnfermeria, Paciente, Usuario, Enfermero, ListaEspera, Admision, TipoTurno } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes en triaje
exports.listarTriaje = async (req, res) => {
  try {
    const { nivel, fecha, estado } = req.query;
    
    const whereCondition = {
      nivel_triaje: { [Op.ne]: null }
    };

    // Filtros opcionales
    if (nivel) {
      whereCondition.nivel_triaje = nivel;
    }

    if (estado) {
      whereCondition.tipo_egreso = estado;
    } else {
      // Por defecto mostrar solo pendientes
      whereCondition.tipo_egreso = 'PENDIENTE_EVALUACION';
    }

    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      whereCondition.fecha = {
        [Op.between]: [fechaInicio, fechaFin]
      };
    } else {
      // Por defecto mostrar del día actual
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      whereCondition.fecha = {
        [Op.gte]: hoy
      };
    }

    const pacientesTriaje = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
            }
          ]
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
      ],
      order: [
        ['nivel_triaje', 'ASC'], // Rojo primero
        ['fecha', 'ASC']
      ]
    });

    // Estadísticas de triaje
    const estadisticas = {
      total: pacientesTriaje.length,
      rojo: pacientesTriaje.filter(p => p.nivel_triaje === 'Rojo').length,
      amarillo: pacientesTriaje.filter(p => p.nivel_triaje === 'Amarillo').length,
      verde: pacientesTriaje.filter(p => p.nivel_triaje === 'Verde').length,
      negro: pacientesTriaje.filter(p => p.nivel_triaje === 'Negro').length
    };

    res.render('dashboard/enfermero/triaje', {
      title: 'Triaje',
      user: req.user,
      pacientesTriaje,
      estadisticas,
      filtros: { nivel, fecha, estado }
    });

  } catch (error) {
    console.error('Error al listar triaje:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el triaje',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para registrar nuevo triaje
exports.formularioNuevoTriaje = async (req, res) => {
  try {
    const { paciente_id } = req.query;
    
    let paciente = null;
    if (paciente_id) {
      paciente = await Paciente.findByPk(paciente_id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
        }]
      });
    }

    res.render('dashboard/enfermero/triaje-nuevo', {
      title: 'Nuevo Triaje',
      user: req.user,
      paciente
    });

  } catch (error) {
    console.error('Error al cargar formulario de triaje:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Registrar nuevo triaje
exports.registrarTriaje = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermeroId = req.user.enfermero.id;
    const {
      paciente_id,
      nivel_triaje,
      signos_vitales,
      motivo_consulta,
      observaciones,
      presion_arterial,
      frecuencia_cardiaca,
      temperatura,
      saturacion_oxigeno,
      frecuencia_respiratoria
    } = req.body;

    // Validar que el paciente existe
    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Construir signos vitales
    const signosVitalesTexto = `PA: ${presion_arterial || 'N/A'}, FC: ${frecuencia_cardiaca || 'N/A'}, T: ${temperatura || 'N/A'}°C, SpO2: ${saturacion_oxigeno || 'N/A'}%, FR: ${frecuencia_respiratoria || 'N/A'}`;

    // Crear evaluación de enfermería con triaje
    const evaluacionTriaje = await EvaluacionEnfermeria.create({
      paciente_id,
      enfermero_id: enfermeroId,
      fecha: new Date(),
      nivel_triaje,
      signos_vitales: signosVitalesTexto,
      observaciones: `Motivo: ${motivo_consulta}\n${observaciones || ''}`,
      tipo_egreso: 'PENDIENTE_EVALUACION'
    }, { transaction });

    // Determinar prioridad según nivel de triaje
    let prioridad = 'MEDIA';
    if (nivel_triaje === 'Rojo') prioridad = 'ALTA';
    else if (nivel_triaje === 'Verde' || nivel_triaje === 'Negro') prioridad = 'BAJA';

    // Buscar tipo de turno "Consulta" o crear uno genérico
    let tipoTurno = await TipoTurno.findOne({
      where: { nombre: 'Consulta' },
      transaction
    });

    if (!tipoTurno) {
      tipoTurno = await TipoTurno.create({
        nombre: 'Consulta',
        descripcion: 'Consulta médica general',
        requiere_especialidad: false,
        requiere_estudio: false
      }, { transaction });
    }

    // Crear entrada en lista de espera si es nivel Rojo o Amarillo
    if (nivel_triaje === 'Rojo' || nivel_triaje === 'Amarillo') {
      await ListaEspera.create({
        paciente_id,
        tipo_turno_id: tipoTurno.id,
        prioridad,
        estado: 'PENDIENTE',
        creador_tipo: 'ENFERMERO',
        creador_id: req.user.id,
        fecha_registro: new Date()
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Triaje registrado correctamente',
      evaluacion_id: evaluacionTriaje.id,
      redirect: '/dashboard/enfermero/triaje'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar triaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el triaje',
      error: error.message
    });
  }
};

// Ver detalle de triaje
exports.verTriaje = async (req, res) => {
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
        },
        {
          model: ListaEspera,
          as: 'lista_espera_generada'
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación de triaje no encontrada'
      });
    }

    res.render('dashboard/enfermero/triaje-detalle', {
      title: 'Detalle de Triaje',
      user: req.user,
      evaluacion
    });

  } catch (error) {
    console.error('Error al ver triaje:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle del triaje',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Actualizar triaje
exports.actualizarTriaje = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      nivel_triaje,
      signos_vitales,
      observaciones,
      tipo_egreso
    } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    // Actualizar evaluación
    await evaluacion.update({
      nivel_triaje: nivel_triaje || evaluacion.nivel_triaje,
      signos_vitales: signos_vitales || evaluacion.signos_vitales,
      observaciones: observaciones || evaluacion.observaciones,
      tipo_egreso: tipo_egreso || evaluacion.tipo_egreso
    }, { transaction });

    // Si se deriva a urgencia, actualizar lista de espera
    if (tipo_egreso === 'DERIVACION_URGENCIA') {
      const listaEspera = await ListaEspera.findOne({
        where: { paciente_id: evaluacion.paciente_id },
        order: [['created_at', 'DESC']],
        transaction
      });

      if (listaEspera) {
        await listaEspera.update({
          prioridad: 'ALTA'
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Triaje actualizado correctamente',
      redirect: '/dashboard/enfermero/triaje'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar triaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el triaje',
      error: error.message
    });
  }
};

// Buscar paciente por DNI para triaje
exports.buscarPacientePorDni = async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({
        success: false,
        message: 'DNI requerido'
      });
    }

    const paciente = await Paciente.findOne({
      include: [{
        model: Usuario,
        as: 'usuario',
        where: { dni },
        attributes: ['id', 'nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email']
      }]
    });

    if (!paciente) {
      return res.json({
        success: false,
        message: 'Paciente no encontrado',
        encontrado: false
      });
    }

    res.json({
      success: true,
      encontrado: true,
      paciente: {
        id: paciente.id,
        usuario_id: paciente.usuario_id,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        dni: paciente.usuario.dni,
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        sexo: paciente.usuario.sexo,
        telefono: paciente.usuario.telefono,
        email: paciente.usuario.email
      }
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar el paciente',
      error: error.message
    });
  }
};

// Estadísticas de triaje en tiempo real
exports.estadisticasTriaje = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [total, rojo, amarillo, verde, negro, atendidos, pendientes] = await Promise.all([
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: { [Op.ne]: null },
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: 'Rojo',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: 'Amarillo',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: 'Verde',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: 'Negro',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: { [Op.ne]: null },
          tipo_egreso: { [Op.ne]: 'PENDIENTE_EVALUACION' },
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: { [Op.ne]: null },
          tipo_egreso: 'PENDIENTE_EVALUACION',
          fecha: { [Op.gte]: hoy }
        }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total,
        rojo,
        amarillo,
        verde,
        negro,
        atendidos,
        pendientes
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

module.exports = exports;