
const { Habitacion, Medico, Cama, Internacion, Sector } = require('../models');

/**
 * Middleware: Verificar que el usuario tiene un sector asignado
 * - Administrativos y directores pueden ver todos los sectores
 * - Médicos y enfermeros SOLO ven su sector
 */
const verificarSectorUsuario = async (req, res, next) => {
  try {
    const user = req.user;
    
    // El administrativo puede ver TODO
    if (user.rol === 'ADMINISTRATIVO') {
      req.puedeverTodosSectores = true;
      req.sectorUsuario = null; // No tiene restricción
      return next();
    }
    
    // Médicos y enfermeros SOLO su sector
    if (!user.sector_id) {
      return res.status(403).render('error', {
        title: 'Sin Sector Asignado',
        message: 'No tiene un sector asignado. Contacte al administrador para que le asignen uno.',
        error: { status: 403 },
        user: req.user
      });
    }
    
    // Verificar que el sector existe
    const sector = await Sector.findByPk(user.sector_id);
    if (!sector) {
      return res.status(403).render('error', {
        title: 'Sector No Válido',
        message: 'El sector asignado no existe en el sistema.',
        error: { status: 403 },
        user: req.user
      });
    }
    
    req.sectorUsuario = user.sector_id;
    req.puedeverTodosSectores = false;
    req.nombreSector = sector.nombre;
    next();
    
  } catch (error) {
    console.error('Error en middleware de sector:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación de sector' 
    });
  }
};

/**
 * Middleware factory: Verificar que un recurso específico pertenece al sector del usuario
 * @param {string} modeloNombre - 'habitacion', 'cama', 'internacion'
 */
const verificarRecursoDelSector = (modeloNombre) => {
  return async (req, res, next) => {
    // Si puede ver todos los sectores, no necesita validación
    if (req.puedeverTodosSectores) {
      return next();
    }
    
    try {
      const { id } = req.params;
      let recurso;
      let perteneceAlSector = false;
      
      switch(modeloNombre) {
        case 'habitacion':
          recurso = await Habitacion.findByPk(id);
          if (recurso) {
            perteneceAlSector = recurso.sector_id === req.sectorUsuario;
          }
          break;
          
        case 'cama':
          recurso = await Cama.findByPk(id, {
            include: [{ 
              model: Habitacion, 
              as: 'habitacion',
              attributes: ['sector_id']
            }]
          });
          if (recurso && recurso.habitacion) {
            perteneceAlSector = recurso.habitacion.sector_id === req.sectorUsuario;
          }
          break;
          
        case 'internacion':
          recurso = await Internacion.findByPk(id, {
            include: [{
              model: Cama,
              as: 'cama',
              include: [{
                model: Habitacion,
                as: 'habitacion',
                attributes: ['sector_id']
              }]
            }]
          });
          if (recurso && recurso.cama && recurso.cama.habitacion) {
            perteneceAlSector = recurso.cama.habitacion.sector_id === req.sectorUsuario;
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de recurso no válido'
          });
      }
      
      if (!recurso) {
        return res.status(404).json({ 
          success: false, 
          message: 'Recurso no encontrado' 
        });
      }
      
      if (!perteneceAlSector) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene acceso a este recurso. Solo puede acceder a recursos de su sector.' 
        });
      }
      
      // Adjuntar el recurso al request para usarlo en el controller si es necesario
      req.recursoValidado = recurso;
      next();
      
    } catch (error) {
      console.error('Error verificando recurso del sector:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error de validación de acceso' 
      });
    }
  };
};

/**
 * Middleware: Verificar que el paciente a internar no tiene internación activa
 */
const verificarPacienteSinInternacionActiva = async (req, res, next) => {
  try {
    const { paciente_id } = req.body;
    
    if (!paciente_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente requerido'
      });
    }
    
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: paciente_id,
        fecha_alta: null
      }
    });
    
    if (internacionActiva) {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya tiene una internación activa. Debe darle el alta antes de crear una nueva internación.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error verificando internación activa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado del paciente'
    });
  }
};
// LO USO EN LAS NOTIFICACIONES DE EMERGENCIA 
const verificarMedicoEmergencias = async (req, res, next) => {
  try {
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico || medico.sector?.nombre !== 'Emergencias') {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
      }
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'Solo médicos de Emergencias',
        user: req.user
      });
    }
    
    req.medico = medico;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  verificarSectorUsuario, 
  verificarRecursoDelSector,
  verificarPacienteSinInternacionActiva,
  verificarMedicoEmergencias 
};