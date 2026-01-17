const { Cama, 
    Habitacion, 
    Sector, 
    TipoDeServicio, 
    Internacion, 
    Paciente, 
    Usuario } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar camas
exports.listarCamas = async (req, res) => {
  try {
    const { sector, estado, habitacion, tipo_servicio } = req.query;
    
    const whereConditionCama = {};
    const whereConditionHabitacion = {};

    if (estado) {
      whereConditionCama.estado = estado;
    }

    if (habitacion) {
      whereConditionCama.habitacion_id = habitacion;
    }

    if (sector) {
      whereConditionHabitacion.sector_id = sector;
    }

    if (tipo_servicio) {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio;
    }

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
          required: false,
          where: { fecha_alta: null },
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
      ],
      order: [
        ['habitacion_id', 'ASC'],
        ['numero', 'ASC']
      ]
    });

    // Obtener datos para filtros
    const [sectores, habitaciones, tiposServicio] = await Promise.all([
      Sector.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      }),
      Habitacion.findAll({
        attributes: ['id', 'numero'],
        include: [{
          model: Sector,
          as: 'sector',
          attributes: ['nombre']
        }],
        order: [['numero', 'ASC']]
      }),
      TipoDeServicio.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      })
    ]);

    // Estadísticas
    const estadisticas = {
      total: camas.length,
      libres: camas.filter(c => c.estado === 'Libre').length,
      ocupadas: camas.filter(c => c.estado === 'Ocupada').length,
      en_limpieza: camas.filter(c => c.estado === 'EnLimpieza').length,
      porcentaje_ocupacion: camas.length > 0 
        ? Math.round((camas.filter(c => c.estado === 'Ocupada').length / camas.length) * 100) 
        : 0
    };

    res.render('dashboard/enfermero/camas', {
      title: 'Gestión de Camas',
      user: req.user,
      camas,
      sectores,
      habitaciones,
      tiposServicio,
      estadisticas,
      filtros: { sector, estado, habitacion, tipo_servicio }
    });

  } catch (error) {
    console.error('Error al listar camas:', error);
    res.status(500).render('error', {
      message: 'Error al cargar camas',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de cama
exports.verCama = async (req, res) => {
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
                attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
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

    res.render('dashboard/enfermero/camas-detalle', {
      title: 'Detalle de Cama',
      user: req.user,
      cama,
      historial
    });

  } catch (error) {
    console.error('Error al ver cama:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle de la cama',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Cambiar estado de cama
exports.cambiarEstado = async (req, res) => {
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
    } else if (nuevo_estado === 'Libre') {
      updateData.fecha_fin_limpieza = null;
      updateData.sexo_ocupante = null;
    }

    await cama.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Cama cambiada a estado: ${nuevo_estado}`,
      redirect: `dashboard/enfermero/camas/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la cama',
      error: error.message
    });
  }
};

// Liberar cama (finalizar limpieza)
exports.liberarCama = async (req, res) => {
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
      redirect: 'dashboard/enfermero/camas'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al liberar cama:', error);
    res.status(500).json({
      success: false,
      message: 'Error al liberar la cama',
      error: error.message
    });
  }
};

// Obtener disponibilidad por sector
exports.disponibilidadPorSector = async (req, res) => {
  try {
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    const disponibilidad = [];

    for (const sector of sectores) {
      const [total, libres, ocupadas, enLimpieza] = await Promise.all([
        Cama.count({
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id: sector.id }
          }]
        }),
        Cama.count({
          where: { estado: 'Libre' },
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id: sector.id }
          }]
        }),
        Cama.count({
          where: { estado: 'Ocupada' },
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id: sector.id }
          }]
        }),
        Cama.count({
          where: { estado: 'EnLimpieza' },
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id: sector.id }
          }]
        })
      ]);

      disponibilidad.push({
        sector: sector.nombre,
        total,
        libres,
        ocupadas,
        en_limpieza: enLimpieza,
        porcentaje_ocupacion: total > 0 ? Math.round((ocupadas / total) * 100) : 0
      });
    }

    res.json({
      success: true,
      disponibilidad
    });

  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad'
    });
  }
};

// Buscar camas disponibles
exports.buscarDisponibles = async (req, res) => {
  try {
    const { sector_id, sexo, tipo_servicio_id } = req.query;

    const whereConditionCama = {
      estado: 'Libre'
    };

    const whereConditionHabitacion = {};

    if (sector_id) {
      whereConditionHabitacion.sector_id = sector_id;
    }

    if (tipo_servicio_id) {
      whereConditionHabitacion.tipo_de_servicio_id = tipo_servicio_id;
    }

    // Filtrar por sexo permitido en habitación
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
      ]
    });

    res.json({
      success: true,
      total: camas.length,
      camas: camas.map(c => ({
        id: c.id,
        numero: c.numero,
        habitacion: c.habitacion.numero,
        sector: c.habitacion.sector.nombre,
        tipo_servicio: c.habitacion.tipoServicio.nombre
      }))
    });

  } catch (error) {
    console.error('Error al buscar camas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar camas disponibles'
    });
  }
};

// Obtener camas por limpiar
exports.camasPorLimpiar = async (req, res) => {
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
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener camas en limpieza'
    });
  }
};

// Estadísticas generales
exports.estadisticasGenerales = async (req, res) => {
  try {
    const [
      totalCamas,
      libres,
      ocupadas,
      enLimpieza,
      masculinas,
      femeninas,
      mixtas
    ] = await Promise.all([
      Cama.count(),
      Cama.count({ where: { estado: 'Libre' } }),
      Cama.count({ where: { estado: 'Ocupada' } }),
      Cama.count({ where: { estado: 'EnLimpieza' } }),
      Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sexo_permitido: 'Masculino' }
        }]
      }),
      Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sexo_permitido: 'Femenino' }
        }]
      }),
      Cama.count({
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sexo_permitido: 'Mixto' }
        }]
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total: totalCamas,
        libres,
        ocupadas,
        en_limpieza: enLimpieza,
        porcentaje_ocupacion: totalCamas > 0 ? Math.round((ocupadas / totalCamas) * 100) : 0,
        por_sexo: {
          masculinas,
          femeninas,
          mixtas
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

module.exports = exports;