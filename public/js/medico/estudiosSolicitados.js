let paginaActual = 1;
const estudiosPorPagina = 10;
let chartCategorias = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarDistribucionCategorias();
  cargarTiposEstudio();
  cargarEstudios();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarEstudios();
  });
  
  // Formulario nuevo estudio
  document.getElementById('formNuevoEstudio').addEventListener('submit', function(e) {
    e.preventDefault();
    crearEstudio();
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-pendientes').textContent = data.data.Pendiente || 0;
      document.getElementById('stat-realizados').textContent = data.data.Realizado || 0;
      document.getElementById('stat-cancelados').textContent = data.data.Cancelado || 0;
      document.getElementById('stat-mes').textContent = data.data.estudiosMes || 0;
      
      // Mostrar gráfico de urgencias
      mostrarGraficoUrgencias(data.data.porUrgencia);
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Mostrar gráfico de urgencias
function mostrarGraficoUrgencias(datos) {
  const loadingDiv = document.getElementById('loading-urgencias');
  const graficoDiv = document.getElementById('grafico-urgencias');
  
  loadingDiv.classList.add('d-none');
  graficoDiv.classList.remove('d-none');
  
  const total = (datos.Normal || 0) + (datos.Alta || 0);
  const porcentajeNormal = total > 0 ? ((datos.Normal || 0) / total * 100).toFixed(1) : 0;
  const porcentajeAlta = total > 0 ? ((datos.Alta || 0) / total * 100).toFixed(1) : 0;
  
  graficoDiv.innerHTML = `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span><i class="fas fa-circle text-primary me-2"></i>Normal</span>
        <strong>${datos.Normal || 0} (${porcentajeNormal}%)</strong>
      </div>
      <div class="progress" style="height: 25px;">
        <div class="progress-bar bg-primary" style="width: ${porcentajeNormal}%">
          ${porcentajeNormal}%
        </div>
      </div>
    </div>
    
    <div>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span><i class="fas fa-circle text-danger me-2"></i>Alta</span>
        <strong>${datos.Alta || 0} (${porcentajeAlta}%)</strong>
      </div>
      <div class="progress" style="height: 25px;">
        <div class="progress-bar bg-danger" style="width: ${porcentajeAlta}%">
          ${porcentajeAlta}%
        </div>
      </div>
    </div>
  `;
}

// Cargar distribución por categorías
async function cargarDistribucionCategorias() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/por-categoria');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-categorias');
    const canvas = document.getElementById('chartCategorias');
    
    loadingDiv.classList.add('d-none');
    canvas.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      const ctx = canvas.getContext('2d');
      
      if (chartCategorias) {
        chartCategorias.destroy();
      }
      
      chartCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.data.map(item => item.categoria),
          datasets: [{
            data: data.data.map(item => item.total),
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    } else {
      canvas.parentElement.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-chart-pie fa-3x mb-3"></i>
          <p>No hay datos para mostrar</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar distribución:', error);
  }
}

// Cargar tipos de estudio
async function cargarTiposEstudio() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/tipos-estudio');
    const data = await response.json();
    
    if (data.success) {
      const selectFiltro = document.getElementById('filtroTipoEstudio');
      const selectNuevo = document.getElementById('nuevoTipoEstudio');
      
      data.data.forEach(tipo => {
        // Para filtro
        const optionFiltro = document.createElement('option');
        optionFiltro.value = tipo.id;
        optionFiltro.textContent = `${tipo.nombre} (${tipo.categoria})`;
        selectFiltro.appendChild(optionFiltro);
        
        // Para nuevo estudio
        const optionNuevo = document.createElement('option');
        optionNuevo.value = tipo.id;
        optionNuevo.textContent = tipo.nombre;
        optionNuevo.dataset.categoria = tipo.categoria;
        optionNuevo.dataset.ayuno = tipo.requiere_ayuno;
        selectNuevo.appendChild(optionNuevo);
      });
    }
  } catch (error) {
    console.error('Error al cargar tipos de estudio:', error);
  }
}

// Cargar estudios
async function cargarEstudios(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', estudiosPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/estudios-solicitados/api/estudios?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-estudios');
    const tablaDiv = document.getElementById('tabla-estudios');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarEstudios(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-estudios').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-flask fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron estudios</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar estudios:', error);
    mostrarAlerta('error', 'Error al cargar estudios');
  }
}

// Mostrar estudios en la tabla
function mostrarEstudios(estudios) {
  const tbody = document.getElementById('tbody-estudios');
  
  tbody.innerHTML = estudios.map(estudio => {
    const fecha = new Date(estudio.created_at);
    
    const estadoClass = {
      'Pendiente': 'warning',
      'Realizado': 'success',
      'Cancelado': 'danger'
    }[estudio.estado] || 'secondary';
    
    const urgenciaClass = estudio.urgencia === 'Alta' ? 'danger' : 'info';
    
    return `
      <tr>
        <td>
          <strong>${estudio.paciente?.usuario?.nombre || 'N/A'} ${estudio.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${estudio.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          <span class="badge bg-primary">${estudio.tipo_estudio?.nombre || 'N/A'}</span>
          <br>
          <small class="text-muted">${estudio.tipo_estudio?.categoria || ''}</small>
          ${estudio.tipo_estudio?.requiere_ayuno ? 
            '<br><small class="badge bg-warning">Requiere ayuno</small>' : 
            ''
          }
        </td>
        <td>
          <span class="badge bg-${estadoClass}">
            ${estudio.estado}
          </span>
          ${estudio.turno_estudio ? 
            `<br><small class="text-muted">Turno: ${new Date(estudio.turno_estudio.fecha).toLocaleDateString('es-AR')}</small>` : 
            ''
          }
        </td>
        <td>
          <span class="badge bg-${urgenciaClass}">
            ${estudio.urgencia}
          </span>
        </td>
        <td>
          <small>
            ${fecha.toLocaleDateString('es-AR')}
            <br>
            ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleEstudio(${estudio.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            ${estudio.estado === 'Pendiente' ? `
              <button class="btn btn-sm btn-outline-danger" 
                      onclick="cancelarEstudio(${estudio.id})"
                      title="Cancelar">
                <i class="fas fa-times"></i>
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
  cargarEstudios(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Mostrar modal nuevo estudio
function mostrarModalNuevoEstudio() {
  document.getElementById('formNuevoEstudio').reset();
  new bootstrap.Modal(document.getElementById('modalNuevoEstudio')).show();
}

// Crear estudio
async function crearEstudio() {
  try {
    const formData = new FormData(document.getElementById('formNuevoEstudio'));
    const data = Object.fromEntries(formData.entries());
    
    // Convertir a números
    data.evaluacion_medica_id = parseInt(data.evaluacion_medica_id);
    data.paciente_id = parseInt(data.paciente_id);
    data.tipo_estudio_id = parseInt(data.tipo_estudio_id);
    
    const response = await fetch('/medico/estudios-solicitados/api/estudios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Estudio solicitado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoEstudio')).hide();
      cargarEstudios();
      cargarEstadisticas();
      cargarDistribucionCategorias();
    } else {
      mostrarAlerta('error', result.message || 'Error al solicitar estudio');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al solicitar estudio');
  }
}

// Ver detalle del estudio
async function verDetalleEstudio(id) {
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const estudio = data.data;
      const fecha = new Date(estudio.created_at);
      
      document.getElementById('modalDetalleEstudioBody').innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-user-circle me-2"></i>
              Información del Paciente
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Paciente:</th>
                <td>${estudio.paciente?.usuario?.nombre} ${estudio.paciente?.usuario?.apellido}</td>
              </tr>
              <tr>
                <th>DNI:</th>
                <td>${estudio.paciente?.usuario?.dni}</td>
              </tr>
              <tr>
                <th>Obra Social:</th>
                <td>${estudio.paciente?.obraSocial?.nombre || 'Sin obra social'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-flask me-2"></i>
              Información del Estudio
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Tipo:</th>
                <td>${estudio.tipo_estudio?.nombre}</td>
              </tr>
              <tr>
                <th>Categoría:</th>
                <td>${estudio.tipo_estudio?.categoria}</td>
              </tr>
              <tr>
                <th>Estado:</th>
                <td><span class="badge bg-${estudio.estado === 'Pendiente' ? 'warning' : estudio.estado === 'Realizado' ? 'success' : 'danger'}">${estudio.estado}</span></td>
              </tr>
              <tr>
                <th>Urgencia:</th>
                <td><span class="badge bg-${estudio.urgencia === 'Alta' ? 'danger' : 'info'}">${estudio.urgencia}</span></td>
              </tr>
              <tr>
                <th>Requiere Ayuno:</th>
                <td>${estudio.tipo_estudio?.requiere_ayuno ? 'Sí' : 'No'}</td>
              </tr>
              <tr>
                <th>Fecha Solicitud:</th>
                <td>${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR')}</td>
              </tr>
            </table>
          </div>
          
          ${estudio.evaluacion_medica?.diagnostico ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-notes-medical me-2"></i>
                Diagnóstico Asociado
              </h6>
              <div class="alert alert-info">
                <strong>${estudio.evaluacion_medica.diagnostico.codigo}:</strong> 
                ${estudio.evaluacion_medica.diagnostico.nombre}
              </div>
            </div>
          ` : ''}
          
          ${estudio.observaciones ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-comment me-2"></i>
                Observaciones
              </h6>
              <div class="alert alert-secondary">
                ${estudio.observaciones}
              </div>
            </div>
          ` : ''}
          
          ${estudio.turno_estudio ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-calendar-check me-2"></i>
                Turno Asignado
              </h6>
              <table class="table table-sm table-bordered">
                <tr>
                  <th width="30%">Fecha:</th>
                  <td>${new Date(estudio.turno_estudio.fecha).toLocaleDateString('es-AR')}</td>
                </tr>
                <tr>
                  <th>Hora:</th>
                  <td>${estudio.turno_estudio.hora}</td>
                </tr>
                <tr>
                  <th>Estado:</th>
                  <td><span class="badge bg-info">${estudio.turno_estudio.estado}</span></td>
                </tr>
                ${estudio.turno_estudio.resultado ? `
                  <tr>
                    <th>Resultado:</th>
                    <td>${estudio.turno_estudio.resultado}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          ` : ''}
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalleEstudio')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Cancelar estudio
async function cancelarEstudio(id) {
  if (!confirm('¿Está seguro de cancelar este estudio?')) return;
  
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', 'Estudio cancelado correctamente');
      cargarEstudios();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al cancelar estudio');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cancelar estudio');
  }
}

// Actualizar tabla
function actualizarTabla() {
  cargarEstudios();
  cargarEstadisticas();
  cargarDistribucionCategorias();
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