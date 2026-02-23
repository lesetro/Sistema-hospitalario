const jwt = require('jsonwebtoken');
const { Usuario, Administrativo, Enfermero, Medico, Rol, Sector } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // PASO 1: Obtener token
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // ✅ DETECCIÓN CORRECTA: usa originalUrl para ver la URL completa
    const isApiRequest = 
      req.originalUrl.includes('/api/') ||
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));

    if (!token) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'No se proporcionó token de autenticación',
          redirect: '/auth/login'
        });
      }
      return res.redirect('/auth/login?reason=no_token');
    }

    // PASO 2: Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital-secret-jwt');

    if (!decoded.usuario_id) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o mal formado',
          redirect: '/auth/login'
        });
      }
      res.clearCookie('token');
      return res.redirect('/auth/login?reason=invalid_token');
    }

    // PASO 3: Buscar usuario en DB
    const usuario = await Usuario.findByPk(decoded.usuario_id, {
      include: [{ model: Rol, as: 'rol_principal', attributes: ['id', 'nombre'] }]
    });

    if (!usuario) {
      // ✅ LIMPIAR COOKIE antes de redirigir (evita el loop)
      res.clearCookie('token');
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          redirect: '/auth/login'
        });
      }
      return res.redirect('/auth/login?reason=user_not_found');
    }

    if (usuario.estado !== 'Activo') {
      res.clearCookie('token');
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          message: `Usuario ${usuario.estado}. Contacte al administrador.`
        });
      }
      return res.redirect(`/auth/login?reason=user_${usuario.estado.toLowerCase()}`);
    }

    // PASO 4: Determinar tipo de usuario
    let tipoUsuario = decoded.rol || null;
    let idTipoUsuario = decoded.id_tipo || null;
    let sectorId = null;
    let sectorNombre = null;

    if (!tipoUsuario || !idTipoUsuario) {
      const admin = await Administrativo.findOne({ where: { usuario_id: usuario.id } });
      if (admin) { tipoUsuario = 'ADMINISTRATIVO'; idTipoUsuario = admin.id; }

      if (!tipoUsuario) {
        const enfermero = await Enfermero.findOne({
          where: { usuario_id: usuario.id },
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        });
        if (enfermero) {
          tipoUsuario = 'ENFERMERO';
          idTipoUsuario = enfermero.id;
          sectorId = enfermero.sector_id;
          sectorNombre = enfermero.sector?.nombre;
        }
      }

      if (!tipoUsuario) {
        const medico = await Medico.findOne({
          where: { usuario_id: usuario.id },
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        });
        if (medico) {
          tipoUsuario = 'MEDICO';
          idTipoUsuario = medico.id;
          sectorId = medico.sector_id;
          sectorNombre = medico.sector?.nombre;
        }
      }
    } else {
      if (tipoUsuario === 'ENFERMERO') {
        const enfermero = await Enfermero.findByPk(idTipoUsuario, {
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        });
        sectorId = enfermero?.sector_id;
        sectorNombre = enfermero?.sector?.nombre;
      } else if (tipoUsuario === 'MEDICO') {
        const medico = await Medico.findByPk(idTipoUsuario, {
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        });
        sectorId = medico?.sector_id;
        sectorNombre = medico?.sector?.nombre;
      }
    }

    if (!tipoUsuario || !idTipoUsuario) {
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no tiene un rol válido asignado'
        });
      }
      return res.redirect('/auth/login?reason=invalid_role');
    }

    // PASO 5: Calcular rol_ruta
    const rol_ruta = tipoUsuario === 'ADMINISTRATIVO' ? 'admin' : tipoUsuario.toLowerCase();

    // PASO 6: Poblar req.user
    req.user = {
      id: idTipoUsuario,
      usuario_id: usuario.id,
      medico_id: tipoUsuario === 'MEDICO' ? idTipoUsuario : null,
      enfermero_id: tipoUsuario === 'ENFERMERO' ? idTipoUsuario : null,
      administrativo_id: tipoUsuario === 'ADMINISTRATIVO' ? idTipoUsuario : null,
      sector_id: sectorId,
      sector_nombre: sectorNombre,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      rol: tipoUsuario,
      rol_id: usuario.rol_principal_id,
      rol_nombre: usuario.rol_principal?.nombre || 'Desconocido',
      rol_ruta: rol_ruta,
      estado: usuario.estado,
      token: token
    };

    req.session = req.session || {};
    req.session.user = req.user;
    res.locals.user = req.user;
    res.locals.nombreSector = req.user.sector_nombre || null;
    res.locals.sectorId = req.user.sector_id || null;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Usuario autenticado:', {
        usuario_id: req.user.usuario_id,
        nombre: req.user.nombre,
        rol: req.user.rol,
        sector_nombre: req.user.sector_nombre
      });
    }

    next();

  } catch (error) {

    const isApiRequest = 
      req.originalUrl.includes('/api/') ||
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));

    // ✅ TOKEN EXPIRADO: rechazar correctamente, no pasar como GUEST
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('token');
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
          redirect: '/auth/login?reason=session_expired'
        });
      }
      return res.redirect('/auth/login?reason=session_expired');
    }

    if (error.name === 'JsonWebTokenError') {
      res.clearCookie('token');
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          redirect: '/auth/login'
        });
      }
      return res.redirect('/auth/login?reason=invalid_token');
    }

    if (isApiRequest) {
      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    return res.redirect('/auth/login?reason=auth_error');
  }
};

const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.originalUrl.includes('/api/')) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      return res.redirect('/auth/login');
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      if (req.originalUrl.includes('/api/')) {
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
module.exports.verificarRol = requireRole;