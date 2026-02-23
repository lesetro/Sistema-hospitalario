const { Enfermero, 
  Usuario, 
  Sector, 
  EvaluacionEnfermeria, 
  Paciente, 
  ControlEnfermeria, 
  Cama, 
  Internacion, 
  ListaEspera, 
  Turno 
} = require('../../models');
const { Op } = require('sequelize');
const utilsHorarios = require('../../services/horariosUtils');

// Dashboard principal
exports.dashboard = async (req, res, next) => {
  try {
    
    const enfermeroId = req.user.id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Estadísticas del día
    const [
      evaluacionesHoy,
      pacientesTriaje,
      procedimientosPendientes,
      pacientesInternados,
      camasDisponibles,
      listaEsperaPendiente
    ] = await Promise.all([
      EvaluacionEnfermeria.count({
        where: {
          enfermero_id: enfermeroId,
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          nivel_triaje: { [Op.ne]: null },
          tipo_egreso: 'PENDIENTE_EVALUACION',
          fecha: { [Op.gte]: hoy }
        }
      }),
      EvaluacionEnfermeria.count({
        where: {
          procedimiento_enfermeria_id: { [Op.ne]: null },
          tipo_egreso: 'PENDIENTE_EVALUACION'
        }
      }),
      Internacion.count({
        where: { fecha_alta: null },
        include: [{
          model: Paciente,
          as: 'paciente',
          required: true
        }]
      }),
      Cama.count({
        where: { estado: 'Libre' }
      }),
      ListaEspera.count({
        where: {
          estado: 'PENDIENTE',
          creador_tipo: 'ENFERMERO',
          creador_id: req.user.usuario_id
        }
      })
    ]);

    // Últimas evaluaciones
    const ultimasEvaluaciones = await EvaluacionEnfermeria.findAll({
      where: { enfermero_id: enfermeroId },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    // Pacientes críticos en triaje
    const pacientesCriticos = await EvaluacionEnfermeria.findAll({
      where: {
        nivel_triaje: 'Rojo',
        tipo_egreso: 'PENDIENTE_EVALUACION',
        fecha: { [Op.gte]: hoy }
      },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'ASC']],
      limit: 10
    });

    // Información del enfermero
    const enfermero = await Enfermero.findByPk(enfermeroId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        }
      ]
    });

    res.render('dashboard/enfermero/dashboard', {
      title: 'Dashboard Enfermería',
      user: {
        ...req.user,
        nombre: enfermero.usuario.nombre,
        apellido: enfermero.usuario.apellido,
        nivel: enfermero.nivel
      },
      estadisticas: {
        evaluacionesHoy,
        pacientesTriaje,
        procedimientosPendientes,
        pacientesInternados,
        camasDisponibles,
        listaEsperaPendiente
      },
      ultimasEvaluaciones,
      pacientesCriticos,
      enfermero
    });

  } catch (error) {
    console.error('Error en dashboard enfermero:', error);
    next(error);
  }
};

// Obtener resumen de actividad
exports.getResumenActividad = async (req, res, next) => {
  try {
    
    const enfermeroId = req.user.id;
    const { fecha_inicio, fecha_fin } = req.query;

    const whereCondition = {
      enfermero_id: enfermeroId
    };

    if (fecha_inicio && fecha_fin) {
      whereCondition.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha', 'DESC']]
    });

    const resumen = {
      total: evaluaciones.length,
      completados: evaluaciones.filter(e => e.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO').length,
      derivados_medico: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_MEDICO').length,
      derivados_urgencia: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_URGENCIA').length,
      pendientes: evaluaciones.filter(e => e.tipo_egreso === 'PENDIENTE_EVALUACION').length
    };

    res.json({
      success: true,
      resumen,
      evaluaciones
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    next(error);
  }
};

// Notificaciones pendientes
exports.getNotificaciones = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const notificaciones = [];

    const triajeCritico = await EvaluacionEnfermeria.count({
      where: {
        nivel_triaje: 'Rojo',
        tipo_egreso: 'PENDIENTE_EVALUACION',
        fecha: { [Op.gte]: hoy }
      }
    });

    if (triajeCritico > 0) {
      notificaciones.push({
        tipo: 'critico',
        mensaje: `${triajeCritico} paciente(s) en triaje crítico (Rojo)`,
        url: '/enfermero/triaje',
        icono: 'fa-exclamation-triangle',
        cantidad: triajeCritico
      });
    }

    const procedimientosPendientes = await EvaluacionEnfermeria.count({
      where: {
        procedimiento_enfermeria_id: { [Op.ne]: null },
        tipo_egreso: 'PENDIENTE_EVALUACION'
      }
    });

    if (procedimientosPendientes > 0) {
      notificaciones.push({
        tipo: 'procedimiento',
        mensaje: `${procedimientosPendientes} procedimiento(s) pendiente(s)`,
        url: '/enfermero/procedimientos',
        icono: 'fa-syringe',
        cantidad: procedimientosPendientes
      });
    }

    const camasPorLimpiar = await Cama.count({
      where: { estado: 'EnLimpieza' }
    });

    if (camasPorLimpiar > 0) {
      notificaciones.push({
        tipo: 'limpieza',
        mensaje: `${camasPorLimpiar} cama(s) en proceso de limpieza`,
        url: '/enfermero/camas',
        icono: 'fa-bed',
        cantidad: camasPorLimpiar
      });
    }

    res.json({
      success: true,
      notificaciones
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    next(error);
  }
};
exports.obtenerMedicosUrgencias = async (req, res, next) => {
  try {
    console.log('🔍 Obteniendo médicos del sector Urgencias');
    
    const medicos = await Medico.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: Sector,
          as: 'sector',
          where: { nombre: 'Urgencias' }
        },
        {
          model: Especialidad,
          as: 'especialidad',
          attributes: ['id', 'nombre']
        }
      ],
      where: {
        // Verificar que el médico tenga horarios configurados
        id: {
          [Op.in]: db.sequelize.literal(`
            SELECT DISTINCT m.id 
            FROM medicos m
            JOIN usuarios u ON m.usuario_id = u.id
            JOIN turnos_personal tp ON tp.usuario_id = u.id
            WHERE m.sector_id = (
              SELECT id FROM sectores WHERE nombre = 'Urgencias'
            )
            AND tp.tipo IN ('Atencion', 'Guardia Activa')
          `)
        }
      }
    });

    console.log(`✅ Encontrados ${medicos.length} médicos en Urgencias`);

    res.json({
      success: true,
      data: medicos.map(medico => ({
        id: medico.id,
        nombre_completo: `${medico.usuario.nombre} ${medico.usuario.apellido}`,
        especialidad: medico.especialidad?.nombre || 'Sin especialidad',
        email: medico.usuario.email
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener médicos:', error.message);
    next(error);
  }
};

// ========================================
// OBTENER HORARIOS DISPONIBLES DE UN MÉDICO
// ========================================
exports.obtenerHorariosMedico = async (req, res, next) => {
  try {
    const { medicoId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    console.log(` Obteniendo horarios para médico ${medicoId}, fecha: ${fecha}`);

    // Usar la utilidad compartida
    const resultado = await utilsHorarios.obtenerHorariosDisponibles(
      medicoId,
      fecha,
      30, // Duración de 30 minutos para urgencias
      null // Sin tipo de servicio específico
    );

    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        message: resultado.message
      });
    }

    res.json({
      success: true,
      horarios: resultado.horarios,
      estadisticas: resultado.estadisticas,
      infoMedico: resultado.turnoPersonal
    });
  } catch (error) {
    console.error('❌ Error al obtener horarios:', error.message);
    next(error);
  }
};

// ========================================
// ASIGNAR TURNO DESDE EVALUACIÓN DE ENFERMERÍA
// ========================================
exports.asignarTurnoDesdeEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      paciente_id,
      medico_id,
      fecha,
      hora_inicio,
      evaluacion_id,
      observaciones
    } = req.body;

    console.log(` Asignando turno desde evaluación:`, req.body);

    // 1. Validar que el horario esté disponible
    const horarioValido = await utilsHorarios.validarHorarioDisponible(
      medico_id,
      fecha,
      hora_inicio,
      30
    );

    if (!horarioValido.disponible) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: horarioValido.mensaje
      });
    }

    // 2. Calcular hora_fin (30 minutos después)
    const hora_fin = utilsHorarios.calcularHoraFin(hora_inicio, 30);

    // 3. Crear el turno
    const turno = await Turno.create({
      paciente_id,
      medico_id,
      fecha,
      hora_inicio,
      hora_fin,
      estado: 'PENDIENTE',
      tipo_turno: 'URGENCIA',
      sector_id: (await Medico.findByPk(medico_id)).sector_id,
      observaciones: observaciones || 'Derivado desde evaluación de enfermería'
    }, { transaction });

    console.log(`✅ Turno creado: ${turno.id}`);

    // 4. Actualizar la evaluación de enfermería
    if (evaluacion_id) {
      await EvaluacionEnfermeria.update(
        {
          tipo_egreso: 'DERIVACION_MEDICO',
          medico_id: medico_id,
          observaciones: `Paciente derivado al Dr. ${medico_id} para el ${fecha} a las ${hora_inicio}`
        },
        {
          where: { id: evaluacion_id },
          transaction
        }
      );

      console.log(`✅ Evaluación actualizada con turno`);
    }

    // 5. Actualizar lista de espera si existe
    const listaEspera = await ListaEspera.findOne({
      where: {
        paciente_id,
        estado: 'PENDIENTE'
      },
      transaction
    });

    if (listaEspera) {
      await listaEspera.update(
        {
          estado: 'ASIGNADO',
          turno_id: turno.id,
          medico_id: medico_id
        },
        { transaction }
      );
      console.log(`✅ Lista de espera actualizada`);
    }

    // 6. Crear notificación para el médico
    const medico = await Medico.findByPk(medico_id, {
      include: [{ model: Usuario, as: 'usuario' }],
      transaction
    });

    if (medico && medico.usuario) {
      await Notificacion.create({
        usuario_id: medico.usuario_id,
        mensaje: `Tiene un nuevo turno de urgencia para el ${fecha} a las ${hora_inicio}`,
        tipo: 'URGENCIA',
        leida: false,
        metadata: JSON.stringify({ turno_id: turno.id, paciente_id })
      }, { transaction });
      console.log(`✅ Notificación creada para el médico`);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Turno asignado correctamente',
      data: {
        turno_id: turno.id,
        fecha,
        hora_inicio,
        hora_fin,
        medico_id
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al asignar turno:', error.message);
    next(error);
  }
};

module.exports = exports;