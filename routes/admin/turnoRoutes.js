const express = require('express');
const router = express.Router();
const turnoController = require('../../controllers/admin/turnoController');
const authMiddleware = require('../../middleware/authMiddleware');

const { requireRole } = require('../../middleware/authMiddleware');
// ============================================================================
// MIDDLEWARE: Todas las rutas requieren autenticación
// ============================================================================
router.use(authMiddleware);
router.use(requireRole('ADMINISTRATIVO')); 

// ============================================================================
// VISTAS
// ============================================================================
router.get('/', turnoController.getVistaTurnos);
router.get('/servicio/:servicio_id', turnoController.getVistaServicio);

// ============================================================================
// API - CONSULTAS Y LISTADOS
// ============================================================================
router.get('/api/dashboard', turnoController.getDashboardTurnos);
router.get('/api/medicos', turnoController.getMedicos);
router.get('/api/medico/:medico_id/horarios', turnoController.getHorariosDisponibles); 
router.get('/api/turno/:id', turnoController.getTurnoById);
router.get('/api/lista/:id', turnoController.getListaEsperaById);
router.get('/api/paciente/:paciente_id/detalles', turnoController.getDetallesPaciente);
router.get('/api/sector/:sector_id/servicios', turnoController.getServiciosPorSector);
router.get('/api/servicio/:servicio_id/datos', turnoController.getDatosServicio);

// ============================================================================
// API - GESTIÓN DE TURNOS
// ============================================================================
router.post('/api/asignar', turnoController.asignarTurnoListaEspera);
router.put('/api/turno/:id/estado', turnoController.cambiarEstadoTurno);
// ✅ CORREGIDO: Agregar '-turno' al endpoint
router.post('/api/servicio/asignar-turno', turnoController.asignarTurnoServicio);
router.put('/api/servicio/turno/:turno_id/cancelar', turnoController.cancelarTurnoServicio);

// Legacy (mantener por compatibilidad)
router.put('/api/cancelar', turnoController.cancelarTurno);
router.put('/api/completar', turnoController.completarTurno);
// En routes/turnos.js
router.get('/api/debug/servicio/:servicio_id', turnoController.debugServicio);
router.get('/api/servicio/:servicio_id/medicos', turnoController.getMedicosPorServicio);
router.get('/api/servicio/:servicio_id/validar-horario', turnoController.validarHorarioDisponibleAPI);
router.post('/api/servicio/:servicio_id/validar-horario', turnoController.validarHorarioDisponibleAPI );
module.exports = router;