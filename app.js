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
// ROUTERS Administrativo
// ========================================
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const admisionRoutes = require("./routes/admin/admisionRoutes");
const camasRoutes = require('./routes/admin/camasRoutes');
const internacionRoutes = require('./routes/admin/internacionRoutes');
const turnoRoutes = require('./routes/admin/turnoRoutes');
const pacienteRoutes = require('./routes/admin/pacienteRoutes');
const facturaRoutes = require('./routes/admin/facturaRoutes');
const procedimientoEstudioRoutes = require('./routes/admin/procedimientoEstudioRoutes');
const personalRoutes = require('./routes/admin/personalRoutes');
const reclamoDerivacionRoutes = require('./routes/admin/reclamoDerivacionRoutes');
const mensajeriaRoutes = require('./routes/admin/mensajeriaRoutes');
const searchRoutes = require('./routes/admin/searchRoutes');
const usuariosRoutes = require('./routes/admin/usuariosRoutes');
const configuracionNormalizadoresRoutes = require('./routes/admin/configuracionNormalizadoresRoutes');
const altasMedicasRoutes = require('./routes/admin/altasMedicasRoutes');
const noticiasRoutes = require('./routes/admin/noticiasRoutes');
const infraestructuraRoutes = require('./routes/admin/infraestructuraRoutes'); 


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

// ========================================
// ROUTERS Medico
// ========================================
const medicoRoutes = require("./routes/medico/medicoRouter");
const pacienteMedicoRoutes = require("./routes/medico/pacientesMedicoRouter");
const turnoMedicoRoutes = require("./routes/medico/turnosMedicoRouter");
const evaluacionMedicaRoutes = require("./routes/medico/evaluacionesMedicasRouter");
const diagnosticosMedicoRoutes = require("./routes/medico/diagnosticosRouter");
const estudiosSolicitadosMedicoRoutes = require("./routes/medico/estudiosSolicitadosrouter");
const altasMedicasMedicoRoutes = require("./routes/medico/altasMedicasRouter");
const internacionesRoutes = require("./routes/medico/internacionesRouter");
const recetasMedicoRoutes = require("./routes/medico/recetasCertificadosRouter");
const intervencionesRoutes = require("./routes/medico/intervencionesRouter");
const derivacionesRoutes = require("./routes/medico/derivacionesRouter");
const buscarPacienteRoutes = require("./routes/medico/buscarPacienteRouter");
const comunicacionesRoutes = require("./routes/medico/comunicacionesRouter");
const historialClinicoRoutes = require("./routes/medico/historialClinicoRouter");


app.use("/medico/buscar-paciente" ,authMiddleware,requireRole(['MEDICO']),buscarPacienteRoutes);
app.use("/medico/historial-clinico" ,authMiddleware,requireRole(['MEDICO']),historialClinicoRoutes);
app.use("/medico/comunicaciones" ,authMiddleware,requireRole(['MEDICO']),comunicacionesRoutes);
app.use("/medico/derivaciones", authMiddleware,requireRole(['MEDICO']), derivacionesRoutes);
app.use("/medico/internaciones", authMiddleware, requireRole(['MEDICO']), internacionesRoutes);
app.use("/medico/recetas-certificados", authMiddleware, requireRole(['MEDICO']), recetasMedicoRoutes);
app.use("/medico/intervenciones", authMiddleware, requireRole(['MEDICO']), intervencionesRoutes);
app.use("/medico/altas-medicas", authMiddleware, requireRole(['MEDICO']), altasMedicasMedicoRoutes);
app.use("/medico/diagnosticos", authMiddleware, requireRole(['MEDICO']), diagnosticosMedicoRoutes);
app.use("/medico/estudios-solicitados", authMiddleware, requireRole(['MEDICO']), estudiosSolicitadosMedicoRoutes);
app.use("/medico/evaluaciones", authMiddleware, requireRole(['MEDICO']), evaluacionMedicaRoutes);
app.use("/medico/mis-turnos", authMiddleware, requireRole(['MEDICO']), turnoMedicoRoutes);
app.use("/medico/pacientes", authMiddleware, requireRole(['MEDICO']), pacienteMedicoRoutes);
app.use("/medico", authMiddleware, requireRole(['MEDICO']), medicoRoutes);

// ========================================
// ROUTERS Enfermero
// ========================================

const dashboardEnfermeroRoutes = require("./routes/enfermero/enfermeroRoutes");
const triajeRoutes = require("./routes/enfermero/triajeRoutes");
const evaluacionesEnfermeroRoutes = require("./routes/enfermero/evaluacionesEnfermeriaRoutes");
const controlesEnfermeroRoutes = require("./routes/enfermero/controlesRoutes");
const signosVitalesRoutes = require("./routes/enfermero/signosVitalesRoutes");
const procedimientosEnfermeriaRoutes = require("./routes/enfermero/procedimientosEnfermeriaRoutes");
const prequirurgicosRoutes = require("./routes/enfermero/prequirurgicosRoutes");
const medicacionRoutes = require("./routes/enfermero/medicacionRoutes");
const pacientesEnfermeroRoutes = require("./routes/enfermero/pacientesEnfermeroRoutes");
const internadosRoutes = require("./routes/enfermero/internadosRoutes");
const camasEnfermeroRoutes = require("./routes/enfermero/camasEnfermeroRoutes");
const listaEsperaRoutes = require("./routes/enfermero/listaEsperaRoutes");
const buscarPacienteEnfermeroRoutes = require("./routes/enfermero/buscarPacienteRoutes");
const comunicacionesEnfermeroRoutes = require("./routes/enfermero/comunicacionesEnfermeroRoutes");
const misTurnosRoutes = require("./routes/enfermero/misTurnosRoutes");
//const perfilEnfermeroRoutes = require("./routes/enfermero/perfilEnfermeroRoutes");

// Aplicar rutas con middleware de autenticación y rol
//app.use("/enfermero/perfil", authMiddleware, requireRole(['ENFERMERO']), perfilEnfermeroRoutes);
app.use("/enfermero/mis-turnos", authMiddleware, requireRole(['ENFERMERO']), misTurnosRoutes);
app.use("/enfermero/comunicaciones", authMiddleware, requireRole(['ENFERMERO']), comunicacionesEnfermeroRoutes);
app.use("/enfermero/buscar-paciente", authMiddleware, requireRole(['ENFERMERO']), buscarPacienteEnfermeroRoutes);
app.use("/enfermero/lista-espera", authMiddleware, requireRole(['ENFERMERO']), listaEsperaRoutes);
app.use("/enfermero/camas", authMiddleware, requireRole(['ENFERMERO']), camasEnfermeroRoutes);
app.use("/enfermero/internados", authMiddleware, requireRole(['ENFERMERO']), internadosRoutes);
app.use("/enfermero/pacientes", authMiddleware, requireRole(['ENFERMERO']), pacientesEnfermeroRoutes);
app.use("/enfermero/medicacion", authMiddleware, requireRole(['ENFERMERO']), medicacionRoutes);
app.use("/enfermero/prequirurgicos", authMiddleware, requireRole(['ENFERMERO']), prequirurgicosRoutes);
app.use("/enfermero/procedimientos", authMiddleware, requireRole(['ENFERMERO']), procedimientosEnfermeriaRoutes);
app.use("/enfermero/signos-vitales", authMiddleware, requireRole(['ENFERMERO']), signosVitalesRoutes);
app.use("/enfermero/controles", authMiddleware, requireRole(['ENFERMERO']), controlesEnfermeroRoutes);
app.use("/enfermero/evaluaciones", authMiddleware, requireRole(['ENFERMERO']), evaluacionesEnfermeroRoutes);
app.use("/enfermero/triaje", authMiddleware, requireRole(['ENFERMERO']), triajeRoutes);
app.use("/enfermero", authMiddleware, requireRole(['ENFERMERO']), dashboardEnfermeroRoutes);

// ========================================
// ROUTERS Paciente
// ========================================
const pacienteDashboardRouter = require('./routes/paciente/pacienteDashboardRouter');
const pacienteTurnosRouter = require('./routes/paciente/pacienteTurnosRouter');
const pacienteSolicitarTurnoRouter = require('./routes/paciente/pacienteSolicitarTurnoRouter');
const pacienteListaEsperaRouter = require('./routes/paciente/pacienteListaEsperaRouter');
const pacienteAdmisionesRouter = require('./routes/paciente/pacienteAdmisionesRouter');
const pacienteHistorialMedicoRouter = require('./routes/paciente/pacienteHistorialMedicoRouter');
const pacienteEstudiosRouter = require('./routes/paciente/pacienteEstudiosRouter');
const pacienteRecetasRouter = require('./routes/paciente/pacienteRecetasRouter');
const pacienteInternacionesRouter = require('./routes/paciente/pacienteInternacionesRouter');
const pacienteFacturasRouter = require('./routes/paciente/pacienteFacturasRouter');
const pacientePagosRouter = require('./routes/paciente/pacientePagosRouter');
const pacienteNotificacionesRouter = require('./routes/paciente/pacienteNotificacionesRouter');
const pacienteMensajesRouter = require('./routes/paciente/pacienteMensajesRouter');
const pacienteReclamosRouter = require('./routes/paciente/pacienteReclamosRouter');
const pacientePerfilRouter = require('./routes/paciente/pacientePerfilRouter');


// Dashboard principal
app.use("/paciente", authMiddleware, requireRole(['PACIENTE']), pacienteDashboardRouter);

// Gestión de turnos
app.use("/paciente/turnos", authMiddleware, requireRole(['PACIENTE']), pacienteTurnosRouter);
app.use("/paciente/solicitar-turno", authMiddleware, requireRole(['PACIENTE']), pacienteSolicitarTurnoRouter);
app.use("/paciente/lista-espera", authMiddleware, requireRole(['PACIENTE']), pacienteListaEsperaRouter);

// Información médica
app.use("/paciente/admisiones", authMiddleware, requireRole(['PACIENTE']), pacienteAdmisionesRouter);
app.use("/paciente/historial-medico", authMiddleware, requireRole(['PACIENTE']), pacienteHistorialMedicoRouter);
app.use("/paciente/estudios", authMiddleware, requireRole(['PACIENTE']), pacienteEstudiosRouter);
app.use("/paciente/recetas", authMiddleware, requireRole(['PACIENTE']), pacienteRecetasRouter);
app.use("/paciente/internaciones", authMiddleware, requireRole(['PACIENTE']), pacienteInternacionesRouter);

// Facturación
app.use("/paciente/facturas", authMiddleware, requireRole(['PACIENTE']), pacienteFacturasRouter);
app.use("/paciente/pagos", authMiddleware, requireRole(['PACIENTE']), pacientePagosRouter);

// Comunicación
app.use("/paciente/notificaciones", authMiddleware, requireRole(['PACIENTE']), pacienteNotificacionesRouter);
app.use("/paciente/mensajes", authMiddleware, requireRole(['PACIENTE']), pacienteMensajesRouter);
app.use("/paciente/reclamos", authMiddleware, requireRole(['PACIENTE']), pacienteReclamosRouter);

// Perfil
app.use("/paciente/perfil", authMiddleware, requireRole(['PACIENTE']), pacientePerfilRouter);




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