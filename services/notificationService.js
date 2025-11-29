class NotificationService {
  
  // Tipos de notificación
  static TYPES = {
    EMERGENCY: 'emergency',
    WARNING: 'warning',
    INFO: 'info',
    SUCCESS: 'success',
    APPOINTMENT: 'appointment',
    MEDICAL: 'medical'
  };

  // Prioridades
  static PRIORITIES = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  };

  // Almacén en memoria para notificaciones (en producción usar Redis/DB)
  static notifications = new Map();
  static subscribers = new Map();

  // Crear notificación
  static createNotification(data) {
    const notification = {
      id: this.generateId(),
      type: data.type || this.TYPES.INFO,
      priority: data.priority || this.PRIORITIES.MEDIUM,
      title: data.title,
      message: data.message,
      userId: data.userId,
      userRole: data.userRole,
      sectorId: data.sectorId,
      pacienteId: data.pacienteId,
      metadata: data.metadata || {},
      timestamp: new Date(),
      read: false,
      actions: data.actions || []
    };

    // Guardar notificación
    this.notifications.set(notification.id, notification);

    // Enviar a suscriptores
    this.broadcastNotification(notification);

    return notification;
  }

  // Notificaciones específicas del hospital
  static alertCriticalVitals(pacienteId, vitals, medicoId, enfermeroId) {
    const alerts = [];
    
    // Detectar valores críticos
    if (vitals.presion_sistolica > 180 || vitals.presion_sistolica < 90) {
      alerts.push(`Presión sistólica crítica: ${vitals.presion_sistolica} mmHg`);
    }
    
    if (vitals.temperatura > 39 || vitals.temperatura < 36) {
      alerts.push(`Temperatura crítica: ${vitals.temperatura}°C`);
    }
    
    if (vitals.frecuencia_cardiaca > 120 || vitals.frecuencia_cardiaca < 50) {
      alerts.push(`Frecuencia cardíaca crítica: ${vitals.frecuencia_cardiaca} bpm`);
    }

    if (alerts.length > 0) {
      // Notificar al médico
      this.createNotification({
        type: this.TYPES.EMERGENCY,
        priority: this.PRIORITIES.CRITICAL,
        title: 'ALERTA: Signos Vitales Críticos',
        message: `Paciente ID ${pacienteId}: ${alerts.join(', ')}`,
        userId: medicoId,
        pacienteId: pacienteId,
        metadata: { vitals, alerts },
        actions: [
          { label: 'Ver Paciente', url: `/pacientes/${pacienteId}` },
          { label: 'Evaluar', url: `/evaluaciones/nueva/${pacienteId}` }
        ]
      });

      // Notificar al enfermero
      this.createNotification({
        type: this.TYPES.EMERGENCY,
        priority: this.PRIORITIES.HIGH,
        title: 'Signos Vitales Anormales',
        message: `Revisar paciente ID ${pacienteId} inmediatamente`,
        userId: enfermeroId,
        pacienteId: pacienteId,
        metadata: { vitals }
      });

      return { alertSent: true, alerts };
    }

    return { alertSent: false };
  }

  static reminderAppointment(turnoId, pacienteData, medicoData, timeBeforeMinutes = 30) {
    // Recordatorio para el médico
    this.createNotification({
      type: this.TYPES.APPOINTMENT,
      priority: this.PRIORITIES.MEDIUM,
      title: 'Próximo Turno',
      message: `Turno con ${pacienteData.nombre} ${pacienteData.apellido} en ${timeBeforeMinutes} minutos`,
      userId: medicoData.id,
      pacienteId: pacienteData.id,
      metadata: { turnoId, timeBeforeMinutes },
      actions: [
        { label: 'Ver Turno', url: `/turnos/${turnoId}` },
        { label: 'Historial', url: `/pacientes/${pacienteData.id}/historial` }
      ]
    });

    // Recordatorio para el paciente (si tienes sistema de notificaciones para pacientes)
    this.createNotification({
      type: this.TYPES.APPOINTMENT,
      priority: this.PRIORITIES.MEDIUM,
      title: 'Recordatorio de Turno',
      message: `Su turno con Dr. ${medicoData.nombre} ${medicoData.apellido} es en ${timeBeforeMinutes} minutos`,
      userId: pacienteData.id,
      userRole: 'paciente',
      metadata: { turnoId, timeBeforeMinutes }
    });
  }

  static emergencyAlert(sectorId, mensaje, usuarioId, pacienteId = null) {
    // Alerta a todo el personal del sector
    this.createNotification({
      type: this.TYPES.EMERGENCY,
      priority: this.PRIORITIES.CRITICAL,
      title: 'EMERGENCIA EN SECTOR',
      message: mensaje,
      sectorId: sectorId,
      pacienteId: pacienteId,
      metadata: { 
        timestamp: new Date(),
        reportedBy: usuarioId,
        requiresImmediate: true
      },
      actions: [
        { label: 'Responder', url: `/emergencias/responder` },
        { label: 'Ver Sector', url: `/sectores/${sectorId}` }
      ]
    });
  }

  static admissionAlert(admisionId, pacienteData, tipoAdmision) {
    let priority = this.PRIORITIES.MEDIUM;
    let type = this.TYPES.INFO;

    if (tipoAdmision === 'EMERGENCIA') {
      priority = this.PRIORITIES.HIGH;
      type = this.TYPES.EMERGENCY;
    }

    this.createNotification({
      type: type,
      priority: priority,
      title: `Nueva ${tipoAdmision}`,
      message: `Paciente ${pacienteData.nombre} ${pacienteData.apellido} (DNI: ${pacienteData.dni}) admitido`,
      pacienteId: pacienteData.id,
      metadata: { 
        admisionId,
        tipoAdmision,
        timestamp: new Date()
      },
      actions: [
        { label: 'Ver Admisión', url: `/admisiones/${admisionId}` },
        { label: 'Evaluar', url: `/evaluaciones/nueva/${pacienteData.id}` }
      ]
    });
  }

  static medicationReminder(pacienteId, medicamento, dosis, proximaDosis) {
    this.createNotification({
      type: this.TYPES.MEDICAL,
      priority: this.PRIORITIES.MEDIUM,
      title: 'Recordatorio de Medicación',
      message: `Administrar ${medicamento} - ${dosis} a paciente ID ${pacienteId}`,
      pacienteId: pacienteId,
      metadata: { 
        medicamento,
        dosis,
        proximaDosis,
        tipo: 'medicacion'
      },
      actions: [
        { label: 'Registrar Administración', url: `/medicaciones/administrar/${pacienteId}` },
        { label: 'Ver Paciente', url: `/pacientes/${pacienteId}` }
      ]
    });
  }

  // Gestión de notificaciones
  static getNotificationsForUser(userId, userRole = null, limit = 20) {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => {
        if (notification.userId && notification.userId !== userId) return false;
        if (userRole && notification.userRole && notification.userRole !== userRole) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return userNotifications;
  }

  static getNotificationsForSector(sectorId, limit = 20) {
    const sectorNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.sectorId === sectorId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return sectorNotifications;
  }

  static markAsRead(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (notification && (notification.userId === userId || !notification.userId)) {
      notification.read = true;
      return true;
    }
    return false;
  }

  static deleteNotification(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (notification && (notification.userId === userId || !notification.userId)) {
      this.notifications.delete(notificationId);
      return true;
    }
    return false;
  }

  // Sistema de suscripción (para tiempo real)
  static subscribe(userId, callback) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }
    this.subscribers.get(userId).push(callback);
  }

  static unsubscribe(userId, callback) {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      const index = userSubscribers.indexOf(callback);
      if (index > -1) {
        userSubscribers.splice(index, 1);
      }
    }
  }

  static broadcastNotification(notification) {
    // Enviar a usuario específico
    if (notification.userId) {
      const userSubscribers = this.subscribers.get(notification.userId);
      if (userSubscribers) {
        userSubscribers.forEach(callback => callback(notification));
      }
    }

    // Enviar a todos los del sector
    if (notification.sectorId) {
      this.subscribers.forEach((callbacks, userId) => {
        // Aquí podrías verificar si el usuario pertenece al sector
        callbacks.forEach(callback => callback(notification));
      });
    }
  }

  // Estadísticas
  static getNotificationStats(userId) {
    const userNotifications = this.getNotificationsForUser(userId);
    
    const stats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      byType: {},
      byPriority: {},
      recent: userNotifications.filter(n => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(n.timestamp) > hourAgo;
      }).length
    };

    // Agrupar por tipo
    Object.values(this.TYPES).forEach(type => {
      stats.byType[type] = userNotifications.filter(n => n.type === type).length;
    });

    // Agrupar por prioridad
    Object.values(this.PRIORITIES).forEach(priority => {
      stats.byPriority[priority] = userNotifications.filter(n => n.priority === priority).length;
    });

    return stats;
  }

  // Limpiar notificaciones antiguas
  static cleanOldNotifications(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    this.notifications.forEach((notification, id) => {
      if (new Date(notification.timestamp) < cutoffDate) {
        this.notifications.delete(id);
        cleaned++;
      }
    });

    return { cleaned, remaining: this.notifications.size };
  }

  // Utilidades
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Middleware para Express (notificaciones en tiempo real)
  static createMiddleware() {
    return (req, res, next) => {
      // Agregar métodos de notificación al request
      req.notify = {
        success: (message, title = 'Éxito') => {
          if (req.user) {
            this.createNotification({
              type: this.TYPES.SUCCESS,
              priority: this.PRIORITIES.LOW,
              title,
              message,
              userId: req.user.id
            });
          }
        },
        warning: (message, title = 'Advertencia') => {
          if (req.user) {
            this.createNotification({
              type: this.TYPES.WARNING,
              priority: this.PRIORITIES.MEDIUM,
              title,
              message,
              userId: req.user.id
            });
          }
        },
        error: (message, title = 'Error') => {
          if (req.user) {
            this.createNotification({
              type: this.TYPES.EMERGENCY,
              priority: this.PRIORITIES.HIGH,
              title,
              message,
              userId: req.user.id
            });
          }
        }
      };
      
      next();
    };
  }

  // Configurar notificaciones automáticas
  static setupAutomaticNotifications() {
    // Verificar signos vitales críticos cada 5 minutos
    setInterval(() => {
      this.checkCriticalPatients();
    }, 5 * 60 * 1000);

    // Limpiar notificaciones antiguas cada día
    setInterval(() => {
      this.cleanOldNotifications();
    }, 24 * 60 * 60 * 1000);

    // Recordatorios de turnos cada minuto
    setInterval(() => {
      this.checkUpcomingAppointments();
    }, 60 * 1000);
  }

  static async checkCriticalPatients() {
    // Esta función se ejecutaría con acceso a la base de datos
    // para verificar pacientes con signos vitales críticos
    console.log('Verificando pacientes críticos...');
  }

  static async checkUpcomingAppointments() {
    // Esta función verificaría turnos próximos y enviaría recordatorios
    console.log('Verificando turnos próximos...');
  }
}

module.exports = NotificationService;