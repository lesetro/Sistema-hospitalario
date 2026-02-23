const { RecetaCertificado,
    EvaluacionMedica, 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Medico, 
    Enfermero,
    Sector,
    Tratamiento,
    ObraSocial 
  } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ============================================
// MÉTODOS PARA EL MÉDICO (C-U-D)
// ============================================

// CREAR orden de medicación
exports.crear = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const medicoId = req.user.medico_id;
    const sectorId = req.user.sector_id;
    
    const {
      evaluacion_medica_id,
      paciente_id,
      tipo,
      contenido,
      medicamentos,
      via_administracion,
      frecuencia,
      duracion_tratamiento,
      observaciones_especiales,
      prioridad,
      requiere_monitoreo
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

    // Construir contenido completo de la receta
    let contenidoCompleto = `=== ORDEN DE MEDICACIÓN ===\n`;
    contenidoCompleto += `Fecha: ${new Date().toLocaleString('es-AR')}\n`;
    contenidoCompleto += `Médico: Dr. ${req.user.nombre} ${req.user.apellido}\n\n`;
    contenidoCompleto += `=== MEDICAMENTOS ===\n${medicamentos || contenido}\n\n`;
    
    if (via_administracion) {
      contenidoCompleto += `Vía de administración: ${via_administracion}\n`;
    }
    
    if (frecuencia) {
      contenidoCompleto += `Frecuencia: ${frecuencia}\n`;
    }
    
    if (duracion_tratamiento) {
      contenidoCompleto += `Duración del tratamiento: ${duracion_tratamiento}\n`;
    }
    
    if (observaciones_especiales) {
      contenidoCompleto += `\n=== OBSERVACIONES ESPECIALES ===\n${observaciones_especiales}\n`;
    }
    
    if (requiere_monitoreo === 'true' || requiere_monitoreo === true) {
      contenidoCompleto += `\n⚠️ REQUIERE MONITOREO ESTRICTO DE SIGNOS VITALES\n`;
    }

    // Crear la receta/orden de medicación
    const receta = await RecetaCertificado.create({
      paciente_id,
      medico_id: medicoId,
      evaluacion_medica_id: evaluacion_medica_id || null,
      tipo: tipo || 'Receta Medica',
      contenido: contenidoCompleto,
      fecha: new Date(),
      estado: 'PENDIENTE',
      prioridad: prioridad || 'MEDIA',
      requiere_monitoreo: requiere_monitoreo === 'true' || requiere_monitoreo === true
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de medicación creada correctamente',
      receta_id: receta.id,
      redirect: `/medico/ordenes-medicacion`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear orden de medicación:', error);
    next(error);
  }
};

// EDITAR orden de medicación
exports.editar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const receta = await RecetaCertificado.findByPk(id, { transaction });
    
    if (!receta) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden de medicación no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (receta.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar esta orden'
      });
    }

    // Verificar si ya fue administrada
    const administracion = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: receta.paciente_id,
        observaciones: {
          [Op.like]: `%Receta #${receta.id}%`
        }
      },
      transaction
    });

    if (administracion) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una orden de medicación ya administrada'
      });
    }

    const {
      contenido,
      medicamentos,
      via_administracion,
      frecuencia,
      duracion_tratamiento,
      observaciones_especiales,
      prioridad,
      requiere_monitoreo
    } = req.body;

    // Construir nuevo contenido
    let contenidoCompleto = `=== ORDEN DE MEDICACIÓN (ACTUALIZADA) ===\n`;
    contenidoCompleto += `Fecha actualización: ${new Date().toLocaleString('es-AR')}\n`;
    contenidoCompleto += `Médico: Dr. ${req.user.nombre} ${req.user.apellido}\n\n`;
    contenidoCompleto += `=== MEDICAMENTOS ===\n${medicamentos || contenido}\n\n`;
    
    if (via_administracion) {
      contenidoCompleto += `Vía de administración: ${via_administracion}\n`;
    }
    
    if (frecuencia) {
      contenidoCompleto += `Frecuencia: ${frecuencia}\n`;
    }
    
    if (duracion_tratamiento) {
      contenidoCompleto += `Duración del tratamiento: ${duracion_tratamiento}\n`;
    }
    
    if (observaciones_especiales) {
      contenidoCompleto += `\n=== OBSERVACIONES ESPECIALES ===\n${observaciones_especiales}\n`;
    }
    
    if (requiere_monitoreo === 'true' || requiere_monitoreo === true) {
      contenidoCompleto += `\n⚠️ REQUIERE MONITOREO ESTRICTO DE SIGNOS VITALES\n`;
    }

    await receta.update({
      contenido: contenidoCompleto,
      prioridad: prioridad || receta.prioridad,
      requiere_monitoreo: requiere_monitoreo === 'true' || requiere_monitoreo === true
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de medicación actualizada correctamente',
      redirect: `/medico/ordenes-medicacion/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al editar orden de medicación:', error);
    next(error);
  }
};

// ELIMINAR/CANCELAR orden de medicación
exports.eliminar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;
    const { motivo_cancelacion } = req.body;

    const receta = await RecetaCertificado.findByPk(id, { transaction });
    
    if (!receta) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Verificar que sea el médico que creó la orden
    if (receta.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para cancelar esta orden'
      });
    }

    // Verificar si ya fue administrada
    const administracion = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: receta.paciente_id,
        observaciones: {
          [Op.like]: `%Receta #${receta.id}%`
        }
      },
      transaction
    });

    if (administracion) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una orden ya administrada'
      });
    }

    // Actualizar estado a CANCELADA
    await receta.update({
      estado: 'CANCELADA',
      contenido: receta.contenido + `\n\n=== ORDEN CANCELADA ===\nFecha: ${new Date().toLocaleString('es-AR')}\nMédico: Dr. ${req.user.nombre} ${req.user.apellido}\nMotivo: ${motivo_cancelacion || 'Sin motivo especificado'}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden de medicación cancelada correctamente',
      redirect: '/medico/ordenes-medicacion'
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

// LISTAR órdenes de medicación (Ambos roles)
exports.listar = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    const sectorId = req.user.sector_id;
    const { estado, prioridad, fecha, paciente } = req.query;
    
    const whereCondition = {
      tipo: 'Receta Medica'
    };
    
    // Si es médico, mostrar solo sus órdenes
    if (userRole === 'MEDICO') {
      whereCondition.medico_id = req.user.medico_id;
    }
    
    // Si es enfermero, mostrar solo pendientes
    if (userRole === 'ENFERMERO') {
      whereCondition.estado = 'PENDIENTE';
    }
    
    if (estado && userRole === 'MEDICO') {
      whereCondition.estado = estado;
    }

    if (prioridad) {
      whereCondition.prioridad = prioridad;
    }

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
      order: [
        ['prioridad', 'DESC'],
        ['fecha', 'DESC']
      ],
      subQuery: false
    });

    // Para cada receta, verificar si fue administrada
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

    // Estadísticas
    const estadisticas = {
      total: recetas.length,
      pendientes: recetas.filter(r => !r.dataValues.administrada && r.estado !== 'CANCELADA').length,
      administradas: recetas.filter(r => r.dataValues.administrada).length,
      canceladas: recetas.filter(r => r.estado === 'CANCELADA').length,
      urgentes: recetas.filter(r => r.prioridad === 'ALTA' && !r.dataValues.administrada).length,
      hoy: recetas.filter(r => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReceta = new Date(r.fecha);
        fechaReceta.setHours(0, 0, 0, 0);
        return fechaReceta.getTime() === hoy.getTime();
      }).length
    };

    // Renderizar vista según el rol
    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-medicacion-lista'
      : 'dashboard/enfermero/medicacion';

    res.render(vistaRender, {
      title: userRole === 'MEDICO' ? 'Órdenes de Medicación' : 'Administración de Medicación',
      user: req.user,
      recetas,
      estadisticas,
      filtros: { estado, prioridad, fecha, paciente }
    });

  } catch (error) {
    console.error('Error al listar órdenes de medicación:', error);
    next(error);
  }
};

// VER DETALLE (Ambos roles)
exports.verDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.rol;

    
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
        }
      ]
    });

    //  RELOAD para asegurar datos frescos
    await receta.reload();

    if (!receta) {
      return res.status(404).render('error', {
        message: 'Orden de medicación no encontrada',
        user: req.user
      });
    }

    console.log('📖 Cargando detalle, estado actual:', receta.estado);

    // Obtener historial
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

    const edadPaciente = calcularEdad(receta.paciente.usuario.fecha_nacimiento);

    const vistaRender = userRole === 'MEDICO' 
      ? 'dashboard/medico/ordenes-medicacion-detalle'
      : 'dashboard/enfermero/medicacion-detalle';

    res.render(vistaRender, {
      title: 'Detalle de Medicación',
      user: req.user,
      receta,
      administraciones,
      edadPaciente
    });

  } catch (error) {
    console.error('Error al ver detalle de medicación:', error);
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

    res.render('dashboard/medico/ordenes-medicacion-crear', {
      title: 'Crear Orden de Medicación',
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

    const receta = await RecetaCertificado.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        }
      ]
    });

    if (!receta) {
      return res.status(404).render('error', {
        message: 'Orden no encontrada',
        user: req.user
      });
    }

    // Verificar que sea el médico que creó la orden
    if (receta.medico_id !== medicoId) {
      return res.status(403).render('error', {
        message: 'No tiene permisos para editar esta orden',
        user: req.user
      });
    }

    // Verificar si ya fue administrada
    const administracion = await EvaluacionEnfermeria.findOne({
      where: {
        paciente_id: receta.paciente_id,
        observaciones: {
          [Op.like]: `%Receta #${receta.id}%`
        }
      }
    });

    if (administracion) {
      return res.redirect(`/medico/ordenes-medicacion/${id}`);
    }

    res.render('dashboard/medico/ordenes-medicacion-editar', {
      title: 'Editar Orden de Medicación',
      user: req.user,
      receta
    });

  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    next(error);
  }
};

// API: Obtener órdenes de medicación pendientes para un paciente
exports.obtenerOrdenesPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;

    const ordenes = await RecetaCertificado.findAll({
      where: {
        paciente_id,
        tipo: 'Receta Medica',
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
        ['fecha', 'ASC']
      ]
    });

    // Verificar cuáles fueron administradas
    const ordenesConEstado = await Promise.all(ordenes.map(async (orden) => {
      const administracion = await EvaluacionEnfermeria.findOne({
        where: {
          paciente_id: orden.paciente_id,
          observaciones: {
            [Op.like]: `%Receta #${orden.id}%`
          }
        }
      });

      return {
        id: orden.id,
        contenido: orden.contenido,
        prioridad: orden.prioridad,
        requiere_monitoreo: orden.requiere_monitoreo,
        medico: `Dr. ${orden.medico.usuario.nombre} ${orden.medico.usuario.apellido}`,
        fecha: orden.fecha,
        administrada: !!administracion
      };
    }));

    res.json({
      success: true,
      total: ordenesConEstado.length,
      ordenes: ordenesConEstado
    });

  } catch (error) {
    console.error('Error al obtener órdenes de medicación del paciente:', error);
    next(error);
  }
};

// ============================================
// BUSCAR PACIENTE PARA ORDEN DE MEDICACIÓN
// ============================================
exports.buscarPacienteParaMedicacion = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Buscando paciente para orden de medicación:', q);
    
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

    console.log(`✅ Encontrados ${pacientes.length} pacientes`);

    if (pacientes.length === 0) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0,
        message: 'No se encontraron pacientes'
      });
    }

    // Buscar datos adicionales para cada paciente
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

        // Buscar alergias del paciente
        let alergias = [];
        try {
          // Asumiendo que tienes un modelo Alergia o un campo en Paciente
          if (paciente.alergias) {
            alergias = paciente.alergias;
          } else if (paciente.usuario && paciente.usuario.alergias) {
            alergias = paciente.usuario.alergias;
          }
        } catch (error) {
          console.log('Error al buscar alergias:', error.message);
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
          // Alergias del paciente
          alergias: alergias,
          alergias_texto: Array.isArray(alergias) ? alergias.join(', ') : (alergias || ''),
          // Evaluaciones médicas para el select
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
    console.error('❌ Error en búsqueda de pacientes para medicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar pacientes',
      pacientes: []
    });
  }
};

// Función auxiliar para calcular edad
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