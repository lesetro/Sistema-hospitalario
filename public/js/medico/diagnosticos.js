let paginaActual = 1;
const diagnosticosPorPagina = 15;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarDiagnosticosMasUtilizados();
  cargarDiagnosticosRecientes();
  cargarTiposDiagnostico();
  cargarCatalogo();
  
  let timeoutBusqueda;
  document.getElementById('busquedaDiagnostico')?.addEventListener('input', function(e) {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
      paginaActual = 1;
      cargarCatalogo();
    }, 500);
  });
  
  document.getElementById('filtroTipo')?.addEventListener('change', function() {
    paginaActual = 1;
    cargarCatalogo();
  });
});

async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/diagnosticos/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-utilizados').textContent = data.data.diagnosticosUtilizados;
      document.getElementById('stat-con-diagnostico').textContent = data.data.evaluacionesConDiagnostico;
      document.getElementById('stat-sin-diagnostico').textContent = data.data.evaluacionesSinDiagnostico;
      document.getElementById('stat-mes').textContent = data.data.diagnosticosMes;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

async function cargarDiagnosticosMasUtilizados() {
  try {
    const response = await fetch('/medico/diagnosticos/api/diagnosticos/mas-utilizados?limite=10');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-mas-utilizados');
    const listaDiv = document.getElementById('lista-mas-utilizados');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      // ✅ CORREGIDO: Sin .get() - acceso directo a propiedades
      const maxUsos = parseInt(data.data[0].total_usos);
      
      listaDiv.innerHTML = `
        <div class="list-group list-group-flush">
          ${data.data.map(item => {
            const diagnostico = item.diagnostico;
            // ✅ CORREGIDO: Sin .get() - acceso directo
            const usos = parseInt(item.total_usos);
            const porcentaje = (usos / maxUsos) * 100;
            
            return `
              <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="flex-grow-1">
                    <h6 class="mb-0">
                      <span class="badge bg-secondary me-2">${diagnostico.codigo}</span>
                      ${diagnostico.nombre}
                    </h6>
                    <small class="text-muted">${diagnostico.tipoDiagnostico?.nombre || ''}</small>
                  </div>
                  <span class="badge bg-primary">${usos} uso${usos !== 1 ? 's' : ''}</span>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-primary" 
                       role="progressbar" 
                       style="width: ${porcentaje}%">
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      listaDiv.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-chart-bar fa-3x mb-3"></i>
          <p>No hay diagnósticos utilizados</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar diagnósticos más utilizados:', error);
    document.getElementById('loading-mas-utilizados').innerHTML = `
      <div class="alert alert-danger">Error al cargar diagnósticos</div>
    `;
  }
}

async function cargarDiagnosticosRecientes() {
  try {
    const response = await fetch('/medico/diagnosticos/api/diagnosticos/recientes?limite=10');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-recientes');
    const listaDiv = document.getElementById('lista-recientes');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      listaDiv.innerHTML = `
        <div class="timeline">
          ${data.data.map(ev => {
            const fecha = new Date(ev.fecha);
            const diagnostico = ev.diagnostico;
            const paciente = ev.paciente;
            
            return `
              <div class="timeline-item">
                <div class="timeline-marker bg-primary"></div>
                <div class="timeline-content">
                  <div class="d-flex justify-content-between">
                    <h6 class="mb-1">
                      <span class="badge bg-secondary me-2">${diagnostico.codigo}</span>
                      ${diagnostico.nombre}
                    </h6>
                    <small class="text-muted">${fecha.toLocaleDateString('es-AR')}</small>
                  </div>
                  <p class="mb-0 text-muted small">
                    <i class="fas fa-user me-1"></i>
                    ${paciente.usuario.nombre} ${paciente.usuario.apellido}
                  </p>
                  <small class="text-muted">${diagnostico.tipoDiagnostico?.nombre || ''}</small>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      listaDiv.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-history fa-3x mb-3"></i>
          <p>No hay diagnósticos recientes</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar diagnósticos recientes:', error);
    document.getElementById('loading-recientes').innerHTML = `
      <div class="alert alert-danger">Error al cargar diagnósticos</div>
    `;
  }
}

async function cargarTiposDiagnostico() {
  try {
    const response = await fetch('/medico/diagnosticos/api/tipos-diagnostico');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('filtroTipo');
      
      data.data.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.id;
        option.textContent = `${tipo.nombre} (${tipo.sistema_clasificacion})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar tipos de diagnóstico:', error);
  }
}

async function cargarCatalogo(pagina = paginaActual) {
  try {
    const busqueda = document.getElementById('busquedaDiagnostico').value;
    const tipo = document.getElementById('filtroTipo').value;
    
    const params = new URLSearchParams();
    params.append('page', pagina);
    params.append('limit', diagnosticosPorPagina);
    
    if (busqueda) params.append('busqueda', busqueda);
    if (tipo && tipo !== 'TODOS') params.append('tipoDiagnostico', tipo);
    
    const response = await fetch(`/medico/diagnosticos/api/diagnosticos?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-catalogo');
    const catalogoDiv = document.getElementById('catalogo-diagnosticos');
    
    loadingDiv.classList.add('d-none');
    catalogoDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarCatalogo(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-diagnosticos').innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <i class="fas fa-search fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron diagnósticos</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar catálogo:', error);
    mostrarAlerta('error', 'Error al cargar catálogo');
  }
}

function mostrarCatalogo(diagnosticos) {
  const tbody = document.getElementById('tbody-diagnosticos');
  
  tbody.innerHTML = diagnosticos.map(diagnostico => {
    return `
      <tr>
        <td>
          <span class="badge bg-secondary">${diagnostico.codigo}</span>
        </td>
        <td>
          <strong>${diagnostico.nombre}</strong>
        </td>
        <td>
          ${diagnostico.tipoDiagnostico ? 
            `<span class="badge bg-info">${diagnostico.tipoDiagnostico.nombre}</span>
             <br><small class="text-muted">${diagnostico.tipoDiagnostico.sistema_clasificacion}</small>` : 
            '<span class="text-muted">N/A</span>'
          }
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleDiagnostico(${diagnostico.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" 
                    onclick="verPacientesConDiagnostico(${diagnostico.id})"
                    title="Ver pacientes">
              <i class="fas fa-users"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

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
    if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
      html += `
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
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

function cambiarPagina(pagina) {
  paginaActual = pagina;
  cargarCatalogo(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

async function verDetalleDiagnostico(id) {
  try {
    const response = await fetch(`/medico/diagnosticos/api/diagnosticos/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const diagnostico = data.data.diagnostico;
      const stats = data.data.estadisticas;
      
      document.getElementById('modalDetalleDiagnosticoBody').innerHTML = `
        <div class="row g-3">
          <div class="col-md-12">
            <h5 class="text-primary mb-3">
              <span class="badge bg-secondary me-2">${diagnostico.codigo}</span>
              ${diagnostico.nombre}
            </h5>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-muted mb-2">Información del Diagnóstico</h6>
            <table class="table table-sm">
              <tr><th width="40%">Código:</th><td>${diagnostico.codigo}</td></tr>
              <tr><th>Nombre:</th><td>${diagnostico.nombre}</td></tr>
              <tr><th>Tipo:</th><td>${diagnostico.tipoDiagnostico?.nombre || 'N/A'}</td></tr>
              <tr><th>Sistema:</th><td>${diagnostico.tipoDiagnostico?.sistema_clasificacion || 'N/A'}</td></tr>
              ${diagnostico.descripcion ? `<tr><th>Descripción:</th><td>${diagnostico.descripcion}</td></tr>` : ''}
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-muted mb-2">Estadísticas de Uso</h6>
            <div class="card bg-light">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Veces utilizado:</span>
                  <strong class="text-primary">${stats.usosPorMedico}</strong>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span>Pacientes:</span>
                  <strong class="text-success">${stats.pacientesConDiagnostico}</strong>
                </div>
              </div>
            </div>
            ${stats.pacientesConDiagnostico > 0 ? `
              <div class="mt-3">
                <button class="btn btn-primary btn-sm w-100" 
                        onclick="verPacientesConDiagnostico(${diagnostico.id}); bootstrap.Modal.getInstance(document.getElementById('modalDetalleDiagnostico')).hide();">
                  <i class="fas fa-users me-2"></i>
                  Ver Pacientes
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalleDiagnostico')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

async function verPacientesConDiagnostico(diagnosticoId) {
  try {
    const response = await fetch(`/medico/diagnosticos/api/diagnosticos/${diagnosticoId}/pacientes`);
    const data = await response.json();
    
    if (data.success) {
      if (data.data.length > 0) {
        document.getElementById('modalPacientesDiagnosticoBody').innerHTML = `
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Paciente</th><th>DNI</th><th>Última Evaluación</th><th>Total Evaluaciones</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.map(item => {
                  const paciente = item.paciente;
                  const fecha = new Date(item.ultimaEvaluacion);
                  return `
                    <tr>
                      <td><strong>${paciente.usuario.nombre} ${paciente.usuario.apellido}</strong></td>
                      <td>${paciente.usuario.dni}</td>
                      <td>${fecha.toLocaleDateString('es-AR')}</td>
                      <td><span class="badge bg-primary">${item.totalEvaluaciones}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        document.getElementById('modalPacientesDiagnosticoBody').innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-users fa-3x mb-3"></i>
            <p>No hay pacientes con este diagnóstico</p>
          </div>
        `;
      }
      
      new bootstrap.Modal(document.getElementById('modalPacientesDiagnostico')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar pacientes');
  }
}

function buscarDiagnosticos() {
  paginaActual = 1;
  cargarCatalogo();
}

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
  setTimeout(() => alertContainer.remove(), 5000);
}