/**
 * DASHBOARD DEL PACIENTE - JavaScript
 * Maneja la actualización de contadores y funcionalidades dinámicas
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Actualizar contadores cada 30 segundos
  actualizarContadores();
  setInterval(actualizarContadores, 30000);

  // Función para actualizar contadores
  async function actualizarContadores() {
    try {
      const response = await fetch('/paciente/resumen-rapido');
      const data = await response.json();

      if (data.success && data.contadores) {
        // Actualizar badges en el sidebar
        actualizarBadge('badge-turnos-proximos', data.contadores.turnosProximos);
        actualizarBadge('badge-facturas-pendientes', data.contadores.facturasPendientes);
        actualizarBadge('badge-notificaciones', data.contadores.notificacionesNoLeidas);

        // Actualizar badges en el header
        actualizarBadge('header-turnos-count', data.contadores.turnosProximos);
        actualizarBadge('header-facturas-count', data.contadores.facturasPendientes);
        actualizarBadge('header-contador-mensajes', data.contadores.notificacionesNoLeidas);
      }
    } catch (error) {
      console.error('Error al actualizar contadores:', error);
    }
  }

  // Función auxiliar para actualizar un badge
  function actualizarBadge(elementId, valor) {
    const badge = document.getElementById(elementId);
    if (badge) {
      if (valor > 0) {
        badge.textContent = valor;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Animación para las tarjetas de estadísticas
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'all 0.5s ease';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    }, index * 100);
  });

  // Tooltips de Bootstrap
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Confirmar acciones
  const botonesConfirmar = document.querySelectorAll('[data-confirm]');
  botonesConfirmar.forEach(boton => {
    boton.addEventListener('click', function(e) {
      const mensaje = this.getAttribute('data-confirm');
      if (!confirm(mensaje)) {
        e.preventDefault();
      }
    });
  });

  // Auto-cerrar alertas después de 5 segundos
  const alertas = document.querySelectorAll('.alert:not(.alert-permanent)');
  alertas.forEach(alerta => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alerta);
      bsAlert.close();
    }, 5000);
  });

  // Formatear montos
  const montos = document.querySelectorAll('.monto');
  montos.forEach(monto => {
    const valor = parseFloat(monto.textContent);
    if (!isNaN(valor)) {
      monto.textContent = '$' + valor.toFixed(2);
    }
  });

  // Resaltar próximo turno (el más cercano)
  const primerTurno = document.querySelector('.list-group-item');
  if (primerTurno) {
    primerTurno.classList.add('border-primary', 'border-2');
  }

  // Función para copiar texto
  window.copiarTexto = function(texto) {
    navigator.clipboard.writeText(texto).then(() => {
      mostrarNotificacion('Texto copiado al portapapeles', 'success');
    }).catch(err => {
      console.error('Error al copiar:', err);
      mostrarNotificacion('Error al copiar texto', 'danger');
    });
  };

  // Función para mostrar notificaciones toast
  function mostrarNotificacion(mensaje, tipo = 'info') {
    const toastHTML = `
      <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
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

  // Hacer función disponible globalmente
  window.mostrarNotificacion = mostrarNotificacion;

  // Cargar animaciones suaves
  const elementosAnimados = document.querySelectorAll('.card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, { threshold: 0.1 });

  elementosAnimados.forEach(elemento => {
    observer.observe(elemento);
  });

  console.log('Dashboard del paciente cargado correctamente');
});