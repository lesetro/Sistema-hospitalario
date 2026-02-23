(function() {
  'use strict';
  
  /**
   * SISTEMA DE NOTIFICACIONES MÉDICAS
   * 
   * Polling para verificar:
   * - Emergencias médicas pendientes
   * - Cirugías de urgencia pendientes
   * 
   * TODO: Migrar a SSE (Server-Sent Events) en v2.0.0
   */
  
  let intervaloVerificacion;
  let ultimoCountEmergencias = 0;
  let ultimoCountCirugias = 0;
  
  const CONFIG = {
    ENDPOINT_EMERGENCIAS: '/medico/emergencias/api/verificar-pendientes',
    ENDPOINT_CIRUGIAS: '/medico/emergencias/api/verificar-cirugias',
    INTERVALO_VERIFICACION: 15000,
    TIMEOUT_ALERTA: 10000,
    DEBUG: true
  };
  
  // ========================================
  // INICIALIZACIÓN
  // ========================================
  function inicializar() {
    log('🚨 Iniciando sistema de notificaciones médicas...');
    
    // Verificar inmediatamente
    verificarEmergenciasPendientes();
    verificarCirugiasPendientes();
    
    // Verificar periódicamente
    intervaloVerificacion = setInterval(() => {
      verificarEmergenciasPendientes();
      verificarCirugiasPendientes();
    }, CONFIG.INTERVALO_VERIFICACION);
    
    window.addEventListener('beforeunload', cleanup);
  }
  
  // ========================================
  // VERIFICAR EMERGENCIAS
  // ========================================
  async function verificarEmergenciasPendientes() {
    try {
      const response = await fetch(CONFIG.ENDPOINT_EMERGENCIAS, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (response.status === 401 || response.status === 403) {
        cleanup();
        window.location.href = '/auth/login?reason=session_expired';
        return;
      }

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        actualizarMenuEmergencias(data.hay_pendientes, data.count);

        if (data.count > ultimoCountEmergencias && data.count > 0) {
          mostrarNotificacion('emergencia', data.count);
        }

        ultimoCountEmergencias = data.count;
      }

    } catch (error) {
      console.error('❌ Error emergencias:', error.message);
    }
  }
  
  // ========================================
  // VERIFICAR CIRUGÍAS
  // ========================================
  async function verificarCirugiasPendientes() {
    try {
      const response = await fetch(CONFIG.ENDPOINT_CIRUGIAS, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        actualizarMenuCirugias(data.hay_pendientes, data.count);

        if (data.count > ultimoCountCirugias && data.count > 0) {
          mostrarNotificacion('cirugia', data.count);
        }

        ultimoCountCirugias = data.count;
      }

    } catch (error) {
      console.error('❌ Error cirugías:', error.message);
    }
  }
  
  // ========================================
  // ACTUALIZAR MENÚ EMERGENCIAS
  // ========================================
  function actualizarMenuEmergencias(hayPendientes, count) {
    const menuItem = document.querySelector('a[href="/medico/emergencias"]');
    if (!menuItem) return;
    
    menuItem.classList.remove('emergencia-activa', 'emergencia-titilando');
    
    if (hayPendientes && count > 0) {
      menuItem.classList.add('emergencia-activa', 'emergencia-titilando');
      
      let badge = menuItem.querySelector('.badge-emergencia');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge badge-emergencia bg-danger ms-2';
        badge.style.cssText = 'font-size: 0.7rem; animation: pulse 1.5s infinite;';
        menuItem.appendChild(badge);
      }
      badge.textContent = count;
      
      const icon = menuItem.querySelector('i');
      if (icon) icon.classList.add('text-danger');
    } else {
      const badge = menuItem.querySelector('.badge-emergencia');
      if (badge) badge.remove();
      
      const icon = menuItem.querySelector('i');
      if (icon) icon.classList.remove('text-danger');
    }
  }
  
  // ========================================
  // ACTUALIZAR MENÚ CIRUGÍAS
  // ========================================
  function actualizarMenuCirugias(hayPendientes, count) {
    // Buscar el item de intervenciones o cirugías
    let menuItem = document.querySelector('a[href*="/intervenciones"]');
    if (!menuItem) {
      menuItem = document.querySelector('a[href*="/cirugias"]');
    }
    if (!menuItem) return;
    
    menuItem.classList.remove('cirugia-activa', 'cirugia-titilando');
    
    if (hayPendientes && count > 0) {
      menuItem.classList.add('cirugia-activa', 'cirugia-titilando');
      
      let badge = menuItem.querySelector('.badge-cirugia');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge badge-cirugia bg-warning text-dark ms-2';
        badge.style.cssText = 'font-size: 0.7rem; animation: pulse 1.5s infinite;';
        menuItem.appendChild(badge);
      }
      badge.textContent = count;
      
      const icon = menuItem.querySelector('i');
      if (icon) icon.classList.add('text-warning');
    } else {
      const badge = menuItem.querySelector('.badge-cirugia');
      if (badge) badge.remove();
      
      const icon = menuItem.querySelector('i');
      if (icon) icon.classList.remove('text-warning');
    }
  }
  
  // ========================================
  // MOSTRAR NOTIFICACIONES
  // ========================================
  function mostrarNotificacion(tipo, count) {
    const esEmergencia = tipo === 'emergencia';
    const titulo = esEmergencia ? '🚨 Nueva Emergencia' : '🔪 Cirugía de Urgencia';
    const mensaje = esEmergencia 
      ? `Hay ${count} paciente(s) esperando atención urgente`
      : `Hay ${count} paciente(s) esperando cirugía de urgencia`;
    const color = esEmergencia ? 'danger' : 'warning';
    const textColor = esEmergencia ? 'text-white' : 'text-dark';
    const link = esEmergencia ? '/medico/emergencias' : '/medico/intervenciones';
    const icono = esEmergencia ? 'fa-ambulance' : 'fa-procedures';
    
    // Notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: mensaje,
        tag: `${tipo}-${Date.now()}`,
        requireInteraction: true
      });
    }
    
    // Toast en página
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    
    container.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-header bg-${color} ${textColor}">
          <i class="fas ${icono} me-2"></i>
          <strong class="me-auto">${titulo}</strong>
          <button type="button" class="btn-close ${esEmergencia ? 'btn-close-white' : ''}" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          <p class="mb-2">${mensaje}</p>
          <a href="${link}" class="btn btn-sm btn-${color} ${textColor} w-100">
            <i class="fas fa-eye me-1"></i>
            Ver ${esEmergencia ? 'Emergencias' : 'Cirugías'}
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), CONFIG.TIMEOUT_ALERTA);
  }
  
  // ========================================
  // ESTILOS
  // ========================================
  function inyectarEstilos() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes notif-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      
      .emergencia-activa {
        background-color: rgba(220, 53, 69, 0.1) !important;
        border-left: 4px solid #dc3545 !important;
      }
      
      .emergencia-titilando {
        animation: notif-pulse 2s ease-in-out infinite !important;
      }
      
      .cirugia-activa {
        background-color: rgba(255, 193, 7, 0.15) !important;
        border-left: 4px solid #ffc107 !important;
      }
      
      .cirugia-titilando {
        animation: notif-pulse 2s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // ========================================
  // UTILIDADES
  // ========================================
  function cleanup() {
    if (intervaloVerificacion) {
      clearInterval(intervaloVerificacion);
    }
  }
  
  function log(mensaje) {
    if (CONFIG.DEBUG) {
      console.log(`[Notificaciones] ${mensaje}`);
    }
  }
  
  function solicitarPermisosNotificacion() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  // ========================================
  // AUTO-INICIO
  // ========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      inyectarEstilos();
      solicitarPermisosNotificacion();
      inicializar();
    });
  } else {
    inyectarEstilos();
    solicitarPermisosNotificacion();
    inicializar();
  }
  
})();