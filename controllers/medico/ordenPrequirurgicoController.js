const { ProcedimientoPreQuirurgico, 
    EvaluacionMedica, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero,
    TipoDeServicio,
    Sector,
    ObraSocial,
    TipoInternacion,
    IntervencionQuirurgica,
    Internacion,
    Cama,
    Habitacion,
    ListaEspera,
    TipoTurno,
    Notificacion,
    HistorialMedico
  
    } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ============================================
// MÉTODOS PARA EL MÉDICO (C-U-D)
// ============================================

// CREAR orden pre-quirúrgica
exports.crear = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const medicoId = req.user.medico_id;
    const sectorId = req.user.sector_id;
    
    const {
      evaluacion_medica_id,
      paciente_id,
      intervencion_quirurgica_id,
      nombre,
      descripcion,
      prioridad,
      checklist_requerido,
      observaciones_especiales
    } = req.body;

    // Validar que el paciente existe
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

    //  Verificar que evaluacion_medica_id existe
    if (!evaluacion_medica_id || evaluacion_medica_id === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El ID de evaluación médica es requerido'
      });
    }

    // Verificar que la evaluación médica existe en la BD
    const evaluacionMedica = await EvaluacionMedica.findByPk(evaluacion_medica_id, { transaction });
    
    if (!evaluacionMedica) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'La evaluación médica especificada no existe'
      });
    }

    // Construir descripción completa
    let descripcionCompleta = descripcion || 'Preparación pre-quirúrgica estándar';
    
    if (observaciones_especiales) {
      descripcionCompleta += `\n\n=== OBSERVACIONES ESPECIALES DEL MÉDICO ===\n${observaciones_especiales}`;
    }

    if (checklist_requerido) {
      descripcionCompleta += '\n\n=== CHECKLIST REQUERIDO ===\n' + checklist_requerido;
    }

    // Crear el procedimiento pre-quirúrgico
    const prequirurgico = await ProcedimientoPreQuirurgico.create({
      evaluacion_medica_id, 
      medico_id: medicoId,
      paciente_id,
      nombre: nombre || 'Preparación Pre-quirúrgica',
      descripcion: descripcionCompleta,
      estado: 'Pendiente',
      prioridad: prioridad || 'ALTA',
      fecha_orden: new Date()
    }, { transaction });

    // Si hay intervención quirúrgica asociada, vincularla
    if (intervencion_quirurgica_id) {
      const intervencion = await IntervencionQuirurgica.findByPk(intervencion_quirurgica_id, { transaction });
      if (intervencion) {
        await intervencion.update({
          procedimiento_pre_quirurgico_id: prequirurgico.id
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de preparación pre-quirúrgica creada correctamente',
      prequirurgico_id: prequirurgico.id,
      redirect: `/medico/ordenes-prequirurgico`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear orden pre-quirúrgica:', error);
    next(error);
  }
};

// EDITAR orden pre-quirúrgica
exports.editar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const prequirurgico = await ProcedimientoPreQuirurgico.findByPk(id, { transaction });
    
    if (!prequirurgico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden pre-quirúrgica no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (prequirurgico.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar esta orden'
      });
    }

    // No permitir editar si ya fue completada
    if (prequirurgico.estado === 'Completado') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una preparación ya completada'
      });
    }

    const {
      nombre,
      descripcion,
      prioridad,
      checklist_requerido,
      observaciones_especiales
    } = req.body;

    // Construir nueva descripción
    let descripcionCompleta = descripcion || prequirurgico.descripcion;
    
    if (observaciones_especiales) {
      descripcionCompleta += `\n\n=== OBSERVACIONES ESPECIALES DEL MÉDICO (Actualizado) ===\n${observaciones_especiales}`;
    }

    if (checklist_requerido) {
      descripcionCompleta += '\n\n=== CHECKLIST REQUERIDO (Actualizado) ===\n' + checklist_requerido;
    }

    await prequirurgico.update({
      nombre: nombre || prequirurgico.nombre,
      descripcion: descripcionCompleta,
      prioridad: prioridad || prequirurgico.prioridad
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden pre-quirúrgica actualizada correctamente',
      redirect: `/medico/ordenes-prequirurgico/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al editar orden pre-quirúrgica:', error);
    next(error);
  }
};

// ELIMINAR/CANCELAR orden pre-quirúrgica
exports.eliminar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;
    const { motivo_cancelacion } = req.body;

    const prequirurgico = await ProcedimientoPreQuirurgico.findByPk(id, { transaction });
    
    if (!prequirurgico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (prequirurgico.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para cancelar esta orden'
      });
    }

    // No permitir cancelar si ya fue completada
    if (prequirurgico.estado === 'Completado') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una preparación ya completada'
      });
    }

    // Actualizar estado a Cancelada
    await prequirurgico.update({
      estado: 'Cancelada',
      descripcion: prequirurgico.descripcion + `\n\n=== ORDEN CANCELADA ===\nFecha: ${new Date().toLocaleString('es-AR')}\nMédico: Dr. ${req.user.nombre} ${req.user.apellido}\nMotivo: ${motivo_cancelacion || 'Sin motivo especificado'}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden pre-quirúrgica cancelada correctamente',
      redirect: '/medico/ordenes-prequirurgico'
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

// LISTAR órdenes pre-quirúrgicas (Ambos roles)
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
    
    // Si es enfermero, mostrar solo pendientes
    if (userRole === 'ENFERMERO') {
      whereCondition.estado = 'Pendiente';
    }
    
    if (estado && userRole === 'MEDICO') {
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

    const procedimientos = await ProcedimientoPreQuirurgico.findAll({
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
          model: EvaluacionEnfermeria,
          as: 'evaluacion_enfermeria',
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
        ['estado', 'ASC'],
        ['fecha_orden', 'DESC']
      ],
      subQuery: false
    });

    // Estadísticas
    const estadisticas = {
      total: procedimientos.length,
      pendientes: procedimientos.filter(p => p.estado === 'Pendiente').length,
      completados: procedimientos.filter(p => p.estado === 'Completado').length,
      cancelados: procedimientos.filter(p => p.estado === 'Cancelada').length,
      urgentes: procedimientos.filter(p => p.prioridad === 'URGENTE' && p.estado === 'Pendiente').length
    };

    // Renderizar vista según el rol
    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-prequirurgico-lista'
      : 'dashboard/enfermero/prequirurgicos';

    res.render(vistaRender, {
      title: userRole === 'MEDICO' ? 'Órdenes Pre-quirúrgicas' : 'Preparación Pre-quirúrgica',
      user: req.user,
      procedimientos,
      estadisticas,
      filtros: { estado, prioridad, fecha_inicio, fecha_fin, paciente }
    });

  } catch (error) {
    console.error('Error al listar órdenes pre-quirúrgicas:', error);
    next(error);
  }
};

// VER DETALLE (Ambos roles)
exports.verDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.rol;

    const procedimiento = await ProcedimientoPreQuirurgico.findByPk(id, {
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
            },
            {
              
              model: IntervencionQuirurgica,
              as: 'intervenciones_quirurgicas', 
              required: false,
              separate: true,
              limit: 1
            }
          ]
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion_enfermeria',
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
        message: 'Orden pre-quirúrgica no encontrada',
        user: req.user
      });
    }

    // Renderizar vista según el rol
    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-prequirurgico-detalle'
      : 'dashboard/enfermero/prequirurgicos-detalle';

    // Extraer la intervención del include
    const intervencion = procedimiento.evaluacion_medica?.intervenciones?.[0];

    res.render(vistaRender, {
      title: 'Detalle Pre-quirúrgico',
      user: req.user,
      procedimiento,
      intervencion // Pasamos la intervención extraída
    });

  } catch (error) {
    console.error('Error al ver detalle pre-quirúrgico:', error);
    next(error);
  }
};

// Formulario para CREAR (solo médico)
exports.formularioCrear = async (req, res, next) => {
  try {
    const { evaluacion_id, paciente_id, intervencion_id } = req.query;

    // Obtener datos del paciente si viene por parámetro
    let paciente = null;
    let evaluacion = null;
    let intervencion = null;

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

    if (intervencion_id) {
      intervencion = await IntervencionQuirurgica.findByPk(intervencion_id);
    }

    res.render('dashboard/medico/ordenes-prequirurgico-crear', {
      title: 'Crear Orden Pre-quirúrgica',
      user: req.user,
      paciente,
      evaluacion,
      intervencion
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

    const procedimiento = await ProcedimientoPreQuirurgico.findByPk(id, {
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

    // No permitir editar si ya fue completada
    if (procedimiento.estado === 'Completado') {
      return res.redirect(`/medico/ordenes-prequirurgico/${id}`);
    }

    res.render('dashboard/medico/ordenes-prequirurgico-editar', {
      title: 'Editar Orden Pre-quirúrgica',
      user: req.user,
      procedimiento
    });

  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    next(error);
  }
};

// API: Obtener órdenes pre-quirúrgicas pendientes para un paciente
exports.obtenerOrdenesPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;

    const ordenes = await ProcedimientoPreQuirurgico.findAll({
      where: {
        paciente_id,
        estado: 'Pendiente'
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
        estado: o.estado,
        medico: `Dr. ${o.medico.usuario.nombre} ${o.medico.usuario.apellido}`,
        fecha_orden: o.fecha_orden
      }))
    });

  } catch (error) {
    console.error('Error al obtener órdenes pre-quirúrgicas del paciente:', error);
    next(error);
  }
};
// ========================================
// BUSCAR PACIENTE CON SUS EVALUACIONES


exports.buscarPacienteConEvaluaciones = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    console.log(' Buscando paciente para orden pre-quirúrgica:', q);
    
    if (!q || q.length < 3) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0
      });
    }

    // Buscar pacientes
    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          required: true,
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
      limit: 10,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    console.log(` Encontrados ${pacientes.length} pacientes`);

    if (pacientes.length === 0) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0,
        message: 'No se encontraron pacientes'
      });
    }

    // Buscar evaluaciones médicas para cada paciente
    const pacientesConDatos = await Promise.all(
      pacientes.map(async (paciente) => {
        // Buscar evaluaciones médicas recientes
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
            }
          ],
          order: [['fecha', 'DESC']],
          limit: 10
        });

        // Buscar intervenciones quirúrgicas
        let intervenciones = [];
        try {
          if (IntervencionQuirurgica) {
            intervenciones = await IntervencionQuirurgica.findAll({
              where: { paciente_id: paciente.id },
              limit: 5
            });
          }
        } catch (error) {
          console.log('Error al buscar intervenciones:', error.message);
          intervenciones = []; 
        }

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
          //  AHORA SIEMPRE INCLUIMOS LAS EVALUACIONES
          evaluaciones: evaluaciones.map(e => ({
            id: e.id,
            fecha: e.fecha,
            fecha_formateada: e.fecha ? new Date(e.fecha).toLocaleDateString('es-AR') : 'Sin fecha',
            motivo: e.motivo_consulta || 'Sin motivo',
            diagnostico: e.diagnostico_presuntivo || 'Sin diagnóstico',
            medico: e.medico ? 
              `Dr. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}` : 
              'No asignado',
            // Campo para mostrar en el select
            display: `Evaluación del ${e.fecha ? new Date(e.fecha).toLocaleDateString('es-AR') : 'N/A'} - ${e.motivo_consulta || 'Sin motivo'}`
          })),
          intervenciones: intervenciones.map(i => ({
            id: i.id,
            nombre: i.tipo_procedimiento || 'Intervención quirúrgica',
            fecha_inicio: i.fecha_inicio,
            fecha_formateada: i.fecha_inicio ? 
              new Date(i.fecha_inicio).toLocaleDateString('es-AR') : 
              'No programada',
            tipo: i.tipo_procedimiento
          }))
        };
      })
    );

    res.json({
      success: true,
      pacientes: pacientesConDatos,
      total: pacientesConDatos.length,
      message: `Se encontraron ${pacientesConDatos.length} paciente(s)`
    });

  } catch (error) {
    console.error('❌ Error en búsqueda de pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar pacientes',
      pacientes: []
    });
  }
};

function calcularEdad(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// ========================================
// ENVIAR A CIRUGÍA DESDE PRE-QUIRÚRGICO
// ========================================

exports.enviarACirugia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params; // ID del procedimiento pre-quirúrgico
    const { 
      quirofano_id,
      tipo_procedimiento,
      observaciones,
      prioridad = 'ALTA'
    } = req.body;
    
    const medicoId = req.user.medico_id;
    const usuarioId = req.user.usuario_id;
    
    console.log(`🔪 Enviando pre-quirúrgico ${id} a cirugía`);
    
    // ========================================
    // 1. OBTENER PROCEDIMIENTO PRE-QUIRÚRGICO
    // ========================================
    const prequirurgico = await ProcedimientoPreQuirurgico.findByPk(id, {
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [{
            model: Paciente,
            as: 'paciente',
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'dni'] }]
          }]
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion_enfermeria',
          required: false
        },
        {
          model: Paciente,
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'dni'] }]
        }
      ],
      transaction
    });
    
    if (!prequirurgico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Procedimiento pre-quirúrgico no encontrado'
      });
    }
    
    // ========================================
    // 2. VALIDAR QUE EL CHECKLIST ESTÉ COMPLETADO
    // ========================================
    if (prequirurgico.estado !== 'Completado') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El checklist pre-quirúrgico debe estar completado antes de enviar a cirugía',
        estado_actual: prequirurgico.estado
      });
    }
    
    // Obtener paciente (puede venir de evaluacion_medica o directamente)
    const paciente = prequirurgico.paciente || prequirurgico.evaluacion_medica?.paciente;
    
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'No se pudo identificar al paciente'
      });
    }
    
    // ========================================
    // 3. BUSCAR INTERNACIÓN PRE-QUIRÚRGICA ACTIVA
    // ========================================
    const internacion = await Internacion.findOne({
      where: {
        paciente_id: paciente.id,
        es_prequirurgica: true,
        fecha_alta: null
      },
      include: [
        { model: Cama, as: 'cama' },
        { model: Habitacion, as: 'habitacion' }
      ],
      transaction
    });
    
    // ========================================
    // 4. BUSCAR/VALIDAR QUIRÓFANO
    // ========================================
    let quirofano = null;
    if (quirofano_id) {
      quirofano = await Habitacion.findByPk(quirofano_id, { transaction });
      if (!quirofano) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Quirófano no encontrado'
        });
      }
    } else {
      // Buscar quirófano de cirugía disponible
      quirofano = await Habitacion.findOne({
        include: [{
          model: TipoDeServicio,
          as: 'tipoServicio',
          where: { 
            nombre: { [Op.like]: '%Cirug%' }  // Busca "Cirugía de Urgencia"
          }
        }],
        transaction
      });
      
      if (!quirofano) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'No hay quirófanos disponibles. Contacte al administrativo.',
          tipo: 'SIN_QUIROFANO'
        });
      }
    }
    
    // ========================================
    // 5. CREAR LISTA DE ESPERA PARA CIRUGÍA
    // ========================================
    const tipoTurnoCirugia = await TipoTurno.findOne({
      where: { nombre: { [Op.like]: '%CIRUG%' } },
      transaction
    });
    
    const listaEsperaCirugia = await ListaEspera.create({
      paciente_id: paciente.id,
      tipo_turno_id: tipoTurnoCirugia?.id || 1,
      prioridad: prioridad,
      estado: 'PENDIENTE',
      habitacion_id: quirofano.id,
      fecha_registro: new Date(),
      creador_tipo: 'MEDICO',
      creador_id: usuarioId,
      observaciones: `Enviado a cirugía desde pre-quirúrgico #${prequirurgico.id}. ${observaciones || ''}`
    }, { transaction });
    
    // ========================================
    // 6. CREAR INTERVENCIÓN QUIRÚRGICA
    // ========================================
    const intervencion = await IntervencionQuirurgica.create({
      paciente_id: paciente.id,
      medico_id: medicoId,
      habitacion_id: quirofano.id,
      evaluacion_medica_id: prequirurgico.evaluacion_medica_id,
      tipo_procedimiento: tipo_procedimiento || 'Intervención quirúrgica programada',
      fecha_inicio: new Date(),
      lista_espera_id: listaEsperaCirugia.id,
      observaciones: observaciones || `Derivado desde pre-quirúrgico #${prequirurgico.id}`
    }, { transaction });
    
    console.log(`✅ Intervención quirúrgica creada: ${intervencion.id}`);
    // ========================================
    // 6.1 OCUPAR CAMA DEL QUIRÓFANO
    // ========================================
    const camaQuirofano = await Cama.findOne({
      where: { 
       habitacion_id: quirofano.id,
        estado: 'Libre'
      },
      transaction
    });

    if (camaQuirofano) {
      await camaQuirofano.update({
        estado: 'Ocupada',
        sexo_ocupante: paciente.usuario.sexo
      }, { transaction });
      console.log(`✅ Cama quirófano ${camaQuirofano.numero} ocupada`);
    } else {
     console.log(`⚠️ No se encontró cama libre en quirófano ${quirofano.numero}`);
    }
    // ========================================
    // 7. LIBERAR CAMA DE PRE-QUIRÚRGICO
    // ========================================
    let camaLiberada = null;
    
    if (internacion?.cama) {
      camaLiberada = internacion.cama;
      
      // Poner cama en limpieza
      await camaLiberada.update({
        estado: 'EnLimpieza',
        sexo_ocupante: null
      }, { transaction });
      
      // Marcar internación pre-quirúrgica como terminada
      await internacion.update({
        fecha_alta: new Date(),
        estado_operacion: 'Postquirurgico',
        intervencion_quirurgica_id: intervencion.id
      }, { transaction });
      
      console.log(`✅ Cama ${camaLiberada.numero} liberada (en limpieza)`);
    }
    
    // ========================================
    // 8. ACTUALIZAR ESTADO DEL PRE-QUIRÚRGICO
    // ========================================
    await prequirurgico.update({
      estado: 'EnCirugia',
      descripcion: prequirurgico.descripcion + 
        `\n\n=== ENVIADO A CIRUGÍA ===\n` +
        `Fecha: ${new Date().toLocaleString('es-AR')}\n` +
        `Quirófano: ${quirofano.numero}\n` +
        `Intervención ID: ${intervencion.id}`
    }, { transaction });
    
    // ========================================
    // 9. COMPLETAR LISTAS DE ESPERA ANTERIORES
    // ========================================
    await ListaEspera.update(
      { estado: 'COMPLETADO' },
      {
        where: {
          paciente_id: paciente.id,
          estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] },
          id: { [Op.ne]: listaEsperaCirugia.id }
        },
        transaction
      }
    );
    
    // ========================================
    // 10. REGISTRO EN HISTORIAL MÉDICO
    // ========================================
    await HistorialMedico.create({
      paciente_id: paciente.id,
      descripcion: `Enviado a cirugía desde pre-quirúrgico. ` +
        `Quirófano: ${quirofano.numero}. ` +
        `Tipo: ${tipo_procedimiento || 'No especificado'}. ` +
        (camaLiberada ? `Cama ${camaLiberada.numero} liberada.` : ''),
      tipo_evento: 'Cirugia',
      fecha: new Date()
    }, { transaction });
    
    // ========================================
    // 11. NOTIFICAR A PERSONAL DE QUIRÓFANO
    // ========================================
    const sectorQuirofano = await Sector.findOne({
      where: { nombre: { [Op.like]: '%Quir%' } },
      transaction
    });
    
    if (sectorQuirofano) {
      // Notificar a médicos del quirófano
      const medicosQuirofano = await Medico.findAll({
        where: { sector_id: sectorQuirofano.id },
        include: [{ model: Usuario, as: 'usuario' }],
        transaction
      });
      
      const mensajeCirugia = 
        `🔪 **PACIENTE PARA CIRUGÍA**\n\n` +
        `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
        `DNI: ${paciente.usuario.dni}\n` +
        `Quirófano: ${quirofano.numero}\n` +
        `Tipo: ${tipo_procedimiento || 'No especificado'}\n` +
        `Prioridad: ${prioridad}\n` +
        `Pre-quirúrgico: ✅ Completado\n` +
        `Médico derivante: Dr. ${req.user.nombre}`;
      
      for (const medico of medicosQuirofano) {
        await Notificacion.create({
          usuario_id: medico.usuario_id,
          remitente_id: usuarioId,
          mensaje: mensajeCirugia,
          leida: false,
          tipo: 'CIRUGIA'
        }, { transaction });
      }
    }
    
    await transaction.commit();
    
    console.log(`✅ Paciente enviado a cirugía exitosamente`);
    
    res.json({
      success: true,
      message: `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} enviado a cirugía.` +
        (camaLiberada ? ` Cama ${camaLiberada.numero} liberada.` : ''),
      data: {
        intervencion_id: intervencion.id,
        quirofano: quirofano.numero,
        cama_liberada: camaLiberada?.numero || null,
        lista_espera_cirugia_id: listaEsperaCirugia.id
      },
      redirect: '/medico/ordenes-prequirurgico'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al enviar a cirugía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar paciente a cirugía',
      error: error.message
    });
  }
};

// ========================================
// MÉTODO AUXILIAR: Obtener quirófanos disponibles
// ========================================
exports.obtenerQuirofanosDisponibles = async (req, res, next) => {
  try {
    const quirofanos = await Habitacion.findAll({
      where: {
        tipo: { [Op.like]: '%Quir%' }
      },
      include: [{
        model: Sector,
        as: 'sector',
        attributes: ['id', 'nombre']
      }],
      attributes: ['id', 'numero', 'tipo']
    });
    
    res.json({
      success: true,
      quirofanos: quirofanos.map(q => ({
        id: q.id,
        numero: q.numero,
        tipo: q.tipo,
        sector: q.sector?.nombre
      }))
    });
    
  } catch (error) {
    console.error('Error al obtener quirófanos:', error);
    next(error);
  }
};

module.exports = exports;