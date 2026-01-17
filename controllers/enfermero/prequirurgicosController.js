const { ProcedimientoPreQuirurgico, 
    EvaluacionMedica, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero, 
    IntervencionQuirurgica } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar procedimientos pre-quirúrgicos
exports.listarPrequirurgicos = async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin, paciente } = req.query;
    
    const whereCondition = {};
    
    if (estado) {
      whereCondition.estado = estado;
    }

    const procedimientos = await ProcedimientoPreQuirurgico.findAll({
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
                attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono'],
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
        ['estado', 'ASC'], // Pendientes primero
        ['created_at', 'DESC']
      ],
      subQuery: false
    });

    // Estadísticas
    const estadisticas = {
      total: procedimientos.length,
      pendientes: procedimientos.filter(p => p.estado === 'Pendiente').length,
      completados: procedimientos.filter(p => p.estado === 'Completado').length,
      urgentes: procedimientos.filter(p => p.estado === 'Pendiente' && p.evaluacion_enfermeria).length
    };

    res.render('dashboard/enfermero/prequirurgicos', {
      title: 'Preparación Pre-quirúrgica',
      user: req.user,
      procedimientos,
      estadisticas,
      filtros: { estado, fecha_inicio, fecha_fin, paciente }
    });

  } catch (error) {
    console.error('Error al listar pre-quirúrgicos:', error);
    res.status(500).render('error', {
      message: 'Error al cargar procedimientos pre-quirúrgicos',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de preparación pre-quirúrgica
exports.verPrequirurgico = async (req, res) => {
  try {
    const { id } = req.params;

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
        message: 'Procedimiento pre-quirúrgico no encontrado'
      });
    }

    // Buscar si hay intervención quirúrgica asociada
    const intervencion = await IntervencionQuirurgica.findOne({
      where: {
        paciente_id: procedimiento.evaluacion_medica.paciente_id,
        evaluacion_medica_id: procedimiento.evaluacion_medica_id
      }
    });

    res.render('dashboard/enfermero/prequirurgicos-detalle', {
      title: 'Detalle Pre-quirúrgico',
      user: req.user,
      procedimiento,
      intervencion
    });

  } catch (error) {
    console.error('Error al ver pre-quirúrgico:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para completar preparación
exports.formularioCompletar = async (req, res) => {
  try {
    const { id } = req.params;

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
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
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

    if (procedimiento.estado === 'Completado') {
      return res.redirect(`dashboard/enfermero/prequirurgicos/${id}`);
    }

    res.render('dashboard/enfermero/prequirurgicos-completar', {
      title: 'Completar Preparación Pre-quirúrgica',
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

// Completar preparación pre-quirúrgica
exports.completarPrequirurgico = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermeroId = req.user.enfermero.id;
    const { id } = req.params;
    const {
      ayuno_horas,
      higiene_realizada,
      retiro_joyas,
      retiro_protesis,
      retiro_lentes,
      retiro_esmalte,
      consentimiento_firmado,
      estudios_completos,
      via_venosa,
      profilaxis_antibiotica,
      medicacion_preanestesica,
      alergias_verificadas,
      signos_vitales,
      observaciones,
      complicaciones
    } = req.body;

    // Validar procedimiento
    const procedimiento = await ProcedimientoPreQuirurgico.findByPk(id, {
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

    if (procedimiento.estado === 'Completado') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este procedimiento ya fue completado'
      });
    }

    // Construir checklist
    const checklist = {
      ayuno: { horas: ayuno_horas || 'N/A', verificado: true },
      higiene: higiene_realizada === 'true',
      retiro_joyas: retiro_joyas === 'true',
      retiro_protesis: retiro_protesis === 'true',
      retiro_lentes: retiro_lentes === 'true',
      retiro_esmalte: retiro_esmalte === 'true',
      consentimiento: consentimiento_firmado === 'true',
      estudios: estudios_completos === 'true',
      via_venosa: via_venosa === 'true',
      profilaxis: profilaxis_antibiotica === 'true',
      preanestesia: medicacion_preanestesica === 'true',
      alergias: alergias_verificadas === 'true'
    };

    // Construir observaciones detalladas
    const observacionesCompletas = `
=== PREPARACIÓN PRE-QUIRÚRGICA COMPLETADA ===
Fecha y hora: ${new Date().toLocaleString('es-AR')}
Enfermero: ${req.user.nombre} ${req.user.apellido}

=== CHECKLIST ===
✓ Ayuno: ${checklist.ayuno.horas} horas
${checklist.higiene ? '✓' : '✗'} Higiene corporal realizada
${checklist.retiro_joyas ? '✓' : '✗'} Retiro de joyas y accesorios
${checklist.retiro_protesis ? '✓' : '✗'} Retiro de prótesis
${checklist.retiro_lentes ? '✓' : '✗'} Retiro de lentes de contacto
${checklist.retiro_esmalte ? '✓' : '✗'} Retiro de esmalte de uñas
${checklist.consentimiento ? '✓' : '✗'} Consentimiento informado firmado
${checklist.estudios ? '✓' : '✗'} Estudios pre-operatorios completos
${checklist.via_venosa ? '✓' : '✗'} Vía venosa permeable
${checklist.profilaxis ? '✓' : '✗'} Profilaxis antibiótica administrada
${checklist.preanestesia ? '✓' : '✗'} Medicación preanestésica administrada
${checklist.alergias ? '✓' : '✗'} Alergias verificadas

=== SIGNOS VITALES ===
${signos_vitales || 'No registrados'}

=== OBSERVACIONES ===
${observaciones || 'Ninguna'}

${complicaciones ? `\n=== COMPLICACIONES ===\n${complicaciones}` : ''}
    `.trim();

    // Actualizar procedimiento pre-quirúrgico
    await procedimiento.update({
      estado: 'Completado',
      descripcion: procedimiento.descripcion + '\n\n' + observacionesCompletas
    }, { transaction });

    // Crear evaluación de enfermería
    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id: procedimiento.evaluacion_medica.paciente_id,
      enfermero_id: enfermeroId,
      medico_id: procedimiento.evaluacion_medica.medico_id,
      fecha: new Date(),
      signos_vitales: signos_vitales || null,
      procedimiento_pre_quirurgico_id: id,
      observaciones: observacionesCompletas,
      tipo_egreso: complicaciones ? 'DERIVACION_MEDICO' : 'PROCEDIMIENTO_COMPLETADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Preparación pre-quirúrgica completada',
      evaluacion_id: evaluacion.id,
      redirect: `dashboard/enfermero/prequirurgicos/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al completar pre-quirúrgico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar la preparación',
      error: error.message
    });
  }
};

// Obtener checklist estándar
exports.checklistEstandar = async (req, res) => {
  try {
    const checklist = {
      items: [
        { id: 'ayuno', nombre: 'Ayuno (8-12 horas)', requerido: true },
        { id: 'higiene', nombre: 'Higiene corporal completa', requerido: true },
        { id: 'retiro_joyas', nombre: 'Retiro de joyas y accesorios', requerido: true },
        { id: 'retiro_protesis', nombre: 'Retiro de prótesis dentales', requerido: true },
        { id: 'retiro_lentes', nombre: 'Retiro de lentes de contacto', requerido: false },
        { id: 'retiro_esmalte', nombre: 'Retiro de esmalte de uñas', requerido: true },
        { id: 'consentimiento', nombre: 'Consentimiento informado firmado', requerido: true },
        { id: 'estudios', nombre: 'Estudios pre-operatorios disponibles', requerido: true },
        { id: 'via_venosa', nombre: 'Vía venosa permeable', requerido: true },
        { id: 'profilaxis', nombre: 'Profilaxis antibiótica (si corresponde)', requerido: false },
        { id: 'preanestesia', nombre: 'Medicación preanestésica administrada', requerido: false },
        { id: 'alergias', nombre: 'Alergias verificadas y documentadas', requerido: true }
      ]
    };

    res.json({
      success: true,
      checklist
    });

  } catch (error) {
    console.error('Error al obtener checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener checklist'
    });
  }
};

// Obtener preparaciones pendientes
exports.pendientes = async (req, res) => {
  try {
    const procedimientos = await ProcedimientoPreQuirurgico.findAll({
      where: {
        estado: 'Pendiente'
      },
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
                attributes: ['nombre', 'apellido', 'dni']
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
        }
      ],
      order: [['created_at', 'ASC']],
      limit: 20
    });

    res.json({
      success: true,
      procedimientos: procedimientos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        paciente: {
          id: p.evaluacion_medica.paciente.id,
          nombre: `${p.evaluacion_medica.paciente.usuario.nombre} ${p.evaluacion_medica.paciente.usuario.apellido}`,
          dni: p.evaluacion_medica.paciente.usuario.dni
        },
        medico: `Dr. ${p.evaluacion_medica.medico.usuario.nombre} ${p.evaluacion_medica.medico.usuario.apellido}`,
        fecha_solicitud: p.created_at
      }))
    });

  } catch (error) {
    console.error('Error al buscar pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar procedimientos pendientes'
    });
  }
};

// Registrar complicación pre-quirúrgica
exports.registrarComplicacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { tipo_complicacion, descripcion, requiere_suspension } = req.body;

    const procedimiento = await ProcedimientoPreQuirurgico.findByPk(id, {
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

    // Registrar complicación
    const complicacionTexto = `
\n=== COMPLICACIÓN PRE-QUIRÚRGICA ===
Fecha: ${new Date().toLocaleString('es-AR')}
Tipo: ${tipo_complicacion}
Descripción: ${descripcion}
${requiere_suspension === 'true' ? '⚠️ REQUIERE SUSPENSIÓN DE LA CIRUGÍA' : 'No requiere suspensión'}
    `;

    await procedimiento.update({
      descripcion: procedimiento.descripcion + complicacionTexto
    }, { transaction });

    // Si hay evaluación de enfermería, actualizarla
    const evaluacion = await EvaluacionEnfermeria.findOne({
      where: { procedimiento_pre_quirurgico_id: id },
      transaction
    });

    if (evaluacion) {
      await evaluacion.update({
        observaciones: evaluacion.observaciones + complicacionTexto,
        tipo_egreso: 'DERIVACION_MEDICO'
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Complicación registrada. Se notificará al médico.',
      redirect: `dashboard/enfermero/prequirurgicos/${id}`
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

module.exports = exports;