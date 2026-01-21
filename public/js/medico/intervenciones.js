let paginaActual = 1;
const intervencionesPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarIntervencionesProximas();
  cargarHabitaciones();
  cargarIntervenciones();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarIntervenciones();
  });
  
  // Formulario nueva intervención
  document.getElementById('formNuevaIntervencion').addEventListener('submit', function(e) {
    e.preventDefault();
    crearIntervencion();
  });
  
  // Formulario finalizar intervención
  document.getElementById('formFinalizarIntervencion').addEventListener('submit', function(e) {
    e.preventDefault();
    finalizarIntervencion();
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/intervenciones/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-en-curso').textContent = data.data.enCurso;
      document.getElementById('stat-finalizadas').textContent = data.data.finalizadas;
      document.getElementById('stat-mes').textContent = data.data.esteMes;
      document.getElementById('stat-total').textContent = data.data.totalIntervenciones;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar intervenciones próximas
async function cargarIntervencionesProximas() {
  try {
    const response = await fetch('/medico/intervenciones/api/intervenciones/proximas');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-proximas');
    const listaDiv = document.getElementById('lista-proximas');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      listaDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Paciente</th>
                <th>Procedimiento</th>
                <th>Habitación</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(int => {
                const fecha = new Date(int.fecha_inicio);
                return `
                  <tr>
                    <td>
                      <strong>${fecha.toLocaleDateString('es-AR')}</strong>
                      <br>
                      <small>${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>${int.paciente.usuario.nombre} ${int.paciente.usuario.apellido}</td>
                    <td>${int.tipo_procedimiento}</td>
                    <td>Hab. ${int.habitacion.numero}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      listaDiv.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-calendar-times fa-3x mb-3"></i>
          <p>No hay intervenciones programadas próximamente</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar intervenciones próximas:', error);
  }
}

// Cargar habitaciones
async function cargarHabitaciones() {
  try {
    const response = await fetch('/medico/intervenciones/api/habitaciones');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('nuevaHabitacion');
      
      data.data.forEach(hab => {
        const option = document.createElement('option');
        option.value = hab.id;
        option.textContent = `Habitación ${hab.numero} (${hab.tipo}) - ${hab.sector?.nombre || 'N/A'}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
  }
}

// Cargar intervenciones
async function cargarIntervenciones(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', intervencionesPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/intervenciones/api/intervenciones?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-intervenciones');
    const tablaDiv = document.getElementById('tabla-intervenciones');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarIntervenciones(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-intervenciones').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-procedures fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron intervenciones</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar intervenciones:', error);
    mostrarAlerta('error', 'Error al cargar intervenciones');
  }
}

// Mostrar intervenciones en la tabla
function mostrarIntervenciones(intervenciones) {
  const tbody = document.getElementById('tbody-intervenciones');
  
  tbody.innerHTML = intervenciones.map(int => {
    const fechaInicio = new Date(int.fecha_inicio);
    const enCurso = !int.fecha_fin;
    
    const resultadoColors = {
      'Fallecio': 'dark',
      'NecesitaInternacionHabitacion': 'warning',
      'NecesitaInternacionUCI': 'danger',
      'AltaDirecta': 'success',
      'Complicaciones': 'danger'
    };
    
    return `
      <tr>
        <td>
          <strong>${int.paciente?.usuario?.nombre || 'N/A'} ${int.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${int.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          <strong>${int.tipo_procedimiento}</strong>
          <br>
          <small class="text-muted">Hab. ${int.habitacion?.numero || 'N/A'}</small>
        </td>
        <td>
          ${fechaInicio.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fechaInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <span class="badge bg-${enCurso ? 'warning' : 'success'}">
            ${enCurso ? 'En Curso' : 'Finalizada'}
          </span>
        </td>
        <td>
          ${int.resultado_cirugia ? 
            `<span class="badge bg-${resultadoColors[int.resultado_cirugia] || 'secondary'}">
              ${int.resultado_cirugia.replace(/([A-Z])/g, ' $1').trim()}
            </span>` : 
            '<span class="text-muted">-</span>'
          }
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleIntervencion(${int.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            ${enCurso ? `
              <button class="btn btn-sm btn-outline-success" 
                      onclick="mostrarModalFinalizar(${int.id})"
                      title="Finalizar">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
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
  cargarIntervenciones(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Mostrar modal nueva intervención
function mostrarModalNuevaIntervencion() {
  document.getElementById('formNuevaIntervencion').reset();
  // Establecer fecha actual como predeterminada
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  document.getElementById('nuevaFechaInicio').value = ahora.toISOString().slice(0, 16);
  new bootstrap.Modal(document.getElementById('modalNuevaIntervencion')).show();
}

// Crear intervención
async function crearIntervencion() {
  try {
    const formData = new FormData(document.getElementById('formNuevaIntervencion'));
    const data = Object.fromEntries(formData.entries());
    
    // Convertir a números
    data.paciente_id = parseInt(data.paciente_id);
    data.habitacion_id = parseInt(data.habitacion_id);
    data.lista_espera_id = parseInt(data.lista_espera_id);
    if (data.evaluacion_medica_id) {
      data.evaluacion_medica_id = parseInt(data.evaluacion_medica_id);
    }
    
    const response = await fetch('/medico/intervenciones/api/intervenciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Intervención registrada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevaIntervencion')).hide();
      cargarIntervenciones();
      cargarEstadisticas();
      cargarIntervencionesProximas();
    } else {
      mostrarAlerta('error', result.message || 'Error al registrar intervención');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al registrar intervención');
  }
}

// Ver detalle de intervención
async function verDetalleIntervencion(id) {
  try {
    const response = await fetch(`/medico/intervenciones/api/intervenciones/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const int = data.data;
      const fechaInicio = new Date(int.fecha_inicio);
      const fechaFin = int.fecha_fin ? new Date(int.fecha_fin) : null;
      
      document.getElementById('modalDetalleIntervencionBody').innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-user-circle me-2"></i>
              Información del Paciente
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Paciente:</th>
                <td>${int.paciente.usuario.nombre} ${int.paciente.usuario.apellido}</td>
              </tr>
              <tr>
                <th>DNI:</th>
                <td>${int.paciente.usuario.dni}</td>
              </tr>
              <tr>
                <th>Obra Social:</th>
                <td>${int.paciente.obraSocial?.nombre || 'Sin obra social'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-procedures me-2"></i>
              Información de la Intervención
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Procedimiento:</th>
                <td>${int.tipo_procedimiento}</td>
              </tr>
              <tr>
                <th>Habitación:</th>
                <td>${int.habitacion.numero} (${int.habitacion.sector?.nombre || 'N/A'})</td>
              </tr>
              <tr>
                <th>Fecha Inicio:</th>
                <td>${fechaInicio.toLocaleString('es-AR')}</td>
              </tr>
              ${fechaFin ? `
                <tr>
                  <th>Fecha Fin:</th>
                  <td>${fechaFin.toLocaleString('es-AR')}</td>
                </tr>
              ` : ''}
              <tr>
                <th>Estado:</th>
                <td><span class="badge bg-${fechaFin ? 'success' : 'warning'}">${fechaFin ? 'Finalizada' : 'En Curso'}</span></td>
              </tr>
              ${int.resultado_cirugia ? `
                <tr>
                  <th>Resultado:</th>
                  <td><span class="badge bg-info">${int.resultado_cirugia}</span></td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          ${int.evaluacion_medica?.diagnostico ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-notes-medical me-2"></i>
                Diagnóstico Asociado
              </h6>
              <div class="alert alert-info">
                <strong>${int.evaluacion_medica.diagnostico.codigo}:</strong> 
                ${int.evaluacion_medica.diagnostico.nombre}
              </div>
            </div>
          ` : ''}
          
          ${int.observaciones ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-comment me-2"></i>
                Observaciones
              </h6>
              <div class="alert alert-secondary">
                ${int.observaciones}
              </div>
            </div>
          ` : ''}
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalleIntervencion')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Mostrar modal finalizar
function mostrarModalFinalizar(id) {
  document.getElementById('finalizarIntervencionId').value = id;
  document.getElementById('formFinalizarIntervencion').reset();
  new bootstrap.Modal(document.getElementById('modalFinalizarIntervencion')).show();
}

// Finalizar intervención
async function finalizarIntervencion() {
  try {
    const id = document.getElementById('finalizarIntervencionId').value;
    const formData = new FormData(document.getElementById('formFinalizarIntervencion'));
    const data = Object.fromEntries(formData.entries());
    
    const response = await fetch(`/medico/intervenciones/api/intervenciones/${id}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Intervención finalizada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalFinalizarIntervencion')).hide();
      cargarIntervenciones();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', result.message || 'Error al finalizar intervención');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al finalizar intervención');
  }
}

// Actualizar tabla
function actualizarTabla() {
  cargarIntervenciones();
  cargarEstadisticas();
  cargarIntervencionesProximas();
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