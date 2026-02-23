/**
 * LISTA DE ESPERA DEL PACIENTE - JavaScript
 */

let solicitudIdParaCancelar = null;

document.addEventListener('DOMContentLoaded', function() {
  
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Botón de confirmación de cancelación
  const btnConfirmarCancelacion = document.getElementById('btnConfirmarCancelacion');
  if (btnConfirmarCancelacion) {
    btnConfirmarCancelacion.addEventListener('click', confirmarCancelacion);
  }

  // Actualizar información periódicamente
  setInterval(verificarActualizaciones, 60000); // cada 60 segundos

  console.log('Módulo de lista de espera cargado');
});

/**
 * Mostrar modal de cancelación
 */
function mostrarModalCancelar(solicitudId) {
  solicitudIdParaCancelar = solicitudId;
  const modal = new bootstrap.Modal(document.getElementById('modalCancelarSolicitud'));
  document.getElementById('motivoCancelacion').value = '';
  modal.show();
}

/**
 * Confirmar cancelación de solicitud
 */
async function confirmarCancelacion() {
  if (!solicitudIdParaCancelar) {
    mostrarNotificacion('Error: No se identificó la solicitud a cancelar', 'danger');
    return;
  }

  const motivo = document.getElementById('motivoCancelacion').value.trim();
  const btnConfirmar = document.getElementById('btnConfirmarCancelacion');
  
  // Deshabilitar botón
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cancelando...';

  try {
    const response = await fetch(`/paciente/lista-espera/${solicitudIdParaCancelar}/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo })
    });

    const data = await response.json();

    if (data.success) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelarSolicitud'));
      modal.hide();

      // Mostrar mensaje de éxito
      mostrarNotificacion(data.message, 'success');

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '/paciente/lista-espera';
      }, 2000);
    } else {
      mostrarNotificacion(data.message || 'Error al cancelar la solicitud', 'danger');
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i>Sí, cancelar solicitud';
    }

  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    mostrarNotificacion('Error de conexión al cancelar la solicitud', 'danger');
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i>Sí, cancelar solicitud';
  }
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
  window.location.href = '/paciente/lista-espera';
}

/**
 * Verificar actualizaciones de solicitudes
 */
async function verificarActualizaciones() {
  try {
    const response = await fetch('/paciente/lista-espera/activas');
    const data = await response.json();

    if (data.success) {
      // Actualizar contador en el badge del sidebar
      const badge = document.getElementById('badge-lista-espera');
      if (badge) {
        if (data.total > 0) {
          badge.textContent = data.total;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      // Verificar si hay cambios importantes (turno asignado)
      data.solicitudes.forEach(solicitud => {
        if (solicitud.estado === 'ASIGNADO' && solicitud.turno_id) {
          // Si estamos en la página de lista, podría ser útil notificar
          mostrarNotificacionSuave('Tienes un turno asignado', 'success');
        }
      });
    }
  } catch (error) {
    console.error('Error al verificar actualizaciones:', error);
  }
}

/**
 * Mostrar notificación suave (sin sonido, menos intrusiva)
 */
function mostrarNotificacionSuave(mensaje, tipo = 'info') {
  // Solo mostrar si no hay otras notificaciones visibles
  const toastsExistentes = document.querySelectorAll('.toast.show');
  if (toastsExistentes.length > 0) {
    return;
  }

  mostrarNotificacion(mensaje, tipo);
}

/**
 * Mostrar notificación toast
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toastHTML = `
    <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'danger' ? 'fa-exclamation-circle' : tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
          ${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = toastContainer.lastElementChild;
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

/**
 * Calcular tiempo de espera legible
 */
function calcularTiempoEspera(fechaRegistro) {
  const ahora = new Date();
  const registro = new Date(fechaRegistro);
  const diferencia = ahora - registro;
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) {
    return `${dias} día${dias > 1 ? 's' : ''}`;
  } else if (horas > 0) {
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  } else {
    return 'Menos de una hora';
  }
}

/**
 * Mostrar spinner de carga
 */
function mostrarSpinner() {
  let spinner = document.getElementById('spinner-overlay');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'spinner-overlay';
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    `;
    document.body.appendChild(spinner);
  }
  spinner.style.display = 'flex';
}

/**
 * Ocultar spinner de carga
 */
function ocultarSpinner() {
  const spinner = document.getElementById('spinner-overlay');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

/**
 * Formatear fecha de manera legible
 */
function formatearFecha(fecha) {
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(fecha).toLocaleDateString('es-AR', opciones);
}

/**
 * Obtener badge de prioridad
 */
function obtenerBadgePrioridad(prioridad) {
  const badges = {
    'ALTA': '<span class="badge bg-danger">ALTA</span>',
    'MEDIA': '<span class="badge bg-warning">MEDIA</span>',
    'BAJA': '<span class="badge bg-secondary">BAJA</span>'
  };
  return badges[prioridad] || '<span class="badge bg-secondary">-</span>';
}

/**
 * Obtener badge de estado
 */
function obtenerBadgeEstado(estado) {
  const badges = {
    'PENDIENTE': '<span class="badge bg-warning">PENDIENTE</span>',
    'ASIGNADO': '<span class="badge bg-primary">ASIGNADO</span>',
    'COMPLETADO': '<span class="badge bg-success">COMPLETADO</span>',
    'CANCELADO': '<span class="badge bg-danger">CANCELADO</span>'
  };
  return badges[estado] || '<span class="badge bg-secondary">-</span>';
}

// Exportar funciones globalmente
window.mostrarModalCancelar = mostrarModalCancelar;
window.limpiarFiltros = limpiarFiltros;
window.mostrarNotificacion = mostrarNotificacion;
