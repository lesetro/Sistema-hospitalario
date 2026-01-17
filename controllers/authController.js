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
        unauthorized: 'Debes iniciar sesión para acceder a esta página',
        password_reset: 'Contraseña recuperada exitosamente. Por favor inicia sesión con tu nueva contraseña.'
      };
      
      const messageType = req.query.logout ? 'success' : 
                         req.query.password_reset ? 'success' :
                         req.query.reason ? 'warning' : null;
      const message = messages[req.query.logout || req.query.password_reset || req.query.reason] || null;
      
      res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: null,
        message: message,
        messageType: messageType
      });
      
    } catch (error) {
      console.error('❌ Error en getLogin:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar la página de login',
        error: error
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
        rol_ruta: rol_ruta,
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

      console.log(`✅ Login exitoso: ${usuario.email} (${tipoUsuario}) → Redirigiendo a /${rol_ruta}`);

      // Detectar si es petición AJAX o formulario normal
      const isAjax = req.xhr || req.headers.accept?.indexOf('json') > -1;

      if (isAjax) {
        return res.status(200).json({
          success: true,
          message: 'Inicio de sesión exitoso',
          token,
          user: userData,
          redirect: `/${rol_ruta}` 
        });
      } else {
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
        return res.status(500).render('error', {
          title: 'Error',
          message: 'Error al procesar el inicio de sesión',
          error: error
        });
      }
    }
  },

  // ==========================================
  // VERIFICAR TOKEN
  // ==========================================
  verifyToken: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
          redirectTo: '/auth/login',
          reason: 'token_invalid'
        });
      }

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
      res.clearCookie('token');

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Error al destruir sesión:', err);
          }
        });
      }

      console.log('✅ Logout exitoso');

      const isAjax = req.xhr || req.headers.accept?.indexOf('json') > -1;

      if (isAjax) {
        return res.status(200).json({
          success: true,
          message: 'Sesión cerrada correctamente',
          redirect: '/auth/login?logout=success'
        });
      } else {
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
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar la página de registro',
        error: error
      });
    }
  },

  // ==========================================
  // PROCESAR REGISTRO
  // ==========================================
  register: async (req, res) => {
    try {
      const { nombre, apellido, dni, email, password, telefono, fecha_nacimiento, sexo } = req.body;

      if (!nombre || !apellido || !dni || !email || !password) {
        return res.status(400).render('auth/register', {
          title: 'Registrarse',
          error: 'Todos los campos obligatorios deben ser completados'
        });
      }

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

      const rolPaciente = await Rol.findOne({ where: { nombre: 'Paciente' } });
      if (!rolPaciente) {
        return res.status(500).render('error', {
          title: 'Error',
          message: 'Error de configuración del sistema',
          error: new Error('Rol Paciente no encontrado')
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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
        estado: 'Pendiente'
      });

      await Paciente.create({
        usuario_id: nuevoUsuario.id,
        fecha_ingreso: new Date(),
        estado: 'Activo'
      });

      console.log(`✅ Nuevo usuario registrado: ${nuevoUsuario.email}`);

      return res.redirect('/auth/login?registered=success');

    } catch (error) {
      console.error('❌ Error en registro:', error);
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Error al procesar el registro',
        error: error
      });
    }
  },

  // ==========================================
  // MOSTRAR FORMULARIO DE RECUPERAR CONTRASEÑA
  // ==========================================
  getRecuperarContrasena: async (req, res) => {
    try {
      const success = req.query.success ? 'Contraseña actualizada exitosamente. Por favor inicia sesión con tu nueva contraseña.' : null;

      res.render('auth/recuperar-contrasena', {
        title: 'Recuperar Contraseña',
        success: success,
        error: null,
        email: ''
      });
    } catch (error) {
      console.error('❌ Error en getRecuperarContrasena:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar la página de recuperación',
        error: error
      });
    }
  },

  // ==========================================
  // PROCESAR RECUPERAR CONTRASEÑA
  // ==========================================
  postRecuperarContrasena: async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).render('auth/recuperar-contrasena', {
          title: 'Recuperar Contraseña',
          error: 'El email y la nueva contraseña son requeridos',
          success: null,
          email: email || ''
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).render('auth/recuperar-contrasena', {
          title: 'Recuperar Contraseña',
          error: 'La contraseña debe tener al menos 6 caracteres',
          success: null,
          email: email
        });
      }

      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() }
      });

      if (!usuario) {
        console.log(`⚠️ Intento de recuperación con email no registrado: ${email}`);
        return res.status(200).render('auth/recuperar-contrasena', {
          title: 'Recuperar Contraseña',
          success: 'Si el email existe en nuestro sistema, la contraseña ha sido actualizada. Por favor, inicia sesión.',
          error: null,
          email: ''
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await usuario.update({
        password: hashedPassword
      });

      console.log(`✅ Contraseña recuperada: ${usuario.email}`);

      return res.redirect('/auth/login?password_reset=success');

    } catch (error) {
      console.error('❌ Error en postRecuperarContrasena:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al procesar la solicitud',
        error: error
      });
    }
  },

  // ==========================================
  // RENDERIZAR PERFIL (CON LAYOUT DINÁMICO)
  // ==========================================
  renderPerfil: async (req, res) => {
    try {
      // Construir includes dinámicamente según el rol
      const includes = [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ];

      // Agregar includes específicos según el rol del usuario
      switch(req.user.rol) {
        case 'MEDICO':
          includes.push({
            model: Medico,
            as: 'medico',
            include: [
              {
                model: require('../models').Especialidad,
                as: 'especialidad',
                attributes: ['id', 'nombre', 'descripcion']
              },
              {
                model: require('../models').Sector,
                as: 'sector',
                attributes: ['id', 'nombre', 'descripcion']
              }
            ]
          });
          break;

        case 'ENFERMERO':
          includes.push({
            model: Enfermero,
            as: 'enfermero',
            include: [
              {
                model: require('../models').Sector,
                as: 'sector',
                attributes: ['id', 'nombre', 'descripcion']
              }
            ]
          });
          break;

        case 'ADMINISTRATIVO':
          includes.push({
            model: Administrativo,
            as: 'administrativo',
            include: [
              {
                model: require('../models').Sector,
                as: 'sector',
                attributes: ['id', 'nombre', 'descripcion']
              }
            ]
          });
          break;

        case 'PACIENTE':
          includes.push({
            model: Paciente,
            as: 'paciente',
            include: [
              {
                model: require('../models').ObraSocial,
                as: 'obraSocial',
                attributes: ['id', 'nombre']
              }
            ]
          });
          break;
      }

      const usuario = await Usuario.findByPk(req.user.usuario_id, {
        include: includes,
        attributes: { exclude: ['password'] }
      });

      if (!usuario) {
        return res.redirect('/auth/login?reason=session_expired');
      }

      // Calcular edad
      const edad = usuario.fecha_nacimiento ? 
        Math.floor((new Date() - new Date(usuario.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : 
        null;

      // Preparar datos adicionales según el rol
      let datosAdicionales = {};
      
      if (req.user.rol === 'MEDICO' && usuario.medico) {
        datosAdicionales = {
          matricula: usuario.medico.matricula,
          especialidad: usuario.medico.especialidad?.nombre,
          sector: usuario.medico.sector?.nombre
        };
      } else if (req.user.rol === 'ENFERMERO' && usuario.enfermero) {
        datosAdicionales = {
          matricula: usuario.enfermero.matricula,
          nivel: usuario.enfermero.nivel,
          sector: usuario.enfermero.sector?.nombre,
          fecha_ingreso: usuario.enfermero.fecha_ingreso
        };
      } else if (req.user.rol === 'ADMINISTRATIVO' && usuario.administrativo) {
        datosAdicionales = {
          sector: usuario.administrativo.sector?.nombre,
          responsabilidad: usuario.administrativo.responsabilidad
        };
      } else if (req.user.rol === 'PACIENTE' && usuario.paciente) {
        datosAdicionales = {
          obra_social: usuario.paciente.obraSocial?.nombre || 'Sin obra social',
          fecha_ingreso: usuario.paciente.fecha_ingreso
        };
      }

      // ✅ MAPEAR LAYOUT DINÁMICO SEGÚN EL ROL
      const layoutMap = {
        'MEDICO': 'layouts/layoutMedico',
        'ENFERMERO': 'layouts/layoutEnfermero',
        'ADMINISTRATIVO': 'layouts/layoutAdministrativo',
        'PACIENTE': 'layouts/layoutPaciente'
      };

      const layout = layoutMap[req.user.rol] || 'layouts/layout';

      console.log(`✅ Renderizando perfil de: ${usuario.email} (${req.user.rol}) con layout: ${layout}`);

      res.render('auth/perfil', {
        title: 'Mi Perfil',
        user: {
          ...usuario.toJSON(),
          edad,
          ...datosAdicionales
        },
        rol: req.user.rol,
        rol_ruta: req.user.rol_ruta,
        layout: layout  // ✅ AGREGAR LAYOUT DINÁMICO
      });

    } catch (error) {
      console.error('❌ Error al renderizar perfil:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el perfil',
        error: error
      });
    }
  },

  // ==========================================
  // OBTENER PERFIL (API)
  // ==========================================
  obtenerPerfil: async (req, res) => {
    try {
      const includes = [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ];

      // Agregar includes específicos según el rol
      switch(req.user.rol) {
        case 'MEDICO':
          includes.push({
            model: Medico,
            as: 'medico',
            include: [
              { model: require('../models').Especialidad, as: 'especialidad' },
              { model: require('../models').Sector, as: 'sector' }
            ]
          });
          break;

        case 'ENFERMERO':
          includes.push({
            model: Enfermero,
            as: 'enfermero',
            include: [
              { model: require('../models').Sector, as: 'sector' }
            ]
          });
          break;

        case 'ADMINISTRATIVO':
          includes.push({
            model: Administrativo,
            as: 'administrativo',
            include: [
              { model: require('../models').Sector, as: 'sector' }
            ]
          });
          break;

        case 'PACIENTE':
          includes.push({
            model: Paciente,
            as: 'paciente',
            include: [
              { model: require('../models').ObraSocial, as: 'obraSocial' }
            ]
          });
          break;
      }

      const usuario = await Usuario.findByPk(req.user.usuario_id, {
        include: includes,
        attributes: { exclude: ['password'] }
      });

      if (!usuario) {
        return res.status(404).json({ 
          success: false,
          message: 'Usuario no encontrado' 
        });
      }

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al obtener perfil' 
      });
    }
  },

  // ==========================================
  // ACTUALIZAR PERFIL
  // ==========================================
  actualizarPerfil: async (req, res) => {
    try {
      const { telefono, email } = req.body;
      
      const usuario = await Usuario.findByPk(req.user.usuario_id);

      if (!usuario) {
        return res.status(404).json({ 
          success: false,
          message: 'Usuario no encontrado' 
        });
      }

      // Verificar si el email ya está en uso por otro usuario
      if (email && email.toLowerCase().trim() !== usuario.email.toLowerCase()) {
        const emailExiste = await Usuario.findOne({
          where: { 
            email: email.toLowerCase().trim(),
            id: { [Op.ne]: usuario.id }
          }
        });

        if (emailExiste) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso por otro usuario'
          });
        }
      }

      // Actualizar datos
      const datosActualizar = {};
      
      if (telefono !== undefined) {
        datosActualizar.telefono = telefono.trim() || null;
      }
      
      if (email && email.toLowerCase().trim() !== usuario.email.toLowerCase()) {
        datosActualizar.email = email.toLowerCase().trim();
      }

      if (Object.keys(datosActualizar).length > 0) {
        await usuario.update(datosActualizar);
        console.log(`✅ Perfil actualizado: ${usuario.email}`);
      }

      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: {
          telefono: usuario.telefono,
          email: usuario.email
        }
      });

    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al actualizar perfil' 
      });
    }
  },

  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================
  cambiarPassword: async (req, res) => {
    try {
      const { password_actual, password_nueva, password_confirmacion } = req.body;

      // Validaciones
      if (!password_actual || !password_nueva || !password_confirmacion) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      if (password_nueva !== password_confirmacion) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas nuevas no coinciden'
        });
      }

      if (password_nueva.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }

      const usuario = await Usuario.findByPk(req.user.usuario_id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(password_actual, usuario.password);
      
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(password_nueva, 10);

      // Actualizar contraseña
      await usuario.update({ password: hashedPassword });

      console.log(`✅ Contraseña actualizada: ${usuario.email}`);

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });

    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña'
      });
    }
  }
};

module.exports = authController;