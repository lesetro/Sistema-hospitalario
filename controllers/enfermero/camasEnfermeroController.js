const { 
  Sector, 
  Habitacion, 
  Cama, 
  TipoDeServicio, 
  Paciente, 
  Usuario, 
  Admision, 
  Internacion, 
  Medico,            
  ObraSocial, 
  TipoInternacion,   
  ListaEspera, 
  Administrativo,
  AltaMedica,
  Enfermero
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');
const sequelize = db.sequelize;

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================
const CONFIG = {
  TIEMPO_LIMPIEZA_HORAS: 2,
  LIMITE_BUSQUEDA_PACIENTES: 20,
  LIMITE_HISTORIAL: 10,
  LIMITE_CAMAS_API: 50,
  MIN_CARACTERES_BUSQUEDA: 3
};

// ============================================================================
// FUNCIONES AUXILIARES 
// ============================================================================

/**
 * Obtiene el sector_id del enfermero desde el middleware de autenticación
 */
function obtenerSectorEnfermero(req) {
  if (!req.user || !req.user.sector_id) {
    throw new Error('No se pudo determinar el sector del enfermero');
  }
  return req.user.sector_id;
}

/**
 * Calcula estadísticas de camas para un sector específico
 */
async function calcularEstadisticasSector(sectorId) {
  const includeHabitacion = [{
    model: Habitacion,
    as: 'habitacion',
    where: { sector_id: sectorId },
    attributes: []
  }];

  const [totalCamas, camasLibres, camasOcupadas, camasLimpieza] = await Promise.all([
    Cama.count({ include: includeHabitacion }),
    Cama.count({ where: { estado: 'Libre' }, include: includeHabitacion }),
    Cama.count({ where: { estado: 'Ocupada' }, include: includeHabitacion }),
    Cama.count({ where: { estado: 'EnLimpieza' }, include: includeHabitacion })
  ]);

  return {
    totalCamas,
    camasLibres,
    camasOcupadas,
    camasLimpieza,
    porcentajeOcupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0
  };
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/**
 * Agrupa habitaciones por tipo de servicio
 */
function agruparPorServicio(habitaciones) {
  const habitacionesPorServicio = {};
  
  habitaciones.forEach(habitacion => {
    const servicioId = habitacion.tipo_de_servicio_id;
    const servicioNombre = habitacion.tipoServicio?.nombre || 'Sin servicio';
    
    if (!habitacionesPorServicio[servicioId]) {
      habitacionesPorServicio[servicioId] = {
        id: servicioId,
        nombre: servicioNombre,
        habitaciones: []
      };
    }
    
    habitacionesPorServicio[servicioId].habitaciones.push(habitacion);
  });
  
  return Object.values(habitacionesPorServicio);
}

/**
 * Convierte tipos de habitación a array con iconos
 */
function formatearTiposHabitacion(tiposHabitacion) {
  const iconos = {
    'Individual': 'fa-user',
    'Doble': 'fa-user-friends',
    'Colectiva': 'fa-users'
  };
  
  return Object.entries(tiposHabitacion).map(([tipo, cantidad]) => ({
    tipo,
    cantidad,
    icono: iconos[tipo] || 'fa-bed'
  }));
}

/**
 * Obtiene el texto de capacidad según el tipo de habitación
 */
function obtenerCapacidadTexto(tipo) {
  const capacidades = {
    'Individual': '1 cama',
    'Doble': '2 camas',
    'Colectiva': 'Múltiples camas'
  };
  return capacidades[tipo] || 'No especificada';
}

// ============================================================================
// VISTAS PRINCIPALES DEL SECTOR DEL ENFERMERO
// ============================================================================

/**
 * Dashboard principal - Vista del sector del enfermero
 * GET /enfermero/camas/
 */
exports.vistaSectorEnfermero = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    
    const sector = await Sector.findByPk(sectorId, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [
          { model: TipoDeServicio, as: 'tipoServicio' },
          { model: Cama, as: 'camas', attributes: ['id', 'estado', 'numero'] }
        ]
      }]
    });

    if (!sector) {
      return res.status(404).render('error', {
        message: 'Sector no encontrado o no asignado'
      });
    }

    const estadisticasSector = await calcularEstadisticasSector(sectorId);
    const habitacionesPorServicio = agruparPorServicio(sector.habitaciones);

    res.render('dashboard/enfermero/camas-dashboard', {
      title: `Sector ${sector.nombre}`,
      user: req.user,
      sector,
      habitacionesPorServicio,
      estadisticas: estadisticasSector
    });

  } catch (error) {
    console.error('Error en vista sector enfermero:', error);
    next(error);
  }
};

/**
 * Ver detalles del sector del enfermero
 * GET /enfermero/camas/sector
 */
exports.verSectorEnfermero = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    
    const sector = await Sector.findByPk(sectorId, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [
          { model: TipoDeServicio, as: 'tipoServicio' },
          { model: Cama, as: 'camas', attributes: ['id', 'estado', 'numero'] }
        ]
      }]
    });

    if (!sector) {
      return res.status(404).render('error', {
        message: 'Sector no encontrado'
      });
    }

    const estadisticas = await calcularEstadisticasSector(sectorId);

    res.render('dashboard/enfermero/camas-sectores', {
      title: `Sector ${sector.nombre}`,
      user: req.user,
      sector,
      estadisticas
    });

  } catch (error) {
    console.error('Error al ver sector:', error);
    next(error);
  }
};

// ============================================================================
// SERVICIOS Y HABITACIONES
// ============================================================================

/**
 * Listar servicios del sector del enfermero
 * GET /enfermero/camas/servicios
 */
exports.serviciosPorSector = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    
    const servicios = await TipoDeServicio.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        where: { sector_id: sectorId },
        attributes: ['id'],
        required: true
      }],
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    const serviciosConConteo = await Promise.all(servicios.map(async (servicio) => {
      const whereHabitacion = { 
        sector_id: sectorId,
        tipo_de_servicio_id: servicio.id
      };

      const [totalHabitaciones, camasOcupadas, totalCamas] = await Promise.all([
        Habitacion.count({ where: whereHabitacion }),
        Cama.count({
          where: { estado: 'Ocupada' },
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: whereHabitacion,
            attributes: []
          }]
        }),
        Cama.count({
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: whereHabitacion,
            attributes: []
          }]
        })
      ]);

      return {
        ...servicio.toJSON(),
        estadisticas: {
          totalHabitaciones,
          totalCamas,
          camasOcupadas,
          camasLibres: totalCamas - camasOcupadas
        }
      };
    }));

    res.render('dashboard/enfermero/camas-tipos-servicio', {
      title: 'Servicios del Sector',
      user: req.user,
      servicios: serviciosConConteo
    });

  } catch (error) {
    console.error('Error al listar servicios:', error);
    next(error);
  }
};

/**
 * Habitaciones por servicio (dentro del sector del enfermero)
 * GET /enfermero/camas/servicios/:servicioId/habitaciones
 */
exports.habitacionesPorServicio = async (req, res, next) => {
  try {
    const { servicioId } = req.params;
    const sectorId = obtenerSectorEnfermero(req);
    
    const servicio = await TipoDeServicio.findByPk(servicioId);
    
    if (!servicio) {
      return res.status(404).render('error', {
        message: 'Servicio no encontrado'
      });
    }

    const habitaciones = await Habitacion.findAll({
      where: {
        sector_id: sectorId,
        tipo_de_servicio_id: servicioId
      },
      include: [{
        model: Cama,
        as: 'camas',
        attributes: ['id', 'estado', 'numero']
      }],
      order: [['numero', 'ASC']]
    });

    // Calcular estadísticas
    const estadisticas = habitaciones.reduce((acc, habitacion) => {
      acc.totalCamas += habitacion.camas.length;
      habitacion.camas.forEach(cama => {
        if (cama.estado === 'Libre') acc.camasLibres++;
        else if (cama.estado === 'Ocupada') acc.camasOcupadas++;
      });
      return acc;
    }, { totalCamas: 0, camasLibres: 0, camasOcupadas: 0 });

    estadisticas.totalHabitaciones = habitaciones.length;
    estadisticas.porcentajeOcupacion = estadisticas.totalCamas > 0 
      ? Math.round((estadisticas.camasOcupadas / estadisticas.totalCamas) * 100) 
      : 0;

    res.render('dashboard/enfermero/habitacion-detalle', {
      title: `Habitaciones - ${servicio.nombre}`,
      user: req.user,
      servicio,
      habitaciones,
      estadisticas
    });

  } catch (error) {
    console.error('Error al listar habitaciones:', error);
    next(error);
  }
};

/**
 * Camas por habitación
 * GET /enfermero/camas/habitaciones/:habitacionId/camas
 */
exports.camasPorHabitacion = async (req, res, next) => {
  try {
    const { habitacionId } = req.params;
    const { estado } = req.query;
    const sectorId = obtenerSectorEnfermero(req);

    const habitacion = await Habitacion.findOne({
      where: { 
        id: habitacionId,
        sector_id: sectorId
      },
      include: [
        { model: Sector, as: 'sector' },
        { model: TipoDeServicio, as: 'tipoServicio' }
      ]
    });

    if (!habitacion) {
      return res.status(404).render('error', {
        message: 'Habitación no encontrada o no pertenece a su sector'
      });
    }

    const whereCondition = { habitacion_id: habitacionId };
    if (estado && estado !== 'Todos') {
      whereCondition.estado = estado;
    }

    const camas = await Cama.findAll({
      where: whereCondition,
      include: [{
        model: Internacion,
        as: 'internaciones',
        where: { fecha_alta: null },
        required: false,
        include: [{
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'sexo']
          }]
        }]
      }],
      order: [['numero', 'ASC']]
    });

    res.render('dashboard/enfermero/camas-lista', {
      title: `Camas - Habitación ${habitacion.numero}`,
      user: req.user,
      habitacion,
      camas,
      capacidadTexto: obtenerCapacidadTexto(habitacion.tipo),
      totalCamas: camas.length,
      filtros: { estado }
    });

  } catch (error) {
    console.error('Error al listar camas:', error);
    next(error);
  }
};

// ============================================================================
// VISTAS ESPECIALES
// ============================================================================

/**
 * Camas disponibles del sector
 * GET /enfermero/camas/disponibles
 */
exports.camasDisponibles = async (req, res, next) => {
  try {
    const { 
      tipo_servicio_id, 
      habitacion_id, 
      habitacion_numero,
      cama_numero,
      sexo 
    } = req.query;

    const sectorId = obtenerSectorEnfermero(req);  

    // Construir condiciones de búsqueda
    const whereConditionCama = { estado: 'Libre' };
    const whereConditionHabitacion = { sector_id: sectorId };   

    if (cama_numero) {
      whereConditionCama.numero = cama_numero;
    }

    if (habitacion_numero) {
      whereConditionHabitacion.numero = habitacion_numero;
    }

    if (habitacion_id) {
      whereConditionCama.habitacion_id = habitacion_id;
    }

    if (tipo_servicio_id) {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio_id;
    }

    if (sexo && sexo !== 'Todos') {
      whereConditionHabitacion[Op.or] = [
        { sexo_permitido: 'Mixto' },
        { sexo_permitido: sexo }
      ];
    }

    const camas = await Cama.findAll({
      where: whereConditionCama,
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: whereConditionHabitacion,
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      }],
      order: [
        ['habitacion_id', 'ASC'],
        ['numero', 'ASC']
      ]
    });

    // Agrupar por tipo de servicio
    const camasPorServicio = {};
    camas.forEach(cama => {
      const servicioId = cama.habitacion.tipoServicio.id;
      const servicioNombre = cama.habitacion.tipoServicio.nombre;
      
      if (!camasPorServicio[servicioId]) {
        camasPorServicio[servicioId] = {
          id: servicioId,
          nombre: servicioNombre,
          camas: []
        };
      }
      
      camasPorServicio[servicioId].camas.push(cama);
    });

    //  Obtener datos para filtros — usando sectorId consistente
    const [habitaciones, tiposServicio, medicos, tiposInternacion] = await Promise.all([
      Habitacion.findAll({
        where: { sector_id: sectorId },  
        attributes: ['id', 'numero'],
        include: [
          { model: Sector, as: 'sector', attributes: ['nombre'] },
          { model: TipoDeServicio, as: 'tipoServicio', attributes: ['nombre'] }
        ],
        order: [['numero', 'ASC']]
      }),
      TipoDeServicio.findAll({
        attributes: ['id', 'nombre'],
        include: [{
          model: Habitacion,
          as: 'habitaciones',
          where: { sector_id: sectorId },  
          attributes: ['id'],
          required: true
        }],
        order: [['nombre', 'ASC']]
      }),
      Medico.findAll({
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }],
        order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
      }),
      TipoInternacion.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      })
    ]);

    res.render('dashboard/enfermero/camas-disponibles', {
      title: 'Camas Disponibles',
      user: req.user,
      camasPorServicio: Object.values(camasPorServicio),
      total: camas.length,
      habitaciones,
      tiposServicio,
      medicos,
      tiposInternacion,
      filtros: { 
        tipo_servicio_id, 
        habitacion_id,
        habitacion_numero,
        cama_numero,
        sexo 
      }
    });

  } catch (error) {
    console.error('Error en camas disponibles:', error);
    next(error);
  }
};

/**
 * Camas en limpieza del sector
 * GET /enfermero/camas/limpieza
 */
exports.camasEnLimpieza = async (req, res, next) => {
  try {
    const sectorEnfermero = await obtenerSectorEnfermero(req);
    const { sector_id, orden, mostrar } = req.query;

    // Construir condición de búsqueda
    const whereHabitacion = {};
    
    // Si hay filtro de sector, usarlo; sino usar el del enfermero
    if (sector_id) {
      whereHabitacion.sector_id = sector_id;
    } else {
      whereHabitacion.sector_id = sectorEnfermero;
    }

    const camas = await Cama.findAll({
      where: { estado: 'EnLimpieza' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: whereHabitacion,
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      }],
      order: [['fecha_fin_limpieza', 'ASC']]
    });

    // Calcular tiempo restante para cada cama
    const ahora = new Date();
    let totalTiempo = 0;
    let camasConTiempo = 0;
    
    const camasFormateadas = camas.map(cama => {
      let tiempoRestante = null;
      
      if (cama.fecha_fin_limpieza) {
        const minutos = Math.floor((new Date(cama.fecha_fin_limpieza) - ahora) / (1000 * 60));
        tiempoRestante = minutos;
        totalTiempo += Math.abs(minutos);
        camasConTiempo++;
      }

      return {
        ...cama.toJSON(),
        tiempoRestante,
        tiempoFormateado: tiempoRestante !== null 
          ? `${tiempoRestante} min` 
          : 'Sin tiempo estimado'
      };
    });

    // Filtrar por mostrar
    let camasFiltradas = camasFormateadas;
    if (mostrar === 'proximas') {
      camasFiltradas = camasFormateadas.filter(c => c.tiempoRestante !== null && c.tiempoRestante > 0 && c.tiempoRestante <= 15);
    } else if (mostrar === 'atrasadas') {
      camasFiltradas = camasFormateadas.filter(c => c.tiempoRestante !== null && c.tiempoRestante <= 0);
    }

    // Ordenar
    if (orden === 'habitacion') {
      camasFiltradas.sort((a, b) => a.habitacion.numero.localeCompare(b.habitacion.numero));
    } else if (orden === 'cama') {
      camasFiltradas.sort((a, b) => a.numero.localeCompare(b.numero));
    }

    // Estadísticas
    const atrasadas = camasFormateadas.filter(c => c.tiempoRestante !== null && c.tiempoRestante <= 0).length;
    const porTerminar = camasFormateadas.filter(c => c.tiempoRestante !== null && c.tiempoRestante > 0 && c.tiempoRestante <= 15).length;
    const promedioTiempo = camasConTiempo > 0 ? Math.round(totalTiempo / camasConTiempo) : null;

    // Obtener sectores para el filtro
    const sectores = await Sector.findAll({
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/enfermero/camas-limpieza', {
      title: 'Camas en Limpieza',
      user: req.user,
      camas: camasFiltradas,
      total: camasFiltradas.length,
      sectores,
      filtros: {
        sector_id: sector_id || '',
        orden: orden || 'tiempo',
        mostrar: mostrar || 'todas'
      },
      atrasadas,
      porTerminar,
      promedioTiempo
    });

  } catch (error) {
    console.error('❌ Error al obtener camas en limpieza:', error);
    next(error);
  }
};

// ============================================================================
// VISTAS DE DETALLE
// ============================================================================

/**
 * Ver detalle de cama individual
 * GET /enfermero/camas/detalle/:id
 */
exports.verCama = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sectorId = obtenerSectorEnfermero(req);

    const cama = await Cama.findByPk(id, {
      include: [
        {
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorId },
          include: [
            { model: Sector, as: 'sector' },
            { model: TipoDeServicio, as: 'tipoServicio' }
          ]
        },
        {
          model: Internacion,
          as: 'internaciones',
          where: { fecha_alta: null },
          required: false,
          include: [{
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
            }]
          }]
        }
      ]
    });

    if (!cama) {
      return res.status(404).render('error', {
        message: 'Cama no encontrada o no pertenece a su sector'
      });
    }

    // Historial de ocupación
    const historial = await Internacion.findAll({
      where: { cama_id: id },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }]
      }],
      order: [['fecha_inicio', 'DESC']],
      limit: CONFIG.LIMITE_HISTORIAL
    });

    res.render('dashboard/enfermero/camas-detalle', {
      title: `Cama ${cama.numero}`,
      user: req.user,
      cama,
      historial,
      capacidadTexto: obtenerCapacidadTexto(cama.habitacion.tipo)
    });

  } catch (error) {
    console.error('Error al ver cama:', error);
    next(error);
  }
};

/**
 * Ver detalle de habitación
 * GET /enfermero/camas/habitaciones/:id/detalle
 */
exports.verHabitacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sectorId = obtenerSectorEnfermero(req);

    const habitacion = await Habitacion.findOne({
      where: { 
        id,
        sector_id: sectorId
      },
      include: [
        { model: Sector, as: 'sector' },
        { model: TipoDeServicio, as: 'tipoServicio' },
        {
          model: Cama,
          as: 'camas',
          include: [{
            model: Internacion,
            as: 'internaciones',
            where: { fecha_alta: null },
            required: false,
            include: [{
              model: Paciente,
              as: 'paciente',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido']
              }]
            }]
          }]
        }
      ]
    });

    if (!habitacion) {
      return res.status(404).render('error', {
        message: 'Habitación no encontrada o no pertenece a su sector'
      });
    }

    // Historial de internaciones
    const historial = await Internacion.findAll({
      where: { habitacion_id: id },
      include: [
        { model: Cama, as: 'cama', attributes: ['numero'] },
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: CONFIG.LIMITE_HISTORIAL
    });

    // Calcular estadísticas
    const camas = habitacion.camas || [];
    const estadisticas = {
      total: camas.length,
      libres: camas.filter(c => c.estado === 'Libre').length,
      ocupadas: camas.filter(c => c.estado === 'Ocupada').length,
      limpieza: camas.filter(c => c.estado === 'EnLimpieza').length
    };

    const libresPorcentaje = estadisticas.total > 0 
      ? Math.round((estadisticas.libres / estadisticas.total) * 100) 
      : 0;
    const ocupadasPorcentaje = estadisticas.total > 0 
      ? Math.round((estadisticas.ocupadas / estadisticas.total) * 100) 
      : 0;

    res.render('dashboard/enfermero/habitacion', {
      title: `Habitación ${habitacion.numero}`,
      user: req.user,
      habitacion,
      camas,
      estadisticas,
      historial,
      libresPorcentaje,
      ocupadasPorcentaje
    });

  } catch (error) {
    console.error('Error al ver habitación:', error);
    next(error);
  }
};

// ============================================================================
// ACCIONES
// ============================================================================

/**
 * Cambiar estado de cama
 * POST /enfermero/camas/:id/cambiar-estado
 */
exports.cambiarEstado = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nuevo_estado, tiempo_limpieza_horas } = req.body;
    const sectorId = obtenerSectorEnfermero(req);

    // Verificar que la cama pertenece al sector del enfermero
    const cama = await Cama.findOne({
      where: { id },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorId }
      }],
      transaction
    });
    
    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada o no pertenece a su sector'
      });
    }

    const estadoAnterior = cama.estado;

    // Validaciones según el estado
    if (nuevo_estado === 'Ocupada') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Las camas solo pueden ocuparse mediante una internación'
      });
    }

    if (estadoAnterior === 'Ocupada' && nuevo_estado !== 'EnLimpieza') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Una cama ocupada solo puede pasar a estado "En Limpieza"'
      });
    }

    // Preparar datos de actualización
    const updateData = { estado: nuevo_estado };
    
    if (nuevo_estado === 'EnLimpieza') {
      const horasLimpieza = tiempo_limpieza_horas || CONFIG.TIEMPO_LIMPIEZA_HORAS;
      const fechaFinLimpieza = new Date();
      fechaFinLimpieza.setHours(fechaFinLimpieza.getHours() + horasLimpieza);
      updateData.fecha_fin_limpieza = fechaFinLimpieza;
      updateData.sexo_ocupante = null;
    } else if (nuevo_estado === 'Libre') {
      updateData.fecha_fin_limpieza = null;
      updateData.sexo_ocupante = null;
    }

    await cama.update(updateData, { transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: `Cama cambiada a estado: ${nuevo_estado}`,
      redirect: `/enfermero/camas/detalle/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar estado:', error);
    next(error);
  }
};

/**
 * Liberar cama (finalizar limpieza)
 * POST /enfermero/camas/:id/liberar
 */
exports.liberarCama = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const sectorId = obtenerSectorEnfermero(req);

    const cama = await Cama.findOne({
      where: { id },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorId }
      }],
      transaction
    });
    
    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada o no pertenece a su sector'
      });
    }

    if (cama.estado !== 'EnLimpieza') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden liberar camas en limpieza'
      });
    }

    await cama.update({
      estado: 'Libre',
      fecha_fin_limpieza: null,
      sexo_ocupante: null
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cama liberada correctamente',
      redirect: '/enfermero/camas/limpieza'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al liberar cama:', error);
    next(error);
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * API: Obtener camas disponibles
 * GET /enfermero/camas/api/disponibles
 */
exports.apiCamasDisponibles = async (req, res, next) => {
  try {
    const { sexo, tipo_servicio_id } = req.query;
    const sectorId = obtenerSectorEnfermero(req);

    const whereConditionCama = { estado: 'Libre' };
    const whereConditionHabitacion = { sector_id: sectorId };

    if (tipo_servicio_id) {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio_id;
    }

    if (sexo) {
      whereConditionHabitacion[Op.or] = [
        { sexo_permitido: 'Mixto' },
        { sexo_permitido: sexo }
      ];
    }

    const camas = await Cama.findAll({
      where: whereConditionCama,
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: whereConditionHabitacion,
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      }],
      order: [['habitacion_id', 'ASC'], ['numero', 'ASC']],
      limit: CONFIG.LIMITE_CAMAS_API
    });

    res.json({
      success: true,
      total: camas.length,
      camas: camas.map(c => ({
        id: c.id,
        numero: c.numero,
        habitacion: c.habitacion.numero,
        habitacion_id: c.habitacion.id,
        sector: c.habitacion.sector.nombre,
        tipo_servicio: c.habitacion.tipoServicio.nombre,
        sexo_permitido: c.habitacion.sexo_permitido
      }))
    });

  } catch (error) {
    console.error('Error en API camas disponibles:', error);
    next(error);
  }
};

/**
 * API: Obtener camas en limpieza
 * GET /enfermero/camas/api/limpieza
 */
exports.apiCamasLimpieza = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);

    const camas = await Cama.findAll({
      where: { estado: 'EnLimpieza' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorId },
        include: [{ model: Sector, as: 'sector' }]
      }],
      order: [['fecha_fin_limpieza', 'ASC']]
    });

    res.json({
      success: true,
      total: camas.length,
      camas: camas.map(c => ({
        id: c.id,
        numero: c.numero,
        habitacion: c.habitacion.numero,
        sector: c.habitacion.sector.nombre,
        fecha_fin_estimada: c.fecha_fin_limpieza,
        tiempo_restante: c.fecha_fin_limpieza 
          ? Math.max(0, Math.floor((new Date(c.fecha_fin_limpieza) - new Date()) / (1000 * 60))) 
          : null
      }))
    });

  } catch (error) {
    console.error('Error en API camas limpieza:', error);
    next(error);
  }
};

/**
 * API: Estadísticas generales del sector
 * GET /enfermero/camas/api/estadisticas
 */
exports.estadisticasGenerales = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    const estadisticas = await calcularEstadisticasSector(sectorId);
    
    const sector = await Sector.findByPk(sectorId, {
      attributes: ['nombre']
    });

    const totalHabitaciones = await Habitacion.count({
      where: { sector_id: sectorId }
    });

    res.json({
      success: true,
      estadisticas: {
        sector_nombre: sector?.nombre || 'Sin nombre',
        sector_id: sectorId,
        habitaciones: {
          total: totalHabitaciones
        },
        totalCamas: estadisticas.totalCamas,
        libres: estadisticas.camasLibres,
        ocupadas: estadisticas.camasOcupadas,
        en_limpieza: estadisticas.camasLimpieza,
        porcentaje_ocupacion: estadisticas.porcentajeOcupacion
      }
    });

  } catch (error) {
    console.error('Error en estadísticas generales:', error);
    next(error);
  }
};

/**
 * API: Detalle del sector del enfermero
 * GET /enfermero/camas/api/sector/detalle
 */
exports.apiDetalleSectorEnfermero = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    
    const sector = await Sector.findByPk(sectorId, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [
          { model: TipoDeServicio, as: 'tipoServicio' },
          { model: Cama, as: 'camas', attributes: ['id', 'estado'] }
        ]
      }]
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        message: 'Sector no encontrado'
      });
    }

    // Calcular estadísticas
    let totalCamas = 0;
    let camasLibres = 0;
    let camasOcupadas = 0;
    let camasLimpieza = 0;
    const tiposHabitacion = {};
    const tiposServicioSet = new Set();
    const tiposServicioDetalles = [];

    sector.habitaciones.forEach(habitacion => {
      // Contar tipos de habitación
      tiposHabitacion[habitacion.tipo] = (tiposHabitacion[habitacion.tipo] || 0) + 1;

      // Contar camas por estado
      totalCamas += habitacion.camas.length;
      habitacion.camas.forEach(cama => {
        if (cama.estado === 'Libre') camasLibres++;
        else if (cama.estado === 'Ocupada') camasOcupadas++;
        else if (cama.estado === 'EnLimpieza') camasLimpieza++;
      });

      // Tipos de servicio únicos
      if (habitacion.tipoServicio && !tiposServicioSet.has(habitacion.tipoServicio.id)) {
        tiposServicioSet.add(habitacion.tipoServicio.id);
        tiposServicioDetalles.push({
          id: habitacion.tipoServicio.id,
          nombre: habitacion.tipoServicio.nombre,
          descripcion: habitacion.tipoServicio.descripcion
        });
      }
    });

    res.json({
      success: true,
      sector: {
        id: sector.id,
        nombre: sector.nombre,
        descripcion: sector.descripcion,
        estadisticas: {
          totalHabitaciones: sector.habitaciones.length,
          totalCamas,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0
        },
        tiposHabitacion: formatearTiposHabitacion(tiposHabitacion),
        tiposServicio: tiposServicioDetalles
      }
    });

  } catch (error) {
    console.error('Error en API detalle sector enfermero:', error);
    next(error);
  }
};

/**
 * API: Servicios por sector
 * GET /enfermero/camas/api/servicios
 */
exports.apiServiciosPorSector = async (req, res, next) => {
  try {
    const sectorId = obtenerSectorEnfermero(req);
    
    const servicios = await TipoDeServicio.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        where: { sector_id: sectorId },
        attributes: ['id'],
        required: true
      }],
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      servicios: servicios.map(s => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion
      }))
    });

  } catch (error) {
    console.error('Error en API servicios por sector:', error);
    next(error);
  }
};

/**
 * API: Habitaciones por servicio
 * GET /enfermero/camas/api/servicios/:servicioId/habitaciones
 */
exports.apiHabitacionesPorServicio = async (req, res, next) => {
  try {
    const { servicioId } = req.params;
    const sectorId = obtenerSectorEnfermero(req);
    
    const habitaciones = await Habitacion.findAll({
      where: {
        sector_id: sectorId,
        tipo_de_servicio_id: servicioId
      },
      attributes: ['id', 'numero', 'tipo', 'sexo_permitido'],
      include: [{
        model: Cama,
        as: 'camas',
        attributes: ['id', 'estado', 'numero']
      }],
      order: [['numero', 'ASC']]
    });

    res.json({
      success: true,
      habitaciones: habitaciones.map(h => ({
        id: h.id,
        numero: h.numero,
        tipo: h.tipo,
        sexo_permitido: h.sexo_permitido,
        totalCamas: h.camas.length,
        camasLibres: h.camas.filter(c => c.estado === 'Libre').length,
        camasOcupadas: h.camas.filter(c => c.estado === 'Ocupada').length
      }))
    });

  } catch (error) {
    console.error('Error en API habitaciones por servicio:', error);
    next(error);
  }
};

// ============================================================================
// BÚSQUEDA Y ASIGNACIÓN DE PACIENTES
// ============================================================================

/**
 * API: Buscar pacientes con admisión activa (sin internación)
 * GET /enfermero/camas/api/buscar-pacientes
 */
exports.apiBuscarPacientes = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.length < CONFIG.MIN_CARACTERES_BUSQUEDA) {
      return res.json({
        success: true,
        pacientes: []
      });
    }

    // Buscar pacientes por DNI/nombre/apellido
    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: {
            [Op.or]: [
              { dni: { [Op.like]: `%${termino}%` } },
              { nombre: { [Op.like]: `%${termino}%` } },
              { apellido: { [Op.like]: `%${termino}%` } }
            ]
          },
          attributes: ['id', 'nombre', 'apellido', 'dni', 'sexo', 'fecha_nacimiento']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['nombre'],
          required: false
        }
      ],
      limit: CONFIG.LIMITE_BUSQUEDA_PACIENTES
    });

    if (pacientes.length === 0) {
      return res.json({
        success: true,
        pacientes: []
      });
    }

    // Validar cada paciente
    const pacientesValidos = [];
    
    for (const paciente of pacientes) {
      // Buscar admisiones sin alta médica
      const admisionActiva = await Admision.findOne({
        where: { paciente_id: paciente.id },
        include: [{
          model: AltaMedica,
          as: 'alta_medica',
          required: false
        }],
        order: [['fecha', 'DESC']]
      });

      // Si no tiene admisión o ya tiene alta, no es válido
      if (!admisionActiva || admisionActiva.alta_medica) {
        continue;
      }

      // Verificar que no tenga internación activa
      const internacionActiva = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          fecha_alta: null
        }
      });

      if (internacionActiva) {
        continue;
      }

      // Paciente válido
      pacientesValidos.push({
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        sexo: paciente.usuario.sexo,
        edad: calcularEdad(paciente.usuario.fecha_nacimiento),
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        admision_id: admisionActiva.id,
        admision_fecha: admisionActiva.fecha,
        admision_estado: admisionActiva.estado
      });
    }

    res.json({
      success: true,
      pacientes: pacientesValidos
    });

  } catch (error) {
    console.error('Error en API buscar pacientes:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * API: Asignar paciente a cama
 * POST /enfermero/camas/api/asignar-paciente
 */
exports.apiAsignarPaciente = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      paciente_id,
      cama_id,
      medico_id,
      tipo_internacion_id,
      admision_id,
      prioridad,
      observaciones
    } = req.body;

    const sectorId = obtenerSectorEnfermero(req);
    const usuarioId = req.user.id;

    // ===== VALIDACIONES =====
    
    // Validar campos requeridos
    if (!paciente_id || !cama_id || !medico_id || !tipo_internacion_id || !admision_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: paciente_id, cama_id, medico_id, tipo_internacion_id, admision_id'
      });
    }

    // Validar paciente
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'sexo']
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

    // Validar que no esté internado
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id,
        fecha_alta: null
      },
      transaction
    });

    if (internacionActiva) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente ya tiene una internación activa'
      });
    }

    // Validar admisión
    const admision = await Admision.findOne({
      where: { 
        id: admision_id,
        paciente_id 
      },
      include: [{
        model: AltaMedica,
        as: 'alta_medica',
        required: false
      }],
      transaction
    });

    if (!admision) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Admisión no encontrada'
      });
    }

    if (admision.alta_medica) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La admisión ya tiene alta médica'
      });
    }

    // Validar cama
    const cama = await Cama.findOne({
      where: { id: cama_id },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorId },
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      }],
      transaction
    });

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada o no pertenece a su sector'
      });
    }

    if (cama.estado !== 'Libre') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La cama ${cama.numero} no está disponible (Estado: ${cama.estado})`
      });
    }

    // Validar compatibilidad de sexo
    const sexoPaciente = paciente.usuario.sexo;
    const habitacion = cama.habitacion;

    if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexoPaciente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La habitación ${habitacion.numero} solo permite pacientes de sexo ${habitacion.sexo_permitido}`
      });
    }

    // En habitaciones dobles, validar conflicto de sexo
    if (habitacion.tipo === 'Doble') {
      const camaOcupada = await Cama.findOne({
        where: {
          habitacion_id: habitacion.id,
          estado: 'Ocupada',
          id: { [Op.ne]: cama_id }
        },
        transaction
      });

      if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `La habitación ${habitacion.numero} ya tiene un paciente de sexo ${camaOcupada.sexo_ocupante}`
        });
      }
    }

    // Validar médico
    const medico = await Medico.findByPk(medico_id, { transaction });
    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Validar tipo de internación
    const tipoInternacion = await TipoInternacion.findByPk(tipo_internacion_id, { transaction });
    if (!tipoInternacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tipo de internación no encontrado'
      });
    }

    // Obtener enfermero
    const enfermero = await Enfermero.findOne({
      where: { usuario_id: usuarioId },
      transaction
    });

    // ===== CREAR LISTA DE ESPERA =====
    const listaEspera = await ListaEspera.create({
      paciente_id,
      tipo_turno_id: tipo_internacion_id,
      prioridad: prioridad || 'MEDIA',
      estado: 'ASIGNADO',
      habitacion_id: habitacion.id,
      creador_tipo: 'ENFERMERO',
      creador_id: enfermero?.id || usuarioId,
      fecha_registro: new Date(),
      observaciones: observaciones || null
    }, { transaction });

    // ===== CREAR INTERNACIÓN =====
    const internacion = await Internacion.create({
      paciente_id,
      medico_id,
      cama_id,
      habitacion_id: habitacion.id,
      tipo_internacion_id,
      administrativo_id: null,
      evaluacion_medica_id: null,
      es_prequirurgica: false,
      estado_operacion: 'No aplica',
      estado_estudios: 'Pendientes',
      estado_paciente: 'Sin_Evaluar',
      fecha_inicio: new Date(),
      fecha_cirugia: null,
      obra_social_id: paciente.obra_social_id,
      lista_espera_id: listaEspera.id,
      admision_id
    }, { transaction });

    // ===== ACTUALIZAR CAMA =====
    await cama.update({
      estado: 'Ocupada',
      sexo_ocupante: sexoPaciente
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} asignado exitosamente a la cama ${cama.numero}`,
      data: {
        internacion_id: internacion.id,
        lista_espera_id: listaEspera.id,
        cama: {
          id: cama.id,
          numero: cama.numero,
          habitacion: habitacion.numero,
          servicio: habitacion.tipoServicio.nombre,
          sector: habitacion.sector.nombre
        },
        paciente: {
          id: paciente.id,
          nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
          dni: paciente.usuario.dni
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al asignar paciente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar paciente a cama'
    });
  }
};

module.exports = exports;