const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();


const authRoutes = require('./routes/authRouter');
const indexRoutes = require('./routes/indexRoutes');
const pacienteRouter = require('./routes/pacienteRouter');
// Middlewares deben ir ANTES de las rutas
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); 

// Rutas
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/pacientes', pacienteRouter);


// Manejador de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});