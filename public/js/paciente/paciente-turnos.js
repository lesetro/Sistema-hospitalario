/**
 * GESTIÓN DE TURNOS DEL PACIENTE - JavaScript
 */

let turnoIdParaCancelar = null;

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

  // Auto-submit de filtros al cambiar
  const selectEstado = document.querySelector('select[name="estado"]');
  if (selectEstado) {
    selectEstado.addEventListener('change', function() {
      // Opcional: auto-submit del formulario
      // document.getElementById('formFiltros').submit();
    });
  }

  console.log('Módulo de turnos del paciente cargado');
});

/**
 * Mostrar modal de cancelación
 */
function mostrarModalCancelar(turnoId) {
  turnoIdParaCancelar = turnoId;
  const modal = new bootstrap.Modal(document.getElementById('modalCancelarTurno'));
  document.getElementById('motivoCancelacion').value = '';
  modal.show();
}

/**
 * Confirmar cancelación del turno
 */
async function confirmarCancelacion() {
  if (!turnoIdParaCancelar) {
    mostrarNotificacion('Error: No se identificó el turno a cancelar', 'danger');
    return;
  }

  const motivo = document.getElementById('motivoCancelacion').value.trim();
  const btnConfirmar = document.getElementById('btnConfirmarCancelacion');
  
  // Deshabilitar botón
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cancelando...';

  try {
    const response = await fetch(`/paciente/turnos/${turnoIdParaCancelar}/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo })
    });

    const data = await response.json();

    if (data.success) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelarTurno'));
      modal.hide();

      // Mostrar mensaje de éxito
      mostrarNotificacion(data.message, 'success');

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '/paciente/turnos';
      }, 2000);
    } else {
      mostrarNotificacion(data.message || 'Error al cancelar el turno', 'danger');
      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i>Sí, cancelar turno';
    }

  } catch (error) {
    console.error('Error al cancelar turno:', error);
    mostrarNotificacion('Error de conexión al cancelar el turno', 'danger');
    btnConfirmar.disabled = false;
    btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i>Sí, cancelar turno';
  }
}

/**
 * Confirmar un turno
 */
async function confirmarTurno(turnoId) {
  if (!confirm('¿Deseas confirmar este turno?')) {
    return;
  }

  // Mostrar indicador de carga
  mostrarSpinner();

  try {
    const response = await fetch(`/paciente/turnos/${turnoId}/confirmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    ocultarSpinner();

    if (data.success) {
      mostrarNotificacion(data.message, 'success');
      
      // Recargar la página después de 1.5 segundos
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      mostrarNotificacion(data.message || 'Error al confirmar el turno', 'danger');
    }

  } catch (error) {
    ocultarSpinner();
    console.error('Error al confirmar turno:', error);
    mostrarNotificacion('Error de conexión al confirmar el turno', 'danger');
  }
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
  window.location.href = '/paciente/turnos';
}

/**
 * Descargar información del turno (futuro: PDF)
 */
function descargarTurno(turnoId) {
  window.print();
}

/**
 * Compartir turno (futuro: compartir por WhatsApp, email, etc)
 */
function compartirTurno(turnoId) {
  if (navigator.share) {
    navigator.share({
      title: 'Mi turno médico',
      text: 'Información de mi turno',
      url: window.location.href
    }).catch(err => console.log('Error al compartir:', err));
  } else {
    copiarEnlace();
  }
}

/**
 * Copiar enlace del turno
 */
function copiarEnlace() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    mostrarNotificacion('Enlace copiado al portapapeles', 'success');
  }).catch(err => {
    console.error('Error al copiar:', err);
    mostrarNotificacion('Error al copiar enlace', 'danger');
  });
}

/**
 * Agregar recordatorio al calendario (futuro)
 */
function agregarACalendario(turnoId, fecha, hora, descripcion) {
  // Implementar integración con Google Calendar, iCal, etc
  mostrarNotificacion('Función en desarrollo', 'info');
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
 * Mostrar notificación toast
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toastHTML = `
    <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
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
 * Formatear fechas de manera legible
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
 * Calcular tiempo restante hasta el turno
 */
function calcularTiempoRestante(fecha, hora) {
  const fechaTurno = new Date(`${fecha}T${hora}`);
  const ahora = new Date();
  const diferencia = fechaTurno - ahora;
  
  if (diferencia < 0) {
    return 'Turno pasado';
  }
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) {
    return `Faltan ${dias} día${dias > 1 ? 's' : ''}`;
  } else if (horas > 0) {
    return `Faltan ${horas} hora${horas > 1 ? 's' : ''}`;
  } else {
    return 'Hoy';
  }
}

/**
 * Validar fechas de filtro
 */
function validarFiltroFechas() {
  const desde = document.querySelector('input[name="desde"]');
  const hasta = document.querySelector('input[name="hasta"]');
  
  if (desde && hasta && desde.value && hasta.value) {
    if (new Date(desde.value) > new Date(hasta.value)) {
      mostrarNotificacion('La fecha "Desde" no puede ser mayor que "Hasta"', 'warning');
      return false;
    }
  }
  return true;
}

// Exportar funciones globalmente
window.mostrarModalCancelar = mostrarModalCancelar;
window.confirmarTurno = confirmarTurno;
window.limpiarFiltros = limpiarFiltros;
window.descargarTurno = descargarTurno;
window.compartirTurno = compartirTurno;
window.agregarACalendario = agregarACalendario;