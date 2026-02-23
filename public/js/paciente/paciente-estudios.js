/**
 * ESTUDIOS DEL PACIENTE - JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Resaltar estudios urgentes
  resaltarUrgentes();

  console.log('Módulo de estudios cargado');
});

/**
 * Resaltar estudios urgentes
 */
function resaltarUrgentes() {
  const badgesUrgentes = document.querySelectorAll('.badge.bg-danger');
  badgesUrgentes.forEach(badge => {
    if (badge.textContent.includes('URGENTE')) {
      const item = badge.closest('.list-group-item');
      if (item) {
        item.classList.add('border-danger', 'border-2');
      }
    }
  });
}

/**
 * Descargar resultado de estudio
 */
function descargarResultado(estudioId) {
  // Futuro: implementar descarga de PDF con resultados
  mostrarNotificacion('Función de descarga en desarrollo', 'info');
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

window.descargarResultado = descargarResultado;
window.mostrarNotificacion = mostrarNotificacion;
