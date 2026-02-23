const express = require('express');
const router = express.Router();
const camasController = require('../../controllers/medico/camasMedicoController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ===== Dashboard principal =====
router.get('/', camasController.listarSectores);

// ===== Navegación jerárquica =====
router.get('/sectores', camasController.vistaCompletaSectores);
router.get('/camas', camasController.listarSectores);
router.get('/sectores/:sectorId/habitaciones', camasController.habitacionesPorSector);
router.get('/habitaciones/:habitacionId/camas', camasController.camasPorHabitacion);

// ===== Vistas especiales =====
router.get('/disponibles', camasController.camasDisponibles);
router.get('/limpieza', camasController.camasEnLimpieza);

// ===== Vistas individuales =====
router.get('/detalle/:id', camasController.verCama);

// ===== Acciones =====
router.post('/:id/cambiar-estado', camasController.cambiarEstado);
router.post('/:id/liberar', camasController.liberarCama);

// ===== API para AJAX =====
router.get('/api/disponibles', camasController.apiCamasDisponibles);
router.get('/api/limpieza', camasController.apiCamasLimpieza);
router.get('/api/estadisticas', camasController.estadisticasGenerales);
router.get('/habitaciones/:id/detalle', camasController.verHabitacion);
router.get('/api/sectores/:sectorId/detalle', camasController.apiDetalleSector);

// ===== API para búsqueda =====
router.get('/api/buscar', camasController.apiBuscarCamas);
router.get('/api/sectores', camasController.obtenerSectores);
router.get('/api/tipos-servicio', camasController.obtenerTiposServicio);
router.get('/api/estadisticas-generales', camasController.estadisticasGenerales);
router.get('/api/buscar-pacientes', camasController.apiBuscarPacientes);
router.post('/api/asignar-paciente', camasController.apiAsignarPaciente); 

module.exports = router;