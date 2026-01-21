let paginaActual = 1;
const resultadosPorPagina = 10;
let pacienteActual = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarObrasSociales();
  
  // Formulario de búsqueda
  document.getElementById('formBusqueda').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    buscarPacientes();
  });
  
  // Búsqueda en tiempo real
  let timeoutBusqueda;
  document.getElementById('campoBusqueda').addEventListener('input', function(e) {
    clearTimeout(timeoutBusqueda);
    if (e.target.value.length >= 2) {
      timeoutBusqueda = setTimeout(() => {
        paginaActual = 1;
        buscarPacientes();
      }, 500);
    }
  });
});

// Cargar obras sociales
async function cargarObrasSociales() {
  try {
    const response = await fetch('/medico/buscar-paciente/api/obras-sociales');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('filtroObraSocial');
      
      data.data.forEach(os => {
        const option = document.createElement('option');
        option.value = os.id;
        option.textContent = os.nombre;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar obras sociales:', error);
  }
}

// Buscar pacientes
async function buscarPacientes(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formBusqueda'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', resultadosPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    // Mostrar loading
    document.getElementById('mensaje-inicial').classList.add('d-none');
    document.getElementById('resultados-busqueda').classList.add('d-none');
    document.getElementById('sin-resultados').classList.add('d-none');
    document.getElementById('loading-resultados').classList.remove('d-none');
    
    const response = await fetch(`/medico/buscar-paciente/api/buscar?${params.toString()}`);
    const data = await response.json();
    
    document.getElementById('loading-resultados').classList.add('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarResultados(data.data, data.pagination);
    } else {
      document.getElementById('sin-resultados').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    document.getElementById('loading-resultados').classList.add('d-none');
    mostrarAlerta('error', 'Error al buscar pacientes');
  }
}

// Mostrar resultados
function mostrarResultados(pacientes, pagination) {
  const resultadosDiv = document.getElementById('resultados-busqueda');
  const tbody = document.getElementById('tbody-resultados');
  
  document.getElementById('total-resultados').textContent = 
    `Se encontraron ${pagination.total} paciente${pagination.total !== 1 ? 's' : ''}`;
  
  tbody.innerHTML = pacientes.map(paciente => {
    const estadoColors = {
      'Activo': 'success',
      'Inactivo': 'warning',
      'Baja': 'danger'
    };
    
    return `
      <tr>
        <td>
          <strong>${paciente.usuario.nombre} ${paciente.usuario.apellido}</strong>
          <br>
          <small class="text-muted">${paciente.usuario.email || 'Sin email'}</small>
        </td>
        <td>${paciente.usuario.dni}</td>
        <td>
          <span class="badge bg-${estadoColors[paciente.estado] || 'secondary'}">
            ${paciente.estado}
          </span>
        </td>
        <td>${paciente.obraSocial?.nombre || 'Sin obra social'}</td>
        <td>
          <button class="btn btn-sm btn-primary" 
                  onclick="verDetallePaciente(${paciente.id})">
            <i class="fas fa-eye me-1"></i>
            Ver Detalle
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  mostrarPaginacion(pagination);
  resultadosDiv.classList.remove('d-none');
}

// Mostrar paginación
function mostrarPaginacion(pagination) {
  const paginacionDiv = document.getElementById('paginacion');
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${pagination.page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 || 
      i === pagination.totalPages || 
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      html += `
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">
            ${i}
          </a>
        </li>
      `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  html += `
    <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${pagination.page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginacionDiv.innerHTML = html;
}

// Cambiar página
function cambiarPagina(pagina) {
  paginaActual = pagina;
  buscarPacientes(pagina);
}

// Ver detalle del paciente
async function verDetallePaciente(id) {
  try {
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}`);
    const data = await response.json();
    
    if (data.success) {
      pacienteActual = data.data;
      mostrarInfoBasica(data.data);
      cargarResumen(id, data.data);
      
      // Limpiar tabs
      document.getElementById('evaluaciones').innerHTML = '';
      document.getElementById('turnos').innerHTML = '';
      document.getElementById('internaciones').innerHTML = '';
      document.getElementById('historial').innerHTML = '';
      document.getElementById('documentos').innerHTML = '';
      
      // Event listeners para cargar datos al cambiar de tab
      document.getElementById('tab-evaluaciones').addEventListener('click', () => cargarEvaluaciones(id), { once: true });
      document.getElementById('tab-turnos').addEventListener('click', () => cargarTurnos(id), { once: true });
      document.getElementById('tab-internaciones').addEventListener('click', () => cargarInternaciones(id), { once: true });
      document.getElementById('tab-historial').addEventListener('click', () => cargarHistorial(id), { once: true });
      document.getElementById('tab-documentos').addEventListener('click', () => cargarDocumentos(id), { once: true });
      
      new bootstrap.Modal(document.getElementById('modalDetallePaciente')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle del paciente');
  }
}

// Mostrar información básica
function mostrarInfoBasica(data) {
  const paciente = data.paciente;
  const stats = data.estadisticas;
  
  const fechaNac = new Date(paciente.usuario.fecha_nacimiento);
  const edad = Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));
  
  document.getElementById('info-basica-paciente').innerHTML = `
    <div class="card bg-light">
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h4>${paciente.usuario.nombre} ${paciente.usuario.apellido}</h4>
            <p class="mb-2">
              <strong>DNI:</strong> ${paciente.usuario.dni}<br>
              <strong>Edad:</strong> ${edad} años<br>
              <strong>Sexo:</strong> ${paciente.usuario.sexo}<br>
              <strong>Email:</strong> ${paciente.usuario.email || 'No registrado'}<br>
              <strong>Teléfono:</strong> ${paciente.usuario.telefono || 'No registrado'}
            </p>
          </div>
          <div class="col-md-6">
            <p class="mb-2">
              <strong>Obra Social:</strong> ${paciente.obraSocial?.nombre || 'Sin obra social'}<br>
              <strong>Estado:</strong> <span class="badge bg-${paciente.estado === 'Activo' ? 'success' : 'warning'}">${paciente.estado}</span><br>
              <strong>Fecha Ingreso:</strong> ${new Date(paciente.fecha_ingreso).toLocaleDateString('es-AR')}
            </p>
            ${stats.internacionActiva ? `
              <div class="alert alert-warning mb-0">
                <i class="fas fa-bed me-2"></i>
                <strong>Internado actualmente</strong><br>
                Hab. ${stats.internacionActiva.habitacion?.numero} - Cama ${stats.internacionActiva.cama?.numero}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Cargar resumen
function cargarResumen(id, data) {
  const stats = data.estadisticas;
  
  document.getElementById('resumen').innerHTML = `
    <div class="row g-3">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-stethoscope fa-2x text-primary mb-2"></i>
            <h3>${stats.evaluaciones}</h3>
            <p class="mb-0">Evaluaciones</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-calendar-check fa-2x text-success mb-2"></i>
            <h3>${stats.turnos}</h3>
            <p class="mb-0">Turnos</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-bed fa-2x text-warning mb-2"></i>
            <h3>${stats.internaciones}</h3>
            <p class="mb-0">Internaciones</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-sign-out-alt fa-2x text-info mb-2"></i>
            <h3>${stats.altas}</h3>
            <p class="mb-0">Altas Médicas</p>
          </div>
        </div>
      </div>
      ${stats.ultimaEvaluacion ? `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Última evaluación:</strong> ${new Date(stats.ultimaEvaluacion.fecha).toLocaleString('es-AR')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Cargar evaluaciones
async function cargarEvaluaciones(id) {
  try {
    document.getElementById('evaluaciones').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}/evaluaciones`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      document.getElementById('evaluaciones').innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Diagnóstico</th>
                <th>Tratamiento</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(ev => `
                <tr>
                  <td>${new Date(ev.fecha).toLocaleString('es-AR')}</td>
                  <td>${ev.diagnostico ? `${ev.diagnostico.codigo} - ${ev.diagnostico.nombre}` : 'Sin diagnóstico'}</td>
                  <td>${ev.tratamiento?.nombre || 'Sin tratamiento'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      document.getElementById('evaluaciones').innerHTML = '<p class="text-muted text-center py-4">No hay evaluaciones registradas</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('evaluaciones').innerHTML = '<p class="text-danger text-center py-4">Error al cargar evaluaciones</p>';
  }
}

// Cargar turnos
async function cargarTurnos(id) {
  try {
    document.getElementById('turnos').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}/turnos`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      document.getElementById('turnos').innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(turno => `
                <tr>
                  <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
                  <td>${turno.hora_inicio}</td>
                  <td><span class="badge bg-${turno.estado === 'COMPLETADO' ? 'success' : 'warning'}">${turno.estado}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      document.getElementById('turnos').innerHTML = '<p class="text-muted text-center py-4">No hay turnos registrados</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('turnos').innerHTML = '<p class="text-danger text-center py-4">Error al cargar turnos</p>';
  }
}

// Cargar internaciones
async function cargarInternaciones(id) {
  try {
    document.getElementById('internaciones').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}/internaciones`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      document.getElementById('internaciones').innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Fecha Inicio</th>
                <th>Fecha Alta</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(int => `
                <tr>
                  <td>${int.tipoInternacion?.nombre || 'N/A'}</td>
                  <td>Hab. ${int.habitacion?.numero} - Cama ${int.cama?.numero}</td>
                  <td>${new Date(int.fecha_inicio).toLocaleDateString('es-AR')}</td>
                  <td>${int.fecha_alta ? new Date(int.fecha_alta).toLocaleDateString('es-AR') : 'Activa'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      document.getElementById('internaciones').innerHTML = '<p class="text-muted text-center py-4">No hay internaciones registradas</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('internaciones').innerHTML = '<p class="text-danger text-center py-4">Error al cargar internaciones</p>';
  }
}

// Cargar historial
async function cargarHistorial(id) {
  try {
    document.getElementById('historial').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}/historial`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      document.getElementById('historial').innerHTML = `
        <div class="timeline">
          ${data.data.map(item => `
            <div class="timeline-item">
              <div class="timeline-marker bg-primary"></div>
              <div class="timeline-content">
                <small class="text-muted">${new Date(item.fecha).toLocaleString('es-AR')}</small>
                <h6>${item.tipo_evento}</h6>
                <p class="mb-0">${item.descripcion}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      document.getElementById('historial').innerHTML = '<p class="text-muted text-center py-4">No hay historial médico registrado</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('historial').innerHTML = '<p class="text-danger text-center py-4">Error al cargar historial</p>';
  }
}

// Cargar documentos
async function cargarDocumentos(id) {
  try {
    document.getElementById('documentos').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
    
    const response = await fetch(`/medico/buscar-paciente/api/paciente/${id}/recetas-certificados`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      document.getElementById('documentos').innerHTML = `
        <div class="list-group">
          ${data.data.map(doc => `
            <div class="list-group-item">
              <div class="d-flex justify-content-between">
                <h6><i class="fas fa-${doc.tipo === 'Receta Medica' ? 'prescription' : 'certificate'} me-2"></i>${doc.tipo}</h6>
                <small>${new Date(doc.fecha).toLocaleDateString('es-AR')}</small>
              </div>
              <p class="mb-0 small">${doc.contenido.substring(0, 100)}...</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      document.getElementById('documentos').innerHTML = '<p class="text-muted text-center py-4">No hay documentos registrados</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('documentos').innerHTML = '<p class="text-danger text-center py-4">Error al cargar documentos</p>';
  }
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertContainer.style.zIndex = '9999';
  alertContainer.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.remove();
  }, 5000);
}