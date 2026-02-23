const express = require('express');
const router = express.Router();
const intervencionesController = require('../../controllers/medico/intervencionesController');
const authMiddleware = require('../../middleware/authMiddleware');

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================
router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', intervencionesController.renderCirugias);

// ========================================
// APIs - ESPECÍFICAS PRIMERO
// ========================================

// Estadísticas
router.get('/api/estadisticas', intervencionesController.obtenerEstadisticas);

// Quirófanos disponibles
router.get('/api/quirofanos', intervencionesController.obtenerQuirofanos);

// Detalle del paciente
router.get('/api/paciente/:paciente_id', intervencionesController.verDetallePaciente);

// ========================================
// APIs - ACCIONES
// ========================================

// Listar pacientes para cirugía (programados + urgencias)
router.get('/api/pacientes', intervencionesController.obtenerPacientesCirugia);

// Aceptar paciente de urgencia
router.post('/api/aceptar/:lista_espera_id', intervencionesController.aceptarPaciente);

// Crear intervención quirúrgica
router.post('/api/intervenciones', intervencionesController.crearIntervencion);

// Actualizar estado de cirugía
router.put('/api/intervenciones/:id/estado', intervencionesController.actualizarEstado);

// Finalizar cirugía
router.put('/api/intervenciones/:id/finalizar', intervencionesController.finalizarCirugia);

module.exports = router;