let paginaActual = 1;
const internacionesPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarInternacionesActivas();
  cargarPacientesParaFiltro();
  cargarInternaciones();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarInternaciones();
  });
  
  // Formulario actualizar estado
  document.getElementById('formActualizarEstado').addEventListener('submit', function(e) {
    e.preventDefault();
    actualizarEstado();
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/internaciones/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-activas').textContent = data.data.activas;
      document.getElementById('stat-con-alta').textContent = data.data.conAlta;
      document.getElementById('stat-mes').textContent = data.data.esteMes;
      document.getElementById('stat-total').textContent = data.data.totalInternaciones;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar internaciones activas
async function cargarInternacionesActivas() {
  try {
    const response = await fetch('/medico/internaciones/api/internaciones/activas');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-activas');
    const listaDiv = document.getElementById('lista-activas');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      listaDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Días Internado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(int => {
                const fechaInicio = new Date(int.fecha_inicio);
                const diasInternado = Math.floor((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
                
                const estadoClass = {
                  'Estable': 'success',
                  'Grave': 'warning',
                  'Critico': 'danger',
                  'Fallecido': 'dark',
                  'Sin_Evaluar': 'secondary'
                }[int.estado_paciente] || 'secondary';
                
                return `
                  <tr>
                    <td>
                      <strong>${int.paciente.usuario.nombre} ${int.paciente.usuario.apellido}</strong>
                      <br>
                      <small class="text-muted">${int.paciente.usuario.dni}</small>
                    </td>
                    <td>
                      Hab. ${int.habitacion?.numero || 'N/A'} - Cama ${int.cama?.numero || 'N/A'}
                      <br>
                      <small class="text-muted">${int.habitacion?.sector?.nombre || 'N/A'}</small>
                    </td>
                    <td>
                      <span class="badge bg-${estadoClass}">${int.estado_paciente}</span>
                    </td>
                    <td>${diasInternado} día${diasInternado !== 1 ? 's' : ''}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" onclick="verDetalle(${int.id})">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
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
          <i class="fas fa-bed fa-3x mb-3"></i>
          <p>No hay internaciones activas</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar internaciones activas:', error);
  }
}

// Cargar pacientes para filtro
async function cargarPacientesParaFiltro() {
  try {
    const response = await fetch('/medico/internaciones/api/pacientes-filtro');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('filtroPaciente');
      
      data.data.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = `${paciente.usuario.nombre} ${paciente.usuario.apellido} (${paciente.usuario.dni})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
  }
}

// Cargar internaciones
async function cargarInternaciones(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', internacionesPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/internaciones/api/internaciones?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-internaciones');
    const tablaDiv = document.getElementById('tabla-internaciones');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarInternaciones(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-internaciones').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-bed fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron internaciones</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar internaciones:', error);
    mostrarAlerta('error', 'Error al cargar internaciones');
  }
}

// Mostrar internaciones en la tabla
function mostrarInternaciones(internaciones) {
  const tbody = document.getElementById('tbody-internaciones');
  
  tbody.innerHTML = internaciones.map(int => {
    const fechaInicio = new Date(int.fecha_inicio);
    
    const estadoClass = {
      'Estable': 'success',
      'Grave': 'warning',
      'Critico': 'danger',
      'Fallecido': 'dark',
      'Sin_Evaluar': 'secondary'
    }[int.estado_paciente] || 'secondary';
    
    return `
      <tr>
        <td>
          <strong>${int.paciente?.usuario?.nombre || 'N/A'} ${int.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${int.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          Hab. ${int.habitacion?.numero || 'N/A'} - Cama ${int.cama?.numero || 'N/A'}
          <br>
          <small class="text-muted">${int.habitacion?.sector?.nombre || 'N/A'}</small>
        </td>
        <td>
          ${int.tipoInternacion?.nombre || 'N/A'}
          ${int.fecha_alta ? 
            '<br><span class="badge bg-success">Con Alta</span>' : 
            '<br><span class="badge bg-primary">Activa</span>'
          }
        </td>
        <td>
          <span class="badge bg-${estadoClass}">${int.estado_paciente}</span>
          <br>
          <small class="text-muted">
            Estudios: ${int.estado_estudios}
            <br>
            ${int.estado_operacion !== 'No aplica' ? `Op: ${int.estado_operacion}` : ''}
          </small>
        </td>
        <td>
          ${fechaInicio.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fechaInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalle(${int.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            ${!int.fecha_alta ? `
              <button class="btn btn-sm btn-outline-primary" 
                      onclick="mostrarModalActualizar(${int.id})"
                      title="Actualizar estado">
                <i class="fas fa-edit"></i>
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
  cargarInternaciones(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Ver detalle
async function verDetalle(id) {
  try {
    const response = await fetch(`/medico/internaciones/api/internaciones/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const int = data.data;
      const fechaInicio = new Date(int.fecha_inicio);
      const fechaAlta = int.fecha_alta ? new Date(int.fecha_alta) : null;
      
      document.getElementById('modalDetalleBody').innerHTML = `
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
              <i class="fas fa-bed me-2"></i>
              Información de Internación
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Tipo:</th>
                <td>${int.tipoInternacion?.nombre || 'N/A'}</td>
              </tr>
              <tr>
                <th>Habitación:</th>
                <td>Hab. ${int.habitacion?.numero} - Cama ${int.cama?.numero}</td>
              </tr>
              <tr>
                <th>Sector:</th>
                <td>${int.habitacion?.sector?.nombre || 'N/A'}</td>
              </tr>
              <tr>
                <th>Fecha Inicio:</th>
                <td>${fechaInicio.toLocaleString('es-AR')}</td>
              </tr>
              ${fechaAlta ? `
                <tr>
                  <th>Fecha Alta:</th>
                  <td>${fechaAlta.toLocaleString('es-AR')}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="col-md-12">
            <h6 class="text-primary mb-3">
              <i class="fas fa-heartbeat me-2"></i>
              Estados
            </h6>
            <div class="row">
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <strong>Estado Paciente:</strong>
                    <br>
                    <span class="badge bg-${{'Estable': 'success', 'Grave': 'warning', 'Critico': 'danger', 'Fallecido': 'dark', 'Sin_Evaluar': 'secondary'}[int.estado_paciente]}">${int.estado_paciente}</span>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <strong>Estado Estudios:</strong>
                    <br>
                    <span class="badge bg-${int.estado_estudios === 'Completos' ? 'success' : 'warning'}">${int.estado_estudios}</span>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-light">
                  <div class="card-body">
                    <strong>Estado Operación:</strong>
                    <br>
                    <span class="badge bg-info">${int.estado_operacion}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${int.evaluacionMedica ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-notes-medical me-2"></i>
                Evaluación Médica Asociada
              </h6>
              <div class="alert alert-info">
                Fecha: ${new Date(int.evaluacionMedica.fecha).toLocaleDateString('es-AR')}
                ${int.evaluacionMedica.diagnostico ? 
                  `<br><strong>Diagnóstico:</strong> ${int.evaluacionMedica.diagnostico.codigo} - ${int.evaluacionMedica.diagnostico.nombre}` : 
                  ''
                }
              </div>
            </div>
          ` : ''}
          
          ${int.intervencionQuirurgica ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-procedures me-2"></i>
                Intervención Quirúrgica
              </h6>
              <div class="alert alert-warning">
                <strong>Procedimiento:</strong> ${int.intervencionQuirurgica.tipo_procedimiento}
                <br>
                <strong>Fecha:</strong> ${new Date(int.intervencionQuirurgica.fecha_inicio).toLocaleString('es-AR')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Mostrar modal actualizar
function mostrarModalActualizar(id) {
  document.getElementById('actualizarId').value = id;
  document.getElementById('formActualizarEstado').reset();
  new bootstrap.Modal(document.getElementById('modalActualizarEstado')).show();
}

// Actualizar estado
async function actualizarEstado() {
  try {
    const id = document.getElementById('actualizarId').value;
    const formData = new FormData(document.getElementById('formActualizarEstado'));
    const data = {};
    
    // Solo incluir campos con valor
    for (let [key, value] of formData.entries()) {
      if (value) data[key] = value;
    }
    
    if (Object.keys(data).length === 0) {
      mostrarAlerta('error', 'Debe seleccionar al menos un campo para actualizar');
      return;
    }
    
    const response = await fetch(`/medico/internaciones/api/internaciones/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalActualizarEstado')).hide();
      cargarInternaciones();
      cargarInternacionesActivas();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al actualizar estado');
  }
}

// Actualizar tabla
function actualizarTabla() {
  cargarInternaciones();
  cargarEstadisticas();
  cargarInternacionesActivas();
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