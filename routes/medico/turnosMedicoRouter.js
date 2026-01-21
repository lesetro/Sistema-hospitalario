const express = require('express');
const router = express.Router();
const turnosMedicoController = require('../../controllers/medico/turnosMedicoController');
const authMiddleware = require('../../middleware/authMiddleware'); // ✅ CRÍTICO

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
// ✅ SIN ESTO, req.user ES UNDEFINED Y TODO FALLA
router.use(authMiddleware);

// ========================================
// VISTAS (Renderizadas en servidor)
// ========================================

// Vista principal de mis turnos
router.get('/', turnosMedicoController.renderMisTurnos);

// ========================================
// APIs (JSON)
// ========================================

// ✅ ORDEN: Primero GET específicas, luego genéricas
// Obtener estadísticas de turnos
router.get('/api/estadisticas', turnosMedicoController.obtenerEstadisticasTurnos);

// Obtener un turno específico
router.get('/api/turnos/:id', turnosMedicoController.obtenerTurnoPorId);

// Obtener turnos con filtros y paginación
router.get('/api/turnos', turnosMedicoController.obtenerTurnos);

// ========================================
// ACCIONES (PUT - Cambiar estado)
// ========================================

// Confirmar turno (PENDIENTE → CONFIRMADO)
router.put('/api/turnos/:id/confirmar', turnosMedicoController.confirmarTurno);

// Cancelar turno (PENDIENTE/CONFIRMADO → CANCELADO)
router.put('/api/turnos/:id/cancelar', turnosMedicoController.cancelarTurno);

// Completar turno (CONFIRMADO → COMPLETADO)
router.put('/api/turnos/:id/completar', turnosMedicoController.completarTurno);

module.exports = router;