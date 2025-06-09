const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./database/db');
const cors = require('cors');

const app = express();
app.use(cors());

// Configurar Pug como motor de vistas
app.set('view engine', 'pug');
const viewsPath = path.join(__dirname, 'views');
app.set('views', viewsPath);
console.log(`Directorio de vistas configurado: ${viewsPath}`);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de depuración para rutas
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
});

// Rutas
const admisionesRoute = require('./routes/admisionesRoute');
const configuracionRoute= require(`./routes/configuracionRoute`);

app.get('/', (req, res) => {
  console.log('Renderizando dashboard/admin/dashboard-admin');
  res.render('dashboard/admin/dashboard-admin', { title: 'Dashboard' });
});
app.use('/admisiones', admisionesRoute);
app.use(`/configuracion`, configuracionRoute);
//app.use('/pacientes', pacienteRoute);

// Rutas para secciones en construcción
const seccionesEnConstruccion = [
  'internaciones', 'turnos', 'pacientes', 'facturacion', 'procedimientos',
  'derivaciones', 'comunicacion', 'personal', 'usuarios',
  'reportes', 'recetas', 'diagnosticos'
];

db.sequelize.authenticate()
  .then(() => console.log('✅ Conexión a la base de datos establecida con éxito.'))
  .catch(err => console.error('❌ Error de conexión:', err));

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason, promise);
});
// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});
seccionesEnConstruccion.forEach(seccion => {
  app.get(`/${seccion}`, (req, res) => {
    console.log(`Renderizando dashboard/admin/construccion para ${seccion}`);
    res.render('dashboard/admin/construccion', { title: seccion.charAt(0).toUpperCase() + seccion.slice(1) });
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  try {
    await db.sequelize.authenticate();
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
});