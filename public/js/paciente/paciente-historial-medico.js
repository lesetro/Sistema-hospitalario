/**
 * HISTORIAL MÉDICO DEL PACIENTE - JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Animaciones para la timeline
  animarTimeline();

  console.log('Módulo de historial médico cargado');
});

/**
 * Animar elementos de la timeline al hacer scroll
 */
function animarTimeline() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateX(-20px)';
        entry.target.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }, 100);
      }
    });
  }, { threshold: 0.1 });

  timelineItems.forEach(item => {
    observer.observe(item);
  });
}

/**
 * Exportar historial a PDF (futuro)
 */
function exportarPDF() {
  window.print();
}

/**
 * Buscar en historial
 */
function buscarEnHistorial(termino) {
  const items = document.querySelectorAll('.timeline-item');
  
  items.forEach(item => {
    const texto = item.textContent.toLowerCase();
    if (texto.includes(termino.toLowerCase())) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

window.exportarPDF = exportarPDF;
window.buscarEnHistorial = buscarEnHistorial;
