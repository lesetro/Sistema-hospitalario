const express = require('express');
const router = express.Router();
const camasController = require('../../controllers/enfermero/camasEnfermeroController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

router.get('/', camasController.vistaSectorEnfermero); 

// Sector del enfermero (único)
router.get('/sector', camasController.verSectorEnfermero); 

// Servicios del sector del enfermero
router.get('/servicios', camasController.serviciosPorSector); 

// Habitaciones filtradas por servicio (dentro del sector del enfermero)
router.get('/servicios/:servicioId/habitaciones', camasController.habitacionesPorServicio);
//  enfermero/camas/servicios/${servicio.id}/servicios'
// Camas por habitación (ya filtrada por sector del enfermero)
router.get('/habitaciones/:habitacionId/camas', camasController.camasPorHabitacion);

// ===== Vistas especiales (filtradas por sector del enfermero) =====
router.get('/disponibles', camasController.camasDisponibles);
router.get('/limpieza', camasController.camasEnLimpieza);

// ===== Vistas individuales =====
router.get('/detalle/:id', camasController.verCama); 
router.get('/habitaciones/:id/detalle', camasController.verHabitacion);

// ===== Acciones =====
router.post('/:id/cambiar-estado', camasController.cambiarEstado);
router.post('/:id/liberar', camasController.liberarCama);

// ===== API para AJAX (filtradas por sector del enfermero) =====
router.get('/api/disponibles', camasController.apiCamasDisponibles);
router.get('/api/limpieza', camasController.apiCamasLimpieza);
router.get('/api/estadisticas', camasController.estadisticasGenerales); // Estadísticas del sector del enfermero
router.get('/api/sector/detalle', camasController.apiDetalleSectorEnfermero); // Detalle del sector del enfermero

// Búsqueda de pacientes y asignación (dentro del sector del enfermero)
router.get('/api/buscar-pacientes', camasController.apiBuscarPacientes);
router.post('/api/asignar-paciente', camasController.apiAsignarPaciente);

// ===== API adicional para navegación =====
router.get('/api/servicios', camasController.apiServiciosPorSector);
router.get('/api/servicios/:servicioId/habitaciones', camasController.apiHabitacionesPorServicio);

module.exports = router;