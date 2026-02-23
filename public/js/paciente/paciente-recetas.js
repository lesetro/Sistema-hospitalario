/**
 * RECETAS Y CERTIFICADOS DEL PACIENTE - JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  console.log('Módulo de recetas y certificados cargado');
});

/**
 * Imprimir documento
 */
function imprimirDocumento(documentoId) {
  window.open(`/paciente/recetas/${documentoId}`, '_blank');
  setTimeout(() => {
    window.print();
  }, 500);
}

/**
 * Descargar documento como PDF (futuro)
 */
function descargarPDF(documentoId) {
  mostrarNotificacion('Función de descarga en desarrollo', 'info');
}

/**
 * Compartir documento (futuro)
 */
function compartirDocumento(documentoId) {
  if (navigator.share) {
    navigator.share({
      title: 'Documento médico',
      text: 'Compartir documento',
      url: window.location.href
    }).catch(err => console.log('Error al compartir:', err));
  } else {
    mostrarNotificacion('Función de compartir no disponible en este navegador', 'warning');
  }
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toastHTML = `
    <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
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

window.imprimirDocumento = imprimirDocumento;
window.descargarPDF = descargarPDF;
window.compartirDocumento = compartirDocumento;
window.mostrarNotificacion = mostrarNotificacion;
