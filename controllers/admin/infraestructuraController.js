const { Op } = require('sequelize');
const db = require('../../database/db');
const {
  Sector,
  Habitacion,
  Cama,
  TipoDeServicio,
  Internacion,
  Paciente,
  Usuario
} = require('../../models');

// ============================================================================
// RENDERIZAR VISTA PRINCIPAL - SECTORES
// ============================================================================
const renderSectores = async (req, res) => {
  try {
    const sectores = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas'
        }]
      }],
      order: [['nombre', 'ASC']]
    });

    // Calcular estadísticas por sector
    const sectoresConEstadisticas = sectores.map(sector => {
      const habitaciones = sector.habitaciones || [];
      const todasLasCamas = habitaciones.flatMap(h => h.camas || []);
      
      return {
        ...sector.toJSON(),
        estadisticas: {
          totalHabitaciones: habitaciones.length,
          totalCamas: todasLasCamas.length,
          camasLibres: todasLasCamas.filter(c => c.estado === 'Libre').length,
          camasOcupadas: todasLasCamas.filter(c => c.estado === 'Ocupada').length,
          camasLimpieza: todasLasCamas.filter(c => c.estado === 'EnLimpieza').length,
          porcentajeOcupacion: todasLasCamas.length > 0 
            ? Math.round((todasLasCamas.filter(c => c.estado === 'Ocupada').length / todasLasCamas.length) * 100) 
            : 0
        }
      };
    });

    // Estadísticas globales
    const estadisticasGlobales = {
      totalSectores: sectores.length,
      totalHabitaciones: sectoresConEstadisticas.reduce((acc, s) => acc + s.estadisticas.totalHabitaciones, 0),
      totalCamas: sectoresConEstadisticas.reduce((acc, s) => acc + s.estadisticas.totalCamas, 0),
      camasLibres: sectoresConEstadisticas.reduce((acc, s) => acc + s.estadisticas.camasLibres, 0),
      camasOcupadas: sectoresConEstadisticas.reduce((acc, s) => acc + s.estadisticas.camasOcupadas, 0)
    };

    res.render('dashboard/admin/infraestructura/index', {
      title: 'Infraestructura Hospitalaria',
      user: req.user,
      sectores: sectoresConEstadisticas,
      estadisticas: estadisticasGlobales
    });

  } catch (error) {
    console.error('Error al cargar sectores:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la infraestructura',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// RENDERIZAR VISTA DE HABITACIONES DE UN SECTOR
// ============================================================================
const renderHabitaciones = async (req, res) => {
  try {
    const { sector_id } = req.params;

    const sector = await Sector.findByPk(sector_id);
    if (!sector) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Sector no encontrado',
        error: { status: 404 },
        user: req.user
      });
    }

    const habitaciones = await Habitacion.findAll({
      where: { sector_id },
      include: [
        {
          model: Cama,
          as: 'camas'
        },
        {
          model: TipoDeServicio,
          as: 'tipoServicio'
        }
      ],
      order: [['numero', 'ASC']]
    });

    // Calcular estadísticas por habitación
    const habitacionesConEstadisticas = habitaciones.map(hab => {
      const camas = hab.camas || [];
      return {
        ...hab.toJSON(),
        estadisticas: {
          totalCamas: camas.length,
          camasLibres: camas.filter(c => c.estado === 'Libre').length,
          camasOcupadas: camas.filter(c => c.estado === 'Ocupada').length,
          camasLimpieza: camas.filter(c => c.estado === 'EnLimpieza').length
        }
      };
    });

    // Obtener tipos de servicio para el formulario
    const tiposServicio = await TipoDeServicio.findAll({
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/infraestructura/habitaciones', {
      title: `Habitaciones - ${sector.nombre}`,
      user: req.user,
      sector,
      habitaciones: habitacionesConEstadisticas,
      tiposServicio
    });

  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar habitaciones',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// RENDERIZAR VISTA DE CAMAS DE UNA HABITACIÓN
// ============================================================================
const renderCamas = async (req, res) => {
  try {
    const { habitacion_id } = req.params;

    const habitacion = await Habitacion.findByPk(habitacion_id, {
      include: [
        { model: Sector, as: 'sector' },
        { model: TipoDeServicio, as: 'tipoServicio' }
      ]
    });

    if (!habitacion) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Habitación no encontrada',
        error: { status: 404 },
        user: req.user
      });
    }

    const camas = await Cama.findAll({
      where: { habitacion_id },
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
      }],
      order: [['numero', 'ASC']]
    });

    // Agregar info de ocupante actual
    const camasConInfo = camas.map(cama => {
      const camaJSON = cama.toJSON();
      const internacionActiva = camaJSON.internaciones?.[0];
      
      return {
        ...camaJSON,
        ocupanteActual: internacionActiva ? {
          paciente: internacionActiva.paciente,
          fechaIngreso: internacionActiva.fecha_inicio
        } : null
      };
    });

    res.render('dashboard/admin/infraestructura/camas', {
      title: `Camas - Habitación ${habitacion.numero}`,
      user: req.user,
      habitacion,
      sector: habitacion.sector,
      camas: camasConInfo
    });

  } catch (error) {
    console.error('Error al cargar camas:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar camas',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// API: OBTENER ESTADÍSTICAS GLOBALES
// ============================================================================
const getEstadisticasGlobales = async (req, res) => {
  try {
    const [sectores, habitaciones, camas] = await Promise.all([
      Sector.count(),
      Habitacion.count(),
      Cama.findAll({
        attributes: ['estado'],
        raw: true
      })
    ]);

    const estadisticas = {
      totalSectores: sectores,
      totalHabitaciones: habitaciones,
      totalCamas: camas.length,
      camasLibres: camas.filter(c => c.estado === 'Libre').length,
      camasOcupadas: camas.filter(c => c.estado === 'Ocupada').length,
      camasLimpieza: camas.filter(c => c.estado === 'EnLimpieza').length
    };

    res.json({ success: true, estadisticas });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

// ============================================================================
// API: CRUD SECTORES
// ============================================================================
const crearSector = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    const sector = await Sector.create({ nombre, descripcion });

    res.status(201).json({
      success: true,
      message: 'Sector creado correctamente',
      sector
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const actualizarSector = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const sector = await Sector.findByPk(id);
    if (!sector) {
      return res.status(404).json({ success: false, message: 'Sector no encontrado' });
    }

    await sector.update({ nombre, descripcion });

    res.json({ success: true, message: 'Sector actualizado', sector });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const eliminarSector = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { confirmar } = req.body;

    const sector = await Sector.findByPk(id, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas'
        }]
      }],
      transaction
    });

    if (!sector) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Sector no encontrado' });
    }

    // Verificar si hay camas ocupadas
    const camasOcupadas = sector.habitaciones
      .flatMap(h => h.camas)
      .filter(c => c.estado === 'Ocupada');

    if (camasOcupadas.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar: hay ${camasOcupadas.length} cama(s) ocupada(s)`,
        camasOcupadas: camasOcupadas.length
      });
    }

    // Si hay habitaciones/camas y no confirmó
    const totalHabitaciones = sector.habitaciones.length;
    const totalCamas = sector.habitaciones.flatMap(h => h.camas).length;

    if ((totalHabitaciones > 0 || totalCamas > 0) && !confirmar) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        requiereConfirmacion: true,
        message: `Este sector tiene ${totalHabitaciones} habitación(es) y ${totalCamas} cama(s). ¿Desea eliminar todo?`,
        totalHabitaciones,
        totalCamas
      });
    }

    // Eliminar camas primero
    for (const habitacion of sector.habitaciones) {
      await Cama.destroy({
        where: { habitacion_id: habitacion.id },
        transaction
      });
    }

    // Eliminar habitaciones
    await Habitacion.destroy({
      where: { sector_id: id },
      transaction
    });

    // Eliminar sector
    await sector.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Sector "${sector.nombre}" eliminado con ${totalHabitaciones} habitación(es) y ${totalCamas} cama(s)`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: CRUD HABITACIONES
// ============================================================================
const crearHabitacion = async (req, res) => {
  try {
    const { sector_id, numero, tipo, sexo_permitido, tipo_de_servicio_id } = req.body;

    if (!sector_id || !numero || !tipo_de_servicio_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: sector_id, numero, tipo_de_servicio_id'
      });
    }

    // Verificar que el sector existe
    const sector = await Sector.findByPk(sector_id);
    if (!sector) {
      return res.status(404).json({ success: false, message: 'Sector no encontrado' });
    }

    // Verificar que no exista otra habitación con el mismo número en el sector
    const existente = await Habitacion.findOne({
      where: { sector_id, numero }
    });

    if (existente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una habitación con número ${numero} en este sector`
      });
    }

    const habitacion = await Habitacion.create({
      sector_id: parseInt(sector_id),
      numero,
      tipo: tipo || 'Colectiva',
      sexo_permitido: sexo_permitido || 'Mixto',
      tipo_de_servicio_id: parseInt(tipo_de_servicio_id)
    });

    res.status(201).json({
      success: true,
      message: 'Habitación creada correctamente',
      habitacion
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const actualizarHabitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, tipo, sexo_permitido, tipo_de_servicio_id } = req.body;

    const habitacion = await Habitacion.findByPk(id);
    if (!habitacion) {
      return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    }

    await habitacion.update({
      numero: numero || habitacion.numero,
      tipo: tipo || habitacion.tipo,
      sexo_permitido: sexo_permitido || habitacion.sexo_permitido,
      tipo_de_servicio_id: tipo_de_servicio_id || habitacion.tipo_de_servicio_id
    });

    res.json({ success: true, message: 'Habitación actualizada', habitacion });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const eliminarHabitacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { confirmar } = req.body;

    const habitacion = await Habitacion.findByPk(id, {
      include: [{
        model: Cama,
        as: 'camas'
      }],
      transaction
    });

    if (!habitacion) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    }

    // Verificar camas ocupadas
    const camasOcupadas = habitacion.camas.filter(c => c.estado === 'Ocupada');
    if (camasOcupadas.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar: hay ${camasOcupadas.length} cama(s) ocupada(s)`
      });
    }

    const totalCamas = habitacion.camas.length;

    if (totalCamas > 0 && !confirmar) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        requiereConfirmacion: true,
        message: `Esta habitación tiene ${totalCamas} cama(s). ¿Desea eliminar todo?`,
        totalCamas
      });
    }

    // Eliminar camas
    await Cama.destroy({
      where: { habitacion_id: id },
      transaction
    });

    // Eliminar habitación
    await habitacion.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Habitación ${habitacion.numero} eliminada con ${totalCamas} cama(s)`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: CRUD CAMAS
// ============================================================================
const crearCama = async (req, res) => {
  try {
    const { habitacion_id, numero } = req.body;

    if (!habitacion_id || !numero) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: habitacion_id, numero'
      });
    }

    // Verificar habitación
    const habitacion = await Habitacion.findByPk(habitacion_id);
    if (!habitacion) {
      return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    }

    // Verificar duplicado
    const existente = await Cama.findOne({
      where: { habitacion_id, numero }
    });

    if (existente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una cama con número ${numero} en esta habitación`
      });
    }

    const cama = await Cama.create({
      habitacion_id: parseInt(habitacion_id),
      numero,
      estado: 'Libre'
    });

    res.status(201).json({
      success: true,
      message: 'Cama creada correctamente',
      cama
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const crearCamasMultiples = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { habitacion_id, cantidad, prefijo } = req.body;

    if (!habitacion_id || !cantidad) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: habitacion_id, cantidad'
      });
    }

    const habitacion = await Habitacion.findByPk(habitacion_id, {
      include: [{ model: Cama, as: 'camas' }],
      transaction
    });

    if (!habitacion) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    }

    // Determinar el siguiente número
    const camasExistentes = habitacion.camas || [];
    let ultimoNumero = 0;
    
    camasExistentes.forEach(c => {
      const num = parseInt(c.numero.replace(/\D/g, '')) || 0;
      if (num > ultimoNumero) ultimoNumero = num;
    });

    const camasCreadas = [];
    const prefijoUsar = prefijo || `${habitacion.numero}-`;

    for (let i = 1; i <= parseInt(cantidad); i++) {
      const numeroCama = `${prefijoUsar}${(ultimoNumero + i).toString().padStart(2, '0')}`;
      
      const cama = await Cama.create({
        habitacion_id: parseInt(habitacion_id),
        numero: numeroCama,
        estado: 'Libre'
      }, { transaction });

      camasCreadas.push(cama);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `${camasCreadas.length} cama(s) creada(s) correctamente`,
      camas: camasCreadas
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const actualizarCama = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, estado } = req.body;

    const cama = await Cama.findByPk(id);
    if (!cama) {
      return res.status(404).json({ success: false, message: 'Cama no encontrada' });
    }

    // No permitir cambiar estado de cama ocupada
    if (cama.estado === 'Ocupada' && estado && estado !== 'Ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado de una cama ocupada. Primero debe dar de alta al paciente.'
      });
    }

    await cama.update({
      numero: numero || cama.numero,
      estado: estado || cama.estado
    });

    res.json({ success: true, message: 'Cama actualizada', cama });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const eliminarCama = async (req, res) => {
  try {
    const { id } = req.params;

    const cama = await Cama.findByPk(id);
    if (!cama) {
      return res.status(404).json({ success: false, message: 'Cama no encontrada' });
    }

    if (cama.estado === 'Ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una cama ocupada. Primero debe dar de alta al paciente.'
      });
    }

    await cama.destroy();

    res.json({
      success: true,
      message: `Cama ${cama.numero} eliminada correctamente`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: OBTENER TIPOS DE SERVICIO
// ============================================================================
const getTiposServicio = async (req, res) => {
  try {
    const tipos = await TipoDeServicio.findAll({
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, tipos });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: OBTENER SECTOR POR ID
// ============================================================================
const getSectorById = async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await Sector.findByPk(id);
    if (!sector) {
      return res.status(404).json({ success: false, message: 'Sector no encontrado' });
    }

    res.json({ success: true, sector });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: OBTENER HABITACIÓN POR ID
// ============================================================================
const getHabitacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const habitacion = await Habitacion.findByPk(id, {
      include: [
        { model: Sector, as: 'sector' },
        { model: TipoDeServicio, as: 'tipoServicio' }
      ]
    });

    if (!habitacion) {
      return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    }

    res.json({ success: true, habitacion });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API: OBTENER CAMA POR ID
// ============================================================================
const getCamaById = async (req, res) => {
  try {
    const { id } = req.params;

    const cama = await Cama.findByPk(id, {
      include: [{
        model: Habitacion,
        as: 'habitacion',
        include: [{ model: Sector, as: 'sector' }]
      }]
    });

    if (!cama) {
      return res.status(404).json({ success: false, message: 'Cama no encontrada' });
    }

    res.json({ success: true, cama });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // Vistas
  renderSectores,
  renderHabitaciones,
  renderCamas,
  // API
  getEstadisticasGlobales,
  getTiposServicio,
  getSectorById,
  getHabitacionById,
  getCamaById,
  // CRUD Sectores
  crearSector,
  actualizarSector,
  eliminarSector,
  // CRUD Habitaciones
  crearHabitacion,
  actualizarHabitacion,
  eliminarHabitacion,
  // CRUD Camas
  crearCama,
  crearCamasMultiples,
  actualizarCama,
  eliminarCama
};
