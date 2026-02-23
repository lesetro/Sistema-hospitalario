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

// medicacionController.js

exports.listar = async (req, res, next) => {
  try {
    const { estado, fecha, paciente } = req.query;
    
    const whereCondition = {
      tipo: 'Receta Medica'
    };

    // ✅ CAMBIO: Ver PENDIENTE, ADMINISTRADA y CANCELADA
    if (estado === 'PENDIENTE') {
      whereCondition.estado = 'PENDIENTE';
    } else if (estado === 'ADMINISTRADA') {
      whereCondition.estado = 'ADMINISTRADA';
    } else if (estado === 'CANCELADA') {
      whereCondition.estado = 'CANCELADA';
    }
    // Si no especifica, ve TODAS (PENDIENTE + ADMINISTRADA + CANCELADA)

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
          required: true,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
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
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      subQuery: false
    });

    // Filtrar paciente EN MEMORIA
    let recetasFiltradas = recetas;
    if (paciente) {
      recetasFiltradas = recetas.filter(r => 
        r.paciente.usuario.nombre.toLowerCase().includes(paciente.toLowerCase()) ||
        r.paciente.usuario.apellido.toLowerCase().includes(paciente.toLowerCase()) ||
        r.paciente.usuario.dni.includes(paciente)
      );
    }

    // ✅ ESTADÍSTICAS: Incluir CANCELADAS
    const estadisticas = {
      total: recetasFiltradas.length,
      pendientes: recetasFiltradas.filter(r => r.estado === 'PENDIENTE').length,
      administradas: recetasFiltradas.filter(r => r.estado === 'ADMINISTRADA').length,
      canceladas: recetasFiltradas.filter(r => r.estado === 'CANCELADA').length,
      hoy: recetasFiltradas.filter(r => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReceta = new Date(r.fecha);
        fechaReceta.setHours(0, 0, 0, 0);
        return fechaReceta.getTime() === hoy.getTime();
      }).length
    };

    console.log('👩‍⚕️ Enfermero - Medicación');
    console.log('Filtro:', { estado, fecha, paciente });
    console.log('Recetas encontradas:', {
      total: recetas.length,
      pendientes: estadisticas.pendientes,
      administradas: estadisticas.administradas,
      canceladas: estadisticas.canceladas
    });

    res.render('dashboard/enfermero/medicacion', {
      title: 'Administración de Medicación',
      user: req.user,
      recetas: recetasFiltradas,
      estadisticas,
      filtros: { estado, fecha, paciente }
    });

  } catch (error) {
    console.error('❌ Error al listar recetas:', error);
    next(error);
  }
};

exports.verDetalle = async (req, res, next) => {
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
        message: 'Receta no encontrada',
        user: req.user
      });
    }

    const edadPaciente = calcularEdad(receta.paciente.usuario.fecha_nacimiento);

    res.render('dashboard/enfermero/medicacion-detalle', {
      title: 'Detalle de Receta',
      user: req.user,
      receta,
      administraciones: [],  
      edadPaciente
    });

  } catch (error) {
    console.error('Error al ver receta:', error);
    next(error);
  }
};



// Ver detalle de receta (IGUAL, sin cambios)
exports.verReceta = async (req, res, next) => {
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

    //  Usa ESTADO real, no busca en EvaluacionEnfermeria
    const administraciones = [];
    if (receta.estado === 'ADMINISTRADA') {
      
    }

    const edadPaciente = calcularEdad(receta.paciente.usuario.fecha_nacimiento);

    res.render('dashboard/enfermero/medicacion-detalle', {
      title: 'Detalle de Receta',
      user: req.user,
      receta,
      administraciones,
      edadPaciente
    });

  } catch (error) {
    console.error('Error al ver receta:', error);
    next(error);
  }
};



// Ver detalle de receta
exports.verReceta = async (req, res, next) => {
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

    //  CALCULAR LA EDAD AQUÍ
    const edadPaciente = calcularEdad(receta.paciente.usuario.fecha_nacimiento);

    res.render('dashboard/enfermero/medicacion-detalle', {
      title: 'Detalle de Receta',
      user: req.user,
      receta,
      administraciones,
      edadPaciente //  Pasar la edad calculada
    });

  } catch (error) {
    console.error('Error al ver receta:', error);
    next(error);
  }
};
// Formulario para administrar medicación
exports.formularioAdministrar = async (req, res, next) => {
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
    next(error);
  }
};

// Registrar administración de medicación
exports.registrarAdministracion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
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

    // Verificar que la receta no esté ya administrada
    if (receta.estado === 'ADMINISTRADA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta medicación ya ha sido administrada anteriormente'
      });
    }

    // Agregar información de administración al contenido de la receta
    const contenidoActualizado = `${receta.contenido}\n\n=== REGISTRO DE ADMINISTRACIÓN ===\nAdministrado por: ${req.user.nombre} ${req.user.apellido}\nFecha administración: ${new Date().toLocaleString('es-AR')}\nMedicamentos: ${medicamentos_administrados}\nVía: ${via_administracion}\nDosis: ${dosis_administrada}`;

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

    // 1. ACTUALIZAR LA RECETA - Solo campos que existen
    await receta.update({
      estado: 'ADMINISTRADA',
      contenido: contenidoActualizado  // Guardamos el registro en el contenido
    }, { transaction });

    // 2. Crear la evaluación de enfermería
    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id: receta.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: receta.medico_id,
      fecha: new Date(),
      signos_vitales: signos_vitales_pre || null,
      observaciones: registroAdministracion,
      tipo_egreso: reacciones_adversas ? 'DERIVACION_MEDICO' : 'PROCEDIMIENTO_COMPLETADO',
      estado: 'Completado'
    }, { transaction });

    await transaction.commit();

    // 3. Forzar la actualización de la caché si es necesario
    await receta.reload();

    res.json({
      success: true,
      message: 'Administración de medicación registrada correctamente',
      evaluacion_id: evaluacion.id,
      estado_receta: 'ADMINISTRADA',
      tiene_reacciones: !!reacciones_adversas,
      redirect: `/enfermero/medicacion/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar administración:', error);
    next(error);
  }
};
// Buscar paciente para medicación
exports.buscarPaciente = async (req, res, next) => {
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
    next(error);
  }
};

// Obtener recetas de un paciente
exports.recetasPaciente = async (req, res, next) => {
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
    next(error);
  }
};

// Verificar interacciones medicamentosas (básico)
exports.verificarInteracciones = async (req, res, next) => {
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
    next(error);
  }
};

// Estadísticas de medicación
exports.estadisticas = async (req, res, next) => {
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
    next(error);
  }
};

const calcularEdad = (fechaNacimiento) => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};
module.exports = exports;