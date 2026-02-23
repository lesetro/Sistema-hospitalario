const express = require('express');
const router = express.Router();
const comunicacionesController = require('../../controllers/medico/comunicacionesController');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

// ========================================
// VISTAS
// ========================================
router.get('/', comunicacionesController.renderComunicaciones);

// ========================================
// APIS - NOTIFICACIONES (Mensajes)
// ========================================

// Obtener notificaciones recibidas (bandeja de entrada)
router.get('/api/notificaciones', comunicacionesController.obtenerNotificaciones);

// Obtener mensajes enviados
router.get('/api/mensajes/enviados', comunicacionesController.obtenerMensajesEnviados);

// Obtener estadísticas
router.get('/api/notificaciones/estadisticas', comunicacionesController.obtenerEstadisticasNotificaciones);

// Crear notificación (enviar mensaje)
router.post('/api/notificaciones', comunicacionesController.crearNotificacion);

// Marcar notificación como leída
router.put('/api/notificaciones/:id/leida', comunicacionesController.marcarNotificacionLeida);

// Marcar todas como leídas
router.put('/api/notificaciones/marcar-todas-leidas', comunicacionesController.marcarTodasNotificacionesLeidas);

// Eliminar notificación
router.delete('/api/notificaciones/:id', comunicacionesController.eliminarNotificacion);

// ========================================
// APIS - CONVERSACIONES
// ========================================

// Obtener conversación con un usuario
router.get('/api/mensajes/conversacion/:usuario_id', comunicacionesController.obtenerConversacion);

// Obtener lista de conversaciones (últimos mensajes)
router.get('/api/mensajes/conversaciones', comunicacionesController.obtenerConversaciones);

// ========================================
// APIS - USUARIOS - BÚSQUEDA
// ========================================
router.get('/api/usuarios/buscar', comunicacionesController.buscarUsuarios);

// ========================================
// APIS - NOTICIAS
// ========================================
router.get('/api/noticias/:id', comunicacionesController.obtenerNoticiaPorId);
router.get('/api/noticias', comunicacionesController.obtenerNoticias);

module.exports = router;