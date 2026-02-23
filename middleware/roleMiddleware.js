/**
 * Middleware para verificación de roles de usuario
 * Permite controlar el acceso a rutas según el rol del usuario
 */

/**
 * Verificar que el usuario tenga uno de los roles permitidos
 * @param {...string} rolesPermitidos - Roles que pueden acceder (ej: 'MEDICO', 'ENFERMERO', 'ADMINISTRATIVO')
 * @returns {Function} Middleware function
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      // Si es una petición API, devolver JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado. Por favor inicie sesión.'
        });
      }
      
      // Si es web, redirigir al login
      return res.redirect('/auth/login?reason=not_authenticated');
    }

    // Verificar que el usuario tenga un rol asignado
    if (!req.user.rol) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado'
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: 'Su usuario no tiene un rol asignado. Contacte al administrador.',
        user: req.user
      });
    }

    // Verificar que el rol del usuario esté en los roles permitidos
    if (!rolesPermitidos.includes(req.user.rol)) {
      // Logging para seguridad
      console.warn(`⚠️ Acceso denegado: Usuario ${req.user.usuario_id} (${req.user.rol}) intentó acceder a ${req.path} (requiere: ${rolesPermitidos.join(' o ')})`);
      
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
          rol_actual: req.user.rol,
          roles_requeridos: rolesPermitidos
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: `Esta función requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}. Su rol actual es: ${req.user.rol}.`,
        user: req.user
      });
    }

    // Usuario tiene el rol correcto, continuar
    next();
  };
};

/**
 * Verificar que el usuario NO tenga ciertos roles (útil para excluir roles)
 * @param {...string} rolesExcluidos - Roles que NO pueden acceder
 * @returns {Function} Middleware function
 */
const excluirRol = (...rolesExcluidos) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }
      
      return res.redirect('/auth/login');
    }

    if (rolesExcluidos.includes(req.user.rol)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado para el rol: ${req.user.rol}`
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: `Esta función no está disponible para su rol: ${req.user.rol}`,
        user: req.user
      });
    }

    next();
  };
};

/**
 * Verificar múltiples condiciones de rol (AND/OR)
 * @param {Object} condiciones - { roles: [...], requireAll: boolean }
 * @returns {Function} Middleware function
 */
const verificarCondicionesRol = (condiciones) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }
      
      return res.redirect('/auth/login');
    }

    const { roles, requireAll = false } = condiciones;

    let permitido = false;

    if (requireAll) {
      // AND: El usuario debe tener TODOS los roles (poco común)
      permitido = roles.every(rol => req.user.rol === rol);
    } else {
      // OR: El usuario debe tener AL MENOS UNO de los roles (más común)
      permitido = roles.includes(req.user.rol);
    }

    if (!permitido) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere: ${roles.join(requireAll ? ' y ' : ' o ')}`
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: `Se requiere: ${roles.join(requireAll ? ' y ' : ' o ')}`,
        user: req.user
      });
    }

    next();
  };
};

/**
 * Verificar que el usuario sea el dueño del recurso O tenga un rol administrativo
 * @param {Function} getResourceOwnerId - Función que retorna el ID del dueño del recurso
 * @param {Array} rolesAdministrativos - Roles que pueden acceder sin ser dueños
 * @returns {Function} Middleware function
 */
const verificarPropiedadOAdmin = (getResourceOwnerId, rolesAdministrativos = ['ADMINISTRATIVO']) => {
  return async (req, res, next) => {
    if (!req.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }
      
      return res.redirect('/auth/login');
    }

    // Si es un rol administrativo, permitir acceso
    if (rolesAdministrativos.includes(req.user.rol)) {
      return next();
    }

    try {
      // Obtener el ID del dueño del recurso
      const ownerId = await getResourceOwnerId(req);

      // Verificar si el usuario es el dueño
      if (req.user.id === ownerId || req.user.usuario_id === ownerId) {
        return next();
      }

      // No es el dueño ni admin
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso'
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: 'No tiene permisos para acceder a este recurso',
        user: req.user
      });

    } catch (error) {
      console.error('Error en verificarPropiedadOAdmin:', error);
      
      if (req.path.startsWith('/api/')) {
        return res.status(500).json({
          success: false,
          message: 'Error al verificar permisos'
        });
      }
      
      return res.status(500).render('error', {
        message: 'Error del Servidor',
        error: { status: 500 },
        user: req.user
      });
    }
  };
};

/**
 * Middleware que adjunta información de permisos al objeto request
 * Útil para vistas que necesitan mostrar/ocultar elementos según el rol
 */
const adjuntarPermisos = (req, res, next) => {
  if (req.user) {
    req.permisos = {
      esMedico: req.user.rol === 'MEDICO',
      esEnfermero: req.user.rol === 'ENFERMERO',
      esAdministrativo: req.user.rol === 'ADMINISTRATIVO',
      puedeCrearOrdenes: req.user.rol === 'MEDICO',
      puedeEjecutarOrdenes: req.user.rol === 'ENFERMERO',
      puedeVerTodo: req.user.rol === 'ADMINISTRATIVO',
      sector_id: req.user.sector_id || null,
      sector_nombre: req.user.sector_nombre || null
    };

    // Hacer disponible en las vistas
    res.locals.permisos = req.permisos;
  }

  next();
};

module.exports = {
  verificarRol,
  excluirRol,
  verificarCondicionesRol,
  verificarPropiedadOAdmin,
  adjuntarPermisos,
  // Aliases por compatibilidad
  requireRole: verificarRol
};