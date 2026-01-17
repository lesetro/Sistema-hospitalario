const { EvaluacionMedica, 
    RecetaCertificado, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero, 
    EvaluacionEnfermeria, 
    Tratamiento } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar recetas para administración
exports.listarRecetas = async (req, res) => {
  try {
    const { fecha, paciente, estado } = req.query;
    
    const whereCondition = {
      tipo: 'Receta Medica'
    };

    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      whereCondition.fecha = {
        [Op.between]: [fechaInicio, fechaFin]
      };
    }

    const recetas = await RecetaCertificado.findAll({
      where: whereCondition,
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
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      subQuery: false
    });

    for (let receta of recetas) {
      const administracion = await EvaluacionEnfermeria.findOne({
        where: {
          paciente_id: receta.paciente_id,
          observaciones: {
            [Op.like]: `%Receta #${receta.id}%`
          }
        },
        order: [['fecha', 'DESC']]
      });
      
      receta.dataValues.administrada = !!administracion;
      receta.dataValues.ultima_administracion = administracion ? administracion.fecha : null;
    }

    let recetasFiltradas = recetas;
    if (estado === 'administrada') {
      recetasFiltradas = recetas.filter(r => r.dataValues.administrada);
    } else if (estado === 'pendiente') {
      recetasFiltradas = recetas.filter(r => !r.dataValues.administrada);
    }

    const estadisticas = {
      total: recetas.length,
      pendientes: recetas.filter(r => !r.dataValues.administrada).length,
      administradas: recetas.filter(r => r.dataValues.administrada).length,
      hoy: recetas.filter(r => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReceta = new Date(r.fecha);
        fechaReceta.setHours(0, 0, 0, 0);
        return fechaReceta.getTime() === hoy.getTime();
      }).length
    };

    res.render('dashboard/enfermero/medicacion', {
      title: 'Administración de Medicación',
      user: req.user,
      recetas: recetasFiltradas,
      estadisticas,
      filtros: { fecha, paciente, estado }
    });

  } catch (error) {
    console.error('Error al listar recetas:', error);
    res.status(500).render('error', {
      message: 'Error al cargar recetas',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de receta
exports.verReceta = async (req, res) => {
  try {
    const { id } = req.params;

    const receta = await RecetaCertificado.findByPk(id, {
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
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          required: false
        }
      ]
    });

    if (!receta) {
      return res.status(404).render('error', {
        message: 'Receta no encontrada'
      });
    }

    const administraciones = await EvaluacionEnfermeria.findAll({
      where: {
        paciente_id: receta.paciente_id,
        observaciones: {
          [Op.like]: `%Receta #${receta.id}%`
        }
      },
      include: [{
        model: Enfermero,
        as: 'enfermero',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']]
    });

    res.render('dashboard/enfermero/medicacion-detalle', {
      title: 'Detalle de Receta',
      user: req.user,
      receta,
      administraciones
    });

  } catch (error) {
    console.error('Error al ver receta:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para administrar medicación
exports.formularioAdministrar = async (req, res) => {
  try {
    const { id } = req.params;

    const receta = await RecetaCertificado.findByPk(id, {
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
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!receta) {
      return res.status(404).render('error', {
        message: 'Receta no encontrada'
      });
    }

    res.render('dashboard/enfermero/medicacion-administrar', {
      title: 'Administrar Medicación',
      user: req.user,
      receta
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Registrar administración de medicación
exports.registrarAdministracion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const { id } = req.params;
    const {
      medicamentos_administrados,
      via_administracion,
      dosis_administrada,
      hora_administracion,
      signos_vitales_pre,
      signos_vitales_post,
      reacciones_adversas,
      observaciones
    } = req.body;

    const receta = await RecetaCertificado.findByPk(id, { transaction });
    
    if (!receta) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const registroAdministracion = `
=== ADMINISTRACIÓN DE MEDICACIÓN ===
Fecha y hora: ${new Date().toLocaleString('es-AR')}
Enfermero: ${req.user.nombre} ${req.user.apellido}
Receta #${id}

=== MEDICAMENTOS ADMINISTRADOS ===
${medicamentos_administrados}

=== DETALLES ===
Vía de administración: ${via_administracion}
Dosis: ${dosis_administrada}
Hora de administración: ${hora_administracion}

=== SIGNOS VITALES ===
Pre-administración: ${signos_vitales_pre || 'No registrados'}
Post-administración (30 min): ${signos_vitales_post || 'Pendiente'}

${reacciones_adversas ? `\n=== REACCIONES ADVERSAS ===\n${reacciones_adversas}\n` : ''}

=== OBSERVACIONES ===
${observaciones || 'Ninguna'}
    `.trim();

    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id: receta.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: receta.medico_id,
      fecha: new Date(),
      signos_vitales: signos_vitales_pre || null,
      observaciones: registroAdministracion,
      tipo_egreso: reacciones_adversas ? 'DERIVACION_MEDICO' : 'PROCEDIMIENTO_COMPLETADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Administración de medicación registrada correctamente',
      evaluacion_id: evaluacion.id,
      tiene_reacciones: !!reacciones_adversas,
      redirect: `dashboard/enfermero/medicacion/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar administración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la administración',
      error: error.message
    });
  }
};

// Buscar paciente para medicación
exports.buscarPaciente = async (req, res) => {
  try {
    const { busqueda } = req.query;

    if (!busqueda) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    const pacientes = await Paciente.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni'],
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${busqueda}%` } },
            { apellido: { [Op.like]: `%${busqueda}%` } },
            { dni: { [Op.like]: `%${busqueda}%` } }
          ]
        }
      }],
      limit: 10
    });

    const resultado = await Promise.all(pacientes.map(async (paciente) => {
      const recetas = await RecetaCertificado.count({
        where: {
          paciente_id: paciente.id,
          tipo: 'Receta Medica'
        }
      });

      return {
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        recetas_activas: recetas
      };
    }));

    res.json({
      success: true,
      pacientes: resultado
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar paciente'
    });
  }
};

// Obtener recetas de un paciente
exports.recetasPaciente = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const recetas = await RecetaCertificado.findAll({
      where: {
        paciente_id,
        tipo: 'Receta Medica'
      },
      include: [{
        model: Medico,
        as: 'medico',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']]
    });

    res.json({
      success: true,
      recetas: recetas.map(r => ({
        id: r.id,
        fecha: r.fecha,
        contenido: r.contenido,
        medico: `Dr. ${r.medico.usuario.nombre} ${r.medico.usuario.apellido}`
      }))
    });

  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas'
    });
  }
};

// Verificar interacciones medicamentosas (básico)
exports.verificarInteracciones = async (req, res) => {
  try {
    const { medicamentos } = req.body;

    const interaccionesConocidas = {
      'warfarina': ['aspirina', 'ibuprofeno', 'naproxeno'],
      'aspirina': ['warfarina', 'clopidogrel'],
      'metformina': ['alcohol'],
      'enalapril': ['espironolactona', 'amilorida']
    };

    const medicamentosLower = medicamentos.map(m => m.toLowerCase());
    const interacciones = [];

    medicamentosLower.forEach((med, index) => {
      if (interaccionesConocidas[med]) {
        const interaccionesMed = interaccionesConocidas[med];
        medicamentosLower.forEach((otroMed, otroIndex) => {
          if (index !== otroIndex && interaccionesMed.includes(otroMed)) {
            interacciones.push({
              medicamento1: medicamentos[index],
              medicamento2: medicamentos[otroIndex],
              tipo: 'Interacción conocida',
              severidad: 'Media'
            });
          }
        });
      }
    });

    res.json({
      success: true,
      tiene_interacciones: interacciones.length > 0,
      interacciones
    });

  } catch (error) {
    console.error('Error al verificar interacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar interacciones'
    });
  }
};

// Estadísticas de medicación
exports.estadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalRecetas, recetasHoy, administracionesHoy] = await Promise.all([
      RecetaCertificado.count({
        where: { tipo: 'Receta Medica' }
      }),
      RecetaCertificado.count({
        where: {
          tipo: 'Receta Medica',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          fecha: { [Op.gte]: hoy },
          observaciones: { [Op.like]: '%ADMINISTRACIÓN DE MEDICACIÓN%' }
        }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total_recetas: totalRecetas,
        recetas_hoy: recetasHoy,
        administraciones_hoy: administracionesHoy
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