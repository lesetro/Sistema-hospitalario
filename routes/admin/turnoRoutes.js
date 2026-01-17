const express = require('express');
const router = express.Router();
const turnoController = require('../../controllers/admin/turnoController');
const authMiddleware = require('../../middleware/authMiddleware');

// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);

// ============================================================================
// VISTA PRINCIPAL
// ============================================================================
router.get('/', turnoController.getVistaTurnos);

// ============================================================================
// API - CONSULTAS Y LISTADOS
// ============================================================================
router.get('/api/dashboard', turnoController.getDashboardTurnos);
router.get('/api/medicos', turnoController.getMedicos);
router.get('/api/medico/:medico_id/horarios', turnoController.getHorariosDisponibles); 
router.get('/api/turno/:id', turnoController.getTurnoById);
router.get('/api/lista/:id', turnoController.getListaEsperaById);
router.get('/api/paciente/:paciente_id/detalles', turnoController.getDetallesPaciente);

// ============================================================================
// API - GESTIÓN DE TURNOS
// ============================================================================
router.post('/api/asignar', turnoController.asignarTurnoListaEspera);
router.put('/api/turno/:id/estado', turnoController.cambiarEstadoTurno); 

// Legacy (mantener por compatibilidad)
router.put('/api/cancelar', turnoController.cancelarTurno);
router.put('/api/completar', turnoController.completarTurno);

module.exports = router;