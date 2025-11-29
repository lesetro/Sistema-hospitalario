
const { Op } = require('sequelize');
const SearchPaginationService = require('../services/searchPaginationService');
const NotificationService = require('../services/notificationService');
const { 
  Admision, 
  Paciente, 
  Usuario, 
  Medico, 
  Sector, 
  Turno, 
  TipoTurno,
  MotivoAdmision,
  FormaIngreso,
  Cama,
  Internacion
} = require('../models');

// Configurar servicio de búsqueda para admisiones
const admisionSearchService = new SearchPaginationService(
  Admision,
  ['$paciente.usuario.dni$', '$paciente.usuario.nombre$', '$paciente.usuario.apellido$'],
  [
    { 
      model: Paciente, 
      as: 'paciente',
      include: [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }]
    },
    { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }] },
    { model: Sector, as: 'sector', attributes: ['nombre'] },
    { 
      model: Turno, 
      as: 'turno', 
      include: [{ model: TipoTurno, as: 'tipoTurno', attributes: ['nombre'] }]
    }
  ]
);

// Dashboard principal
const getDashboard = async (req, res) => {
  try {
    // Obtener todas las estadísticas y datos en paralelo
    const [
      estadisticas,
      admisionesData,
      alertas
    ] = await Promise.all([
      getEstadisticasDashboard(),
      getAdmisionesConPaginacion(req.query),
      getNotificacionesActivas(req.user?.id)
    ]);

    res.render('dashboard/admin/dashboard-admin', {
      title: 'Dashboard',
      estadisticas,
      admisiones: admisionesData.data,
      pagination: admisionesData.pagination,
      alertas,
      searchTerm: req.query.search || ''
    });

  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar el dashboard', 
      error: error.message 
    });
  }
};

// Obtener estadísticas del dashboard
const getEstadisticasDashboard = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const [
      pacientesActivos,
      camasOcupadas,
      turnosHoy,
      admisionesHoy,
      emergenciasActivas
    ] = await Promise.all([
      // Pacientes activos
      Paciente.count({
        where: { estado: 'Activo' }
      }),
      
      // Camas ocupadas
      Cama.count({
        where: { estado: 'Ocupada' }
      }),
      
      // Turnos de hoy
      Turno.count({
        where: {
          fecha: {
            [Op.between]: [hoy, mañana]
          }
        }
      }),
      
      // Admisiones de hoy
      Admision.count({
        where: {
          fecha: {
            [Op.between]: [hoy, mañana]
          }
        }
      }),
      
      // Emergencias activas (admisiones pendientes de emergencia)
      Admision.count({
        where: {
          estado: 'Pendiente',
          forma_ingreso_id: 1 // Asumiendo que 1 es emergencia
        }
      })
    ]);

    return {
      pacientesActivos,
      camasOcupadas,
      turnosHoy,
      admisionesHoy,
      emergenciasActivas
    };

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      pacientesActivos: 0,
      camasOcupadas: 0,
      turnosHoy: 0,
      admisionesHoy: 0,
      emergenciasActivas: 0
    };
  }
};

// Obtener admisiones con paginación y filtros
const getAdmisionesConPaginacion = async (queryParams) => {
  try {
    const options = {
      page: queryParams.page || 1,
      limit: queryParams.limit || 15,
      search: queryParams.search || '',
      sortBy: queryParams.sortBy || 'fecha',
      sortOrder: queryParams.sortOrder || 'DESC'
    };

    // Filtros adicionales
    let whereConditions = {};
    
    if (queryParams.estado) {
      whereConditions.estado = queryParams.estado;
    }
    
    if (queryParams.fecha_desde && queryParams.fecha_hasta) {
      whereConditions.fecha = {
        [Op.between]: [queryParams.fecha_desde, queryParams.fecha_hasta]
      };
    }

    // Aplicar filtros al servicio de búsqueda
    if (Object.keys(whereConditions).length > 0) {
      // Extender el servicio para incluir filtros adicionales
      const result = await Admision.findAndCountAll({
        where: {
          ...whereConditions,
          ...(options.search ? {
            [Op.or]: [
              { '$paciente.usuario.dni$': { [Op.like]: `%${options.search}%` } },
              { '$paciente.usuario.nombre$': { [Op.like]: `%${options.search}%` } },
              { '$paciente.usuario.apellido$': { [Op.like]: `%${options.search}%` } }
            ]
          } : {})
        },
        include: admisionSearchService.includes,
        limit: parseInt(options.limit),
        offset: (options.page - 1) * options.limit,
        order: [[options.sortBy, options.sortOrder.toUpperCase()]],
        distinct: true
      });

      return {
        data: result.rows,
        pagination: {
          currentPage: parseInt(options.page),
          totalPages: Math.ceil(result.count / options.limit),
          totalItems: result.count,
          itemsPerPage: parseInt(options.limit),
          hasNext: options.page < Math.ceil(result.count / options.limit),
          hasPrev: options.page > 1
        }
      };
    }

    // Usar el servicio de búsqueda normal
    return await admisionSearchService.search(options);

  } catch (error) {
    console.error('Error al obtener admisiones:', error);
    return {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 15,
        hasNext: false,
        hasPrev: false
      }
    };
  }
};

// Obtener notificaciones activas
const getNotificacionesActivas = async (userId) => {
  try {
    if (!userId) return [];
    
    return NotificationService.getNotificationsForUser(userId, null, 10);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
};

// API para búsqueda global
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
      resultados.pacientes = await Paciente.findAll({
        where: {
          [Op.or]: [
            { '$usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }],
        limit: 5
      });
    }

    // Buscar admisiones
    if (filter === 'all' || filter === 'admisiones') {
      resultados.admisiones = await Admision.findAll({
        where: {
          [Op.or]: [
            { '$paciente.usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$paciente.usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [
          { 
            model: Paciente, 
            as: 'paciente',
            include: [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }]
          }
        ],
        limit: 5
      });
    }

    // Buscar turnos
    if (filter === 'all' || filter === 'turnos') {
      resultados.turnos = await Turno.findAll({
        where: {
          [Op.or]: [
            { '$paciente.usuario.dni$': { [Op.like]: `%${search}%` } },
            { '$medico.usuario.nombre$': { [Op.like]: `%${search}%` } },
            { '$medico.usuario.apellido$': { [Op.like]: `%${search}%` } }
          ]
        },
        include: [
          { 
            model: Paciente, 
            as: 'paciente',
            include: [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }]
          },
          { 
            model: Medico, 
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
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

// API para marcar notificación como leída
const marcarNotificacionLeida = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const marked = NotificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: marked,
      message: marked ? 'Notificación marcada como leída' : 'No se pudo marcar la notificación'
    });

  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
};

// API para obtener datos de admisión
const getAdmisionDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const admision = await Admision.findByPk(id, {
      include: [
        { 
          model: Paciente, 
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario' }]
        },
        { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] },
        { model: Sector, as: 'sector' },
        { model: MotivoAdmision, as: 'motivo' },
        { model: FormaIngreso, as: 'forma_ingreso' },
        { 
          model: Turno, 
          as: 'turno',
          include: [{ model: TipoTurno, as: 'tipoTurno' }]
        },
        { model: Internacion, as: 'internacion' }
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

module.exports = {
  getDashboard,
  getEstadisticasDashboard,
  busquedaGlobal,
  marcarNotificacionLeida,
  getAdmisionDetalle
};