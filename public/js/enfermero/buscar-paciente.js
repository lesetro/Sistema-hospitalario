// Buscar Paciente

// Búsqueda simple
async function buscarSimple() {
  const query = document.getElementById('busqueda-simple').value.trim();
  
  if (query.length < 2) {
    alert('Ingrese al menos 2 caracteres');
    return;
  }
  
  mostrarCargando();
  
  try {
    const response = await fetch(`/enfermero/buscar-paciente/api/buscar?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarResultados(data.pacientes);
    } else {
      mostrarSinResultados(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError();
  }
}

// Búsqueda avanzada
async function buscarAvanzada() {
  const params = new URLSearchParams();
  
  const nombre = document.getElementById('av-nombre').value.trim();
  const apellido = document.getElementById('av-apellido').value.trim();
  const dni = document.getElementById('av-dni').value.trim();
  const sexo = document.getElementById('av-sexo').value;
  const edadMin = document.getElementById('av-edad-min').value;
  const edadMax = document.getElementById('av-edad-max').value;
  const estado = document.getElementById('av-estado').value;
  const internado = document.getElementById('av-internado').value;
  
  if (nombre) params.append('nombre', nombre);
  if (apellido) params.append('apellido', apellido);
  if (dni) params.append('dni', dni);
  if (sexo) params.append('sexo', sexo);
  if (edadMin) params.append('edad_min', edadMin);
  if (edadMax) params.append('edad_max', edadMax);
  if (estado) params.append('estado', estado);
  if (internado) params.append('internado', internado);
  
  if (params.toString() === '') {
    alert('Ingrese al menos un criterio de búsqueda');
    return;
  }
  
  mostrarCargando();
  
  try {
    const response = await fetch(`/enfermero/buscar-paciente/api/busqueda-avanzada?${params.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarResultados(data.pacientes);
    } else {
      mostrarSinResultados(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError();
  }
}

// Mostrar resultados
function mostrarResultados(pacientes) {
  if (pacientes.length === 0) {
    mostrarSinResultados('No se encontraron pacientes');
    return;
  }
  
  let html = `
    <div class="alert alert-success mb-3">
      <i class="fas fa-check-circle me-2"></i>
      Se encontraron ${pacientes.length} paciente(s)
    </div>
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>Paciente</th>
            <th>DNI</th>
            <th>Edad</th>
            <th>Sexo</th>
            <th>Estado</th>
            <th>Info</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  pacientes.forEach(paciente => {
    const estadoBadge = paciente.estado === 'Activo' ? 'bg-success' : 'bg-secondary';
    
    html += `
      <tr>
        <td>
          <strong>${paciente.nombre}</strong>
          ${paciente.telefono ? `<br><small class="text-muted"><i class="fas fa-phone me-1"></i>${paciente.telefono}</small>` : ''}
        </td>
        <td>${paciente.dni}</td>
        <td>${paciente.edad} años</td>
        <td>${paciente.sexo}</td>
        <td><span class="badge ${estadoBadge}">${paciente.estado}</span></td>
        <td>
    `;
    
    if (paciente.internado) {
      html += `<span class="badge bg-danger" title="Internado"><i class="fas fa-bed me-1"></i>Hab. ${paciente.internado.habitacion}</span>`;
    }
    if (paciente.en_lista_espera) {
      html += `<span class="badge bg-warning text-dark ms-1" title="En lista de espera"><i class="fas fa-clock me-1"></i>${paciente.en_lista_espera.tipo_turno}</span>`;
    }
    if (paciente.ultima_evaluacion) {
      html += `<span class="badge bg-info ms-1" title="Última evaluación"><i class="fas fa-clipboard-check"></i></span>`;
    }
    
    html += `
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" onclick="verFichaRapida(${paciente.id})" title="Ficha rápida">
              <i class="fas fa-id-card"></i>
            </button>
            <a class="btn btn-outline-success" href="/enfermero/pacientes/${paciente.id}" title="Ver completo">
              <i class="fas fa-eye"></i>
            </a>
    `;
    
    if (paciente.internado) {
      html += `
            <a class="btn btn-outline-info" href="/enfermero/internados/${paciente.internado.internacion_id}" title="Ver internación">
              <i class="fas fa-bed"></i>
            </a>
      `;
    }
    
    html += `
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('resultados-busqueda').innerHTML = html;
}

// Ver ficha rápida
async function verFichaRapida(pacienteId) {
  const modal = new bootstrap.Modal(document.getElementById('modalFichaRapida'));
  modal.show();
  
  document.getElementById('contenido-ficha').innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  `;
  
  try {
    const response = await fetch(`/enfermero/buscar-paciente/api/ficha-rapida/${pacienteId}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarFichaRapida(data);
    } else {
      document.getElementById('contenido-ficha').innerHTML = '<p class="text-center text-danger">Error al cargar ficha</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-ficha').innerHTML = '<p class="text-center text-danger">Error al cargar ficha</p>';
  }
}

// Mostrar ficha rápida
function mostrarFichaRapida(data) {
  const paciente = data.paciente;
  
  let html = `
    <div class="row">
      <div class="col-md-4">
        <div class="text-center mb-3">
          <div class="avatar bg-primary text-white rounded-circle mx-auto mb-3" style="width: 100px; height: 100px; line-height: 100px; font-size: 2.5rem">
            ${paciente.nombre.charAt(0)}
          </div>
          <h4>${paciente.nombre}</h4>
          <p class="text-muted mb-1">DNI: ${paciente.dni}</p>
          <p class="text-muted">${paciente.edad} años - ${paciente.sexo}</p>
          <span class="badge ${paciente.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">${paciente.estado}</span>
        </div>
        
        <div class="card bg-light">
          <div class="card-body">
            <h6><i class="fas fa-info-circle me-2"></i>Información</h6>
            <p class="mb-1"><small><strong>Obra Social:</strong> ${paciente.obra_social}</small></p>
            ${paciente.telefono ? `<p class="mb-1"><small><strong>Tel:</strong> ${paciente.telefono}</small></p>` : ''}
            ${paciente.email ? `<p class="mb-0"><small><strong>Email:</strong> ${paciente.email}</small></p>` : ''}
          </div>
        </div>
      </div>
      
      <div class="col-md-8">
  `;
  
  // Internación
  if (data.internacion) {
    html += `
      <div class="alert alert-danger">
        <h6><i class="fas fa-bed me-2"></i>Internado</h6>
        <p class="mb-1"><strong>Ubicación:</strong> Habitación ${data.internacion.habitacion} - Cama ${data.internacion.cama}</p>
        <p class="mb-1"><strong>Sector:</strong> ${data.internacion.sector}</p>
        <p class="mb-1"><strong>Estado:</strong> <span class="badge bg-dark">${data.internacion.estado_paciente}</span></p>
        <a href="/enfermero/internados/${data.internacion.id}" class="btn btn-sm btn-dark mt-2">
          <i class="fas fa-arrow-right me-1"></i> Ver Internación
        </a>
      </div>
    `;
  }
  
  // Lista de espera
  if (data.en_lista_espera.length > 0) {
    html += `
      <div class="alert alert-warning">
        <h6><i class="fas fa-clock me-2"></i>En Lista de Espera</h6>
    `;
    data.en_lista_espera.forEach(le => {
      html += `
        <p class="mb-1">
          <strong>${le.tipo_turno}</strong> - Prioridad: <span class="badge bg-${le.prioridad === 'ALTA' ? 'danger' : 'warning'}">${le.prioridad}</span>
        </p>
      `;
    });
    html += `</div>`;
  }
  
  // Últimas evaluaciones
  if (data.evaluaciones.length > 0) {
    html += `
      <div class="card mb-3">
        <div class="card-header bg-light">
          <h6 class="mb-0"><i class="fas fa-clipboard-check me-2"></i>Últimas Evaluaciones</h6>
        </div>
        <div class="list-group list-group-flush">
    `;
    data.evaluaciones.forEach(ev => {
      html += `
        <div class="list-group-item">
          <div class="d-flex justify-content-between">
            <div>
              <small class="text-muted">${new Date(ev.fecha).toLocaleString('es-AR')}</small>
              <br>
              <small>Enf. ${ev.enfermero}</small>
            </div>
            <span class="badge bg-primary">${ev.tipo_egreso}</span>
          </div>
          ${ev.signos_vitales ? `<p class="mb-0 mt-1"><small>${ev.signos_vitales}</small></p>` : ''}
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;
  }
  
  // Resumen
  html += `
        <div class="row g-2">
          <div class="col-6">
            <div class="card text-center">
              <div class="card-body p-2">
                <h5 class="mb-0">${data.admisiones_recientes}</h5>
                <small class="text-muted">Admisiones</small>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card text-center">
              <div class="card-body p-2">
                <h5 class="mb-0">${data.turnos_proximos}</h5>
                <small class="text-muted">Turnos Próximos</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <hr>
    
    <div class="text-center">
      <h6 class="mb-3">Accesos Rápidos</h6>
      <div class="btn-group" role="group">
        <a href="/enfermero/pacientes/${paciente.id}" class="btn btn-primary">
          <i class="fas fa-user me-1"></i> Ficha Completa
        </a>
        <a href="/enfermero/evaluaciones/nueva?paciente_id=${paciente.id}" class="btn btn-success">
          <i class="fas fa-clipboard-check me-1"></i> Nueva Evaluación
        </a>
        <a href="/enfermero/signos-vitales/registro?paciente_id=${paciente.id}" class="btn btn-info">
          <i class="fas fa-heartbeat me-1"></i> Signos Vitales
        </a>
        <a href="/enfermero/controles/nuevo?paciente_id=${paciente.id}" class="btn btn-warning">
          <i class="fas fa-temperature-high me-1"></i> Control
        </a>
      </div>
    </div>
  `;
  
  document.getElementById('contenido-ficha').innerHTML = html;
}

// Mostrar/ocultar búsqueda avanzada
function mostrarBusquedaAvanzada() {
  const seccion = document.getElementById('seccion-avanzada');
  seccion.style.display = seccion.style.display === 'none' ? 'block' : 'none';
}

// Limpiar búsqueda avanzada
function limpiarAvanzada() {
  document.getElementById('av-nombre').value = '';
  document.getElementById('av-apellido').value = '';
  document.getElementById('av-dni').value = '';
  document.getElementById('av-sexo').value = '';
  document.getElementById('av-edad-min').value = '';
  document.getElementById('av-edad-max').value = '';
  document.getElementById('av-estado').value = '';
  document.getElementById('av-internado').value = '';
}

// Mostrar estados
function mostrarCargando() {
  document.getElementById('resultados-busqueda').innerHTML = `
    <div class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3 text-muted">Buscando pacientes...</p>
    </div>
  `;
}

function mostrarSinResultados(mensaje) {
  document.getElementById('resultados-busqueda').innerHTML = `
    <div class="text-center text-muted p-5">
      <i class="fas fa-search-minus fa-4x mb-3"></i>
      <h5>No se encontraron resultados</h5>
      <p class="mb-0">${mensaje || 'Intente con otros criterios de búsqueda'}</p>
    </div>
  `;
}

function mostrarError() {
  document.getElementById('resultados-busqueda').innerHTML = `
    <div class="text-center text-danger p-5">
      <i class="fas fa-exclamation-triangle fa-4x mb-3"></i>
      <h5>Error en la búsqueda</h5>
      <p class="mb-0">Ocurrió un error. Intente nuevamente.</p>
    </div>
  `;
}

// Enter en búsqueda simple
document.getElementById('busqueda-simple')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarSimple();
  }
});