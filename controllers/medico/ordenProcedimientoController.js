const { ProcedimientoEnfermeria, 
    EvaluacionMedica, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero,
    Sector,
    Tratamiento,
    Diagnostico,
    ObraSocial
  } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');



// CREAR orden de procedimiento
exports.crear = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const medicoId = req.user.medico_id;
    const sectorId = req.user.sector_id;
    
    const {
      evaluacion_medica_id,
      paciente_id,
      nombre,
      descripcion,
      duracion_estimada,
      requiere_preparacion,
      prioridad,
      indicaciones_especificas
    } = req.body;

    // Validar que el paciente esté en el mismo sector del médico
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
      }],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Crear el procedimiento
    const procedimiento = await ProcedimientoEnfermeria.create({
      evaluacion_medica_id,
      medico_id: medicoId,
      paciente_id,
      nombre,
      descripcion: descripcion + (indicaciones_especificas ? `\n\nINDICACIONES ESPECIALES:\n${indicaciones_especificas}` : ''),
      duracion_estimada: duracion_estimada || null,
      requiere_preparacion: requiere_preparacion === 'true' || requiere_preparacion === true,
      estado: 'PENDIENTE',
      prioridad: prioridad || 'NORMAL',
      fecha_orden: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de procedimiento creada correctamente',
      procedimiento_id: procedimiento.id,
      redirect: `/medico/ordenes-procedimiento`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear orden de procedimiento:', error);
    next(error);
  }
};

// EDITAR orden de procedimiento
exports.editar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, { transaction });
    
    if (!procedimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden de procedimiento no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (procedimiento.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar esta orden'
      });
    }

    // Verificar si ya fue ejecutada
    const evaluacionExistente = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id },
      transaction
    });

    if (evaluacionExistente && evaluacionExistente.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un procedimiento ya completado'
      });
    }

    const {
      nombre,
      descripcion,
      duracion_estimada,
      requiere_preparacion,
      prioridad,
      indicaciones_especificas
    } = req.body;

    await procedimiento.update({
      nombre,
      descripcion: descripcion + (indicaciones_especificas ? `\n\nINDICACIONES ESPECIALES:\n${indicaciones_especificas}` : ''),
      duracion_estimada: duracion_estimada || procedimiento.duracion_estimada,
      requiere_preparacion: requiere_preparacion === 'true' || requiere_preparacion === true,
      prioridad: prioridad || procedimiento.prioridad
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de procedimiento actualizada correctamente',
      redirect: `/medico/ordenes-procedimiento/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al editar orden:', error);
    next(error);
  }
};

// ELIMINAR/CANCELAR orden de procedimiento
exports.eliminar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;
    const { motivo_cancelacion } = req.body;

    const procedimiento = await ProcedimientoEnfermeria.findByPk(id, { transaction });
    
    if (!procedimiento) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (procedimiento.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para cancelar esta orden'
      });
    }

    // Verificar si ya fue ejecutada
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

    // Actualizar estado a CANCELADA
    await procedimiento.update({
      estado: 'CANCELADA',
      descripcion: procedimiento.descripcion + `\n\n=== ORDEN CANCELADA ===\nFecha: ${new Date().toLocaleString('es-AR')}\nMédico: Dr. ${req.user.nombre} ${req.user.apellido}\nMotivo: ${motivo_cancelacion || 'Sin motivo especificado'}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden cancelada correctamente',
      redirect: '/medico/ordenes-procedimiento'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar orden:', error);
    next(error);
  }
};

// ============================================
// MÉTODOS COMPARTIDOS (R-ead)
// ============================================

// LISTAR órdenes (Ambos roles, diferente filtro)
exports.listar = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    const sectorId = req.user.sector_id;
    const { estado, prioridad, fecha_inicio, fecha_fin, paciente } = req.query;
    
    const whereCondition = {};
    
    // Si es médico, mostrar solo sus órdenes
    if (userRole === 'MEDICO') {
      whereCondition.medico_id = req.user.medico_id;
    }
    
    
    if (estado) {
      whereCondition.estado = estado;
    }

    if (prioridad) {
      whereCondition.prioridad = prioridad;
    }

    if (fecha_inicio && fecha_fin) {
      whereCondition.fecha_orden = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const procedimientos = await ProcedimientoEnfermeria.findAll({
      where: whereCondition,
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: true,
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
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',
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
      ],
      order: [
        ['prioridad', 'DESC'],
        ['fecha_orden', 'DESC']
      ],
      subQuery: false
    });

    //  Estadísticas 
    const estadisticas = {
      total: procedimientos.length,
      pendientes: procedimientos.filter(p => p.estado === 'PENDIENTE').length,
      completados: procedimientos.filter(p => p.estado === 'COMPLETADO').length,
      cancelados: procedimientos.filter(p => p.estado === 'CANCELADO').length,
      requiere_preparacion: procedimientos.filter(p => p.requiere_preparacion).length
    };

    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-procedimiento-lista'
      : 'dashboard/enfermero/procedimientos';

    res.render(vistaRender, {
      title: userRole === 'MEDICO' ? 'Órdenes de Procedimientos' : 'Procedimientos',
      user: req.user,
      procedimientos,
      estadisticas,
      filtros: { estado, prioridad, fecha_inicio, fecha_fin, paciente }
    });

  } catch (error) {
    console.error('Error al listar órdenes:', error);
    next(error);
  }
};

// VER DETALLE (Ambos roles)
exports.verDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.rol;

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
          as: 'evaluaciones_enfermeria',
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
        message: 'Orden de procedimiento no encontrada',
        user: req.user
      });
    }

    // Renderizar vista según el rol
    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-procedimiento-detalle'
      : 'dashboard/enfermero/procedimientos-detalle';

    res.render(vistaRender, {
      title: 'Detalle de Procedimiento',
      user: req.user,
      procedimiento
    });

  } catch (error) {
    console.error('Error al ver detalle:', error);
    next(error);
  }
};

// Formulario para CREAR (solo médico)
exports.formularioCrear = async (req, res, next) => {
  try {
    const { evaluacion_id, paciente_id } = req.query;

    // Obtener datos del paciente si viene por parámetro
    let paciente = null;
    let evaluacion = null;

    if (paciente_id) {
      paciente = await Paciente.findByPk(paciente_id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      });
    }

    if (evaluacion_id) {
      evaluacion = await EvaluacionMedica.findByPk(evaluacion_id);
    }

    res.render('dashboard/medico/ordenes-procedimiento-crear', {
      title: 'Crear Orden de Procedimiento',
      user: req.user,
      paciente,
      evaluacion
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    next(error);
  }
};

// Formulario para EDITAR (solo médico)
exports.formularioEditar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

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
              attributes: ['nombre', 'apellido', 'dni']
            }]
          }]
        }
      ]
    });

    if (!procedimiento) {
      return res.status(404).render('error', {
        message: 'Orden no encontrada',
        user: req.user
      });
    }

    // Verificar que sea el médico que creó la orden
    if (procedimiento.medico_id !== medicoId) {
      return res.status(403).render('error', {
        message: 'No tiene permisos para editar esta orden',
        user: req.user
      });
    }

    // Verificar si ya fue ejecutada
    const evaluacionExistente = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_enfermeria_id: id }
    });

    if (evaluacionExistente && evaluacionExistente.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO') {
      return res.redirect(`/medico/ordenes-procedimiento/${id}`);
    }

    res.render('dashboard/medico/ordenes-procedimiento-editar', {
      title: 'Editar Orden de Procedimiento',
      user: req.user,
      procedimiento
    });

  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    next(error);
  }
};


// API: Obtener órdenes pendientes para un paciente específico (para modales)
exports.obtenerOrdenesPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;

    const ordenes = await ProcedimientoEnfermeria.findAll({
      where: {
        paciente_id,
        estado: 'PENDIENTE'
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
      order: [
        ['prioridad', 'DESC'],
        ['fecha_orden', 'ASC']
      ]
    });

    res.json({
      success: true,
      total: ordenes.length,
      ordenes: ordenes.map(o => ({
        id: o.id,
        nombre: o.nombre,
        descripcion: o.descripcion,
        prioridad: o.prioridad,
        duracion_estimada: o.duracion_estimada,
        requiere_preparacion: o.requiere_preparacion,
        medico: `Dr. ${o.medico.usuario.nombre} ${o.medico.usuario.apellido}`,
        fecha_orden: o.fecha_orden
      }))
    });

  } catch (error) {
    console.error('Error al obtener órdenes del paciente:', error);
    next(error);
  }
};
// ========================================
// BUSCAR PACIENTE CON SUS EVALUACIONES
// PARA EL FORMULARIO DE ÓRDENES
// ========================================

exports.buscarPacienteConEvaluaciones = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Buscando paciente con término:', q); 
    
    if (!q || q.length < 3) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0
      });
    }

    // 1️⃣ BUSCAR PACIENTES - SIN FILTRO DE ESTADO PROBLEMÁTICO
    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          required: true, // IMPORTANTE: inner join
          attributes: ['id', 'dni', 'nombre', 'apellido', 'fecha_nacimiento', 'sexo'],
          where: {
            [Op.or]: [
              { dni: { [Op.like]: `%${q}%` } },
              { nombre: { [Op.like]: `%${q}%` } },
              { apellido: { [Op.like]: `%${q}%` } }
            ]
          }
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      // where: { estado: 'Activo' }, // 👈 COMENTADO - ¡ELIMINADO!
      limit: 10,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    console.log(`✅ Encontrados ${pacientes.length} pacientes`); // DEBUG

    // 2️⃣ Si NO hay pacientes, devolver vacío
    if (pacientes.length === 0) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0,
        message: 'No se encontraron pacientes'
      });
    }

    // 3️⃣ BUSCAR EVALUACIONES para cada paciente
    const pacientesConEvaluaciones = await Promise.all(
      pacientes.map(async (paciente) => {
        const evaluaciones = await EvaluacionMedica.findAll({
          where: { paciente_id: paciente.id },
          include: [
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
              model: Diagnostico,
              as: 'diagnostico',
              attributes: ['codigo', 'nombre'],
              required: false
            }
          ],
          order: [['fecha', 'DESC']],
          limit: 10
        });

        return {
          id: paciente.id,
          usuario_id: paciente.usuario.id,
          nombre_completo: `${paciente.usuario.apellido}, ${paciente.usuario.nombre}`,
          nombre: paciente.usuario.nombre,
          apellido: paciente.usuario.apellido,
          dni: paciente.usuario.dni,
          fecha_nacimiento: paciente.usuario.fecha_nacimiento,
          edad: calcularEdad(paciente.usuario.fecha_nacimiento),
          sexo: paciente.usuario.sexo,
          obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
          obra_social_id: paciente.obraSocial?.id,
          estado: paciente.estado,
          evaluaciones: evaluaciones.map(e => ({
            id: e.id,
            fecha: e.fecha,
            fecha_formateada: new Date(e.fecha).toLocaleDateString('es-AR'),
            motivo: e.motivo_consulta || 'Sin motivo',
            diagnostico: e.diagnostico_presuntivo || e.diagnostico?.nombre,
            medico: e.medico ? 
              `Dr. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}` : 
              'No asignado'
          }))
        };
      })
    );

    res.json({
      success: true,
      pacientes: pacientesConEvaluaciones,
      total: pacientesConEvaluaciones.length,
      message: `Se encontraron ${pacientesConEvaluaciones.length} paciente(s)`
    });

  } catch (error) {
    console.error('❌ Error en búsqueda con evaluaciones:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al buscar pacientes',
      pacientes: []
    });
  }
};

// Función auxiliar calcular edad
function calcularEdad(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}


module.exports = exports;