// Funciones para gestión de camas
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Vista cards/table
  const vistaCards = document.getElementById('vista-cards');
  const vistaTabla = document.getElementById('vista-tabla');
  const btnTabla = document.getElementById('btn-tabla');
  const btnCards = document.getElementById('btn-cards');

  if (btnTabla && btnCards) {
    btnTabla.addEventListener('click', vistaTablaFunc);
    btnCards.addEventListener('click', vistaCardsFunc);
  }
});

function vistaTabla() {
  document.getElementById('vista-cards').style.display = 'none';
  document.getElementById('vista-tabla').style.display = 'block';
  document.getElementById('btn-tabla').classList.add('active');
  document.getElementById('btn-cards').classList.remove('active');
}

function vistaCards() {
  document.getElementById('vista-cards').style.display = 'block';
  document.getElementById('vista-tabla').style.display = 'none';
  document.getElementById('btn-tabla').classList.remove('active');
  document.getElementById('btn-cards').classList.add('active');
}

function limpiarFiltros() {
  document.getElementById('form-filtros').reset();
  window.location.href = '/enfermero/camas';
}

// Ver camas disponibles
function verDisponibles() {
  const modal = new bootstrap.Modal(document.getElementById('modalDisponibles'));
  const contenido = document.getElementById('contenido-disponibles');
  
  contenido.innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  `;
  
  modal.show();
  
  fetch('/enfermero/camas/disponibles')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        let html = `
          <div class="row">
            <div class="col-12">
              <div class="alert alert-success">
                <i class="fas fa-bed me-2"></i>
                <strong>${data.total} camas disponibles</strong>
              </div>
            </div>
          </div>
        `;
        
        if (data.camas.length > 0) {
          html += `
            <div class="row g-3">
          `;
          
          data.camas.forEach(cama => {
            html += `
              <div class="col-md-4 col-sm-6">
                <div class="card border-success h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-bed fa-2x text-success mb-2"></i>
                    <h5 class="card-title">Cama ${cama.numero}</h5>
                    <p class="card-text">
                      <small class="text-muted">Hab. ${cama.habitacion}</small><br>
                      <small class="text-muted">${cama.sector}</small><br>
                      <small class="text-muted">${cama.tipo_servicio}</small>
                    </p>
                    <a href="/enfermero/camas/${cama.id}" class="btn btn-outline-success btn-sm">
                      <i class="fas fa-eye me-1"></i>Ver Detalle
                    </a>
                  </div>
                </div>
              </div>
            `;
          });
          
          html += `</div>`;
        } else {
          html += `
            <div class="text-center py-5 text-muted">
              <i class="fas fa-bed fa-4x mb-3"></i>
              <h5>No hay camas disponibles</h5>
              <p>Todas las camas están ocupadas o en limpieza</p>
            </div>
          `;
        }
        
        contenido.innerHTML = html;
      } else {
        contenido.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error: ${data.message}
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      contenido.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar las camas disponibles
        </div>
      `;
    });
}

// Ver camas por limpiar
function verCamasPorLimpiar() {
  const modal = new bootstrap.Modal(document.getElementById('modalPorLimpiar'));
  const contenido = document.getElementById('contenido-por-limpiar');
  
  contenido.innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  `;
  
  modal.show();
  
  fetch('/enfermero/camas/por-limpiar')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        let html = `
          <div class="row">
            <div class="col-12">
              <div class="alert alert-warning">
                <i class="fas fa-broom me-2"></i>
                <strong>${data.total} camas por limpiar</strong>
              </div>
            </div>
          </div>
        `;
        
        if (data.camas.length > 0) {
          html += `
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Cama</th>
                    <th>Habitación</th>
                    <th>Sector</th>
                    <th>Tiempo Restante</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          data.camas.forEach(cama => {
            html += `
              <tr>
                <td><strong>${cama.numero}</strong></td>
                <td>${cama.habitacion}</td>
                <td>${cama.sector}</td>
                <td>
                  ${cama.tiempo_restante} minutos
                  <br>
                  <small class="text-muted">${new Date(cama.fecha_fin_estimada).toLocaleTimeString('es-AR')}</small>
                </td>
                <td>
                  <button class="btn btn-sm btn-success" onclick="liberarCamaDesdeModal(${cama.id})">
                    <i class="fas fa-check"></i> Liberar
                  </button>
                </td>
              </tr>
            `;
          });
          
          html += `
                </tbody>
              </table>
            </div>
          `;
        } else {
          html += `
            <div class="text-center py-5 text-muted">
              <i class="fas fa-check-circle fa-4x mb-3 text-success"></i>
              <h5>Todas las camas están limpias</h5>
              <p>No hay camas pendientes de limpieza</p>
            </div>
          `;
        }
        
        contenido.innerHTML = html;
      } else {
        contenido.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error: ${data.message}
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      contenido.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar las camas por limpiar
        </div>
      `;
    });
}

function liberarCamaDesdeModal(id) {
  if (confirm('¿Está seguro de marcar esta cama como limpia?')) {
    fetch(`/enfermero/camas/${id}/liberar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Cama liberada correctamente');
        verCamasPorLimpiar(); // Recargar la lista
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al liberar la cama');
    });
  }
}

// Función para cambiar estado desde la vista cards
function cambiarEstado(id) {
  document.getElementById('estado-cama-id').value = id;
  const modal = new bootstrap.Modal(document.getElementById('modalCambiarEstado'));
  modal.show();
}

// Función para guardar cambio de estado
function guardarEstado() {
  const camaId = document.getElementById('estado-cama-id').value;
  const nuevoEstado = document.getElementById('nuevo-estado').value;
  const motivo = document.getElementById('estado-motivo').value;

  if (!nuevoEstado) {
    alert('Seleccione un estado');
    return;
  }

  fetch(`/enfermero/camas/${camaId}/cambiar-estado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nuevo_estado: nuevoEstado,
      motivo: motivo
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      window.location.reload();
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al cambiar estado');
  });

}
// ===========================================================================
// ASIGNAR PACIENTE A CAMA
// ===========================================================================

function abrirModalAsignarDesdeDisponibles(camaId, camaNumero, sexoPermitido, servicioNombre) {
  // Cerrar modal de disponibles si está abierto
  const modalDisponibles = bootstrap.Modal.getInstance(document.getElementById('modalDisponibles'));
  if (modalDisponibles) {
    modalDisponibles.hide();
  }
  
  // Abrir modal de asignación (debe existir en la página principal)
  setTimeout(() => {
    if (typeof abrirModalAsignar === 'function') {
      abrirModalAsignar(camaId, camaNumero, sexoPermitido, servicioNombre);
    } else {
      window.location.href = `/enfermero/camas/disponibles?asignar=${camaId}`;
    }
  }, 300);
}
