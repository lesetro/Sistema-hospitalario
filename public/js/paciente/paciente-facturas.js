/**
 * FACTURAS DEL PACIENTE - JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Actualizar facturas pendientes periódicamente
  actualizarFacturasPendientes();
  setInterval(actualizarFacturasPendientes, 60000);

  console.log('Módulo de facturas cargado');
});

/**
 * Actualizar facturas pendientes
 */
async function actualizarFacturasPendientes() {
  try {
    const response = await fetch('/paciente/facturas/pendientes');
    const data = await response.json();

    if (data.success) {
      // Actualizar badge en el sidebar
      const badge = document.getElementById('badge-facturas-pendientes');
      if (badge) {
        if (data.total > 0) {
          badge.textContent = data.total;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      // Actualizar badge en el header
      const headerBadge = document.getElementById('header-facturas-count');
      if (headerBadge) {
        if (data.total > 0) {
          headerBadge.textContent = data.total;
          headerBadge.style.display = 'inline-block';
        } else {
          headerBadge.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error al actualizar facturas pendientes:', error);
  }
}

/**
 * Descargar factura como PDF (futuro)
 */
function descargarFactura(facturaId) {
  // Abrir en nueva ventana para imprimir
  window.open(`/paciente/facturas/${facturaId}`, '_blank');
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toastHTML = `
    <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
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
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

window.actualizarFacturasPendientes = actualizarFacturasPendientes;
window.descargarFactura = descargarFactura;
window.mostrarNotificacion = mostrarNotificacion;
