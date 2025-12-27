const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Paciente, Medico, Enfermero, Administrativo, Rol } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// CONTROLADOR DE AUTENTICACIÓN
// ==========================================

const authController = {
  
  // ==========================================
  // MOSTRAR FORMULARIO DE LOGIN
  // ==========================================
  getLogin: async (req, res) => {
    try {
      // Si ya está autenticado, redirigir a su dashboard
      if (req.user && req.user.rol_ruta) {
        return res.redirect(`/${req.user.rol_ruta}`);
      }
      
      // Mensajes de query params
      const messages = {
        logout: 'Sesión cerrada correctamente',
        session_expired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        unauthorized: 'Debes iniciar sesión para acceder a esta página'
      };
      
      const messageType = req.query.logout ? 'success' : 
                         req.query.reason ? 'warning' : null;
      const message = messages[req.query.logout || req.query.reason] || null;
      
      res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: null,
        message: message,
        messageType: messageType
      });
      
    } catch (error) {
      console.error('❌ Error en getLogin:', error);
      res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: 'Error al cargar la página de login'
      });
    }
  },

  // ==========================================
  // PROCESAR LOGIN
  // ==========================================
  login: async (req, res) => {
    try {
      const { email, password, remember } = req.body;

      // Validar datos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
        include: [
          {
            model: Rol,
            as: 'rol_principal',
            attributes: ['id', 'nombre']
          }
        ]
      });

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar estado del usuario
      if (usuario.estado !== 'Activo') {
        return res.status(403).json({
          success: false,
          message: `Tu cuenta está ${usuario.estado.toLowerCase()}. Contacta al administrador.`
        });
      }

      // Determinar tipo de usuario (Administrativo, Medico, Enfermero, Paciente)
      let tipoUsuario = null;
      let idTipo = null;

      const administrativo = await Administrativo.findOne({ where: { usuario_id: usuario.id } });
      if (administrativo) {
        tipoUsuario = 'ADMINISTRATIVO';
        idTipo = administrativo.id;
      }

      if (!tipoUsuario) {
        const enfermero = await Enfermero.findOne({ where: { usuario_id: usuario.id } });
        if (enfermero) {
          tipoUsuario = 'ENFERMERO';
          idTipo = enfermero.id;
        }
      }

      if (!tipoUsuario) {
        const medico = await Medico.findOne({ where: { usuario_id: usuario.id } });
        if (medico) {
          tipoUsuario = 'MEDICO';
          idTipo = medico.id;
        }
      }

      if (!tipoUsuario) {
        const paciente = await Paciente.findOne({ where: { usuario_id: usuario.id } });
        if (paciente) {
          tipoUsuario = 'PACIENTE';
          idTipo = paciente.id;
        }
      }

      if (!tipoUsuario) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacta al administrador.'
        });
      }

      // CALCULAR ROL_RUTA SEGÚN TU ESTRUCTURA DE ARCHIVOS
      let rol_ruta;
      switch(tipoUsuario) {
        case 'ADMINISTRATIVO':
          rol_ruta = 'admin';
          break;
        case 'MEDICO':
          rol_ruta = 'medico';
          break;
        case 'ENFERMERO':
          rol_ruta = 'enfermero';
          break;
        case 'PACIENTE':
          rol_ruta = 'paciente';
          break;
        default:
          rol_ruta = 'admin';
      }

      // Preparar datos para el token
      const payload = {
        usuario_id: usuario.id,
        id_tipo: idTipo,
        rol: tipoUsuario,
        rol_ruta: rol_ruta, // Incluir en el token
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      };

      // Generar token JWT
      const expiresIn = remember ? '30d' : '24h';
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

      // Datos del usuario para la respuesta
      const userData = {
        id: idTipo,
        usuario_id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: tipoUsuario,
        rol_nombre: usuario.rol_principal?.nombre || tipoUsuario,
        rol_ruta: rol_ruta
      };

      // Configurar cookie HttpOnly
      const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: maxAge,
        sameSite: 'lax'
      });

      // Guardar en sesión
      req.session.user = userData;

      console.log(` Login exitoso: ${usuario.email} (${tipoUsuario}) → Redirigiendo a /${rol_ruta}`);

      // REDIRECCIÓN BACKEND DIRECTA (sin necesidad de JavaScript en frontend)
      // Detectar si es petición AJAX o formulario normal
      const isAjax = req.xhr || req.headers.accept?.indexOf('json') > -1;

      if (isAjax) {
        // Si es AJAX, enviar JSON
        return res.status(200).json({
          success: true,
          message: 'Inicio de sesión exitoso',
          token,
          user: userData,
          redirect: `/${rol_ruta}` 
        });
      } else {
        //  Si es formulario normal, REDIRIGIR DIRECTAMENTE
        return res.redirect(`/${rol_ruta}`);
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const isAjax = req.xhr || req.headers.accept?.indexOf('json') > -1;
      
      if (isAjax) {
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      } else {
        return res.render('auth/login', {
          title: 'Iniciar Sesión',
          error: 'Error al procesar el inicio de sesión'
        });
      }
    }
  },

  // ==========================================
  // VERIFICAR TOKEN (para endpoints /api/auth/verify)
  // ==========================================
  verifyToken: async (req, res) => {
    try {
      // El middleware authMiddleware ya validó el token y pobló req.user
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
          redirectTo: '/auth/login',
          reason: 'token_invalid'
        });
      }

      // Token válido, devolver datos del usuario
      return res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          usuario_id: req.user.usuario_id,
          nombre: req.user.nombre,
          apellido: req.user.apellido,
          email: req.user.email,
          rol: req.user.rol,
          rol_nombre: req.user.rol_nombre,
          rol_ruta: req.user.rol_ruta,
          estado: req.user.estado
        }
      });

    } catch (error) {
      console.error('❌ Error al verificar token:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar el token'
      });
    }
  },

  // ==========================================
  // LOGOUT
  // ==========================================
  logout: async (req, res) => {
    try {
      // Limpiar cookie
      res.clearCookie('token');

      // Destruir sesión
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Error al destruir sesión:', err);
          }
        });
      }

      console.log(' Logout exitoso');

      // Detectar si es petición AJAX
      const isAjax = req.xhr || req.headers.accept?.indexOf('json') > -1;

      if (isAjax) {
        return res.status(200).json({
          success: true,
          message: 'Sesión cerrada correctamente',
          redirect: '/auth/login?logout=success'
        });
      } else {
        // Redirección normal
        return res.redirect('/auth/login?logout=success');
      }

    } catch (error) {
      console.error('❌ Error en logout:', error);
      return res.redirect('/auth/login');
    }
  },

  // ==========================================
  // MOSTRAR FORMULARIO DE REGISTRO
  // ==========================================
  getRegister: async (req, res) => {
    try {
      res.render('auth/register', {
        title: 'Registrarse',
        error: null
      });
    } catch (error) {
      console.error('❌ Error en getRegister:', error);
      res.redirect('/auth/login');
    }
  },

  // ==========================================
  // PROCESAR REGISTRO
  // ==========================================
  register: async (req, res) => {
    try {
      const { nombre, apellido, dni, email, password, telefono, fecha_nacimiento, sexo } = req.body;

      // Validaciones básicas
      if (!nombre || !apellido || !dni || !email || !password) {
        return res.status(400).render('auth/register', {
          title: 'Registrarse',
          error: 'Todos los campos obligatorios deben ser completados'
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await Usuario.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase().trim() },
            { dni: dni.trim() }
          ]
        }
      });

      if (usuarioExistente) {
        return res.status(400).render('auth/register', {
          title: 'Registrarse',
          error: 'El email o DNI ya están registrados'
        });
      }

      // Buscar rol de Paciente
      const rolPaciente = await Rol.findOne({ where: { nombre: 'Paciente' } });
      if (!rolPaciente) {
        return res.status(500).render('auth/register', {
          title: 'Registrarse',
          error: 'Error de configuración del sistema. Contacta al administrador.'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const nuevoUsuario = await Usuario.create({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        telefono: telefono?.trim() || null,
        fecha_nacimiento: fecha_nacimiento || null,
        sexo: sexo || 'Otro',
        rol_principal_id: rolPaciente.id,
        estado: 'Pendiente' // Requiere activación por admin
      });

      // Crear registro en tabla Pacientes
      await Paciente.create({
        usuario_id: nuevoUsuario.id,
        fecha_ingreso: new Date(),
        estado: 'Activo'
      });

      console.log(` Nuevo usuario registrado: ${nuevoUsuario.email}`);

      // Redirigir al login con mensaje
      return res.redirect('/auth/login?registered=success');

    } catch (error) {
      console.error('❌ Error en registro:', error);
      return res.status(500).render('auth/register', {
        title: 'Registrarse',
        error: 'Error al procesar el registro. Intenta nuevamente.'
      });
    }
  },

  // ==========================================
  // RECUPERAR CONTRASEÑA (placeholder)
  // ==========================================
  getRecuperarContrasena: async (req, res) => {
    try {
      res.render('auth/recuperar-contrasena', {
        title: 'Recuperar Contraseña',
        message: null,
        error: null
      });
    } catch (error) {
      console.error('❌ Error en getRecuperarContrasena:', error);
      res.redirect('/auth/login');
    }
  },

  postRecuperarContrasena: async (req, res) => {
    try {
      const { email } = req.body;

      // TODO: Implementar lógica de envío de email
      
      res.render('auth/recuperar-contrasena', {
        title: 'Recuperar Contraseña',
        message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña.',
        error: null
      });

    } catch (error) {
      console.error('❌ Error en postRecuperarContrasena:', error);
      res.render('auth/recuperar-contrasena', {
        title: 'Recuperar Contraseña',
        message: null,
        error: 'Error al procesar la solicitud'
      });
    }
  }
};

module.exports = authController;