const jwt = require('jsonwebtoken');
const { Usuario, Administrativo, Enfermero, Medico, Rol } = require('../models');

// MIDDLEWARE DE AUTENTICACIÓN JWT
const authMiddleware = async (req, res, next) => {
  try {
    //  PASO 1: Obtener token del header o cookie
    let token = null;

    // Opción 1: Header Authorization (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    
    // Opción 2: Cookie (si usas cookies para el token)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Opción 3: Query string (solo para desarrollo/testing)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // Si no hay token
    if (!token) {
      // Si es una petición de API, devolver JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'No se proporcionó token de autenticación',
          redirect: '/auth/login'
        });
      }
      
      // Si es una petición web, redirigir
      return res.redirect('/auth/login?reason=no_token');
    }

    //  PASO 2: Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital-secret-jwt');

    //  El token debe tener al menos: { usuario_id, rol }
    if (!decoded.usuario_id) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o mal formado',
          action: 'logout_and_redirect',
          redirectTo: '/auth/login',
          reason: 'invalid_token'
        });
      }
      
      return res.redirect('/auth/login?reason=invalid_token');
    }

    //  PASO 3: Buscar usuario en la base de datos
    const usuario = await Usuario.findByPk(decoded.usuario_id, {
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!usuario) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      return res.redirect('/auth/login?reason=user_not_found');
    }

    // Verificar que el usuario esté activo
    if (usuario.estado !== 'Activo') {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Usuario ${usuario.estado}. Contacte al administrador.`
        });
      }
      
      return res.redirect(`/auth/login?reason=user_${usuario.estado.toLowerCase()}`);
    }

    //  PASO 4: Determinar el tipo de usuario (Administrativo, Enfermero, Médico)
    let tipoUsuario = decoded.rol || null; // Usar el rol del token si existe
    let idTipoUsuario = decoded.id_tipo || null;

    // Si no viene el rol en el token o necesitamos el ID, buscar en las tablas
    if (!tipoUsuario || !idTipoUsuario) {
      // Buscar en administrativos
      const admin = await Administrativo.findOne({
        where: { usuario_id: usuario.id }
      });
      
      if (admin) {
        tipoUsuario = 'ADMINISTRATIVO';
        idTipoUsuario = admin.id;
      }

      // Si no es administrativo, buscar en enfermeros
      if (!tipoUsuario) {
        const enfermero = await Enfermero.findOne({
          where: { usuario_id: usuario.id }
        });

        if (enfermero) {
          tipoUsuario = 'ENFERMERO';
          idTipoUsuario = enfermero.id;
        }
      }

      // Si no es enfermero, buscar en médicos
      if (!tipoUsuario) {
        const medico = await Medico.findOne({
          where: { usuario_id: usuario.id }
        });

        if (medico) {
          tipoUsuario = 'MEDICO';
          idTipoUsuario = medico.id;
        }
      }
    }

    // Si no se encontró el tipo de usuario
    if (!tipoUsuario || !idTipoUsuario) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no tiene un rol válido asignado'
        });
      }
      
      return res.redirect('/auth/login?reason=invalid_role');
    }

    //  PASO 5: Calcular rol_ruta (la ruta correcta para el dashboard)
    const rol_ruta = tipoUsuario === 'ADMINISTRATIVO' ? 'admin' : tipoUsuario.toLowerCase();

    //  PASO 6: Poblar req.user con toda la información necesaria
    req.user = {
      // IDs necesarios para el controller
      id: idTipoUsuario,                    // ID en tabla administrativos/enfermeros/medicos
      usuario_id: usuario.id,               // ID en tabla usuarios
      
      // Datos del usuario
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      
      // Rol y tipo
      rol: tipoUsuario,                     // 'ADMINISTRATIVO', 'ENFERMERO', 'MEDICO'
      rol_id: usuario.rol_principal_id,     // ID del rol en tabla roles
      rol_nombre: usuario.rol_principal?.nombre || 'Desconocido',
      rol_ruta: rol_ruta,                   //  SIEMPRE incluir esto: 'admin', 'medico', 'enfermero'
      
      // Estado
      estado: usuario.estado,
      
      // Token original (por si lo necesitas)
      token: token
    };

    //  PASO 7: Guardar en sesión también (para vistas)
    req.session = req.session || {};
    req.session.user = req.user;
    
    //  PASO 8: Pasar a res.locals para que las vistas puedan acceder
    res.locals.user = req.user;

    //  PASO 9: Logging (opcional, solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Usuario autenticado:', {
        usuario_id: req.user.usuario_id,
        nombre: req.user.nombre,
        rol: req.user.rol,
        rol_ruta: req.user.rol_ruta,
        id_tipo: req.user.id
      });
    }

    //  PASO 10: Continuar al siguiente middleware
    next();

  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);

    // Errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          redirect: '/auth/login'
        });
      }
      
      return res.redirect('/auth/login?reason=invalid_token');
    }

    if (error.name === 'TokenExpiredError') {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado. Por favor, inicie sesión nuevamente.',
          redirect: '/auth/login'
        });
      }
      
      return res.redirect('/auth/login?reason=token_expired');
    }

    // Error genérico
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        redirect: '/auth/login'
      });
    }
    
    return res.redirect('/auth/login?reason=auth_error');
  }
};

//  MIDDLEWARE ADICIONAL: VERIFICAR ROL
const requireRole = (rolesPermitidos) => {
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

    if (!rolesPermitidos.includes(req.user.rol)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
        });
      }
      
      return res.status(403).render('error', {
        message: 'Acceso Denegado',
        error: { status: 403 },
        details: `Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        user: req.user
      });
    }

    next();
  };
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;