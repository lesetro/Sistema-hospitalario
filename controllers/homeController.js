const { Noticia, Especialidad, Reclamo, Usuario } = require('../models');
const { Op } = require('sequelize');

const homeController = {
  // DashboardHome público
  getHome: async (req, res) => {
    try {
      console.log(" Cargando DashboardHome público...");
      
      //  Obtener usuario desde sesión o middleware
      const user = req.session?.user || req.user || null;
      
      console.log("👤 Usuario en sesión:", user ? `${user.nombre} (${user.rol})` : 'No autenticado');

      const fechaLimite = new Date();
      fechaLimite.setFullYear(fechaLimite.getFullYear() - 3);

      // noticias de los ultimos tres años 
      const noticias = await Noticia.findAll({
        where: {
          fecha: { [Op.gte]: fechaLimite }
        },
          limit: 4,
          order: [['fecha', 'DESC']],
          include: [{
            model: Usuario,
              as: 'autor',
            attributes: ['nombre', 'apellido']
          }]
      });

      const especialidades = await Especialidad.findAll({
        limit: 6,
        order: [['nombre', 'ASC']]
      });

      res.render("home/dashboard-home", {
        title: "Hospital Central - Sistema de Gestión",
        noticias,
        especialidades,
        user: user  //  Pasar usuario a la vista
      });

    } catch (error) {
      console.error("❌ Error al cargar DashboardHome:", error);
      res.render("home/dashboard-home", {
        title: "Hospital Central - Sistema de Gestión",
        noticias: [],
        especialidades: [],
        user: req.session?.user || req.user || null
      });
    }
  },

  // GET /quienes-somos
  getQuienesSomos: (req, res) => {
    res.render("home/quienes-somos", {
      title: "Quiénes Somos - Hospital Central",
      user: req.session?.user || req.user || null
    });
  },

  // GET /especialidades
  getEspecialidades: async (req, res) => {
    try {
      const especialidades = await Especialidad.findAll({
        order: [['nombre', 'ASC']]
      });

      res.render("home/especialidades", {
        title: "Especialidades Médicas - Hospital Central",
        especialidades,
        user: req.session?.user || req.user || null
      });
    } catch (error) {
      console.error("❌ Error al cargar especialidades:", error);
      res.render("home/especialidades", {
        title: "Especialidades Médicas - Hospital Central",
        especialidades: [],
        user: req.session?.user || req.user || null
      });
    }
  },

  // GET /reclamos
  getReclamos: (req, res) => {
    res.render("home/reclamos", {
      title: "Reclamos y Consultas - Hospital Central", 
      user: req.session?.user || req.user || null,
      success: req.query.success,
      error: req.query.error
    });
  },

  // POST /reclamos
  postReclamos: async (req, res) => {
    try {
      const { nombre, email, tipo, mensaje } = req.body;

      // Buscar si el usuario ya existe por email
      let usuario = await Usuario.findOne({ where: { email } });

      // Si no existe, crear usuario temporal
      if (!usuario) {
        usuario = await Usuario.create({
          nombre,
          email,
          dni: `TEMP-${Date.now()}`, // DNI temporal único
          apellido: 'Reclamo',
          fecha_nacimiento: new Date('2000-01-01'),
          sexo: 'Otro',
          rol_principal_id: 4, // Paciente
          estado: 'Temporal',
          password: require('bcryptjs').hashSync('temp123', 10)
        });
      }

      // Crear el reclamo
      await Reclamo.create({
        usuario_id: usuario.id,
        texto: `Tipo: ${tipo}\n\nMensaje: ${mensaje}\n\nContacto: ${email}`,
        fecha: new Date(),
        estado: 'Pendiente'
      });

      res.redirect('/reclamos?success=true');
    } catch (error) {
      console.error("❌ Error al crear reclamo:", error);
      res.redirect('/reclamos?error=true');
    }
  },
  getMiDashboard: async(req, res) => {
  try {
    const user = req.session?.user || req.user || null;
    
    if (!user) {
      return res.redirect('/auth/login');
    }

    console.log('🏠 Redirigiendo a dashboard:', user.rol_ruta);

    // Redirigir según rol
    const dashboards = {
      'admin': '/admin',
      'medico': '/medico/dashboard',
      'enfermero': '/enfermero/dashboard',
      'paciente': '/paciente/dashboard'
    };

    const dashboardUrl = dashboards[user.rol_ruta] || '/admin';
    res.redirect(dashboardUrl);

  } catch (error) {
    console.error('Error en getMiDashboard:', error);
    res.redirect('/');
  }
}

};


module.exports = homeController;