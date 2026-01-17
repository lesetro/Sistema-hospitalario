// Administración de Medicación - Lista

// Buscar paciente
function buscarPaciente() {
  const modal = new bootstrap.Modal(document.getElementById('modalBuscarPaciente'));
  modal.show();
  document.getElementById('input-buscar-paciente').focus();
}

// Realizar búsqueda
async function realizarBusqueda() {
  const busqueda = document.getElementById('input-buscar-paciente').value.trim();
  
  if (!busqueda || busqueda.length < 3) {
    alert('Ingrese al menos 3 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/medicacion/api/buscar-paciente?busqueda=${busqueda}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarResultadosPacientes(data.pacientes);
    } else {
      document.getElementById('resultados-pacientes').innerHTML = '<p class="text-center text-muted">No se encontraron pacientes</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar pacientes');
  }
}

// Mostrar resultados de búsqueda
function mostrarResultadosPacientes(pacientes) {
  if (pacientes.length === 0) {
    document.getElementById('resultados-pacientes').innerHTML = '<p class="text-center text-muted">No se encontraron pacientes</p>';
    return;
  }
  
  let html = '<div class="list-group">';
  
  pacientes.forEach(paciente => {
    html += `
      <a href="#" class="list-group-item list-group-item-action" onclick="verRecetasPaciente(${paciente.id}); return false;">
        <div class="d-flex justify-content-between">
          <div>
            <strong>${paciente.nombre}</strong><br>
            <small class="text-muted">DNI: ${paciente.dni}</small>
          </div>
          <div>
            <span class="badge bg-primary">${paciente.recetas_activas} recetas</span>
          </div>
        </div>
      </a>
    `;
  });
  
  html += '</div>';
  document.getElementById('resultados-pacientes').innerHTML = html;
}

// Ver recetas de un paciente
async function verRecetasPaciente(pacienteId) {
  try {
    const response = await fetch(`/enfermero/medicacion/api/recetas/${pacienteId}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarRecetasPaciente(data.recetas);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar recetas');
  }
}

// Mostrar recetas del paciente
function mostrarRecetasPaciente(recetas) {
  if (recetas.length === 0) {
    document.getElementById('resultados-pacientes').innerHTML = '<p class="text-center text-muted">Este paciente no tiene recetas</p>';
    return;
  }
  
  let html = '<div class="list-group">';
  
  recetas.forEach(receta => {
    html += `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <small class="text-muted">${new Date(receta.fecha).toLocaleDateString('es-AR')}</small><br>
            <small>${receta.medico}</small>
          </div>
          <a href="/enfermero/medicacion/${receta.id}/administrar" class="btn btn-sm btn-success">
            <i class="fas fa-syringe me-1"></i> Administrar
          </a>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('resultados-pacientes').innerHTML = html;
}

// Permitir Enter en búsqueda
document.getElementById('input-buscar-paciente')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    realizarBusqueda();
  }
});