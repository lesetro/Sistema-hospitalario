const db = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

/**
 * Obtener estadísticas generales del hospital
 */

const getEstadisticasGenerales = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Inicio y fin del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    const [
      pacientesActivos,
      camasOcupadas,
      camasDisponibles,
      turnosHoy,
      admisionesHoy,
      internacionesActivas,
      listasEsperaPendientes,
      altasMedicasHoy,
      facturasNoPublicas,
      facturasPublicas
    ] = await Promise.all([
      // Pacientes activos
      db.Paciente.count({
        where: { estado: 'Activo' }
      }),

      // Camas ocupadas
      db.Cama.count({
        where: { estado: 'Ocupada' }
      }),

      // Camas disponibles
      db.Cama.count({
        where: { estado: 'Libre' }
      }),

      // Turnos de hoy
      db.Turno.count({
        where: {
          fecha: {
            [Op.between]: [hoy, manana]
          }
        }
      }),

      // Admisiones de hoy
      db.Admision.count({
        where: {
          fecha: {
            [Op.between]: [hoy, manana]
          }
        }
      }),

      // Internaciones activas (sin fecha de alta)
      db.Internacion.count({
        where: {
          fecha_alta: null
        }
      }),

      // Listas de espera pendientes
      db.ListaEspera.count({
        where: {
          estado: 'PENDIENTE'
        }
      }),

      // Altas médicas de hoy
      db.AltaMedica.count({
        where: {
          fecha_alta: {
            [Op.between]: [hoy, manana]
          }
        }
      }),

      // Facturas no públicas (Obra Social + Particulares)
      db.Factura.count({
        where: {
          tipo_pago: {
            [Op.notIn]: ['SISTEMA PUBLICO']
          }
        }
      }),

      // Facturas públicas
      db.Factura.count({
        where: {
          tipo_pago: 'SISTEMA PUBLICO'
        }
      })
    ]);

    return {
      pacientesActivos,
      camasOcupadas,
      camasDisponibles,
      camasTotales: camasOcupadas + camasDisponibles,
      turnosHoy,
      admisionesHoy,
      internacionesActivas,
      listasEsperaPendientes,
      altasMedicasHoy,
      facturasNoPublicas,
      facturasPublicas
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas generales:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas demográficas de admisiones del día
 */
const getEstadisticasDemograficas = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Obtener todas las admisiones de hoy con datos del usuario
    const admisionesHoy = await db.Admision.findAll({
      where: {
        fecha: {
          [Op.between]: [hoy, manana]
        }
      },
      include: [
        {
          model: db.Paciente,
          as: 'paciente',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['sexo', 'fecha_nacimiento']
            }
          ]
        }
      ]
    });

    // Calcular edades y categorizar
    const demograficos = {
      hombres: 0,
      mujeres: 0,
      otros: 0,
      ninos: 0,      // 0-12 años
      adolescentes: 0, // 13-17 años
      adultos: 0,    // 18-64 años
      adultosMayores: 0 // 65+ años
    };

    admisionesHoy.forEach(admision => {
      const usuario = admision.paciente?.usuario;
      if (!usuario) return;

      // Contar por sexo
      if (usuario.sexo === 'Masculino') demograficos.hombres++;
      else if (usuario.sexo === 'Femenino') demograficos.mujeres++;
      else demograficos.otros++;

      // Calcular edad y categorizar
      const fechaNac = new Date(usuario.fecha_nacimiento);
      const edad = Math.floor((hoy - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));

      if (edad <= 12) demograficos.ninos++;
      else if (edad <= 17) demograficos.adolescentes++;
      else if (edad <= 64) demograficos.adultos++;
      else demograficos.adultosMayores++;
    });

    return demograficos;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas demográficas:', error);
    return {
      hombres: 0,
      mujeres: 0,
      otros: 0,
      ninos: 0,
      adolescentes: 0,
      adultos: 0,
      adultosMayores: 0
    };
  }
};

/**
 * Obtener estadísticas de formas de ingreso
 */
const getEstadisticasFormasIngreso = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Inicio y fin del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [admisionesHoy, admisionesMes] = await Promise.all([
      // Admisiones de hoy agrupadas por forma de ingreso
      db.Admision.findAll({
        where: {
          fecha: {
            [Op.between]: [hoy, manana]
          }
        },
        include: [
          {
            model: db.FormaIngreso,
            as: 'forma_ingreso',
            attributes: ['nombre']
          }
        ],
        attributes: ['forma_ingreso_id', [Sequelize.fn('COUNT', Sequelize.col('Admision.id')), 'total']],
        group: ['forma_ingreso_id', 'forma_ingreso.id'],
        raw: false
      }),

      // Admisiones del mes agrupadas por forma de ingreso
      db.Admision.findAll({
        where: {
          fecha: {
            [Op.gte]: inicioMes
          }
        },
        include: [
          {
            model: db.FormaIngreso,
            as: 'forma_ingreso',
            attributes: ['nombre']
          }
        ],
        attributes: ['forma_ingreso_id', [Sequelize.fn('COUNT', Sequelize.col('Admision.id')), 'total']],
        group: ['forma_ingreso_id', 'forma_ingreso.id'],
        raw: false
      })
    ]);

    return {
      hoy: admisionesHoy.map(a => ({
        nombre: a.forma_ingreso?.nombre || 'Sin especificar',
        total: parseInt(a.get('total'))
      })),
      mes: admisionesMes.map(a => ({
        nombre: a.forma_ingreso?.nombre || 'Sin especificar',
        total: parseInt(a.get('total'))
      }))
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de formas de ingreso:', error);
    return { hoy: [], mes: [] };
  }
};

/**
 * Obtener estadísticas de tipos de estudio más solicitados
 */
const getEstadisticosEstudios = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Inicio del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const estudiosDelMes = await db.EstudioSolicitado.findAll({
      where: {
        created_at: {
          [Op.gte]: inicioMes
        }
      },
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        }
      ],
      attributes: [
        'tipo_estudio_id',
        [Sequelize.fn('COUNT', Sequelize.col('EstudioSolicitado.id')), 'total']
      ],
      group: ['tipo_estudio_id', 'tipo_estudio.id'],
      order: [[Sequelize.literal('total'), 'DESC']],
      limit: 5,
      raw: false
    });

    return estudiosDelMes.map(e => ({
      nombre: e.tipo_estudio?.nombre || 'Sin especificar',
      categoria: e.tipo_estudio?.categoria || 'N/A',
      total: parseInt(e.get('total'))
    }));
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de estudios:', error);
    return [];
  }
};

/**
 * Obtener estadísticas de tipos de internación
 */
const getEstadisticasTiposInternacion = async () => {
  try {
    const internacionesActivas = await db.Internacion.findAll({
      where: {
        fecha_alta: null
      },
      include: [
        {
          model: db.TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre']
        }
      ],
      attributes: [
        'tipo_internacion_id',
        [Sequelize.fn('COUNT', Sequelize.col('Internacion.id')), 'total']
      ],
      group: ['tipo_internacion_id', 'tipoInternacion.id'],
      order: [[Sequelize.literal('total'), 'DESC']],
      raw: false
    });

    return internacionesActivas.map(i => ({
      nombre: i.tipoInternacion?.nombre || 'Sin especificar',
      total: parseInt(i.get('total'))
    }));
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de tipos de internación:', error);
    return [];
  }
};
const getAlertasImportantes = async (usuarioId) => {
  try {
    const alertas = [];
    const hoy = new Date();

    // 1. Notificaciones no leídas del usuario
    const notificacionesPendientes = await db.Notificacion.findAll({
      where: {
        usuario_id: usuarioId,
        leida: false
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    notificacionesPendientes.forEach(notif => {
      alertas.push({
        id: `notif-${notif.id}`,
        type: 'info',
        title: 'Notificación',
        message: notif.mensaje,
        timestamp: notif.created_at,
        actions: [
          { label: 'Marcar como leída', url: `/api/notifications/${notif.id}/mark-read` }
        ]
      });
    });

    // 2. Pacientes en estado crítico
    const pacientesCriticos = await db.Internacion.count({
      where: {
        estado_paciente: 'Critico',
        fecha_alta: null
      }
    });

    if (pacientesCriticos > 0) {
      alertas.push({
        id: 'pacientes-criticos',
        type: 'emergency',
        title: 'Pacientes en Estado Crítico',
        message: `Hay ${pacientesCriticos} paciente(s) en estado crítico que requieren atención inmediata.`,
        timestamp: hoy,
        actions: [
          { label: 'Ver pacientes', url: '/internacion?filtro=criticos' }
        ]
      });
    }

    // 3. Camas en limpieza pendientes
    const camasEnLimpieza = await db.Cama.count({
      where: { estado: 'EnLimpieza' }
    });

    if (camasEnLimpieza > 0) {
      alertas.push({
        id: 'camas-limpieza',
        type: 'warning',
        title: 'Camas en Proceso de Limpieza',
        message: `${camasEnLimpieza} cama(s) están en proceso de limpieza y no disponibles.`,
        timestamp: hoy,
        actions: [
          { label: 'Ver estado de camas', url: '/internacion/camas' }
        ]
      });
    }

    // 4. Listas de espera con alta prioridad
    const listasAltaPrioridad = await db.ListaEspera.count({
      where: {
        estado: 'PENDIENTE',
        prioridad: 'ALTA'
      }
    });

    if (listasAltaPrioridad > 0) {
      alertas.push({
        id: 'listas-alta-prioridad',
        type: 'warning',
        title: 'Listas de Espera Prioritarias',
        message: `${listasAltaPrioridad} paciente(s) en lista de espera con prioridad ALTA.`,
        timestamp: hoy,
        actions: [
          { label: 'Gestionar listas', url: '/turnos/lista-espera' }
        ]
      });
    }

    // 5. Turnos confirmados para hoy pendientes de atención
    const turnosPendientesHoy = await db.Turno.count({
      where: {
        fecha: hoy,
        estado: 'CONFIRMADO'
      }
    });

    if (turnosPendientesHoy > 0) {
      alertas.push({
        id: 'turnos-hoy',
        type: 'info',
        title: 'Turnos Confirmados Hoy',
        message: `${turnosPendientesHoy} turno(s) confirmado(s) pendiente(s) de atención para hoy.`,
        timestamp: hoy,
        actions: [
          { label: 'Ver agenda', url: '/turnos' }
        ]
      });
    }

    // 6. Solicitudes de derivación pendientes
    const derivacionesPendientes = await db.SolicitudDerivacion.count({
      where: { estado: 'Pendiente' }
    });

    if (derivacionesPendientes > 0) {
      alertas.push({
        id: 'derivaciones-pendientes',
        type: 'warning',
        title: 'Derivaciones Pendientes',
        message: `${derivacionesPendientes} solicitud(es) de derivación pendiente(s) de aprobación.`,
        timestamp: hoy,
        actions: [
          { label: 'Revisar derivaciones', url: '/derivaciones' }
        ]
      });
    }

    // 7. Facturas pendientes de pago
    const facturasPendientes = await db.Factura.count({
      where: { estado: 'Pendiente' }
    });

    if (facturasPendientes > 5) {
      alertas.push({
        id: 'facturas-pendientes',
        type: 'info',
        title: 'Facturas Pendientes',
        message: `${facturasPendientes} factura(s) pendiente(s) de pago.`,
        timestamp: hoy,
        actions: [
          { label: 'Ver facturación', url: '/facturacion' }
        ]
      });
    }

    return alertas;
  } catch (error) {
    console.error('❌ Error al obtener alertas importantes:', error);
    return [];
  }
};

/**
 * Obtener estadísticas de ocupación por sector
 */
const getEstadisticasPorSector = async () => {
  try {
    const sectores = await db.Sector.findAll({
      attributes: [
        'id',
        'nombre',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM internaciones i
            INNER JOIN habitaciones h ON i.habitacion_id = h.id
            WHERE h.sector_id = Sector.id
            AND i.fecha_alta IS NULL
          )`),
          'internaciones_activas'
        ]
      ],
      raw: true
    });

    return sectores;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas por sector:', error);
    return [];
  }
};

/**
 * Obtener resumen de admisiones recientes
 */
const getAdmisionesRecientes = async (limite = 5) => {
  try {
    const admisiones = await db.Admision.findAll({
      include: [
        {
          model: db.Paciente,
          as: 'paciente',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni']
            }
          ]
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre']
        },
        {
          model: db.MotivoAdmision,
          as: 'motivo',
          attributes: ['nombre']
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limite
    });

    return admisiones;
  } catch (error) {
    console.error('❌ Error al obtener admisiones recientes:', error);
    return [];
  }
};

/**
 * Controlador principal del dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Obtener todos los datos en paralelo
    const [
      estadisticas,
      demograficos,
      formasIngreso,
      estudios,
      tiposInternacion,
      alertas,
      admisionesRecientes
    ] = await Promise.all([
      getEstadisticasGenerales().catch(err => {
        console.error('Error en estadísticas:', err);
        return {
          pacientesActivos: 0,
          camasOcupadas: 0,
          camasDisponibles: 0,
          camasTotales: 0,
          turnosHoy: 0,
          admisionesHoy: 0,
          internacionesActivas: 0,
          listasEsperaPendientes: 0,
          altasMedicasHoy: 0,
          facturasNoPublicas: 0,
          facturasPublicas: 0
        };
      }),
      getEstadisticasDemograficas().catch(err => {
        console.error('Error en demográficos:', err);
        return {
          hombres: 0,
          mujeres: 0,
          otros: 0,
          ninos: 0,
          adolescentes: 0,
          adultos: 0,
          adultosMayores: 0
        };
      }),
      getEstadisticasFormasIngreso().catch(err => {
        console.error('Error en formas de ingreso:', err);
        return { hoy: [], mes: [] };
      }),
      getEstadisticosEstudios().catch(err => {
        console.error('Error en estudios:', err);
        return [];
      }),
      getEstadisticasTiposInternacion().catch(err => {
        console.error('Error en tipos de internación:', err);
        return [];
      }),
      getAlertasImportantes(usuarioId).catch(err => {
        console.error('Error en alertas:', err);
        return [];
      }),
      getAdmisionesRecientes(5).catch(err => {
        console.error('Error en admisiones recientes:', err);
        return [];
      })
    ]);

    res.render('dashboard/admin/dashboard-admin', {
      title: 'Dashboard',
      user: req.user,
      estadisticas,
      demograficos,
      formasIngreso,
      estudios,
      tiposInternacion,
      alertas,
      admisionesRecientes
    });
  } catch (error) {
    console.error('❌ Error en getDashboard:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * API para marcar notificación como leída
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const notificacion = await db.Notificacion.findOne({
      where: {
        id,
        usuario_id: usuarioId
      }
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await notificacion.update({ leida: true });

    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('❌ Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

/**
 * API para obtener notificaciones del usuario
 */
const getNotifications = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { limit = 10, unreadOnly = false } = req.query;

    const where = { usuario_id: usuarioId };
    if (unreadOnly === 'true') {
      where.leida = false;
    }

    const notificaciones = await db.Notificacion.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const unreadCount = await db.Notificacion.count({
      where: {
        usuario_id: usuarioId,
        leida: false
      }
    });

    res.json({
      notificaciones,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

/**
 * API para obtener notificaciones del usuario
 */
const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { limit = 10, unreadOnly = false } = req.query;

    const where = { usuario_id: usuarioId };
    if (unreadOnly === 'true') {
      where.leida = false;
    }

    const notificaciones = await db.Notificacion.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const unreadCount = await db.Notificacion.count({
      where: {
        usuario_id: usuarioId,
        leida: false
      }
    });

    res.json({
      success: true,
      notificaciones,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

/**
 * API para búsqueda global
 */
const busquedaGlobal = async (req, res) => {
  try {
    const { search, filter = 'all' } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    const resultados = {};

    // Buscar pacientes
    if (filter === 'all' || filter === 'pacientes') {
      resultados.pacientes = await db.Paciente.findAll({
        where: {
          [Op.or]: [
            { '$usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [{ 
          model: db.Usuario, 
          as: 'usuario', 
          attributes: ['dni', 'nombre', 'apellido'] 
        }],
        limit: 5
      });
    }

    // Buscar admisiones
    if (filter === 'all' || filter === 'admisiones') {
      resultados.admisiones = await db.Admision.findAll({
        where: {
          [Op.or]: [
            { '$paciente.usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [
          { 
            model: db.Paciente, 
            as: 'paciente',
            include: [{ 
              model: db.Usuario, 
              as: 'usuario', 
              attributes: ['dni', 'nombre', 'apellido'] 
            }]
          }
        ],
        limit: 5
      });
    }

    // Buscar turnos
    if (filter === 'all' || filter === 'turnos') {
      resultados.turnos = await db.Turno.findAll({
        where: {
          [Op.or]: [
            { '$paciente.usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [
          { 
            model: db.Paciente, 
            as: 'paciente',
            include: [{ 
              model: db.Usuario, 
              as: 'usuario', 
              attributes: ['dni', 'nombre', 'apellido'] 
            }]
          }
        ],
        limit: 5
      });
    }

    res.json({
      success: true,
      resultados,
      searchTerm: search
    });

  } catch (error) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
};

/**
 * API para obtener detalles de una admisión
 */
const getAdmisionDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const admision = await db.Admision.findByPk(id, {
      include: [
        { 
          model: db.Paciente, 
          as: 'paciente',
          include: [{ model: db.Usuario, as: 'usuario' }]
        },
        { 
          model: db.Medico, 
          as: 'medico', 
          include: [{ model: db.Usuario, as: 'usuario' }] 
        },
        { model: db.Sector, as: 'sector' },
        { model: db.MotivoAdmision, as: 'motivo' },
        { model: db.FormaIngreso, as: 'forma_ingreso' },
        { model: db.Internacion, as: 'internacion' }
      ]
    });

    if (!admision) {
      return res.status(404).json({
        success: false,
        message: 'Admisión no encontrada'
      });
    }

    res.json({
      success: true,
      admision
    });

  } catch (error) {
    console.error('Error al obtener detalles de admisión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles',
      error: error.message
    });
  }
};

/**
 * API para marcar notificación como leída
 */
const marcarNotificacionLeida = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const usuarioId = req.user.id;

    const notificacion = await db.Notificacion.findOne({
      where: {
        id: notificationId,
        usuario_id: usuarioId
      }
    });

    if (!notificacion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notificación no encontrada' 
      });
    }

    await notificacion.update({ leida: true });

    res.json({ 
      success: true, 
      message: 'Notificación marcada como leída' 
    });
  } catch (error) {
    console.error('❌ Error al marcar notificación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al marcar notificación' 
    });
  }
};

module.exports = {
  getDashboard,
  markNotificationAsRead,
  getNotifications: obtenerNotificaciones,
  obtenerNotificaciones,
  busquedaGlobal,
  getAdmisionDetalle,
  marcarNotificacionLeida,
  getEstadisticasGenerales,
  getAlertasImportantes,
  getEstadisticasDemograficas,
  getEstadisticasFormasIngreso,
  getEstadisticosEstudios,
  getEstadisticasTiposInternacion
};