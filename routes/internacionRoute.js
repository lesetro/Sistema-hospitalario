// routes/internacionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getVistaInternacion,
  getDashboardData,
  crearHabitacion,
  crearCama,
  agregarPacienteListaEspera,
  eliminarPacienteListaEspera
} = require('../controllers/internacionController');

// Vista principal de internación
router.get('/', getVistaInternacion);

// API para obtener datos del dashboard
router.get('/api/dashboard', getDashboardData);

// Crear nueva habitación (para remodelaciones)
router.post('/api/habitacion', crearHabitacion);

// Crear nueva cama en habitación existente
router.post('/api/cama', crearCama);

// CRUD para lista de espera
router.post('/api/lista-espera', agregarPacienteListaEspera);
router.delete('/api/lista-espera/:id', eliminarPacienteListaEspera);

module.exports = router;