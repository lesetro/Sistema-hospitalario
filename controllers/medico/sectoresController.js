// controllers/medico/sectoresController.js
const { 
  Sector, 
  Habitacion, 
  Cama, 
  Internacion, 
  Paciente, 
  Usuario,
  Medico,
  TipoDeServicio,
  TipoInternacion,
  ObraSocial
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ============================================================================
// VISTA PRINCIPAL - MI SECTOR
// ============================================================================
const renderMiSector = async (req, res) => {
  try {
    const sectorId = req.sectorUsuario; // Del middleware
    
    const sector = await Sector.findByPk(sectorId, {
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [
          { model: TipoDeServicio, as: 'tipoServicio' },
          { model: Cama, as: 'camas' }
        ]
      }]
    });
    
    if (!sector) {
      return res.status(404).render('error', {
        title: 'Sector No Encontrado',
        message: 'No se encontró su sector asignado',
        user: req.user
      });
    }
    
    // Agrupar habitaciones por servicio
    const servicios = {};
    
    sector.habitaciones.forEach(hab => {
      const servicioNombre = hab.tipoServicio?.nombre || 'Sin Servicio';
      const servicioId = hab.tipo_servicio_id || 0;
      
      if (!servicios[servicioId]) {
        servicios[servicioId] = {
          id: servicioId,
          nombre: servicioNombre,
          habitaciones: [],
          totalCamas: 0,
          camasLibres: 0,
          camasOcupadas: 0
        };
      }
      
      servicios[servicioId].habitaciones.push(hab);
      
      // Contar camas
      const camas = hab.camas || [];
      servicios[servicioId].totalCamas += camas.length;
      servicios[servicioId].camasLibres += camas.filter(c => c.estado === 'Libre').length;
      servicios[servicioId].camasOcupadas += camas.filter(c => c.estado === 'Ocupada').length;
    });
    
    // Estadísticas del sector
    const todasLasCamas = sector.habitaciones.flatMap(h => h.camas || []);
    const estadisticas = {
      totalHabitaciones: sector.habitaciones.length,
      totalCamas: todasLasCamas.length,
      camasLibres: todasLasCamas.filter(c => c.estado === 'Libre').length,
      camasOcupadas: todasLasCamas.filter(c => c.estado === 'Ocupada').length,
      camasLimpieza: todasLasCamas.filter(c => c.estado === 'EnLimpieza').length
    };
    
    res.render('dashboard/medico/mi-sector', {
      title: `Sector: ${sector.nombre}`,
      user: req.user,
      sector,
      servicios: Object.values(servicios),
      estadisticas
    });
    
  } catch (error) {
    console.error('Error al cargar sector:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el sector',
      user: req.user
    });
  }
};

// ============================================================================
// VER HABITACIÓN CON CAMAS
// ============================================================================
const renderHabitacion = async (req, res) => {
  try {
    const { habitacion_id } = req.params;
    const sectorId = req.sectorUsuario;
    
    // Validar que la habitación pertenece al sector
    const habitacion = await Habitacion.findOne({
      where: { 
        id: habitacion_id,
        sector_id: sectorId
      },
      include: [
        { model: Sector, as: 'sector' },
        { model: TipoDeServicio, as: 'tipoServicio' }
      ]
    });
    
    if (!habitacion) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'No tiene acceso a esta habitación',
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
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [
              { model: Usuario, as: 'usuario' },
              { model: ObraSocial, as: 'obraSocial' }
            ]
          },
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario' }]
          },
          {
            model: TipoInternacion,
            as: 'tipoInternacion'
          }
        ]
      }],
      order: [['numero', 'ASC']]
    });
    
    // Obtener tipos de internación
    const tiposInternacion = await TipoInternacion.findAll({
      order: [['nombre', 'ASC']]
    });
    
    // Obtener otros sectores para derivación
    const sectoresParaDerivacion = await Sector.findAll({
      where: { id: { [Op.ne]: sectorId } },
      order: [['nombre', 'ASC']]
    });
    
    res.render('dashboard/medico/habitacion', {
      title: `Habitación ${habitacion.numero}`,
      user: req.user,
      habitacion,
      camas,
      tiposInternacion,
      sectoresParaDerivacion
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar habitación',
      user: req.user
    });
  }
};

// ============================================================================
// INTERNAR PACIENTE
// ============================================================================
const internarPaciente = async (req, res) => {
  try {
    const medicoId = req.user.medico_id;
    const sectorId = req.sectorUsuario;
    
    const {
      paciente_id,
      cama_id,
      tipo_internacion_id,
      diagnostico_ingreso,
      observaciones
    } = req.body;
    
    // Validar que la cama pertenece al sector
    const cama = await Cama.findByPk(cama_id, {
      include: [{
        model: Habitacion,
        as: 'habitacion',
        where: { sector_id: sectorId }
      }]
    });
    
    if (!cama) {
      return res.status(403).json({
        success: false,
        message: 'No puede internar en camas fuera de su sector'
      });
    }
    
    if (cama.estado !== 'Libre') {
      return res.status(400).json({
        success: false,
        message: `La cama no está disponible. Estado: ${cama.estado}`
      });
    }
    
    // Verificar que el paciente no tenga internación activa
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id,
        fecha_alta: null
      }
    });
    
    if (internacionActiva) {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya tiene una internación activa'
      });
    }
    
    // Crear internación (tu modelo ya valida todo)
    const internacion = await Internacion.create({
      paciente_id,
      cama_id,
      habitacion_id: cama.habitacion_id,
      medico_id: medicoId,
      tipo_internacion_id,
      diagnostico_ingreso,
      observaciones,
      fecha_inicio: new Date()
    });
    
    res.json({
      success: true,
      message: 'Paciente internado correctamente',
      data: {
        internacion_id: internacion.id,
        redirect: `/medico/sectores/habitacion/${cama.habitacion_id}`
      }
    });
    
  } catch (error) {
    console.error('Error al internar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al internar paciente'
    });
  }
};

// ============================================================================
// MARCAR DERIVACIÓN
// ============================================================================
const marcarDerivacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { internacion_id } = req.params;
    const sectorId = req.sectorUsuario;
    const { sector_destino_id, motivo } = req.body;
    
    const internacion = await Internacion.findByPk(internacion_id, {
      include: [{
        model: Cama,
        as: 'cama',
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: sectorId }
        }]
      }],
      transaction
    });
    
    if (!internacion) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene acceso a esta internación'
      });
    }
    
    const sectorDestino = await Sector.findByPk(sector_destino_id, { transaction });
    
    if (!sectorDestino) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sector destino no encontrado'
      });
    }
    
    // Cerrar internación y marcar derivación
    const observacionDerivacion = `\n\n[DERIVACIÓN]\nSector destino: ${sectorDestino.nombre} (ID: ${sector_destino_id})\nMotivo: ${motivo}\nFecha: ${new Date().toLocaleString('es-AR')}\nMédico: Dr. ${req.user.nombre} ${req.user.apellido}`;
    
    await internacion.update({
      fecha_alta: new Date(),
      observaciones: (internacion.observaciones || '') + observacionDerivacion
    }, { transaction });
    
    // Liberar cama
    await internacion.cama.update({
      estado: 'EnLimpieza'
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Derivación marcada a ${sectorDestino.nombre}. El médico de ese sector debe asignar cama.`,
      data: {
        redirect: `/medico/sectores`
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error al derivar:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// VER PENDIENTES
// ============================================================================
const verPendientesDeAsignar = async (req, res) => {
  try {
    const sectorId = req.sectorUsuario;
    
    const pendientes = await Internacion.findAll({
      where: {
        fecha_alta: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        observaciones: {
          [Op.like]: `%Sector destino%ID: ${sectorId}%`
        }
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario' },
            { model: ObraSocial, as: 'obraSocial' }
          ]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{ model: Sector, as: 'sector' }]
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{ model: Usuario, as: 'usuario' }]
        }
      ],
      order: [['fecha_alta', 'DESC']]
    });
    
    // Filtrar solo los que NO tienen nueva internación
    const pendientesReales = [];
    for (const derivacion of pendientes) {
      const tieneNuevaInternacion = await Internacion.findOne({
        where: {
          paciente_id: derivacion.paciente_id,
          fecha_alta: null
        }
      });
      
      if (!tieneNuevaInternacion) {
        pendientesReales.push(derivacion);
      }
    }
    
    res.render('dashboard/medico/pendientes', {
      title: 'Pacientes Pendientes de Asignar',
      user: req.user,
      pendientes: pendientesReales
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar pendientes',
      user: req.user
    });
  }
};

// ============================================================================
// DAR DE ALTA
// ============================================================================
const darDeAlta = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { internacion_id } = req.params;
    const { diagnostico_egreso, indicaciones } = req.body;
    
    const internacion = await Internacion.findByPk(internacion_id, {
      include: [{
        model: Cama,
        as: 'cama',
        include: [{
          model: Habitacion,
          as: 'habitacion',
          where: { sector_id: req.sectorUsuario }
        }]
      }],
      transaction
    });
    
    if (!internacion) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene acceso a esta internación'
      });
    }
    
    // Cerrar internación
    const observacionAlta = `\n\n[ALTA MÉDICA]\nDiagnóstico de egreso: ${diagnostico_egreso || 'No especificado'}\nIndicaciones: ${indicaciones || 'Ninguna'}\nFecha: ${new Date().toLocaleString('es-AR')}`;
    
    await internacion.update({
      fecha_alta: new Date(),
      observaciones: (internacion.observaciones || '') + observacionAlta
    }, { transaction });
    
    // Liberar cama
    await internacion.cama.update({
      estado: 'EnLimpieza'
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Paciente dado de alta correctamente',
      data: {
        redirect: `/medico/sectores/habitacion/${internacion.cama.habitacion_id}`
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error al dar de alta:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  renderMiSector,
  renderHabitacion,
  internarPaciente,
  marcarDerivacion,
  verPendientesDeAsignar,
  darDeAlta
};