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
// APIS - NOTIFICACIONES
// ========================================

// Obtener notificaciones
router.get('/api/notificaciones', comunicacionesController.obtenerNotificaciones);

// Obtener estadísticas
router.get('/api/notificaciones/estadisticas', comunicacionesController.obtenerEstadisticasNotificaciones);

// Crear notificación
router.post('/api/notificaciones', comunicacionesController.crearNotificacion);

// Marcar notificación como leída
router.put('/api/notificaciones/:id/leida', comunicacionesController.marcarNotificacionLeida);

// Marcar todas como leídas
router.put('/api/notificaciones/marcar-todas-leidas', comunicacionesController.marcarTodasNotificacionesLeidas);

// Eliminar notificación
router.delete('/api/notificaciones/:id', comunicacionesController.eliminarNotificacion);

// ========================================
// APIS - MENSAJES
// ========================================

// Obtener conversación con un usuario
router.get('/api/mensajes/conversacion/:usuario_id', comunicacionesController.obtenerConversacion);

// Obtener lista de conversaciones (últimos mensajes)
router.get('/api/mensajes/conversaciones', comunicacionesController.obtenerConversaciones);

// Obtener mensajes recibidos (bandeja de entrada)
router.get('/api/mensajes/recibidos', comunicacionesController.obtenerMensajesRecibidos);

// Obtener mensajes enviados (bandeja de enviados)
router.get('/api/mensajes/enviados', comunicacionesController.obtenerMensajesEnviados);

// Enviar mensaje
router.post('/api/mensajes', comunicacionesController.enviarMensaje);

// Marcar mensaje como leído
router.put('/api/mensajes/:id/leido', comunicacionesController.marcarMensajeLeido);

// Eliminar mensaje
router.delete('/api/mensajes/:id', comunicacionesController.eliminarMensaje);

// ========================================
// APIS - USUARIOS - BÚSQUEDA
// ========================================
router.get('/api/usuarios/buscar', comunicacionesController.buscarUsuarios);

// ========================================
// APIS - NOTICIAS - ESPECÍFICAS PRIMERO
// ========================================
router.get('/api/noticias/:id', comunicacionesController.obtenerNoticiaPorId);

// ========================================
// APIS - NOTICIAS - GENÉRICAS DESPUÉS
// ========================================
router.get('/api/noticias', comunicacionesController.obtenerNoticias);

module.exports = router;