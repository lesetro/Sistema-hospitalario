// Dashboard de Enfermería - Script principal

document.addEventListener('DOMContentLoaded', function() {
  cargarNotificaciones();
  actualizarEstadisticas();
  
  // Actualizar cada 30 segundos
  setInterval(() => {
    cargarNotificaciones();
    actualizarEstadisticas();
  }, 30000);
});

// Cargar notificaciones pendientes
async function cargarNotificaciones() {
  try {
    const response = await fetch('/enfermero/api/notificaciones');
    const data = await response.json();
    
    if (data.success && data.notificaciones.length > 0) {
      mostrarNotificaciones(data.notificaciones);
      actualizarBadges(data.notificaciones);
    }
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

// Mostrar notificaciones en el dashboard
function mostrarNotificaciones(notificaciones) {
  const container = document.getElementById('notificaciones-container');
  
  let html = '<div class="col-12"><div class="alert alert-warning shadow-sm border-0"><h6 class="alert-heading"><i class="fas fa-bell me-2"></i>Notificaciones Pendientes</h6><hr><ul class="mb-0">';
  
  notificaciones.forEach(notif => {
    html += `
      <li class="mb-2">
        <i class="fas ${notif.icono} me-2"></i>
        <strong>${notif.mensaje}</strong>
        <a href="${notif.url}" class="btn btn-sm btn-warning ms-2">
          <i class="fas fa-arrow-right"></i> Atender
        </a>
      </li>
    `;
  });
  
  html += '</ul></div></div>';
  container.innerHTML = html;
}

// Actualizar badges del menú
function actualizarBadges(notificaciones) {
  notificaciones.forEach(notif => {
    if (notif.tipo === 'critico') {
      const badge = document.getElementById('badge-triaje-pendientes');
      if (badge) {
        badge.textContent = notif.cantidad;
        badge.style.display = 'inline-block';
      }
    }
  });
}

// Actualizar estadísticas en tiempo real
async function actualizarEstadisticas() {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const response = await fetch(`/enfermero/api/resumen-actividad?fecha_inicio=${hoy}&fecha_fin=${hoy}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Estadísticas actualizadas:', data.resumen);
    }
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }
}

// Función para mostrar detalles de evaluación
function verEvaluacion(id) {
  window.location.href = `/enfermero/evaluaciones/${id}`;
}

// Función para atender paciente crítico
function atenderPacienteCritico(id) {
  if (confirm('¿Desea atender a este paciente crítico ahora?')) {
    window.location.href = `/enfermero/triaje/${id}`;
  }
}