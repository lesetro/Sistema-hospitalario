// ============================================
// VER ÓRDENES MÉDICAS DEL PACIENTE
// ============================================

async function verOrdenesMedicas(pacienteId, pacienteNombre) {
  const modal = new bootstrap.Modal(document.getElementById('modalOrdenesMedicas'));
  const contenido = document.getElementById('contenido-ordenes-medicas');
  
  // Mostrar modal con loader
  contenido.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando órdenes médicas...</p>
    </div>
  `;
  
  modal.show();
  
  try {
    const response = await fetch(`/enfermero/internados/api/paciente/${pacienteId}/ordenes`);
    const result = await response.json();
    
    if (result.success) {
      mostrarOrdenes(result.ordenes, result.internacion_id);
    } else {
      contenido.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          ${result.message}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar órdenes:', error);
    contenido.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-times-circle me-2"></i>
        Error al cargar las órdenes médicas
      </div>
    `;
  }
}

function mostrarOrdenes(ordenes, internacionId, internacion) {
  const contenido = document.getElementById('contenido-ordenes-medicas');
  
  if (ordenes.length === 0) {
    contenido.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fas fa-inbox fa-4x mb-3"></i>
        <h5>No hay órdenes pendientes</h5>
        <p>El médico no ha creado órdenes para este paciente</p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="list-group">';
  
  ordenes.forEach(orden => {
    const badgeColor = orden.prioridad === 'URGENTE' ? 'danger' : orden.prioridad === 'ALTA' ? 'warning' : 'secondary';
    const iconoPrioridad = orden.prioridad === 'URGENTE' ? 'exclamation-triangle' : orden.prioridad === 'ALTA' ? 'exclamation-circle' : 'info-circle';
    
    html += `
      <div class="list-group-item mb-3 border-0 shadow-sm">
        <div class="card border-0">
          <div class="card-header bg-${badgeColor} bg-opacity-10 d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="fas fa-${iconoPrioridad} text-${badgeColor} me-2"></i>
              Orden Médica #${orden.id}
            </h6>
            <span class="badge bg-${badgeColor}">${orden.prioridad}</span>
          </div>
          
          <div class="card-body">
            <div class="mb-3">
              <small class="text-muted d-block mb-2">
                <i class="fas fa-user-md me-1"></i> ${orden.medico}
                <span class="mx-2">|</span>
                <i class="fas fa-calendar me-1"></i> ${new Date(orden.fecha).toLocaleString('es-AR')}
              </small>
            </div>
            
            <div class="mb-3">
              <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.95rem; background-color: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin: 0; border-left: 4px solid ${orden.prioridad === 'URGENTE' ? '#dc3545' : orden.prioridad === 'ALTA' ? '#ffc107' : '#6c757d'};">${orden.observaciones.substring(0, 200)}${orden.observaciones.length > 200 ? '...' : ''}</pre>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
             
              <a href="/enfermero/internados/orden/${orden.id}" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-eye me-1"></i>
                Ver Detalle Completo
              </a>
              <button class="btn btn-success btn-sm" onclick="ejecutarOrden(${orden.id})">
                <i class="fas fa-check me-1"></i>
                Ejecutar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  contenido.innerHTML = html;
}

// ============================================
// EJECUTAR ORDEN MÉDICA
// ============================================

async function ejecutarOrden(ordenId) {
  const observaciones = prompt('Ingrese observaciones sobre la ejecución de la orden:');
  
  if (observaciones === null) {
    return; // Usuario canceló
  }
  
  // Preguntar si hubo complicaciones
  const huboComplicaciones = confirm('¿Hubo alguna complicación durante la ejecución?');
  let complicaciones = null;
  
  if (huboComplicaciones) {
    complicaciones = prompt('Describa las complicaciones:');
    if (!complicaciones) {
      alert('Debe describir las complicaciones');
      return;
    }
  }
  
  const data = {
    observaciones_ejecucion: observaciones || 'Orden ejecutada correctamente',
    complicaciones: complicaciones
  };
  
  try {
    const response = await fetch(`/enfermero/internados/orden/${ordenId}/ejecutar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      
      if (result.tiene_complicaciones) {
        alert('⚠️ IMPORTANTE: Se registraron complicaciones.\n\nSe ha notificado al médico para que evalúe al paciente.');
      }
      
      // Cerrar modal y recargar
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalOrdenesMedicas'));
      modal.hide();
      window.location.reload();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al ejecutar la orden');
  }
}

// ============================================
// REGISTRAR EVOLUCIÓN
// ============================================

const formEvolucion = document.getElementById('form-registrar-evolucion');
if (formEvolucion) {
  formEvolucion.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    if (!data.observaciones || data.observaciones.trim() === '') {
      alert('Por favor ingrese las observaciones');
      return;
    }
    
    try {
      const response = await fetch(this.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Evolución registrada correctamente');
        window.location.reload();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar la evolución');
    }
  });
}

// ============================================
// ACTUALIZAR ESTADO
// ============================================

const formEstado = document.getElementById('form-actualizar-estado');
if (formEstado) {
  formEstado.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    if (!data.estado_paciente) {
      alert('Por favor seleccione el nuevo estado');
      return;
    }
    
    // Confirmación especial para estado crítico
    if (data.estado_paciente === 'Critico') {
      const confirmado = confirm('⚠️ ATENCIÓN\n\n¿Confirma que el paciente está en estado CRÍTICO?\n\nEsto notificará al médico de inmediato.');
      if (!confirmado) {
        return;
      }
    }
    
    try {
      const response = await fetch(this.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Estado actualizado correctamente');
        window.location.reload();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
  });
}

// ============================================
// AUTO-REFRESH DE ÓRDENES (opcional)
// ============================================

// Refrescar órdenes cada 5 minutos
let intervaloRefresh;

function iniciarAutoRefresh() {
  intervaloRefresh = setInterval(() => {
    console.log('Auto-refresh de órdenes médicas');
    
  }, 300000); // 5 minutos
}

// Detener auto-refresh al salir de la página
window.addEventListener('beforeunload', function() {
  if (intervaloRefresh) {
    clearInterval(intervaloRefresh);
  }
});

// Iniciar auto-refresh al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  iniciarAutoRefresh();
});