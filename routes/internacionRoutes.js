const express = require('express');
const router = express.Router();
const internacionController = require('../controllers/internacionController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);

// ============================================================================
// VISTAS - RENDERIZADO DE PÁGINAS
// ============================================================================
// GET /internaciones - Vista principal
router.get('/', internacionController.renderInternaciones);

// GET /internaciones/lista - Lista con paginación
router.get('/lista', internacionController.renderListaInternaciones);

// GET /internaciones/lista-espera - Lista de espera
router.get('/lista-espera', internacionController.renderListaEspera);

// GET /internaciones/disponibilidad - Disponibilidad detallada (DEBE IR ANTES DE /api)
router.get('/disponibilidad', internacionController.renderDisponibilidadDetallada);

// ============================================================================
// API - DISPONIBILIDAD
// ============================================================================
// GET /internaciones/api/disponibilidad-resumen - NUEVA RUTA
router.get('/api/disponibilidad-resumen', internacionController.getResumenDisponibilidad);

// GET /internaciones/api/disponibilidad-habitaciones?sector_id=1&sexo_paciente=Femenino
router.get('/api/disponibilidad-habitaciones', internacionController.getDisponibilidadHabitaciones);

// GET /internaciones/api/camas-disponibles?habitacion_id=1&sexo_paciente=Masculino
router.get('/api/camas-disponibles', internacionController.getCamasDisponibles);

// ============================================================================
// API - BÚSQUEDA DE PACIENTES
// ============================================================================
// GET /internaciones/api/buscar-paciente?dni=12345678
router.get('/api/buscar-paciente', internacionController.buscarPacienteParaInternacion);

// ============================================================================
// API - LISTA DE ESPERA
// ============================================================================
// GET /internaciones/api/lista-espera?sector_id=1&prioridad=ALTA
router.get('/api/lista-espera', internacionController.getListaEsperaPorSector);

// POST /internaciones/api/lista-espera/:id/asignar-cama
router.post('/api/lista-espera/:id/asignar-cama', internacionController.asignarCamaListaEspera);

// PATCH /internaciones/api/lista-espera/:id/cancelar
router.patch('/api/lista-espera/:id/cancelar', internacionController.cancelarListaEspera);

// ============================================================================
// API - INTERNACIONES
// ============================================================================
// POST /internaciones/api/crear
router.post('/api/crear', internacionController.crearInternacion);

// GET /internaciones/api?page=1&limit=10&sector_id=1&tiene_alta=false
router.get('/api', internacionController.getInternaciones);

// GET /internaciones/api/:id
router.get('/api/:id', internacionController.getInternacionById);

// PATCH /internaciones/api/:id/estado
router.patch('/api/:id/estado', internacionController.updateEstadoInternacion);

// ============================================================================
// API - GESTIÓN DE CAMAS
// ============================================================================
// PATCH /internaciones/api/cama/:cama_id/liberar
router.patch('/api/cama/:cama_id/liberar', internacionController.liberarCama);

// PATCH /internaciones/api/cama/:cama_id/marcar-libre
router.patch('/api/cama/:cama_id/marcar-libre', internacionController.marcarCamaLibre);

module.exports = router;