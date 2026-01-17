// Mis Pacientes - Lista

// Búsqueda rápida
async function buscarRapido() {
  const query = document.getElementById('busqueda-rapida').value.trim();
  
  if (query.length < 2) {
    alert('Ingrese al menos 2 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/pacientes/api/busqueda?q=${query}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarResultadosBusqueda(data.pacientes);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en la búsqueda');
  }
}

// Mostrar resultados de búsqueda
function mostrarResultadosBusqueda(pacientes) {
  if (pacientes.length === 0) {
    alert('No se encontraron pacientes');
    return;
  }
  
  if (pacientes.length === 1) {
    window.location.href = `/enfermero/pacientes/${pacientes[0].id}`;
  } else {
    // Mostrar en modal o tabla
    console.log('Múltiples resultados:', pacientes);
  }
}

// Ver resumen de paciente
async function verResumen(pacienteId) {
  const modal = new bootstrap.Modal(document.getElementById('modalResumen'));
  modal.show();
  
  try {
    const response = await fetch(`/enfermero/pacientes/api/resumen/${pacienteId}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarResumen(data);
    } else {
      document.getElementById('contenido-resumen').innerHTML = '<p class="text-center text-danger">Error al cargar resumen</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-resumen').innerHTML = '<p class="text-center text-danger">Error al cargar resumen</p>';
  }
}

// Mostrar resumen
function mostrarResumen(data) {
  let html = `
    <div class="row">
      <div class="col-12 mb-3">
        <h6><strong>${data.paciente.nombre}</strong></h6>
        <p class="text-muted mb-0">DNI: ${data.paciente.dni} | Edad: ${data.paciente.edad} años | Sexo: ${data.paciente.sexo}</p>
      </div>
  `;
  
  if (data.ultima_evaluacion) {
    html += `
      <div class="col-md-6">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-clipboard-check me-2"></i>Última Evaluación</h6>
            <p class="mb-1"><small class="text-muted">${new Date(data.ultima_evaluacion.fecha).toLocaleString('es-AR')}</small></p>
            <p class="mb-1"><small>${data.ultima_evaluacion.signos_vitales || 'Sin signos vitales'}</small></p>
            <span class="badge bg-primary">${data.ultima_evaluacion.tipo_egreso}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (data.ultimo_control) {
    html += `
      <div class="col-md-6">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-temperature-high me-2"></i>Último Control</h6>
            <p class="mb-1"><small class="text-muted">${new Date(data.ultimo_control.fecha).toLocaleDateString('es-AR')}</small></p>
            <p class="mb-0">
              <small>Peso: ${data.ultimo_control.peso || 'N/A'} kg | PA: ${data.ultimo_control.presion_arterial || 'N/A'}</small>
            </p>
          </div>
        </div>
      </div>
    `;
  }
  
  if (data.internacion) {
    html += `
      <div class="col-12 mt-3">
        <div class="alert alert-info mb-0">
          <i class="fas fa-bed me-2"></i>
          <strong>Internado:</strong> Habitación ${data.internacion.habitacion} - Cama ${data.internacion.cama}
          <br>
          <small>Desde: ${new Date(data.internacion.fecha_inicio).toLocaleDateString('es-AR')}</small>
        </div>
      </div>
    `;
  }
  
  html += `
    </div>
    <div class="mt-3 text-center">
      <a href="/enfermero/pacientes/${data.paciente.id}" class="btn btn-primary">Ver Ficha Completa</a>
    </div>
  `;
  
  document.getElementById('contenido-resumen').innerHTML = html;
}

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    input.value = '';
  });
  form.submit();
}

// Enter en búsqueda rápida
document.getElementById('busqueda-rapida')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarRapido();
  }
});