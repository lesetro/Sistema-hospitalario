// Gestión de Camas

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    input.value = '';
  });
  form.submit();
}

// Cambiar vista
function vistaTabla() {
  document.getElementById('vista-cards').style.display = 'none';
  document.getElementById('vista-tabla').style.display = 'block';
  document.getElementById('btn-cards').classList.remove('active');
  document.getElementById('btn-tabla').classList.add('active');
}

function vistaCards() {
  document.getElementById('vista-tabla').style.display = 'none';
  document.getElementById('vista-cards').style.display = 'block';
  document.getElementById('btn-tabla').classList.remove('active');
  document.getElementById('btn-cards').classList.add('active');
}

// Cambiar estado de cama
function cambiarEstado(camaId) {
  document.getElementById('estado-cama-id').value = camaId;
  const modal = new bootstrap.Modal(document.getElementById('modalCambiarEstado'));
  modal.show();
}

// Guardar estado
async function guardarEstado() {
  const camaId = document.getElementById('estado-cama-id').value;
  const datos = {
    nuevo_estado: document.getElementById('nuevo-estado').value,
    motivo: document.getElementById('estado-motivo').value
  };
  
  if (!datos.nuevo_estado) {
    alert('Seleccione un estado');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/camas/${camaId}/cambiar-estado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al cambiar estado');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar el estado');
  }
}

// Liberar cama
async function liberarCama(camaId) {
  if (!confirm('¿Confirma que la limpieza ha finalizado?')) {
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/camas/${camaId}/liberar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al liberar cama');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al liberar la cama');
  }
}

// Ver camas disponibles
async function verDisponibles() {
  const modal = new bootstrap.Modal(document.getElementById('modalDisponibles'));
  modal.show();
  
  try {
    const response = await fetch('/enfermero/camas/api/buscar-disponibles');
    const data = await response.json();
    
    if (data.success) {
      mostrarDisponibles(data.camas);
    } else {
      document.getElementById('contenido-disponibles').innerHTML = '<p class="text-center text-muted">No hay camas disponibles</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-disponibles').innerHTML = '<p class="text-center text-danger">Error al cargar datos</p>';
  }
}

// Mostrar camas disponibles
function mostrarDisponibles(camas) {
  if (camas.length === 0) {
    document.getElementById('contenido-disponibles').innerHTML = '<p class="text-center text-muted">No hay camas disponibles</p>';
    return;
  }
  
  let html = '<div class="row g-3">';
  
  camas.forEach(cama => {
    html += `
      <div class="col-md-4">
        <div class="card border-success">
          <div class="card-body text-center">
            <i class="fas fa-bed fa-2x text-success mb-2"></i>
            <h5>Habitación ${cama.habitacion} - Cama ${cama.numero}</h5>
            <p class="mb-1"><small>${cama.sector}</small></p>
            <p class="mb-0"><small class="text-muted">${cama.tipo_servicio}</small></p>
            <a href="/enfermero/camas/${cama.id}" class="btn btn-sm btn-success mt-2">
              <i class="fas fa-eye me-1"></i> Ver Detalle
            </a>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('contenido-disponibles').innerHTML = html;
}

// Ver camas por limpiar
async function verCamasPorLimpiar() {
  const modal = new bootstrap.Modal(document.getElementById('modalPorLimpiar'));
  modal.show();
  
  try {
    const response = await fetch('/enfermero/camas/api/por-limpiar');
    const data = await response.json();
    
    if (data.success) {
      mostrarPorLimpiar(data.camas);
    } else {
      document.getElementById('contenido-por-limpiar').innerHTML = '<p class="text-center text-muted">No hay camas en limpieza</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-por-limpiar').innerHTML = '<p class="text-center text-danger">Error al cargar datos</p>';
  }
}

// Mostrar camas por limpiar
function mostrarPorLimpiar(camas) {
  if (camas.length === 0) {
    document.getElementById('contenido-por-limpiar').innerHTML = '<p class="text-center text-muted">No hay camas en limpieza</p>';
    return;
  }
  
  let html = '<div class="list-group">';
  
  camas.forEach(cama => {
    const tiempoRestante = cama.tiempo_restante ? `${cama.tiempo_restante} min restantes` : 'Tiempo excedido';
    const alertClass = cama.tiempo_restante && cama.tiempo_restante > 30 ? '' : 'list-group-item-warning';
    
    html += `
      <div class="list-group-item ${alertClass}">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">Habitación ${cama.habitacion} - Cama ${cama.numero}</h6>
            <p class="mb-0"><small>${cama.sector}</small></p>
            <p class="mb-0"><small class="text-muted">${tiempoRestante}</small></p>
          </div>
          <button class="btn btn-sm btn-success" onclick="liberarCama(${cama.id})">
            <i class="fas fa-check me-1"></i> Liberar
          </button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('contenido-por-limpiar').innerHTML = html;
}