const { 
  EvaluacionEnfermeria,
  Paciente,
  Usuario, 
  Enfermero, 
  ListaEspera, 
  TipoTurno ,
  Sector, 
  Turno,  
  Medico,
  TipoDeServicio 
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes en triaje
exports.listarTriaje = async (req, res, next) => {
  try {
    const { nivel, fecha, estado, mostrar_turnos } = req.query;
    
    console.log('🔍 Iniciando listarTriaje para enfermero:', req.user?.usuario_id);
    
    // 1. Obtener el enfermero con su sector
    const enfermero = await Enfermero.findOne({
      where: { usuario_id: req.user?.usuario_id },
      include: [{ 
        model: Sector, 
        as: 'sector',
        attributes: ['id', 'nombre', 'descripcion']
      }]
    });

    if (!enfermero) {
      return res.status(404).render('error', {
        message: 'Enfermero no encontrado en el sistema'
      });
    }

    // Crear objeto enfermeroInfo con valores por defecto
    const enfermeroInfo = {
      nombre: req.user?.nombre || 'Enfermero/a',
      apellido: req.user?.apellido || '',
      sector: enfermero.sector?.nombre || 'Sin sector asignado',
      sector_id: enfermero.sector_id,
      descripcion: enfermero.sector?.descripcion || ''
    };

    console.log(`✅ Enfermero: ${enfermero.id}, Sector: ${enfermero.sector_id} (${enfermeroInfo.sector})`);

    // 2. Obtener turnos del sector si tiene asignado
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    let turnosSector = [];
    
    if (enfermero.sector_id) {
      turnosSector = await Turno.findAll({
        where: {
          sector_id: enfermero.sector_id,
          fecha: fechaFiltro,
          estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] }
        },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'sexo', 'telefono']
            }]
          },
          {
            model: Medico,
            as: 'medico',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }],
            required: false
          },
          {
            model: TipoDeServicio,
            as: 'tipo_servicio',
            attributes: ['id', 'nombre', 'descripcion']
          }
        ],
        order: [
          ['hora_inicio', 'ASC']
        ]
      });
    }

    console.log(`📅 Turnos del sector ${enfermeroInfo.sector}: ${turnosSector.length}`);

    // 3. Obtener evaluaciones de triaje
    const whereTriaje = {
      nivel_triaje: { [Op.ne]: null }
    };

    // Filtrar por fecha si se especifica
    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      whereTriaje.fecha = { [Op.between]: [fechaInicio, fechaFin] };
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      whereTriaje.fecha = { [Op.gte]: hoy };
    }

    if (nivel) whereTriaje.nivel_triaje = nivel;
    if (estado) {
      whereTriaje.tipo_egreso = estado;
    }

    const pacientesTriaje = await EvaluacionEnfermeria.findAll({
      where: whereTriaje,
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
      ],
      order: [['nivel_triaje', 'ASC'], ['fecha', 'ASC']]
    });

    // 4. Obtener estadísticas (con valores por defecto)
    const estadisticas = {
      sector: enfermeroInfo.sector,
      turnosHoy: turnosSector.length,
      turnosPendientes: turnosSector.filter(t => t.estado === 'PENDIENTE').length,
      turnosConfirmados: turnosSector.filter(t => t.estado === 'CONFIRMADO').length,
      triajesHoy: pacientesTriaje.length,
      rojo: pacientesTriaje.filter(p => p.nivel_triaje === 'Rojo').length,
      amarillo: pacientesTriaje.filter(p => p.nivel_triaje === 'Amarillo').length,
      verde: pacientesTriaje.filter(p => p.nivel_triaje === 'Verde').length,
      negro: pacientesTriaje.filter(p => p.nivel_triaje === 'Negro').length
    };

    // 5. Crear objeto de filtros
    const filtros = { 
      nivel: nivel || '', 
      fecha: fechaFiltro, 
      estado: estado || '',
      mostrar_turnos: mostrar_turnos || 'false'
    };

    // 6. Renderizar vista con TODAS las variables necesarias
    res.render('dashboard/enfermero/triaje', {
      title: `Triaje - ${enfermeroInfo.sector}`,
      user: req.user || {},
      turnosSector: turnosSector || [],
      pacientesTriaje: pacientesTriaje || [],
      estadisticas: estadisticas,
      filtros: filtros,
      enfermeroInfo: enfermeroInfo,
      hoy: new Date().toISOString().split('T')[0],
      mostrarTurnos: mostrar_turnos === 'true' || turnosSector.length > 0,
      error: null  // Variable por si hay errores
    });

  } catch (error) {
    console.error('❌ Error en listarTriaje:', error);
    // Renderizar con error
    res.render('dashboard/enfermero/triaje', {
      title: 'Triaje - Error',
      user: req.user || {},
      turnosSector: [],
      pacientesTriaje: [],
      estadisticas: {
        sector: 'Error',
        turnosHoy: 0,
        turnosPendientes: 0,
        turnosConfirmados: 0,
        triajesHoy: 0,
        rojo: 0,
        amarillo: 0,
        verde: 0,
        negro: 0
      },
      filtros: {},
      enfermeroInfo: {
        nombre: req.user?.nombre || 'Enfermero/a',
        sector: 'Error al cargar sector'
      },
      hoy: new Date().toISOString().split('T')[0],
      mostrarTurnos: false,
      error: 'Error al cargar los datos. Intente nuevamente.'
    });
  }
};

// Formulario para nuevo triaje
exports.formularioNuevoTriaje = async (req, res, next) => {
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
      user: req.user || {},
      paciente: paciente,
      error: null
    });

  } catch (error) {
    console.error('❌ Error en formularioNuevoTriaje:', error);
    res.render('dashboard/enfermero/triaje-nuevo', {
      title: 'Nuevo Triaje - Error',
      user: req.user || {},
      paciente: null,
      error: 'Error al cargar el formulario'
    });
  }
};

// Registrar nuevo triaje
exports.registrarTriaje = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermero = await Enfermero.findOne({
      where: { usuario_id: req.user?.usuario_id }
    });
    
    if (!enfermero) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pudo identificar al enfermero. Vuelva a iniciar sesión.'
      });
    }
    
    const enfermeroId = enfermero.id;
    
    const {
      paciente_id,
      nivel_triaje,
      motivo_consulta,
      observaciones,
      presion_arterial,
      frecuencia_cardiaca,
      temperatura,
      saturacion_oxigeno,
      frecuencia_respiratoria
    } = req.body;

    // Validaciones básicas
    if (!paciente_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar un paciente'
      });
    }

    if (!nivel_triaje) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar un nivel de triaje'
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

    // Crear texto de signos vitales
    const signosVitalesTexto = `PA: ${presion_arterial || 'N/A'}, FC: ${frecuencia_cardiaca || 'N/A'}, T: ${temperatura || 'N/A'}°C, SpO2: ${saturacion_oxigeno || 'N/A'}%, FR: ${frecuencia_respiratoria || 'N/A'}`;
    const observacionesTexto = `Motivo: ${motivo_consulta || 'No especificado'}\n${observaciones || ''}`;

    // Crear evaluación de triaje
    const evaluacionTriaje = await EvaluacionEnfermeria.create({
      paciente_id: parseInt(paciente_id),
      enfermero_id: parseInt(enfermeroId),
      fecha: new Date(),
      nivel_triaje,
      signos_vitales: signosVitalesTexto,
      observaciones: observacionesTexto,
      tipo_egreso: 'PENDIENTE_EVALUACION'
    }, { transaction });

    // Agregar a lista de espera si corresponde
    if (nivel_triaje === 'Rojo' || nivel_triaje === 'Amarillo') {
      const prioridad = nivel_triaje === 'Rojo' ? 'ALTA' : 'MEDIA';
      
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

      await ListaEspera.create({
        paciente_id: parseInt(paciente_id),
        tipo_turno_id: tipoTurno.id,
        prioridad,
        estado: 'PENDIENTE',
        creador_tipo: 'ENFERMERO',
        creador_id: req.user?.usuario_id,
        fecha_registro: new Date()
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Triaje registrado correctamente',
      evaluacion_id: evaluacionTriaje.id,
      redirect: '/enfermero/triaje'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al registrar triaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el triaje. Intente nuevamente.'
    });
  }
};

exports.verTriaje = async (req, res, next) => {
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
        }
      ]
    });

    if (!evaluacion) {
      const error = new Error('Evaluación de triaje no encontrada');
      error.status = 404;
      return next(error);
    }

    res.render('dashboard/enfermero/triaje-detalle', {
      title: 'Detalle de Triaje',
      user: req.user,
      evaluacion
    });

  } catch (error) {
    next(error);
  }
};

// Actualizar triaje
exports.actualizarTriaje = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nivel_triaje, signos_vitales, observaciones, tipo_egreso } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    await evaluacion.update({
      nivel_triaje: nivel_triaje || evaluacion.nivel_triaje,
      signos_vitales: signos_vitales || evaluacion.signos_vitales,
      observaciones: observaciones || evaluacion.observaciones,
      tipo_egreso: tipo_egreso || evaluacion.tipo_egreso
    }, { transaction });

    if (tipo_egreso === 'DERIVACION_URGENCIA') {
      const listaEspera = await ListaEspera.findOne({
        where: { paciente_id: evaluacion.paciente_id },
        order: [['created_at', 'DESC']],
        transaction
      });

      if (listaEspera) {
        await listaEspera.update({ prioridad: 'ALTA' }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Triaje actualizado correctamente',
      redirect: '/enfermero/triaje'  
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Buscar paciente por DNI
exports.buscarPacientePorDni = async (req, res, next) => {
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

    // Calcular edad
    const fechaNac = new Date(paciente.usuario.fecha_nacimiento);
    const hoy = new Date();
    const edad = Math.floor((hoy - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));

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
        edad,
        sexo: paciente.usuario.sexo,
        telefono: paciente.usuario.telefono,
        email: paciente.usuario.email
      }
    });

  } catch (error) {
    next(error);
  }
};

// Estadísticas de triaje
exports.estadisticasTriaje = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [total, rojo, amarillo, verde, negro, atendidos, pendientes] = await Promise.all([
      EvaluacionEnfermeria.count({ where: { nivel_triaje: { [Op.ne]: null }, fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: 'Rojo', fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: 'Amarillo', fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: 'Verde', fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: 'Negro', fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: { [Op.ne]: null }, tipo_egreso: { [Op.ne]: 'PENDIENTE_EVALUACION' }, fecha: { [Op.gte]: hoy } } }),
      EvaluacionEnfermeria.count({ where: { nivel_triaje: { [Op.ne]: null }, tipo_egreso: 'PENDIENTE_EVALUACION', fecha: { [Op.gte]: hoy } } })
    ]);

    res.json({
      success: true,
      estadisticas: { total, rojo, amarillo, verde, negro, atendidos, pendientes }
    });

  } catch (error) {
    next(error);
  }
};
exports.completarTriaje = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observaciones_finales } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    await evaluacion.update({
      tipo_egreso: 'PROCEDIMIENTO_COMPLETADO',
      observaciones: `${evaluacion.observaciones || ''}\n\n--- Completado ---\n${observaciones_finales || 'Sin observaciones adicionales'}`
    }, { transaction });

    await transaction.commit();

    res.json({ success: true, message: 'Triaje completado correctamente' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Derivar a médico
exports.derivarMedico = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo_derivacion, urgente } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    const tipoEgreso = urgente === 'true' ? 'DERIVACION_URGENCIA' : 'DERIVACION_MEDICO';

    await evaluacion.update({
      tipo_egreso: tipoEgreso,
      observaciones: `${evaluacion.observaciones || ''}\n\n--- Derivado ---\nMotivo: ${motivo_derivacion}`
    }, { transaction });

    await transaction.commit();

    res.json({ success: true, message: 'Paciente derivado correctamente' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
// ========================================
// FORMULARIO EDITAR TRIAJE
// ========================================
exports.editarTriaje = async (req, res, next) => {
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
          }],
          required: false
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación de triaje no encontrada',
        error: { status: 404 }
      });
    }

    // Parsear signos vitales si existen
    let signosVitales = {
      presion_arterial: '',
      frecuencia_cardiaca: '',
      temperatura: '',
      saturacion_oxigeno: '',
      frecuencia_respiratoria: ''
    };

    if (evaluacion.signos_vitales) {
      const sv = evaluacion.signos_vitales;
      // Parsear formato: "PA: 120/80, FC: 75, T: 36.5°C, SpO2: 98%, FR: 16"
      const paMatch = sv.match(/PA:\s*([^,]+)/);
      const fcMatch = sv.match(/FC:\s*([^,]+)/);
      const tMatch = sv.match(/T:\s*([^°]+)/);
      const spo2Match = sv.match(/SpO2:\s*([^%]+)/);
      const frMatch = sv.match(/FR:\s*([^,]+)/);

      if (paMatch) signosVitales.presion_arterial = paMatch[1].trim();
      if (fcMatch) signosVitales.frecuencia_cardiaca = fcMatch[1].trim();
      if (tMatch) signosVitales.temperatura = tMatch[1].trim();
      if (spo2Match) signosVitales.saturacion_oxigeno = spo2Match[1].trim();
      if (frMatch) signosVitales.frecuencia_respiratoria = frMatch[1].trim();
    }

    // Parsear observaciones para extraer motivo
    let motivo_consulta = '';
    let observaciones = evaluacion.observaciones || '';
    
    if (observaciones.startsWith('Motivo:')) {
      const lines = observaciones.split('\n');
      motivo_consulta = lines[0].replace('Motivo:', '').trim();
      observaciones = lines.slice(1).join('\n').trim();
    }

    res.render('dashboard/enfermero/triaje-editar', {
      title: 'Editar Triaje',
      user: req.user,
      evaluacion,
      signosVitales,
      motivo_consulta,
      observaciones_limpias: observaciones,
      error: null
    });

  } catch (error) {
    console.error('❌ Error al cargar triaje para editar:', error);
    next(error);
  }
};

module.exports = exports;