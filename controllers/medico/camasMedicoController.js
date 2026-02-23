const { 
   Sector, 
  Habitacion, 
  Cama, 
  TipoDeServicio, 
  Enfermero,         
  Paciente, 
  Usuario, 
  Admision, 
  Internacion, 
  Medico,            
  ObraSocial, 
  TipoInternacion,   
  ListaEspera, 
  Administrativo, 
  Especialidad,
  AltaMedica,
  TurnoPersonal 
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');
const sequelize = db.sequelize;  


// ============================================================================
// FUNCIONES AUXILIARES 
// ============================================================================

async function obtenerSectorEnfermero(req) {
  // El sector ya está en req.user gracias al middleware
  console.log('=== Sector del usuario (desde middleware) ===');
  console.log('sector_id:', req.user.sector_id);
  console.log('sector_nombre:', req.user.sector_nombre);
  
  return req.user.sector_id; 
}

async function calcularEstadisticasSector(sectorId) {
  const totalCamas = await Cama.count({
    include: [{ model: Habitacion, as: 'habitacion', where: { sector_id: sectorId } }]
  });

  const camasLibres = await Cama.count({
    where: { estado: 'Libre' },
    include: [{ model: Habitacion, as: 'habitacion', where: { sector_id: sectorId } }]
  });

  const camasOcupadas = await Cama.count({
    where: { estado: 'Ocupada' },
    include: [{ model: Habitacion, as: 'habitacion', where: { sector_id: sectorId } }]
  });

  const camasLimpieza = await Cama.count({
    where: { estado: 'EnLimpieza' },
    include: [{ model: Habitacion, as: 'habitacion', where: { sector_id: sectorId } }]
  });

  return {
    totalCamas,
    camasLibres,
    camasOcupadas,
    camasLimpieza,
    porcentajeOcupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0
  };
}

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}


// ========== NAVEGACIÓN JERÁRQUICA ==========

// 1. LISTAR SECTORES (pantalla principal - árbol de navegación)
exports.listarSectores = async (req, res, next) => {
  try {
    const sectores = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas',
          attributes: ['id', 'estado', 'numero']
        }]
      }],
      order: [['nombre', 'ASC']]
    });

    // Calcular estadísticas por sector
    const sectoresConEstadisticas = await Promise.all(sectores.map(async (sector) => {
      // Obtener todas las camas del sector con conteo preciso
      const camasSector = await Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasLibres = await Cama.count({
        where: { estado: 'Libre' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasOcupadas = await Cama.count({
        where: { estado: 'Ocupada' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasLimpieza = await Cama.count({
        where: { estado: 'EnLimpieza' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      return {
        ...sector.toJSON(),
        estadisticas: {
          totalCamas: camasSector,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: camasSector > 0 ? Math.round((camasOcupadas / camasSector) * 100) : 0
        }
      };
    }));

    // Estadísticas generales del hospital
    const estadisticasGenerales = {
      totalSectores: sectores.length,
      totalCamas: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.totalCamas, 0),
      camasLibres: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasLibres, 0),
      camasOcupadas: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasOcupadas, 0),
      camasLimpieza: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasLimpieza, 0)
    };

    res.render('dashboard/medico/camas', {
      title: 'Sectores del Hospital',
      user: req.user,
      sectores: sectoresConEstadisticas,
      estadisticas: estadisticasGenerales
    });

  } catch (error) {
    console.error('Error al listar sectores:', error);
   next(error);
  }
};

// 2. HABITACIONES POR SECTOR
exports.habitacionesPorSector = async (req, res, next) => {
  try {
    const { sectorId } = req.params;
    const { tipo, sexo } = req.query;

    const sector = await Sector.findByPk(sectorId);
    
    if (!sector) {
      return res.status(404).render('error', {
        message: 'Sector no encontrado'
      });
    }

    const whereCondition = { sector_id: sectorId };
    
    // Aplicar filtros
    if (tipo) {
      whereCondition.tipo = tipo;
    }
    
    if (sexo && sexo !== 'Todos') {
      whereCondition.sexo_permitido = sexo;
    }

    const habitaciones = await Habitacion.findAll({
      where: whereCondition,
      include: [
        {
          model: TipoDeServicio,
          as: 'tipoServicio'
        },
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
      ],
      order: [['numero', 'ASC']]
    });

    // Calcular estadísticas por habitación
    const habitacionesConEstadisticas = habitaciones.map(habitacion => {
      let camasLibres = 0;
      let camasOcupadas = 0;
      let camasLimpieza = 0;
      let pacientesActuales = [];
      
      habitacion.camas.forEach(cama => {
        if (cama.estado === 'Libre') camasLibres++;
        else if (cama.estado === 'Ocupada') {
          camasOcupadas++;
          if (cama.internaciones && cama.internaciones.length > 0) {
            const internacion = cama.internaciones[0];
            pacientesActuales.push({
              nombre: `${internacion.paciente.usuario.nombre} ${internacion.paciente.usuario.apellido}`,
              camaNumero: cama.numero
            });
          }
        } else if (cama.estado === 'EnLimpieza') camasLimpieza++;
      });

      return {
        ...habitacion.toJSON(),
        estadisticas: {
          totalCamas: habitacion.camas.length,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: habitacion.camas.length > 0 ? 
            Math.round((camasOcupadas / habitacion.camas.length) * 100) : 0
        },
        pacientesActuales
      };
    });

    res.render('dashboard/medico/camas-habitaciones', {
      title: `Habitaciones - ${sector.nombre}`,
      user: req.user,
      sector,
      habitaciones: habitacionesConEstadisticas,
      filtros: { tipo, sexo }
    });

  } catch (error) {
    console.error('Error al listar habitaciones:', error);
   next(error);
  }
};

// 3. CAMAS POR HABITACIÓN
exports.camasPorHabitacion = async (req, res, next) => {
  try {
    const { habitacionId } = req.params;
    const { estado } = req.query;

    const habitacion = await Habitacion.findByPk(habitacionId, {
      include: [
        {
          model: Sector,
          as: 'sector'
        },
        {
          model: TipoDeServicio,
          as: 'tipoServicio'
        }
      ]
    });

    if (!habitacion) {
      return res.status(404).render('error', {
        message: 'Habitación no encontrada'
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

    // Obtener capacidad según tipo de habitación
    let capacidadTexto = '';
    switch(habitacion.tipo) {
      case 'Individual': capacidadTexto = '1 cama'; break;
      case 'Doble': capacidadTexto = '2 camas'; break;
      case 'Colectiva': capacidadTexto = 'Múltiples camas'; break;
      default: capacidadTexto = 'No especificada';
    }

    res.render('dashboard/medico/camas-lista', {
      title: `Camas - Habitación ${habitacion.numero}`,
      user: req.user,
      habitacion,
      camas,
      capacidadTexto,
      totalCamas: camas.length,
      filtros: { estado }
    });

  } catch (error) {
    console.error('Error al listar camas:', error);
    next(error);
  }
};
// API para estadísticas generales
exports.obtenerEstadisticasGenerales = async (req, res, next) => {
  try {
    const sectorEnfermero = await obtenerSectorEnfermero(req);
    
    // Total de sectores
    const totalSectores = await Sector.count();
    
    // Total de habitaciones
    const totalHabitaciones = await Habitacion.count({
      where: { sector_id: sectorEnfermero }
    });
    
    // Total de camas
    const totalCamas = await Cama.count({
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorEnfermero }
      }]
    });
    
    // Camas libres
    const camasLibres = await Cama.count({
      where: { estado: 'Libre' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorEnfermero }
      }]
    });
    
    // Camas ocupadas
    const camasOcupadas = await Cama.count({
      where: { estado: 'Ocupada' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorEnfermero }
      }]
    });
    
    // Camas en limpieza
    const camasLimpieza = await Cama.count({
      where: { estado: 'EnLimpieza' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorEnfermero }
      }]
    });

    res.json({
      success: true,
      estadisticas: {
        totalSectores,
        totalHabitaciones,
        totalCamas,
        camasLibres,
        camasOcupadas,
        camasLimpieza,
        porcentajeOcupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas'
    });
  }
};
// ========== VISTAS ESPECIALES ==========

// A. CAMAS DISPONIBLES (filtradas correctamente)
exports.camasDisponibles = async (req, res, next) => {
  try {
    const { 
      sector_id, 
      tipo_servicio_id, 
      habitacion_id, 
      habitacion_numero,
      cama_numero,
      sexo 
    } = req.query;
    
    const sectorEnfermero = await obtenerSectorEnfermero(req);

    // Construir condiciones de búsqueda
    const whereConditionCama = { estado: 'Libre' };
    const whereConditionHabitacion = { sector_id: sectorEnfermero };

    // BÚSQUEDA ESPECÍFICA POR NÚMERO DE CAMA
    if (cama_numero) {
      whereConditionCama.numero = cama_numero;
    }

    // BÚSQUEDA ESPECÍFICA POR NÚMERO DE HABITACIÓN
    if (habitacion_numero) {
      whereConditionHabitacion.numero = habitacion_numero;
    }

    // BÚSQUEDA ESPECÍFICA POR ID DE HABITACIÓN
    if (habitacion_id) {
      whereConditionCama.habitacion_id = habitacion_id;
    }

    // FILTRO POR TIPO DE SERVICIO
    if (tipo_servicio_id) {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio_id;
    }

    // FILTRO POR SEXO
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
          {
            model: Sector,
            as: 'sector'
          },
          {
            model: TipoDeServicio,
            as: 'tipoServicio'
          }
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

    // Obtener datos para filtros y modal
    const [habitaciones, tiposServicio, medicos, tiposInternacion] = await Promise.all([
      Habitacion.findAll({
        where: { sector_id: sectorEnfermero },
        attributes: ['id', 'numero'],
        include: [
          {
            model: Sector,
            as: 'sector',
            attributes: ['nombre']
          },
          {
            model: TipoDeServicio,
            as: 'tipoServicio',
            attributes: ['nombre']
          }
        ],
        order: [['numero', 'ASC']]
      }),
      TipoDeServicio.findAll({
        attributes: ['id', 'nombre'],
        include: [{
          model: Habitacion,
          as: 'habitaciones',
          where: { sector_id: sectorEnfermero },
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
        order: [['usuario', 'apellido', 'ASC']]
      }),
      TipoInternacion.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      })
    ]);

    res.render('dashboard/medico/camas-disponibles', {
      title: 'Camas Disponibles',
      user: req.user,
      camasPorServicio: Object.values(camasPorServicio),
      total: camas.length,
      habitaciones,
      tiposServicio,
      medicos,
      tiposInternacion,
      filtros: { 
        sector_id, 
        tipo_servicio_id, 
        habitacion_id,
        habitacion_numero,
        cama_numero,
        sexo 
      }
    });

  } catch (error) {
    console.error('Error al buscar camas disponibles:', error);
    next(error);
  }
};

// B. CAMAS EN LIMPIEZA
exports.camasEnLimpieza = async (req, res, next) => {
  try {
    const { sector_id } = req.query;

    const whereCondition = { estado: 'EnLimpieza' };
    const whereConditionHabitacion = {};

    if (sector_id) {
      whereConditionHabitacion.sector_id = sector_id;
    }

    const camas = await Cama.findAll({
      where: whereCondition,
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: whereConditionHabitacion,
        include: [{
          model: Sector,
          as: 'sector'
        }]
      }],
      order: [['fecha_fin_limpieza', 'ASC']]
    });

    // Calcular tiempo restante
    const camasConTiempo = camas.map(cama => {
      let tiempoRestante = null;
      if (cama.fecha_fin_limpieza) {
        const minutos = Math.floor((new Date(cama.fecha_fin_limpieza) - new Date()) / (1000 * 60));
        tiempoRestante = minutos > 0 ? minutos : 0;
      }

      return {
        ...cama.toJSON(),
        tiempoRestante,
        tiempoFormateado: tiempoRestante !== null ? 
          `${tiempoRestante} min` : 'Sin tiempo estimado'
      };
    });

    // Obtener sectores para filtro
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/medico/camas-limpieza', {
      title: 'Camas en Limpieza',
      user: req.user,
      camas: camasConTiempo,
      total: camas.length,
      sectores,
      filtros: { sector_id }
    });

  } catch (error) {
    console.error('Error al obtener camas en limpieza:', error);
    next(error);
  }
};

// ========== VISTAS EXISTENTES (modificadas) ==========

// Ver detalle de cama individual
exports.verCama = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cama = await Cama.findByPk(id, {
      include: [
        {
          model: Habitacion,
          as: 'habitacion',
          include: [
            {
              model: Sector,
              as: 'sector'
            },
            {
              model: TipoDeServicio,
              as: 'tipoServicio'
            }
          ]
        },
        {
          model: Internacion,
          as: 'internaciones',
          where: { fecha_alta: null },
          required: false,
          include: [
            {
              model: Paciente,
              as: 'paciente',
              include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
              }]
            }
          ]
        }
      ]
    });

    if (!cama) {
      return res.status(404).render('error', {
        message: 'Cama no encontrada'
      });
    }

    // Historial de ocupación (últimas 10 internaciones)
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
      limit: 10
    });

    // Obtener capacidad según tipo de habitación
    let capacidadTexto = '';
    switch(cama.habitacion.tipo) {
      case 'Individual': capacidadTexto = '1 cama'; break;
      case 'Doble': capacidadTexto = '2 camas'; break;
      case 'Colectiva': capacidadTexto = 'Múltiples camas'; break;
      default: capacidadTexto = 'No especificada';
    }

    res.render('dashboard/medico/camas-detalle', {
      title: `Cama ${cama.numero}`,
      user: req.user,
      cama,
      historial,
      capacidadTexto
    });

  } catch (error) {
    console.error('Error al ver cama:', error);
    next(error);
  }
};
// Ver detalle de habitación
exports.verHabitacion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const habitacion = await Habitacion.findByPk(id, {
      include: [
        {
          model: Sector,
          as: 'sector'
        },
        {
          model: TipoDeServicio,
          as: 'tipoServicio'
        },
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
        message: 'Habitación no encontrada'
      });
    }

    // Obtener historial de internaciones en esta habitación
    const historial = await Internacion.findAll({
      where: { habitacion_id: id },
      include: [
        {
          model: Cama,
          as: 'cama',
          attributes: ['numero']
        },
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
      limit: 10
    });

    // Calcular estadísticas
    const camas = habitacion.camas || [];
    const estadisticas = {
      total: camas.length,
      libres: camas.filter(c => c.estado === 'Libre').length,
      ocupadas: camas.filter(c => c.estado === 'Ocupada').length,
      limpieza: camas.filter(c => c.estado === 'EnLimpieza').length
    };

    // Calcular porcentajes para el gráfico
    const libresPorcentaje = estadisticas.total > 0 ? Math.round((estadisticas.libres / estadisticas.total) * 100) : 0;
    const ocupadasPorcentaje = estadisticas.total > 0 ? Math.round((estadisticas.ocupadas / estadisticas.total) * 100) : 0;

    res.render('dashboard/medico/habitacion-detalle', {
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
// ========== ACCIONES ==========

// Cambiar estado de cama
exports.cambiarEstado = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nuevo_estado, motivo } = req.body;

    const cama = await Cama.findByPk(id, { transaction });
    
    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada'
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

    // Actualizar estado
    const updateData = { estado: nuevo_estado };
    
    if (nuevo_estado === 'EnLimpieza') {
      // Estimar 2 horas para limpieza
      const fechaFinLimpieza = new Date();
      fechaFinLimpieza.setHours(fechaFinLimpieza.getHours() + 2);
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
      redirect: `/medico/camas/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar estado:', error);
    next(error);
  }
};

// Liberar cama (finalizar limpieza)
exports.liberarCama = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const cama = await Cama.findByPk(id, { transaction });
    
    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada'
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
      redirect: '/medico/camas/limpieza'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al liberar cama:', error);
    next(error);
  }
};

// ========== API PARA MODALES ==========

// API: Obtener camas disponibles (para AJAX/modal)
exports.apiCamasDisponibles = async (req, res, next) => {
  try {
    const { sector_id, sexo, tipo_servicio_id } = req.query;

    const whereConditionCama = { estado: 'Libre' };
    const whereConditionHabitacion = {};

    if (sector_id) {
      whereConditionHabitacion.sector_id = sector_id;
    }

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
          {
            model: Sector,
            as: 'sector'
          },
          {
            model: TipoDeServicio,
            as: 'tipoServicio'
          }
        ]
      }],
      order: [
        ['habitacion_id', 'ASC'],
        ['numero', 'ASC']
      ],
      limit: 50
    });

    res.json({
      success: true,
      total: camas.length,
      camas: camas.map(c => ({
        id: c.id,
        numero: c.numero,
        habitacion: c.habitacion.numero,
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

// API: Obtener camas en limpieza (para AJAX/modal)
exports.apiCamasLimpieza = async (req, res, next) => {
  try {
    const camas = await Cama.findAll({
      where: { estado: 'EnLimpieza' },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        include: [{
          model: Sector,
          as: 'sector'
        }]
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

// API: Estadísticas generales
exports.estadisticasGenerales = async (req, res, next) => {
  try {
    const sectorEnfermero = await obtenerSectorEnfermero(req);
    
    const [
      totalSectores,
      totalHabitaciones,
      totalCamas,
      libres,
      ocupadas,
      enLimpieza,
      habitacionesOcupadas,
      habitacionesVacias
    ] = await Promise.all([
      // Total de sectores (puede ser todos o filtrados por rol)
      Sector.count(),
      
      // Total de habitaciones (filtradas por sector del enfermero)
      Habitacion.count({ 
        where: { sector_id: sectorEnfermero } 
      }),
      
      // Total de camas (filtradas por sector del enfermero)
      Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorEnfermero }
        }]
      }),
      
      // Camas libres (filtradas por sector)
      Cama.count({
        where: { estado: 'Libre' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorEnfermero }
        }]
      }),
      
      // Camas ocupadas (filtradas por sector)
      Cama.count({
        where: { estado: 'Ocupada' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorEnfermero }
        }]
      }),
      
      // Camas en limpieza (filtradas por sector)
      Cama.count({
        where: { estado: 'EnLimpieza' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorEnfermero }
        }]
      }),
      
      // Habitaciones con al menos una cama ocupada
      Habitacion.count({
        where: { sector_id: sectorEnfermero },
        include: [{
          model: Cama,
          as: 'camas',
          where: { estado: 'Ocupada' },
          required: true
        }],
        distinct: true,
        col: 'id'
      }),
      
      // Habitaciones con todas las camas libres
      Habitacion.count({
        where: { sector_id: sectorEnfermero },
        include: [{
          model: Cama,
          as: 'camas',
          where: { estado: 'Libre' },
          required: true
        }],
        distinct: true,
        col: 'id'
      })
    ]);

    // Calcular correctamente habitaciones vacías (sin camas ocupadas)
    const totalHabitacionesConCamas = await Habitacion.count({
      where: { sector_id: sectorEnfermero },
      include: [{
        model: Cama,
        as: 'camas',
        required: true
      }],
      distinct: true,
      col: 'id'
    });

    res.json({
      success: true,
      estadisticas: {
        totalSectores,
        totalHabitaciones,
        totalCamas,
        libres,
        ocupadas,
        en_limpieza: enLimpieza,
        porcentaje_ocupacion: totalCamas > 0 ? Math.round((ocupadas / totalCamas) * 100) : 0,
        habitaciones: {
          total: totalHabitacionesConCamas,
          ocupadas: habitacionesOcupadas,
          vacias: habitacionesVacias
        }
      }
    });

  } catch (error) {
    console.error('Error en API estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas',
      error: error.message
    });
  }
};
exports.apiDetalleSector = async (req, res, next) => {
  try {
    const { sectorId } = req.params;

    // Obtener sector con sus relaciones
    const sector = await Sector.findByPk(sectorId, {
      include: [
        {
          model: Habitacion,
          as: 'habitaciones',
          include: [
            {
              model: TipoDeServicio,
              as: 'tipoServicio'
            },
            {
              model: Cama,
              as: 'camas',
              attributes: ['id', 'estado']
            }
          ]
        }
      ]
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
    let tiposHabitacion = {};
    let tiposServicioSet = new Set();
    let tiposServicioDetalles = [];

    sector.habitaciones.forEach(habitacion => {
      // Contar tipos de habitación
      if (!tiposHabitacion[habitacion.tipo]) {
        tiposHabitacion[habitacion.tipo] = 0;
      }
      tiposHabitacion[habitacion.tipo]++;

      // Contar camas
      totalCamas += habitacion.camas.length;
      habitacion.camas.forEach(cama => {
        if (cama.estado === 'Libre') camasLibres++;
        else if (cama.estado === 'Ocupada') camasOcupadas++;
        else if (cama.estado === 'EnLimpieza') camasLimpieza++;
      });

      // Recolectar tipos de servicio únicos
      if (habitacion.tipoServicio && !tiposServicioSet.has(habitacion.tipoServicio.id)) {
        tiposServicioSet.add(habitacion.tipoServicio.id);
        tiposServicioDetalles.push({
          id: habitacion.tipoServicio.id,
          nombre: habitacion.tipoServicio.nombre,
          descripcion: habitacion.tipoServicio.descripcion
        });
      }
    });

    // Convertir tipos de habitación a array con iconos
    const tiposHabitacionArray = Object.entries(tiposHabitacion).map(([tipo, cantidad]) => {
      let icono = '';
      switch(tipo) {
        case 'Individual': icono = 'fa-user'; break;
        case 'Doble': icono = 'fa-user-friends'; break;
        case 'Colectiva': icono = 'fa-users'; break;
        default: icono = 'fa-bed';
      }
      return { tipo, cantidad, icono };
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
        tiposHabitacion: tiposHabitacionArray,
        tiposServicio: tiposServicioDetalles
      }
    });

  } catch (error) {
    console.error('Error en API detalle sector:', error);
    next(error);
  }
};

// Vista de sectores 
exports.vistaCompletaSectores = async (req, res, next) => {
  try {
    const sectores = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas',
          attributes: ['id', 'estado', 'numero']
        }]
      }],
      order: [['nombre', 'ASC']]
    });

    // Calcular estadísticas por sector 
    const sectoresConEstadisticas = await Promise.all(sectores.map(async (sector) => {
      const camasSector = await Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasLibres = await Cama.count({
        where: { estado: 'Libre' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasOcupadas = await Cama.count({
        where: { estado: 'Ocupada' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      const camasLimpieza = await Cama.count({
        where: { estado: 'EnLimpieza' },
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sector.id }
        }]
      });

      return {
        ...sector.toJSON(),
        estadisticas: {
          totalCamas: camasSector,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: camasSector > 0 ? Math.round((camasOcupadas / camasSector) * 100) : 0
        }
      };
    }));

    // Estadísticas generales del hospital
    const estadisticasGenerales = {
      totalSectores: sectores.length,
      totalCamas: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.totalCamas, 0),
      camasLibres: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasLibres, 0),
      camasOcupadas: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasOcupadas, 0),
      camasLimpieza: sectoresConEstadisticas.reduce((sum, s) => sum + s.estadisticas.camasLimpieza, 0)
    };

    // Renderizar la vista de sectores 
    res.render('dashboard/medico/camas-sectores', {
      title: 'Sectores del Hospital',
      user: req.user,
      sectores: sectoresConEstadisticas,
      estadisticas: estadisticasGenerales
    });

  } catch (error) {
    console.error('Error al listar sectores:', error);
    next(error);
  }
};
// ============================================================================
// TIPOS DE SERVICIO POR SECTOR
// ============================================================================
// En un controlador separado para médicos, ej: medicosController.js
exports.tiposServicioPorSectorMedico = async (req, res, next) => {
  try {
    console.log('=== DEBUG tiposServicioPorSector (MÉDICO) ===');
    
    // 1. SOLO MÉDICOS
    if (req.user.rol !== 'MEDICO') {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'Acceso restringido a personal médico',
        error: { status: 403 },
        user: req.user
      });
    }
    
    const { sectorId } = req.params;
    
    // 2. Validar sectorId
    if (!sectorId || isNaN(parseInt(sectorId))) {
      return res.status(400).render('error', {
        title: 'Sector Inválido',
        message: 'ID de sector inválido',
        error: { status: 400 },
        user: req.user
      });
    }
    
    // 3. Buscar sector (médicos pueden ver cualquier sector)
    const sector = await Sector.findByPk(sectorId);
    
    if (!sector) {
      return res.status(404).render('error', {
        title: 'Sector No Encontrado',
        message: 'El sector solicitado no existe',
        error: { status: 404 },
        user: req.user
      });
    }
    
    // 4. Obtener tipos de servicio (igual que enfermeros pero sin restricción)
    const tiposServicio = await TipoDeServicio.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        where: { sector_id: sectorId },
        required: true,
        include: [{
          model: Cama,
          as: 'camas',
          attributes: ['id', 'estado', 'numero']
        }]
      }],
      order: [['nombre', 'ASC']]
    });

    // 5. Calcular estadísticas (mismo código)
    const tiposServicioConEstadisticas = tiposServicio.map(tipo => {
      let totalCamas = 0;
      let camasLibres = 0;
      let camasOcupadas = 0;
      let camasLimpieza = 0;

      tipo.habitaciones.forEach(hab => {
        hab.camas.forEach(cama => {
          totalCamas++;
          if (cama.estado === 'Libre') camasLibres++;
          else if (cama.estado === 'Ocupada') camasOcupadas++;
          else if (cama.estado === 'EnLimpieza') camasLimpieza++;
        });
      });

      return {
        ...tipo.toJSON(),
        estadisticas: {
          totalHabitaciones: tipo.habitaciones.length,
          totalCamas,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0
        }
      };
    });

    // 6. Obtener todos los sectores para el selector
    const todosLosSectores = await Sector.findAll({
      order: [['nombre', 'ASC']]
    });

    // 7. Renderizar vista DIFERENTE para médicos
    res.render('dashboard/medico/camas-tipos-servicio', {
      title: `Disponibilidad - ${sector.nombre}`,
      user: req.user,
      sector,
      tiposServicio: tiposServicioConEstadisticas,
      todosLosSectores, 
      esMedico: true,
      puedeVerTodosSectores: true
    });

  } catch (error) {
    console.error('Error médico al listar tipos de servicio:', error);
    next(error);
  }
};

// ============================================================================
//  HABITACIONES POR SERVICIO
// ============================================================================
exports.habitacionesPorServicio = async (req, res, next) => {
  try {
    console.log('=== DEBUG habitacionesPorServicio ===');
    console.log('Usuario completo:', {
      usuario_id: req.user.usuario_id,
      nombre: req.user.nombre,
      rol: req.user.rol,
      sector_id: req.user.sector_id,
      sector_nombre: req.user.sector_nombre
    });
    
    const { sectorId, servicioId } = req.params;
    const { tipo, sexo } = req.query;
    
    console.log('Params:', { sectorId, servicioId });
    console.log('Query:', { tipo, sexo });
    
    // Validar que sea enfermero
    if (req.user.rol !== 'ENFERMERO' && req.user.rol !== 'enfermero') {
      return res.status(403).render('error', {
        message: 'Acceso restringido a personal de enfermería'
      });
    }
    
    // Validar permisos - comparar sector del usuario con sector solicitado
    if (req.user.sector_id && parseInt(sectorId) !== req.user.sector_id) {
      console.log('ERROR: Permiso denegado - Sector no coincide');
      return res.status(403).render('error', {
        message: `No tiene permisos para ver este sector. Su sector asignado es: ${req.user.sector_nombre}`
      });
    }
    
    // Si no tiene sector, mostrar advertencia pero permitir
    if (!req.user.sector_id) {
      console.log('ADVERTENCIA: Usuario enfermero sin sector asignado');
    }
    
    // Buscar sector y servicio
    const [sector, tipoServicio] = await Promise.all([
      Sector.findByPk(sectorId),
      TipoDeServicio.findByPk(servicioId)
    ]);
    
    if (!sector || !tipoServicio) {
      return res.status(404).render('error', {
        message: 'Sector o tipo de servicio no encontrado'
      });
    }
    
    console.log('Encontrado:', {
      sector: sector.nombre,
      servicio: tipoServicio.nombre
    });

    // Construir condiciones de filtro
    const whereCondition = { 
      sector_id: sectorId,
      tipo_de_servicio_id: servicioId
    };
    
    if (tipo) {
      whereCondition.tipo = tipo;
    }
    
    if (sexo && sexo !== 'Todos') {
      whereCondition.sexo_permitido = sexo;
    }
    
    console.log('Filtros de búsqueda:', whereCondition);

    // Buscar habitaciones
    const habitaciones = await Habitacion.findAll({
      where: whereCondition,
      include: [
        {
          model: TipoDeServicio,
          as: 'tipoServicio'
        },
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
                attributes: ['nombre', 'apellido', 'dni']
              }]
            }]
          }]
        }
      ],
      order: [['numero', 'ASC']]
    });
    
    console.log(`Encontradas ${habitaciones.length} habitaciones`);

    // Calcular estadísticas por habitación
    const habitacionesConEstadisticas = habitaciones.map(habitacion => {
      let camasLibres = 0;
      let camasOcupadas = 0;
      let camasLimpieza = 0;
      let pacientesActuales = [];
      
      habitacion.camas.forEach(cama => {
        if (cama.estado === 'Libre') camasLibres++;
        else if (cama.estado === 'Ocupada') {
          camasOcupadas++;
          if (cama.internaciones && cama.internaciones.length > 0) {
            const internacion = cama.internaciones[0];
            pacientesActuales.push({
              nombre: `${internacion.paciente.usuario.nombre} ${internacion.paciente.usuario.apellido}`,
              dni: internacion.paciente.usuario.dni,
              camaNumero: cama.numero,
              camaId: cama.id
            });
          }
        } else if (cama.estado === 'EnLimpieza') camasLimpieza++;
      });

      return {
        ...habitacion.toJSON(),
        estadisticas: {
          totalCamas: habitacion.camas.length,
          camasLibres,
          camasOcupadas,
          camasLimpieza,
          porcentajeOcupacion: habitacion.camas.length > 0 ? 
            Math.round((camasOcupadas / habitacion.camas.length) * 100) : 0
        },
        pacientesActuales
      };
    });

    res.render('dashboard/medico/camas-habitaciones', {
      title: `Habitaciones - ${tipoServicio.nombre}`,
      user: req.user,
      sector,
      tipoServicio,
      habitaciones: habitacionesConEstadisticas,
      filtros: { tipo, sexo },
      tieneSectorAsignado: !!req.user.sector_id,
      esMiSector: req.user.sector_id === parseInt(sectorId)
    });

  } catch (error) {
    console.error('Error al listar habitaciones por servicio:', error);
    next(error);
  }
};
// API: Buscar pacientes con admisión activa
exports.apiBuscarPacientes = async (req, res, next) => {
  try {
   
    
    const { termino } = req.query;
    console.log('📝 Término de búsqueda:', termino);

    if (!termino || termino.length < 3) {
      console.log('⚠️ Término muy corto o vacío');
      return res.json({
        success: true,
        pacientes: []
      });
    }

    console.log('🔍 Buscando pacientes en la BD...');

    // 1. Buscar pacientes por DNI/nombre/apellido
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
      limit: 20
    });

    console.log(`📋 Pacientes encontrados: ${pacientes.length}`);

    if (pacientes.length === 0) {
      console.log('ℹ️ No se encontraron pacientes con ese término');
      return res.json({
        success: true,
        pacientes: []
      });
    }

    // 2. Para cada paciente, validar admisiones y estado
    const pacientesValidos = [];
    
    for (const paciente of pacientes) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 PACIENTE: ${paciente.usuario.nombre} ${paciente.usuario.apellido}`);
      console.log(`   ID: ${paciente.id} | DNI: ${paciente.usuario.dni}`);
      console.log(`${'='.repeat(60)}`);
      
      //  PASO 1: Buscar TODAS las admisiones (sin filtro de estado)
      console.log('\n📋 PASO 1: Buscando admisiones...');
      const admisiones = await Admision.findAll({
        where: {
          paciente_id: paciente.id
        },
        include: [
          {
            model: AltaMedica,
            as: 'alta_medica',
            required: false
          }
        ],
        order: [['fecha', 'DESC']]
      });

      console.log(`   Total admisiones: ${admisiones.length}`);
      
      if (admisiones.length === 0) {
        console.log('   ❌ NO TIENE ADMISIONES - Debe crearse una en administración');
        continue;
      }

      // Mostrar detalle de cada admisión
      admisiones.forEach((adm, index) => {
        console.log(`\n   Admisión ${index + 1}:`);
        console.log(`     - ID: ${adm.id}`);
        console.log(`     - Fecha: ${adm.fecha}`);
        console.log(`     - Estado: ${adm.estado}`);
        console.log(`     - Tiene alta médica: ${adm.alta_medica ? `SÍ (ID: ${adm.alta_medica.id})` : 'NO'}`);
      });

      // ✅ PASO 2: Filtrar solo admisiones SIN alta médica
      console.log('\n📋 PASO 2: Filtrando admisiones SIN alta médica...');
      const admisionesSinAlta = admisiones.filter(adm => !adm.alta_medica);

      console.log(`   Admisiones SIN alta médica: ${admisionesSinAlta.length}`);

      if (admisionesSinAlta.length === 0) {
        console.log('   ❌ TODAS LAS ADMISIONES TIENEN ALTA - Necesita nueva admisión');
        continue;
      }

      // Tomar la más reciente
      const admisionMasReciente = admisionesSinAlta[0];
      console.log(`\n    Admisión seleccionada:`);
      console.log(`     - ID: ${admisionMasReciente.id}`);
      console.log(`     - Fecha: ${admisionMasReciente.fecha}`);
      console.log(`     - Estado: ${admisionMasReciente.estado}`);

      // ✅ PASO 3: Verificar internación activa
      console.log('\n🏥 PASO 3: Verificando internación activa...');
      const internacionActiva = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          fecha_alta: null
        },
        attributes: ['id', 'fecha_inicio', 'cama_id', 'habitacion_id']
      });

      if (internacionActiva) {
        console.log(`   ❌ YA TIENE INTERNACIÓN ACTIVA:`);
        console.log(`     - ID: ${internacionActiva.id}`);
        console.log(`     - Fecha inicio: ${internacionActiva.fecha_inicio}`);
        console.log(`     - Cama ID: ${internacionActiva.cama_id}`);
        console.log(`     - Habitación ID: ${internacionActiva.habitacion_id}`);
        console.log(`   → DESCARTADO (ya está internado)`);
        continue;
      }

      console.log('    NO TIENE INTERNACIÓN ACTIVA');

      // ✅ PASO 4: Paciente válido
      console.log('\nPACIENTE VÁLIDO PARA INTERNAR');

      const edad = calcularEdad(paciente.usuario.fecha_nacimiento);
      
      const pacienteValido = {
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        sexo: paciente.usuario.sexo,
        edad,
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        admision_id: admisionMasReciente.id,
        admision_fecha: admisionMasReciente.fecha,
        admision_estado: admisionMasReciente.estado
      };
      
      pacientesValidos.push(pacienteValido);
      console.log('\n✅ AGREGADO A RESULTADOS:');
      console.log(JSON.stringify(pacienteValido, null, 2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS FINALES');
    console.log('='.repeat(60));
    console.log(`Pacientes buscados: ${pacientes.length}`);
    console.log(`Pacientes válidos: ${pacientesValidos.length}`);
    
    if (pacientesValidos.length > 0) {
      console.log('\n LISTA DE PACIENTES VÁLIDOS:');
      pacientesValidos.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.nombre}`);
        console.log(`   - DNI: ${p.dni}`);
        console.log(`   - Admisión: ${p.admision_id} (${p.admision_estado})`);
        console.log(`   - Fecha admisión: ${p.admision_fecha}`);
      });
    } else {
      console.log('\n⚠️ NO HAY PACIENTES VÁLIDOS');
      console.log('POSIBLES MOTIVOS:');
      console.log('  1. Todas las admisiones tienen alta médica');
      console.log('  2. El paciente ya está internado');
      console.log('  3. No tiene admisiones registradas');
    }

    res.json({
      success: true,
      pacientes: pacientesValidos
    });

  } catch (error) {
    
    console.error('❌ ERROR EN API BUSCAR PACIENTES');
    
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// API: Asignar paciente a cama
exports.apiAsignarPaciente = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      paciente_id,
      cama_id,
      medico_id,
      tipo_internacion_id,
      prioridad = 'MEDIA',
      observaciones
    } = req.body;

    const sectorEnfermero = await obtenerSectorEnfermero(req);
    const usuarioId = req.user.id;

    // 1. Validar paciente
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
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    // 2. Validar que no esté ya internado
    const internacionActiva = await Internacion.findOne({
      where: { paciente_id, fecha_alta: null },
      transaction
    });

    if (internacionActiva) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'El paciente ya tiene una internación activa' });
    }

    //  3. Buscar admisión activa sin alta médica
    const admisiones = await Admision.findAll({
      where: { paciente_id },
      include: [{ model: AltaMedica, as: 'alta_medica', required: false }],
      order: [['fecha', 'DESC']],
      transaction
    });

    const admisionActiva = admisiones.find(adm => !adm.alta_medica);

    if (!admisionActiva) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene admisión activa válida. Debe crearse una admisión primero.'
      });
    }

    // 4. Validar cama
    const cama = await Cama.findOne({
      where: { id: cama_id },
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorEnfermero },
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      }],
      transaction
    });

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Cama no encontrada o no pertenece a su sector' });
    }

    if (cama.estado !== 'Libre') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `La cama ${cama.numero} no está disponible (Estado: ${cama.estado})` });
    }

    // 5. Validar compatibilidad de sexo
    const sexoPaciente = paciente.usuario.sexo;
    const habitacion = cama.habitacion;

    if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexoPaciente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La habitación ${habitacion.numero} solo permite pacientes de sexo ${habitacion.sexo_permitido}. El paciente es de sexo ${sexoPaciente}.`
      });
    }

    if (habitacion.tipo === 'Doble') {
      const camaOcupada = await Cama.findOne({
        where: { habitacion_id: habitacion.id, estado: 'Ocupada', id: { [Op.ne]: cama_id } },
        transaction
      });

      if (camaOcupada?.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `La habitación ya tiene un paciente de sexo ${camaOcupada.sexo_ocupante}.`
        });
      }
    }

    // 6. Validar médico
    const medico = await Medico.findByPk(medico_id, { transaction });
    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    // 7. Obtener administrativo si existe
    const administrativo = await Administrativo.findOne({
      where: { usuario_id: usuarioId },
      transaction
    });

    // ===== CREAR LISTA DE ESPERA =====
    const listaEspera = await ListaEspera.create({
      paciente_id,
      tipo_turno_id: 1,
      prioridad,
      estado: 'PENDIENTE',
      habitacion_id: habitacion.id,
      creador_tipo: 'ENFERMERO',
      creador_id: usuarioId,
      fecha_registro: new Date(),
      observaciones
    }, { transaction });

    // ===== CREAR INTERNACIÓN =====
    const internacion = await Internacion.create({
      paciente_id,
      medico_id,
      cama_id,
      habitacion_id: habitacion.id,
      tipo_internacion_id,
      administrativo_id: administrativo?.id || null,
      evaluacion_medica_id: null,
      es_prequirurgica: false,
      estado_operacion: 'No aplica',
      estado_estudios: 'Pendientes',
      estado_paciente: 'Sin_Evaluar',
      fecha_inicio: new Date(),
      fecha_cirugia: null,
      obra_social_id: paciente.obra_social_id,
      lista_espera_id: listaEspera.id,
      admision_id: admisionActiva.id  
    }, { transaction });

    // ===== ACTUALIZAR CAMA =====
    await cama.update({ estado: 'Ocupada', sexo_ocupante: sexoPaciente }, { transaction });

    // ===== ACTUALIZAR LISTA DE ESPERA =====
    await listaEspera.update({ estado: 'ASIGNADO' }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} asignado exitosamente a la cama ${cama.numero}`,
      data: {
        internacion_id: internacion.id,
        admision_id: admisionActiva.id,
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
// API PARA BÚSQUEDA AVANZADA

exports.apiBuscarCamas = async (req, res, next) => {
  try {
    const { 
      cama_numero, 
      habitacion_numero, 
      sector_id,
      estado,
      tipo_servicio_id,
      sexo_permitido,
      limite = 20  
    } = req.query;

    console.log('Parámetros de búsqueda recibidos:', { 
      cama_numero, habitacion_numero, sector_id, estado, tipo_servicio_id, sexo_permitido 
    });

    const sectorEnfermero = await obtenerSectorEnfermero(req);
    console.log('Sector del enfermero:', sectorEnfermero);

    // Construir condiciones de búsqueda para Cama
    const whereConditionCama = {};
    
    if (cama_numero) {
      whereConditionCama.numero = { [Op.like]: `%${cama_numero}%` };
    }
    
    //  Mapear el estado recibido al formato de la base de datos
    if (estado && estado !== 'Todos') {
      // Convertir a formato correcto (primera letra mayúscula, resto minúscula)
      const estadoMap = {
        'libre': 'Libre',
        'ocupada': 'Ocupada',
        'limpieza': 'EnLimpieza',
        'enlimpieza': 'EnLimpieza',
        'en limpieza': 'EnLimpieza'
      };
      
      whereConditionCama.estado = estadoMap[estado.toLowerCase()] || estado;
      console.log('Estado mapeado:', whereConditionCama.estado);
    }

    // Construir condiciones de búsqueda para Habitacion
    const whereConditionHabitacion = { sector_id: sectorEnfermero };
    
    if (habitacion_numero) {
      whereConditionHabitacion.numero = { [Op.like]: `%${habitacion_numero}%` };
    }
    
    if (sector_id && sector_id !== 'Todos') {
      whereConditionHabitacion.sector_id = sector_id;
    }
    
    if (tipo_servicio_id && tipo_servicio_id !== 'Todos') {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio_id;
    }
    
    // CORRECCIÓN: Mapear sexo_permitido al formato de la base de datos
    if (sexo_permitido && sexo_permitido !== 'Todos') {
      // Convertir a formato correcto (primera letra mayúscula, resto minúscula)
      const sexoMap = {
        'masculino': 'Masculino',
        'femenino': 'Femenino',
        'mixto': 'Mixto',
        'unisex': 'Mixto', // Mapear 'unisex' a 'Mixto'
        'todos': 'Mixto'
      };
      
      whereConditionHabitacion.sexo_permitido = sexoMap[sexo_permitido.toLowerCase()] || sexo_permitido;
      console.log('Sexo permitido mapeado:', whereConditionHabitacion.sexo_permitido);
    }

    console.log('Condiciones Cama:', whereConditionCama);
    console.log('Condiciones Habitacion:', whereConditionHabitacion);

    const camas = await Cama.findAll({
      where: whereConditionCama,
      include: [
        {
          model: Habitacion,
          as: 'habitacion',
          where: whereConditionHabitacion,
          include: [
            {
              model: Sector,
              as: 'sector'
            },
            {
              model: TipoDeServicio,
              as: 'tipoServicio'
            }
          ]
        },
        {
          model: Internacion,
          as: 'internaciones',
          where: { fecha_alta: null },
          required: false,
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
      limit: parseInt(limite)
    });

    console.log(`Se encontraron ${camas.length} camas`);

    // ORDENAMOS MANUALMENTE EN JAVASCRIPT
    const camasOrdenadas = camas.sort((a, b) => {
      // Primero por número de habitación
      const numHabitacionA = parseInt(a.habitacion?.numero) || 0;
      const numHabitacionB = parseInt(b.habitacion?.numero) || 0;
      
      if (numHabitacionA < numHabitacionB) return -1;
      if (numHabitacionA > numHabitacionB) return 1;
      
      // Luego por número de cama
      const numCamaA = parseInt(a.numero) || 0;
      const numCamaB = parseInt(b.numero) || 0;
      
      return numCamaA - numCamaB;
    });

    // Formatear resultados
    const resultados = camasOrdenadas.map(cama => ({
      id: cama.id,
      numero: cama.numero,
      estado: cama.estado,
      fecha_fin_limpieza: cama.fecha_fin_limpieza,
      habitacion: cama.habitacion ? {
        id: cama.habitacion.id,
        numero: cama.habitacion.numero,
        tipo: cama.habitacion.tipo,
        sexo_permitido: cama.habitacion.sexo_permitido,
        sector: cama.habitacion.sector ? {
          id: cama.habitacion.sector.id,
          nombre: cama.habitacion.sector.nombre
        } : null,
        tipoServicio: cama.habitacion.tipoServicio ? {
          id: cama.habitacion.tipoServicio.id,
          nombre: cama.habitacion.tipoServicio.nombre
        } : null
      } : null,
      paciente: cama.internaciones && cama.internaciones.length > 0 && cama.internaciones[0].paciente ? {
        id: cama.internaciones[0].paciente.id,
        nombre: cama.internaciones[0].paciente.usuario ? 
          `${cama.internaciones[0].paciente.usuario.nombre} ${cama.internaciones[0].paciente.usuario.apellido}` : 'N/A',
        dni: cama.internaciones[0].paciente.usuario?.dni || 'N/A',
        medico: cama.internaciones[0].medico?.usuario ? 
          `${cama.internaciones[0].medico.usuario.nombre} ${cama.internaciones[0].medico.usuario.apellido}` : null
      } : null
    }));

    res.json({
      success: true,
      total: resultados.length,
      resultados
    });

  } catch (error) {
    console.error('Error en API de búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
};

// Obtener sectores para dropdown
exports.obtenerSectores = async (req, res, next) => {
  try {
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      sectores
    });
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar sectores'
    });
  }
};

// Obtener tipos de servicio
exports.obtenerTiposServicio = async (req, res, next) => {
  try {
    const tiposServicio = await TipoDeServicio.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      tiposServicio
    });
  } catch (error) {
    console.error('Error al obtener tipos de servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar tipos de servicio'
    });
  }
};
exports.apiBuscarPacientes = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.length < 3) {
      return res.json({ success: true, pacientes: [] });
    }

    // Buscar solo pacientes ACTIVOS por DNI, nombre o apellido
    const pacientes = await Paciente.findAll({
      where: { estado: 'Activo' },  //  solo activos
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: {
            [Op.or]: [
              { dni:      { [Op.like]: `%${termino}%` } },
              { nombre:   { [Op.like]: `%${termino}%` } },
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
      limit: 20
    });

    if (pacientes.length === 0) {
      return res.json({ success: true, pacientes: [] });
    }

    const pacientesValidos = [];

    for (const paciente of pacientes) {

      // Verificar que tenga admisión sin alta médica
      const admisiones = await Admision.findAll({
        where: { paciente_id: paciente.id },
        include: [{
          model: AltaMedica,
          as: 'alta_medica',
          required: false
        }],
        order: [['fecha', 'DESC']]
      });

      const admisionesSinAlta = admisiones.filter(adm => !adm.alta_medica);

      if (admisionesSinAlta.length === 0) {
        console.log(`❌ Paciente ${paciente.id} - todas las admisiones tienen alta`);
        continue;
      }

      // Verificar que NO esté ya internado
      const internacionActiva = await Internacion.findOne({
        where: { paciente_id: paciente.id, fecha_alta: null }
      });

      if (internacionActiva) {
        console.log(`❌ Paciente ${paciente.id} - ya tiene internación activa`);
        continue;
      }

      // Paciente válido para asignar cama
      const admisionReciente = admisionesSinAlta[0];
      const edad = calcularEdad(paciente.usuario.fecha_nacimiento);

      pacientesValidos.push({
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        sexo: paciente.usuario.sexo,
        edad,
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        admision_id: admisionReciente.id,
        admision_fecha: admisionReciente.fecha,
        admision_estado: admisionReciente.estado
      });
    }

    console.log(` Pacientes válidos para internar: ${pacientesValidos.length}`);

    res.json({
      success: true,
      pacientes: pacientesValidos
    });

  } catch (error) {
    console.error('❌ Error en apiBuscarPacientes:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;