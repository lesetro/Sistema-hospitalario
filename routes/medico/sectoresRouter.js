const express = require('express');
const router = express.Router();
const sectoresController = require('../../controllers/medico/sectoresController');
const authMiddleware = require('../../middleware/authMiddleware');
const { verificarSectorUsuario } = require('../../middleware/sectorMiddleware');
//NO LO VOY A USAR PREFIERO EL DE ENFERMERO CON GESTION DE CAMAS 

// ============================================================================
// MIDDLEWARE
// ============================================================================
router.use(authMiddleware);
router.use(verificarSectorUsuario);

// ============================================================================
// VISTAS
// ============================================================================

// Vista principal - Mi sector
router.get('/', sectoresController.renderMiSector);

// Vista de camas de una habitación
router.get('/habitacion/:habitacion_id', sectoresController.renderHabitacion);

// Vista de pendientes de asignar
router.get('/pendientes', sectoresController.verPendientesDeAsignar);

// ============================================================================
// ACCIONES
// ============================================================================

// Internar paciente en el sector del médico
router.post('/internar', sectoresController.internarPaciente);

// Marcar derivación a otro sector
router.post('/internacion/:internacion_id/derivar', sectoresController.marcarDerivacion);

// Dar de alta
router.post('/internacion/:internacion_id/alta', sectoresController.darDeAlta);

module.exports = router;