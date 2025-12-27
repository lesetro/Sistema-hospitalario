const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./database/db");
const app = express();

// ========================================
// CONFIGURACIÓN DE MIDDLEWARE
// ========================================

app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser (IMPORTANTE para leer cookies del JWT)
app.use(cookieParser());

//  Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_de_sesion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en producción con HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

//  Middleware para verificar JWT y pasar usuario a vistas
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    res.locals.user = null;
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital-secret-jwt');
    
    //  Asegurar que tenga la propiedad rol_ruta
    if (decoded.rol && !decoded.rol_ruta) {
      decoded.rol_ruta = decoded.rol === 'ADMINISTRATIVO' ? 'admin' : decoded.rol.toLowerCase();
    }
    
    res.locals.user = decoded;
    req.user = decoded;
    req.session.user = decoded; // También guardarlo en sesión
    
  } catch (error) {
    console.error('❌ Error verificando token:', error.message);
    res.clearCookie('token');
    res.locals.user = null;
    req.user = null;
  }
  
  next();
};

app.use(verifyToken);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - User: ${res.locals.user?.email || 'Guest'}`);
  next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// CONFIGURACIÓN DE PUG
// ========================================
app.set("view engine", "pug");
const viewsPath = path.join(__dirname, "views");
app.set("views", viewsPath);
console.log(` Directorio de vistas: ${viewsPath}`);

//  Helper para obtener ruta del dashboard según rol
app.locals.getRutaDashboard = function(rol) {
  const rutas = {
    'ADMINISTRATIVO': '/admin',
    'MEDICO': '/medico/dashboard',
    'ENFERMERO': '/enfermero/dashboard',
    'PACIENTE': '/paciente/dashboard'
  };
  return rutas[rol] || '/';
};

// ========================================
// ROUTERS
// ========================================
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const admisionRoutes = require("./routes/admisionRoutes");
const camasRoutes = require('./routes/camasRoutes');
const internacionRoutes = require('./routes/internacionRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const procedimientoEstudioRoutes = require('./routes/procedimientoEstudioRoutes');
const personalRoutes = require('./routes/personalRoutes');
const reclamoDerivacionRoutes = require('./routes/reclamoDerivacionRoutes');
const mensajeriaRoutes = require('./routes/mensajeriaRoutes');
const searchRoutes = require('./routes/searchRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const configuracionNormalizadoresRoutes = require('./routes/configuracionNormalizadoresRoutes');
const altasMedicasRoutes = require('./routes/altasMedicasRoutes');
const noticiasRoutes = require('./routes/noticiasRoutes');
const infraestructuraRoutes = require('./routes/infraestructuraRoutes'); 


//  Rutas públicas (sin autenticación)
app.use("/", homeRoutes);
app.use("/auth", authRoutes);

//  Rutas protegidas (con middleware de autenticación)
const authMiddleware = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/authMiddleware');

app.use("/admin", authMiddleware, requireRole(['ADMINISTRATIVO']), adminRoutes);
app.use("/admisiones", authMiddleware, admisionRoutes);
app.use("/camas", authMiddleware, camasRoutes);
app.use("/internacion", authMiddleware, internacionRoutes);
app.use("/turnos", authMiddleware, turnoRoutes);
app.use("/pacientes", authMiddleware, requireRole(['ADMINISTRATIVO', 'MEDICO', 'ENFERMERO']), pacienteRoutes);
app.use("/facturas", authMiddleware, requireRole(['ADMINISTRATIVO']), facturaRoutes);
app.use("/procedimientos-estudios", authMiddleware, requireRole(['ADMINISTRATIVO', 'MEDICO', 'ENFERMERO']), procedimientoEstudioRoutes);
app.use("/reclamos-derivaciones", authMiddleware, requireRole(['ADMINISTRATIVO']), reclamoDerivacionRoutes);
app.use("/personal", authMiddleware, requireRole(['ADMINISTRATIVO']), personalRoutes);
app.use('/comunicacion', authMiddleware, mensajeriaRoutes);
app.use('/api/search', authMiddleware, searchRoutes);
app.use("/usuarios", authMiddleware, requireRole(['ADMINISTRATIVO']), usuariosRoutes);
app.use('/configuracion/normalizadores', authMiddleware, requireRole(['ADMINISTRATIVO']), configuracionNormalizadoresRoutes);
app.use('/altas-medicas', authMiddleware, requireRole(['ADMINISTRATIVO']), altasMedicasRoutes);
app.use('/noticias', authMiddleware, requireRole(['ADMINISTRATIVO']), noticiasRoutes);
app.use('/configuracion/infraestructura', authMiddleware, requireRole(['ADMINISTRATIVO']), infraestructuraRoutes);


// app.use("/medico", authMiddleware, requireRole(['MEDICO']), medicoRoutes);
// app.use("/enfermero", authMiddleware, requireRole(['ENFERMERO']), enfermeroRoutes);


// ========================================
// MANEJO DE ERRORES
// ========================================

// 404 - Ruta no encontrada
app.use((req, res) => {
  console.log(`❌ 404 - Ruta no encontrada: ${req.url}`);
  res.status(404).render("error", {
    title: "Página no encontrada",
    message: "La página que buscas no existe.",
    error: { status: 404 },
    action:[
      { text: 'Error', href: '/404.pug' }
    ],
    user: req.user || res.locals.user
  });
});

// Error handler general
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  
  const statusCode = err.status || 500;
  const message = err.message || "Ha ocurrido un error en el sistema.";
  
  // Si es petición AJAX, devolver JSON
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // Si es petición web, renderizar vista de error
  res.status(statusCode).render("error", {
    title: "Error del sistema",
    message,
    error: process.env.NODE_ENV === "development" ? err : { status: statusCode },
    user: req.user || res.locals.user
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Conectar a la base de datos
    const connected = await db.connectWithRetry();
    if (!connected) {
      console.error("❌ No se pudo conectar a la BD. Abortando...");
      process.exit(1);
    }

    console.log(" Usando migraciones (sin sync)");

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n ========================================`);
      console.log(` ♿ Servidor corriendo en http://localhost:${PORT}`);
      console.log(` ========================================`);
      console.log(`🍟 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🍺 Base de datos: ${process.env.DB_NAME}`);
      console.log(`🎃 JWT Secret: ${process.env.JWT_SECRET ? ' Configurado' : ' Usando valor por defecto'}`);
      console.log(` Session Secret: ${process.env.SESSION_SECRET ? ' Configurado' : ' Usando valor por defecto'}`);
      console.log(` ========================================\n`);
    });

  } catch (error) {
    console.error("❌ Error fatal al iniciar:", error);
    process.exit(1);
  }
};

// Cierre graceful
process.on('SIGINT', async () => {
  console.log('\n  Cerrando servidor...');
  try {
    await db.sequelize.close();
    console.log(' Conexión cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar:', error);
    process.exit(1);
  }
});

// Iniciar
startServer();

module.exports = app;