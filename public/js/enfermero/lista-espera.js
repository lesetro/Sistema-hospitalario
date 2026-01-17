// Lista de Espera - Solo Consulta

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    input.value = '';
  });
  form.submit();
}

// Llamar siguiente paciente
async function llamarSiguiente() {
  const modal = new bootstrap.Modal(document.getElementById('modalLlamarSiguiente'));
  modal.show();
  
  try {
    const response = await fetch('/enfermero/lista-espera/api/siguiente-paciente');
    const data = await response.json();
    
    if (data.success) {
      mostrarSiguientePaciente(data);
    } else {
      document.getElementById('contenido-siguiente').innerHTML = `
        <div class="text-center text-muted">
          <i class="fas fa-clipboard-check fa-4x mb-3"></i>
          <h5>No hay pacientes en espera</h5>
          <p>La lista de espera está vacía</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-siguiente').innerHTML = '<p class="text-center text-danger">Error al cargar datos</p>';
  }
}

// Mostrar siguiente paciente
function mostrarSiguientePaciente(data) {
  const prioridadClass = data.registro.prioridad === 'ALTA' ? 'danger' : data.registro.prioridad === 'MEDIA' ? 'warning' : 'secondary';
  
  let html = `
    <div class="text-center mb-4">
      <div class="avatar bg-primary text-white rounded-circle mx-auto mb-3" style="width: 80px; height: 80px; line-height: 80px; font-size: 2rem">
        ${data.paciente.nombre.charAt(0)}
      </div>
      <h4>${data.paciente.nombre}</h4>
      <p class="text-muted mb-1">DNI: ${data.paciente.dni}</p>
      ${data.paciente.telefono ? `<p class="text-muted"><i class="fas fa-phone me-1"></i>${data.paciente.telefono}</p>` : ''}
    </div>
    
    <div class="alert alert-${prioridadClass}">
      <strong>Prioridad:</strong> ${data.registro.prioridad}
      <br>
      <strong>Tipo:</strong> ${data.registro.tipo_turno}
      ${data.registro.tipo_estudio ? `<br><strong>Estudio:</strong> ${data.registro.tipo_estudio}` : ''}
      ${data.registro.especialidad ? `<br><strong>Especialidad:</strong> ${data.registro.especialidad}` : ''}
      <br>
      <strong>Tiempo de espera:</strong> ${Math.floor(data.registro.tiempo_espera_minutos / 60)}h ${data.registro.tiempo_espera_minutos % 60}m
    </div>
    
    <div class="alert alert-info">
      <i class="fas fa-info-circle me-2"></i>
      <strong>Instrucciones:</strong> Llame al paciente y diríjalo al área correspondiente. 
      La asignación del turno debe ser realizada por el área administrativa.
    </div>
    
    <div class="text-center">
      <a href="/enfermero/lista-espera/${data.registro.id}" class="btn btn-primary">
        <i class="fas fa-eye me-2"></i> Ver Detalle Completo
      </a>
    </div>
  `;
  
  document.getElementById('contenido-siguiente').innerHTML = html;
}

// Llamar paciente específico
function llamarPaciente(registroId, nombrePaciente) {
  document.getElementById('nombre-paciente-llamar').textContent = nombrePaciente;
  const modal = new bootstrap.Modal(document.getElementById('modalLlamarPaciente'));
  modal.show();
}

// Buscar paciente
async function buscarPaciente() {
  const busqueda = document.getElementById('buscar-paciente').value.trim();
  
  if (busqueda.length < 2) {
    alert('Ingrese al menos 2 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/lista-espera/api/buscar?busqueda=${busqueda}`);
    const data = await response.json();
    
    if (data.success && data.resultados.length > 0) {
      if (data.resultados.length === 1) {
        window.location.href = `/enfermero/lista-espera/${data.resultados[0].id}`;
      } else {
        mostrarResultadosBusqueda(data.resultados);
      }
    } else {
      alert('No se encontró el paciente en la lista de espera');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en la búsqueda');
  }
}

// Mostrar resultados de búsqueda (múltiples)
function mostrarResultadosBusqueda(resultados) {
  // Implementar modal con resultados múltiples si es necesario
  console.log('Múltiples resultados:', resultados);
}

// Ver pacientes con mayor tiempo de espera
async function verMayorEspera() {
  const modal = new bootstrap.Modal(document.getElementById('modalMayorEspera'));
  modal.show();
  
  try {
    const response = await fetch('/enfermero/lista-espera/api/mayor-tiempo-espera');
    const data = await response.json();
    
    if (data.success) {
      mostrarMayorEspera(data.registros);
    } else {
      document.getElementById('contenido-mayor-espera').innerHTML = '<p class="text-center text-muted">No hay pacientes en espera</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-mayor-espera').innerHTML = '<p class="text-center text-danger">Error al cargar datos</p>';
  }
}

// Mostrar mayor tiempo de espera
function mostrarMayorEspera(registros) {
  if (registros.length === 0) {
    document.getElementById('contenido-mayor-espera').innerHTML = '<p class="text-center text-muted">No hay pacientes en espera</p>';
    return;
  }
  
  let html = '<div class="list-group">';
  
  registros.forEach((registro, index) => {
    const alertClass = registro.tiempo_espera_minutos > 180 ? 'list-group-item-danger' : registro.tiempo_espera_minutos > 120 ? 'list-group-item-warning' : '';
    const prioridadBadge = registro.prioridad === 'ALTA' ? 'bg-danger' : registro.prioridad === 'MEDIA' ? 'bg-warning text-dark' : 'bg-secondary';
    
    html += `
      <div class="list-group-item ${alertClass}">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${index + 1}. ${registro.paciente}</h6>
            <p class="mb-1">
              <small class="text-muted">DNI: ${registro.dni}</small>
              <span class="badge ${prioridadBadge} ms-2">${registro.prioridad}</span>
            </p>
            <p class="mb-0">
              <small>${registro.tipo_turno}</small>
            </p>
          </div>
          <div class="text-end">
            <h5 class="mb-0 text-danger">${registro.tiempo_espera}</h5>
            <small class="text-muted">en espera</small>
            <br>
            <a href="/enfermero/lista-espera/${registro.id}" class="btn btn-sm btn-primary mt-2">
              <i class="fas fa-eye"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('contenido-mayor-espera').innerHTML = html;
}

// Enter en búsqueda
document.getElementById('buscar-paciente')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPaciente();
  }
});