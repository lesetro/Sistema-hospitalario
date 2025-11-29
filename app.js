const express = require("express");
const path = require("path");
require("dotenv").config();
const db = require("./database/db");
const cors = require("cors");

const app = express();
app.use(cors());

// ===============================================
// CONFIGURACIÓN DE PUG
// ===============================================
app.set("view engine", "pug");
const viewsPath = path.join(__dirname, "views");
app.set("views", viewsPath);
console.log(`📁 Directorio de vistas: ${viewsPath}`);

// ===============================================
// MIDDLEWARE
// ===============================================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ===============================================
// RUTAS
// ===============================================
const admisionesRoute = require("./routes/admisionesRoute");
const configuracionRoute = require(`./routes/configuracionRoute`);
const dashboardRoute = require("./routes/dashboardRoute");
const camasRoute = require('./routes/camasRoute');
const internacionRoute = require('./routes/internacionRoute');

// Ruta principal - Dashboard
app.get("/", async (req, res) => {
  try {
    console.log("🏥 Cargando dashboard...");

    const {
      Admision,
      Paciente,
      Usuario,
      Medico,
      Sector,
      Turno,
      TipoTurno,
    } = require("./models");

    // Obtener admisiones con relaciones
    const admisiones = await Admision.findAll({
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nombre", "apellido", "dni"],
            },
          ],
        },
        {
          model: Turno,
          as: "turno",
          attributes: ["id", "fecha", "hora_inicio", "hora_fin", "estado"],
          include: [
            { model: TipoTurno, as: "tipoTurno", attributes: ["id", "nombre"] },
          ],
        },
        {
          model: Medico,
          as: "medico",
          attributes: ["id"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
        { model: Sector, as: "sector", attributes: ["id", "nombre"] },
      ],
    });

    // Calcular estadísticas
    const estadisticas = {
      pacientesActivos: await Paciente.count({ where: { estado: 'Activo' } }),
      camasOcupadas: await db.sequelize.models.Cama?.count({ where: { estado: "Ocupada" } }) || 0,
      camasLibres: await db.sequelize.models.Cama?.count({ where: { estado: "Libre" } }) || 0,
      turnosHoy: await Turno.count({
        where: {
          fecha: new Date().toISOString().split("T")[0],
        },
      }),
      admisionesHoy: await Admision.count({
        where: {
          fecha: {
            [db.Sequelize.Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        },
      }),
    };

    console.log("📊 Estadísticas:", estadisticas);
    console.log(`📋 Admisiones: ${admisiones.length}`);

    res.render("dashboard/admin/dashboard-admin", {
      title: "Dashboard Administrativo",
      estadisticas,
      admisiones,
      alertas: [],
      pagination: null,
    });

  } catch (error) {
    console.error("❌ Error al cargar dashboard:", error);
    res.status(500).render("error", {
      message: "Error al cargar el dashboard",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Aplicar rutas
app.use("/admisiones", admisionesRoute);
app.use("/configuracion", configuracionRoute);
app.use("/", dashboardRoute);
app.use('/camas', camasRoute);
app.use('/internacion', internacionRoute);

// Secciones en construcción
const seccionesEnConstruccion = [
  "turnos",
  "facturacion",
  "procedimientos",
  "derivaciones",
  "comunicacion",
  "personal",
  "usuarios",
  "reportes",
  "recetas",
  "diagnosticos",
];

seccionesEnConstruccion.forEach((seccion) => {
  app.get(`/${seccion}`, (req, res) => {
    console.log(`🚧 Construcción: ${seccion}`);
    res.render("dashboard/admin/construccion", {
      title: seccion.charAt(0).toUpperCase() + seccion.slice(1),
    });
  });
});

// ===============================================
// MANEJO DE ERRORES
// ===============================================

// 404
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Página no encontrada",
    error: { status: 404 }
  });
});

// Errores generales
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { error: err.stack })
  });
});

// Manejar excepciones no capturadas
process.on("uncaughtException", (err) => {
  console.error("💥 Excepción no capturada:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Promesa rechazada:", reason);
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Conectar a la BD
    const connected = await db.connectWithRetry();
    if (!connected) {
      console.error("❌ No se pudo conectar a la BD. Abortando...");
      process.exit(1);
    }

    // 2. Sincronizar modelos (OPCIONAL - mejor usar migraciones)
    
    console.log("✅ Usando migraciones (sin sync)");
    

    // 3. Mostrar modelos y asociaciones (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log("\n📦 Modelos cargados:");
      for (const modelName in db.sequelize.models) {
        const model = db.sequelize.models[modelName];
        console.log(`  ├─ ${modelName}`);
        if (model.associations) {
          for (const assocName in model.associations) {
            const assoc = model.associations[assocName];
            console.log(`  │  └─ ${assoc.associationType} → ${assoc.target.name} (${assoc.options.as})`);
          }
        }
      }
      console.log("");
    }

    // 4. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME}\n`);
    });

  } catch (error) {
    console.error("❌ Error fatal al iniciar:", error);
    process.exit(1);
  }
};

// Cierre graceful
process.on('SIGINT', async () => {
  console.log('\n⚠️  Cerrando servidor...');
  try {
    await db.sequelize.close();
    console.log('✅ Conexión cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar:', error);
    process.exit(1);
  }
});

// Iniciar
startServer();

module.exports = app;