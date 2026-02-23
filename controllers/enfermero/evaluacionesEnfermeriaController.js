const { 
  EvaluacionEnfermeria,
  Paciente, 
  Usuario, 
  Enfermero, 
  Medico, 
  ProcedimientoEnfermeria, 
  ProcedimientoPreQuirurgico, 
  EvaluacionMedica, 
  ControlEnfermeria, 
  ListaEspera,
  Rol,
  Sector,
  Turno,
  Especialidad,
  Notificacion

  } = require('../../models');
  const { Op } = require('sequelize');
  const db = require('../../database/db');
  const utilsHorarios = require('../../services/horariosUtils');

// Listar evaluaciones de enfermería
exports.listarEvaluaciones = async (req, res, next) => {
  try {
    
    const enfermeroId = req.user.id;
    const { fecha_inicio, fecha_fin, paciente, estado } = req.query;
    
    const whereCondition = {};
    
    if (req.query.solo_mias === 'true') {
      whereCondition.enfermero_id = enfermeroId;
    }

    if (fecha_inicio && fecha_fin) {
      whereCondition.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      whereCondition.fecha = {
        [Op.gte]: new Date(fecha_inicio)
      };
    }

    if (estado) {
      whereCondition.tipo_egreso = estado;
    }

    const includeOptions = [
      {
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
        }],
        where: paciente ? {
          [Op.or]: [
            { '$paciente.usuario.nombre$': { [Op.like]: `%${paciente}%` } },
            { '$paciente.usuario.apellido$': { [Op.like]: `%${paciente}%` } },
            { '$paciente.usuario.dni$': { [Op.like]: `%${paciente}%` } }
          ]
        } : {}
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
        model: ProcedimientoEnfermeria,
        as: 'procedimiento_enfermeria',
        required: false
      },
      {
        model: ProcedimientoPreQuirurgico,
        as: 'procedimiento_pre_quirurgico',
        required: false
      },
      {
        model: EvaluacionMedica,
        as: 'evaluacion_medica',
        required: false
      }
    ];

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: includeOptions,
      order: [['fecha', 'DESC']],
      subQuery: false
    });

    const estadisticas = {
      total: evaluaciones.length,
      pendientes: evaluaciones.filter(e => e.tipo_egreso === 'PENDIENTE_EVALUACION').length,
      completadas: evaluaciones.filter(e => e.tipo_egreso === 'PROCEDIMIENTO_COMPLETADO').length,
      derivadas_medico: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_MEDICO').length,
      derivadas_urgencia: evaluaciones.filter(e => e.tipo_egreso === 'DERIVACION_URGENCIA').length,
      ordenes_medicas: evaluaciones.filter(e => e.tipo_egreso === 'ORDEN_MEDICA').length
    };

    res.render('dashboard/enfermero/evaluaciones', {
      title: 'Evaluaciones de Enfermería',
      user: req.user,
      evaluaciones,
      estadisticas,
      filtros: { fecha_inicio, fecha_fin, paciente, estado }
    });

  } catch (error) {
    console.error('Error al listar evaluaciones:', error);
    next(error);
  }
};

// Ver detalle de evaluación
exports.verEvaluacion = async (req, res, next) => {
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
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email']
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
          model: ProcedimientoEnfermeria,
          as: 'procedimiento_enfermeria',
          required: false
        },
        {
          model: ProcedimientoPreQuirurgico,
          as: 'procedimiento_pre_quirurgico',
          required: false
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
        },
        {
          model: ControlEnfermeria,
          as: 'control_enfermeria',
          required: false
        },
        {
          model: ListaEspera,
          as: 'lista_espera_generada',
          required: false
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación no encontrada'
      });
    }

    res.render('dashboard/enfermero/evaluaciones-detalle', {
      title: 'Detalle de Evaluación',
      user: req.user,
      evaluacion
    });

  } catch (error) {
    console.error('Error al ver evaluación:', error);
    next(error);
  }
};

// Formulario para nueva evaluación
exports.formularioNuevaEvaluacion = async (req, res, next) => {
  try {
    const { paciente_id } = req.query;
    
    let paciente = null;
    if (paciente_id) {
      paciente = await Paciente.findByPk(paciente_id, {
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
        }]
      });
    }

    res.render('dashboard/enfermero/evaluaciones-nueva', {
      title: 'Nueva Evaluación de Enfermería',
      user: req.user,
      paciente
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    next(error);
  }
};

// Crear nueva evaluación
async function obtenerTipoTurnoUrgencia(transaction) {
  try {
    const tipoTurno = await db.sequelize.models.TipoTurno.findOne({
      where: { nombre: 'Urgencia' },
      transaction
    });
    
    if (tipoTurno) return tipoTurno.id;
    
    const nuevoTipo = await db.sequelize.models.TipoTurno.create({
      nombre: 'Urgencia',
      descripcion: 'Turno para atención de urgencias',
      duracion_minutos: 30
    }, { transaction });
    
    return nuevoTipo.id;
  } catch (error) {
    console.error('Error al obtener tipo de turno urgencia:', error);
    return null;
  }
}

// Función auxiliar para obtener tipo_turno_id de Alta Médica
async function obtenerTipoTurnoAltaMedica(transaction) {
  try {
    const tipoTurno = await db.sequelize.models.TipoTurno.findOne({
      where: { nombre: 'Alta Médica' },
      transaction
    });
    
    if (tipoTurno) return tipoTurno.id;
    
    const nuevoTipo = await db.sequelize.models.TipoTurno.create({
      nombre: 'Alta Médica',
      descripcion: 'Consulta para otorgar alta médica',
      duracion_minutos: 15,
      requiere_medico: true
    }, { transaction });
    
    return nuevoTipo.id;
  } catch (error) {
    console.error('Error al obtener tipo de turno alta médica:', error);
    return null;
  }
}


async function obtenerTipoTurnoCirugia(transaction) {
  const { TipoTurno } = require('../../models');
  const { Op } = require('sequelize');
  
  let tipoTurno = await TipoTurno.findOne({
    where: { nombre: { [Op.like]: '%CIRUGIA%' } },
    transaction
  });

  if (!tipoTurno) {
    tipoTurno = await TipoTurno.findOne({
      where: { nombre: 'URGENCIA' },
      transaction
    });
  }

  return tipoTurno ? tipoTurno.id : null;
}

// ========================================
// CREAR EVALUACIÓN DE ENFERMERÍA
// ========================================
exports.crearEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const enfermeroId = req.user.id;
    const {
      paciente_id,
      signos_vitales,
      observaciones,
      nivel_triaje,
      presion_arterial,
      frecuencia_cardiaca,
      temperatura,
      saturacion_oxigeno,
      frecuencia_respiratoria,
      tipo_egreso,
      medico_id,
      fecha_turno,
      hora_inicio
    } = req.body;

    console.log(' Tipo de egreso recibido:', tipo_egreso);
    console.log(' Datos de turno:', { medico_id, fecha_turno, hora_inicio });

    // 1. Validar que el paciente existe
    const paciente = await Paciente.findByPk(paciente_id, { 
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'apellido', 'dni']
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

    // 2. Crear texto de signos vitales
    const signosVitalesTexto = signos_vitales || `PA: ${presion_arterial || 'N/A'}, FC: ${frecuencia_cardiaca || 'N/A'}, T: ${temperatura || 'N/A'}°C, SpO2: ${saturacion_oxigeno || 'N/A'}%, FR: ${frecuencia_respiratoria || 'N/A'}`;

    // 3. Crear evaluación de enfermería
    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id,
      enfermero_id: enfermeroId,
      fecha: new Date(),
      signos_vitales: signosVitalesTexto,
      observaciones,
      nivel_triaje: nivel_triaje || null,
      tipo_egreso: tipo_egreso || 'PENDIENTE_EVALUACION',
      medico_id: tipo_egreso === 'DERIVACION_MEDICO' ? medico_id : null
    }, { transaction });

    console.log(`✅ Evaluación creada ID: ${evaluacion.id}`);

    let turnoAsignado = null;
    let listaEsperaActualizada = null;
    let mensajeRespuesta = '✅ Evaluación registrada correctamente';

    // ========== PROCESAR SEGÚN TIPO DE EGRESO ==========
    
    if (tipo_egreso === 'DERIVACION_MEDICO') {
      console.log('🚨 ========== DERIVACIÓN A MÉDICO ==========');
      
      // CASO A: Con datos de turno completos
      if (medico_id && fecha_turno && hora_inicio) {
        console.log(' Intentando asignar turno...');
        
        // Validar disponibilidad del horario
        const horarioValido = await utilsHorarios.validarHorarioDisponible(
          medico_id,
          fecha_turno,
          hora_inicio,
          30
        );
        
        if (horarioValido.disponible) {
          //  HAY TURNO DISPONIBLE
          const hora_fin = utilsHorarios.calcularHoraFin(hora_inicio, 30);
          
          turnoAsignado = await Turno.create({
            paciente_id,
            medico_id,
            fecha: fecha_turno,
            hora_inicio,
            hora_fin,
            estado: 'PENDIENTE',
            tipo_turno: 'URGENCIA',
            sector_id: (await Medico.findByPk(medico_id, { transaction })).sector_id,
            evaluacion_enfermeria_id: evaluacion.id,
            observaciones: observaciones || 'Derivado desde evaluación de enfermería'
          }, { transaction });
          
          console.log(` Turno asignado: ${turnoAsignado.id}`);
          
          // Actualizar evaluación con ID del turno
          await evaluacion.update({
            turno_id: turnoAsignado.id
          }, { transaction });
          
          // Lista de espera ASIGNADA
          listaEsperaActualizada = await ListaEspera.create({
            paciente_id: paciente_id,
            prioridad: 'MEDIA',
            estado: 'ASIGNADO',
            fecha_registro: new Date(),
            medico_id: medico_id,
            turno_id: turnoAsignado.id,
            creador_id: enfermeroId,
            creador_tipo: 'ENFERMERO',
            tipo_turno_id: await obtenerTipoTurnoUrgencia(transaction),
            observaciones: 'Con turno asignado desde enfermería'
          }, { transaction });
          
          mensajeRespuesta = ` Evaluación registrada y turno asignado para el ${fecha_turno} a las ${hora_inicio}`;
          
          // Notificar al médico
          try {
            const medicoUsuario = await Medico.findByPk(medico_id, {
              include: [{ model: Usuario, as: 'usuario' }],
              transaction
            });
            
            if (medicoUsuario?.usuario) {
              await Notificacion.create({
                usuario_id: medicoUsuario.usuario_id,
                remitente_id: req.user.usuario_id,
                mensaje: `📅 **NUEVO TURNO DE URGENCIA**\n` +
                        `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
                        `Fecha: ${fecha_turno}\n` +
                        `Hora: ${hora_inicio}\n` +
                        `Prioridad: MEDIA\n` +
                        `Derivado por: Enfermería`,
                leida: false,
                tipo: 'TURNO_URGENCIA'
              }, { transaction });
              console.log(` Notificación enviada al médico`);
            }
          } catch (error) {
            console.error('❌ Error al notificar al médico:', error.message);
          }
          
        } else {
          // ❌ NO HAY TURNO DISPONIBLE
          console.log('⏳ No hay turnos disponibles - lista de espera');
          
          listaEsperaActualizada = await ListaEspera.create({
            paciente_id: paciente_id,
            prioridad: 'MEDIA',
            estado: 'PENDIENTE',
            fecha_registro: new Date(),
            creador_id: enfermeroId,
            creador_tipo: 'ENFERMERO',
            tipo_turno_id: await obtenerTipoTurnoUrgencia(transaction),
            observaciones: 'En espera de turno - no había disponibilidad'
          }, { transaction });
          
          mensajeRespuesta = '✅ Evaluación registrada. ❌ No había turnos disponibles - paciente en lista de espera';
        }
        
      } else {
        // CASO B: Sin datos de turno
        console.log('⏳ Derivación sin datos de turno - lista de espera');
        
        listaEsperaActualizada = await ListaEspera.create({
          paciente_id: paciente_id,
          prioridad: 'MEDIA',
          estado: 'PENDIENTE',
          fecha_registro: new Date(),
          creador_id: enfermeroId,
          creador_tipo: 'ENFERMERO',
          tipo_turno_id: await obtenerTipoTurnoUrgencia(transaction),
          observaciones: observaciones || 'Derivado a médico - requiere turno'
        }, { transaction });
        
        mensajeRespuesta = '✅ Evaluación registrada. Paciente en lista de espera para asignación de turno.';
      }
      
    } else if (tipo_egreso === 'PROCEDIMIENTO_COMPLETADO') {
      console.log('✅ ========== PROCEDIMIENTO COMPLETADO ==========');
      
      // Crear lista de espera para ALTA MÉDICA
      listaEsperaActualizada = await ListaEspera.create({
        paciente_id: paciente_id,
        prioridad: 'BAJA',
        estado: 'PENDIENTE',
        fecha_registro: new Date(),
        creador_id: enfermeroId,
        creador_tipo: 'ENFERMERO',
        tipo_turno_id: await obtenerTipoTurnoAltaMedica(transaction),
        observaciones: 'Paciente completó procedimiento de enfermería, requiere alta médica'
      }, { transaction });
      
      console.log(`✅ Lista de espera creada para alta médica: ${listaEsperaActualizada.id}`);
      
      mensajeRespuesta = '✅ Evaluación registrada. Paciente requiere ALTA MÉDICA antes de retirarse.';
      
    } else if (tipo_egreso === 'DERIVACION_URGENCIA') {
      console.log('🚨 ========== DERIVACIÓN A URGENCIAS ==========');
      
      // Crear lista de espera con ALTA prioridad
      listaEsperaActualizada = await ListaEspera.create({
        paciente_id: paciente_id,
        prioridad: 'ALTA',
        estado: 'PENDIENTE',
        fecha_registro: new Date(),
        creador_id: enfermeroId,
        creador_tipo: 'ENFERMERO',
        tipo_turno_id: await obtenerTipoTurnoUrgencia(transaction),
        observaciones: observaciones || 'Derivado a urgencias - alta prioridad'
      }, { transaction });
      
      mensajeRespuesta = '⚠️ Evaluación registrada. Paciente derivado a URGENCIAS (alta prioridad).';
      
    } else if (tipo_egreso === 'DERIVACION_CIRUGIA') {
      // ========== NUEVO: DERIVACIÓN A CIRUGÍA DE URGENCIA ==========
      console.log('🔪 ========== DERIVACIÓN A CIRUGÍA DE URGENCIA ==========');
      
      // Buscar cirujano de guardia del sector Emergencias
      let cirujanoAsignado = null;
      
      if (medico_id) {
        cirujanoAsignado = medico_id;
      } else {
        // Buscar cualquier cirujano del sector Emergencias
        const sectorEmergencias = await Sector.findOne({
          where: { nombre: { [Op.like]: '%Emergencia%' } },
          transaction
        });
        
        if (sectorEmergencias) {
          const cirujano = await Medico.findOne({
            where: { sector_id: sectorEmergencias.id },
            include: [{
              model: Especialidad,
              as: 'especialidad',
              where: { nombre: { [Op.like]: '%Cirug%' } }
            }],
            transaction
          });
          
          if (cirujano) {
            cirujanoAsignado = cirujano.id;
            console.log(`🔪 Cirujano de guardia encontrado: ID ${cirujano.id}`);
          }
        }
      }
      
      // Determinar prioridad según nivel de triage
      let prioridadCirugia = 'ALTA';
      if (nivel_triaje === 'Rojo') {
        prioridadCirugia = 'URGENTE';
      } else if (nivel_triaje === 'Negro') {
        prioridadCirugia = 'CRITICA';
      }
      
      // Crear lista de espera tipo CIRUGIA
      listaEsperaActualizada = await ListaEspera.create({
        paciente_id: paciente_id,
        medico_id: cirujanoAsignado,
        prioridad: prioridadCirugia,
        estado: 'PENDIENTE',
        fecha_registro: new Date(),
        creador_id: enfermeroId,
        creador_tipo: 'ENFERMERO',
        tipo: 'CIRUGIA',
        tipo_turno_id: await obtenerTipoTurnoCirugia(transaction),
        observaciones: `🔪 CIRUGÍA DE URGENCIA\n` +
                       `Triage: ${nivel_triaje || 'Sin evaluar'}\n` +
                       `Motivo: ${observaciones || 'Requiere intervención quirúrgica urgente'}`
      }, { transaction });
      
      // Actualizar evaluación con la lista de espera
      await evaluacion.update({
        lista_espera_generada_id: listaEsperaActualizada.id,
        prioridad: prioridadCirugia === 'URGENTE' ? 'ALTA' : 'MEDIA'
      }, { transaction });
      
      console.log(`✅ Lista de espera para cirugía creada: ${listaEsperaActualizada.id}`);
      
      // ========== NOTIFICAR A CIRUJANOS DEL SECTOR EMERGENCIAS ==========
      try {
        const sectorEmergencias = await Sector.findOne({
          where: { nombre: { [Op.like]: '%Emergencia%' } },
          transaction
        });
        
        if (sectorEmergencias) {
          const cirujanos = await Medico.findAll({
            where: { sector_id: sectorEmergencias.id },
            include: [
              { model: Usuario, as: 'usuario' },
              { 
                model: Especialidad, 
                as: 'especialidad',
                where: { nombre: { [Op.like]: '%Cirug%' } }
              }
            ],
            transaction
          });
          
          console.log(`🔍 Cirujanos encontrados para notificar: ${cirujanos.length}`);
          
          const mensajeCirugia = 
            `🔪 **CIRUGÍA DE URGENCIA**\n\n` +
            `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
            `DNI: ${paciente.usuario.dni}\n` +
            `Triage: ${nivel_triaje || 'Sin evaluar'}\n` +
            `Prioridad: ${prioridadCirugia}\n` +
            `Derivado por: Enfermería\n` +
            `Fecha: ${new Date().toLocaleString('es-AR')}\n\n` +
            `Motivo: ${observaciones || 'Requiere evaluación quirúrgica urgente'}`;
          
          for (const cirujano of cirujanos) {
            await Notificacion.create({
              usuario_id: cirujano.usuario_id,
              remitente_id: req.user.usuario_id,
              mensaje: mensajeCirugia,
              leida: false,
              tipo: 'CIRUGIA_URGENCIA'
            }, { transaction });
            
            console.log(`📢 Notificación enviada a Dr. ${cirujano.usuario.nombre}`);
          }
        }
      } catch (error) {
        console.error('❌ Error al notificar cirujanos:', error.message);
      }
      
      mensajeRespuesta = `🔪 Paciente derivado a CIRUGÍA DE URGENCIA. Prioridad: ${prioridadCirugia}. Se notificó a los cirujanos de guardia.`;
      
    } else {
      console.log('ℹ️ Tipo de egreso no requiere acción adicional');
    }

    // ========== NOTIFICACIONES A ADMINISTRATIVOS ==========
    if (tipo_egreso === 'DERIVACION_MEDICO' || tipo_egreso === 'DERIVACION_URGENCIA' || tipo_egreso === 'PROCEDIMIENTO_COMPLETADO' || tipo_egreso === 'DERIVACION_CIRUGIA') {
      console.log('🔍 Buscando administrativos para notificar...');
      
      const rolAdministrativo = await Rol.findOne({
        where: { nombre: 'ADMINISTRATIVO' },
        transaction
      });

      if (rolAdministrativo) {
        const administrativos = await Usuario.findAll({
          where: { 
            rol_principal_id: rolAdministrativo.id,
            estado: 'Activo'
          },
          limit: 2,
          transaction
        });

        if (administrativos.length > 0) {
          // Crear mensaje según tipo
          let mensajeNotificacion = '';
          
          if (tipo_egreso === 'DERIVACION_CIRUGIA') {
            mensajeNotificacion = `🔪 **DERIVACIÓN A CIRUGÍA DE URGENCIA**\n`;
          } else if (tipo_egreso === 'DERIVACION_MEDICO') {
            mensajeNotificacion = turnoAsignado 
              ? `📅 **DERIVACIÓN CON TURNO ASIGNADO**\n`
              : `🏥 **DERIVACIÓN A MÉDICO**\n`;
          } else if (tipo_egreso === 'DERIVACION_URGENCIA') {
            mensajeNotificacion = `🚨 **DERIVACIÓN A URGENCIAS**\n`;
          } else if (tipo_egreso === 'PROCEDIMIENTO_COMPLETADO') {
            mensajeNotificacion = `✅ **SOLICITUD DE ALTA MÉDICA**\n`;
          }
          
          mensajeNotificacion += 
            `Paciente: ${paciente.usuario.nombre} ${paciente.usuario.apellido}\n` +
            `DNI: ${paciente.usuario.dni}\n` +
            `Derivado por: ${req.user.nombre}\n` +
            `Tipo: ${tipo_egreso}\n`;
          
          if (turnoAsignado) {
            mensajeNotificacion += `Turno: ${fecha_turno} a las ${hora_inicio}\n`;
          }
          
          mensajeNotificacion += `Fecha: ${new Date().toLocaleString('es-AR')}`;

          for (const admin of administrativos) {
            try {
              await Notificacion.create({
                usuario_id: admin.id,
                remitente_id: req.user.usuario_id,
                mensaje: mensajeNotificacion,
                leida: false,
                tipo: 'ENFERMERIA_DERIVACION'
              }, { transaction });
              
              console.log(`✅ Notificación enviada a: ${admin.nombre}`);
            } catch (error) {
              console.error(`❌ Error con ${admin.nombre}:`, error.message);
            }
          }
        }
      }
    }

    // ========== COMMIT Y RESPUESTA ==========
    await transaction.commit();
    console.log('✅ Transacción completada exitosamente');

    res.json({
      success: true,
      message: mensajeRespuesta,
      data: {
        evaluacion_id: evaluacion.id,
        tiene_turno: !!turnoAsignado,
        turno_asignado: turnoAsignado ? {
          id: turnoAsignado.id,
          fecha: turnoAsignado.fecha,
          hora: turnoAsignado.hora_inicio,
          medico_id: turnoAsignado.medico_id
        } : null,
        lista_espera: listaEsperaActualizada ? {
          id: listaEsperaActualizada.id,
          estado: listaEsperaActualizada.estado,
          prioridad: listaEsperaActualizada.prioridad
        } : null,
        redirect: `/enfermero/evaluaciones/${evaluacion.id}`
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear evaluación:', error.message);
    
    let mensajeError = 'Error al crear evaluación';
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      mensajeError = 'Error de referencia: El médico o paciente especificado no existe';
    } else if (error.name === 'SequelizeValidationError') {
      mensajeError = 'Error de validación: Verifique los datos ingresados';
    }
    
    res.status(400).json({
      success: false,
      message: mensajeError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========================================
// FUNCIONES ADICIONALES
// ========================================


exports.obtenerMedicosUrgencias = async (req, res, next) => {
  try {
    console.log('🔍 Obteniendo médicos del sector Emergencias...');
    
    // Buscar sector Emergencias (ID 1 según tus datos)
    const sector = await Sector.findByPk(1);
    
    if (!sector) {
      next(error);
    }
    
    // Buscar médicos de ese sector
    const medicos = await Medico.findAll({
      where: { sector_id: 1 },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email']
        },
        {
          model: Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        }
      ],
      order: [[{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']]
    });
    
    // Formatear respuesta
    const data = medicos.map(medico => ({
      id: medico.id,
      nombre_completo: `${medico.usuario.nombre} ${medico.usuario.apellido}`,
      especialidad: medico.especialidad?.nombre || 'General',
      sector: sector.nombre,
      email: medico.usuario.email,
      matricula: medico.matricula
    }));
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    next(error);
  }
};

// Obtener horarios disponibles de un médico
exports.obtenerHorariosMedico = async (req, res, next) => {
  try {
    const { medicoId } = req.params;
    const { fecha } = req.query;

    // Validaciones básicas
    if (!medicoId || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros: medicoId y fecha son requeridos'
      });
    }

    console.log(` Obteniendo horarios para médico ${medicoId}, fecha ${fecha}`);

    // Usar DIRECTAMENTE utilsHorarios (que ya tienes)
    const resultado = await utilsHorarios.obtenerHorariosDisponibles(
      parseInt(medicoId),
      fecha,
      30 // duración en minutos
    );

    // Si hay error en utilsHorarios
    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        message: resultado.message || 'No hay horarios disponibles',
        horarios: []
      });
    }

    // Retornar horarios
    res.json({
      success: true,
      horarios: resultado.horarios || [],
      message: resultado.message || 'Horarios obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener horarios',
      horarios: []
    });
  }
};

// Actualizar evaluación
exports.actualizarEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      signos_vitales,
      observaciones,
      nivel_triaje,
      tipo_egreso,
      medico_id
    } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    // ✅ IMPORTANTE: No permitir cambiar tipo_egreso de órdenes médicas
    const esOrdenMedica = evaluacion.tipo_egreso === 'ORDEN_MEDICA';

    const updateData = {};
    if (signos_vitales) updateData.signos_vitales = signos_vitales;
    if (observaciones) updateData.observaciones = observaciones;
    if (nivel_triaje) updateData.nivel_triaje = nivel_triaje;
    if (medico_id) updateData.medico_id = medico_id;
    
    // Solo permitir cambiar tipo_egreso si NO es orden médica
    if (tipo_egreso && !esOrdenMedica) {
      updateData.tipo_egreso = tipo_egreso;
    }

    await evaluacion.update(updateData, { transaction });

    // Solo crear lista de espera para evaluaciones de enfermero (no órdenes médicas)
    if (!esOrdenMedica && (tipo_egreso === 'DERIVACION_MEDICO' || tipo_egreso === 'DERIVACION_URGENCIA')) {
      const prioridad = tipo_egreso === 'DERIVACION_URGENCIA' ? 'ALTA' : 'MEDIA';
      
      let listaEspera = await ListaEspera.findOne({
        where: { 
          paciente_id: evaluacion.paciente_id,
          estado: 'PENDIENTE'
        },
        order: [['created_at', 'DESC']],
        transaction
      });

      if (listaEspera) {
        await listaEspera.update({ prioridad }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Evaluación actualizada correctamente',
      redirect: `/enfermero/evaluaciones/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar evaluación:', error);
    next(error);
  }
};

// ========================================
// COMPLETAR EVALUACIÓN - CORREGIDO
// ========================================
exports.completarEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observaciones_finales } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    const esOrdenMedica = evaluacion.tipo_egreso === 'ORDEN_MEDICA';

    // ✅ LÓGICA DIFERENCIADA
    if (esOrdenMedica) {
      // ========================================
      // CASO 1: Es una ORDEN MÉDICA
      // ========================================
      // Solo puede completarse si está en progreso
      if (evaluacion.estado !== 'En_progreso') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Esta orden debe estar en progreso para completarla'
        });
      }

      // Solo cambiar ESTADO, no tipo_egreso
      await evaluacion.update({
        estado: 'Completado',
        observaciones: evaluacion.observaciones 
          ? `${evaluacion.observaciones}\n\n--- Observaciones de ejecución ---\n${observaciones_finales || 'Ninguna'}`
          : observaciones_finales || 'Orden completada'
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Orden médica completada correctamente',
        redirect: '/enfermero/evaluaciones'
      });

    } else {
      // ========================================
      // CASO 2: Es una EVALUACIÓN DE ENFERMERO
      // ========================================
      if (evaluacion.tipo_egreso !== 'PENDIENTE_EVALUACION') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Esta evaluación ya fue completada o derivada'
        });
      }

      // Cambiar tipo_egreso (esto SÍ está permitido para evaluaciones de enfermero)
      await evaluacion.update({
        tipo_egreso: 'PROCEDIMIENTO_COMPLETADO',
        observaciones: evaluacion.observaciones 
          ? `${evaluacion.observaciones}\n\n--- Observaciones finales ---\n${observaciones_finales || 'Ninguna'}`
          : observaciones_finales || 'Procedimiento completado'
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Evaluación completada correctamente',
        redirect: '/enfermero/evaluaciones'
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error al completar evaluación:', error);
    next(error);
  }
};

// ========================================
// TOMAR EVALUACIÓN (ORDEN MÉDICA) - CORREGIDO
// ========================================
exports.tomarEvaluacion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const enfermeroId = req.user.enfermero_id;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    // Verificar que sea una orden médica
    if (evaluacion.tipo_egreso !== 'ORDEN_MEDICA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden tomar órdenes médicas'
      });
    }

    // Verificar que no esté ya asignada
    if (evaluacion.enfermero_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya tiene un enfermero asignado'
      });
    }

    // Verificar que esté pendiente
    if (evaluacion.estado !== 'Pendiente') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya no está pendiente'
      });
    }

    // ✅ CORRECTO: Solo cambiar estado y asignar enfermero
    // tipo_egreso se mantiene como 'ORDEN_MEDICA'
    await evaluacion.update({
      enfermero_id: enfermeroId,
      estado: 'En_progreso'
      // NO tocar tipo_egreso
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden médica tomada correctamente',
      redirect: `/enfermero/evaluaciones/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al tomar evaluación:', error);
    next(error);
  }
};

// ========================================
// DERIVAR A MÉDICO - CORREGIDO
// ========================================
exports.derivarMedico = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { medico_id, motivo_derivacion, urgente } = req.body;

    const evaluacion = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!evaluacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada'
      });
    }

    //  NO permitir derivar órdenes médicas (ya vienen del médico)
    if (evaluacion.tipo_egreso === 'ORDEN_MEDICA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Las órdenes médicas no pueden ser derivadas. Debe completarlas o cancelarlas.'
      });
    }

    // Solo se pueden derivar evaluaciones pendientes
    if (evaluacion.tipo_egreso !== 'PENDIENTE_EVALUACION') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden derivar evaluaciones pendientes'
      });
    }

    if (medico_id) {
      const medico = await Medico.findByPk(medico_id, { transaction });
      if (!medico) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Médico no encontrado'
        });
      }
    }

    const tipoEgreso = urgente === true || urgente === 'true' ? 'DERIVACION_URGENCIA' : 'DERIVACION_MEDICO';

    await evaluacion.update({
      medico_id: medico_id || null,
      tipo_egreso: tipoEgreso,
      observaciones: evaluacion.observaciones 
        ? `${evaluacion.observaciones}\n\n--- Derivado a médico ---\nMotivo: ${motivo_derivacion}`
        : `Derivado a médico\nMotivo: ${motivo_derivacion}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Paciente derivado correctamente',
      redirect: '/enfermero/evaluaciones'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al derivar a médico:', error);
    next(error);
  }
};

// Buscar médicos disponibles
exports.buscarMedicos = async (req, res, next) => {
  try {
    const { especialidad_id } = req.query;

    const whereCondition = {};
    if (especialidad_id) {
      whereCondition.especialidad_id = especialidad_id;
    }

    const medicos = await Medico.findAll({
      where: whereCondition,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
      }]
    });

    res.json({
      success: true,
      medicos: medicos.map(m => ({
        id: m.id,
        nombre: `${m.usuario.nombre} ${m.usuario.apellido}`,
        matricula: m.matricula
      }))
    });

  } catch (error) {
    console.error('Error al buscar médicos:', error);
    next(error);
  }
};

// Exportar evaluaciones a PDF
exports.exportarPDF = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    res.json({
      success: true,
      message: 'Funcionalidad en desarrollo'
    });

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    next(error);
  }
};

// Formulario para editar evaluación
exports.formularioEditarEvaluacion = async (req, res, next) => {
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
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
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
          model: Medico,
          as: 'medico',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!evaluacion) {
      return res.status(404).render('error', {
        message: 'Evaluación no encontrada'
      });
    }

    // Verificar que el enfermero sea el dueño de la evaluación
    if (evaluacion.enfermero_id !== req.user.id) {
      return res.status(403).render('error', {
        message: 'No tiene permisos para editar esta evaluación'
      });
    }

    // Solo se pueden editar evaluaciones pendientes (no órdenes médicas)
    if (evaluacion.tipo_egreso !== 'PENDIENTE_EVALUACION') {
      return res.status(400).render('error', {
        message: 'Solo se pueden editar evaluaciones pendientes'
      });
    }

    // Obtener médicos disponibles
    const medicos = await Medico.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
      }],
      order: [['id', 'ASC']]
    });

    res.render('dashboard/enfermero/evaluaciones-editar', {
      title: 'Editar Evaluación',
      user: req.user,
      evaluacion,
      medicos
    });

  } catch (error) {
    console.error('Error al cargar formulario de edición:', error);
    next(error);
  }
};


module.exports = exports;