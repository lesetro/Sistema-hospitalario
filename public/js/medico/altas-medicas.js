let paginaActual = 1;
const altasPorPagina = 10;
let altaActual = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarPendientesAlta();
  cargarPacientesParaFiltro();
  cargarAltas();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarAltas();
  });
  
  // Formulario nueva alta
  document.getElementById('formNuevaAlta').addEventListener('submit', function(e) {
    e.preventDefault();
    crearAlta();
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/altas-medicas/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-total').textContent = data.data.totalAltas;
      document.getElementById('stat-mes').textContent = data.data.esteMes;
      document.getElementById('stat-semana').textContent = data.data.estaSemana;
      document.getElementById('stat-hoy').textContent = data.data.hoy;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar pendientes de alta
async function cargarPendientesAlta() {
  try {
    const response = await fetch('/medico/altas-medicas/api/altas/pendientes');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-pendientes');
    const listaDiv = document.getElementById('lista-pendientes');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    const totalPendientes = (data.data.internaciones?.length || 0) + (data.data.admisiones?.length || 0);
    
    if (data.success && totalPendientes > 0) {
      listaDiv.innerHTML = `
        <div class="alert alert-warning mb-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Hay <strong>${totalPendientes}</strong> caso${totalPendientes !== 1 ? 's' : ''} pendiente${totalPendientes !== 1 ? 's' : ''} de alta médica
        </div>
        
        ${data.data.internaciones.length > 0 ? `
          <h6 class="mb-3">Internaciones Sin Alta</h6>
          <div class="table-responsive mb-4">
            <table class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Ubicación</th>
                  <th>Días Internado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.internaciones.map(int => {
                  const fechaInicio = new Date(int.fecha_inicio);
                  const diasInternado = Math.floor((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
                  
                  return `
                    <tr>
                      <td>
                        <strong>${int.paciente.usuario.nombre} ${int.paciente.usuario.apellido}</strong>
                        <br>
                        <small class="text-muted">${int.paciente.usuario.dni}</small>
                      </td>
                      <td>
                        Hab. ${int.habitacion?.numero || 'N/A'} - Cama ${int.cama?.numero || 'N/A'}
                      </td>
                      <td>${diasInternado} día${diasInternado !== 1 ? 's' : ''}</td>
                      <td>
                        <button class="btn btn-sm btn-success" 
                                onclick="prepararAlta(${int.paciente_id}, ${int.id}, null)">
                          <i class="fas fa-sign-out-alt me-1"></i>
                          Dar Alta
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${data.data.admisiones.length > 0 ? `
          <h6 class="mb-3">Admisiones Pendientes</h6>
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Fecha Admisión</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.admisiones.map(adm => {
                  const fechaAdm = new Date(adm.fecha);
                  
                  return `
                    <tr>
                      <td>
                        <strong>${adm.paciente.usuario.nombre} ${adm.paciente.usuario.apellido}</strong>
                        <br>
                        <small class="text-muted">${adm.paciente.usuario.dni}</small>
                      </td>
                      <td>${fechaAdm.toLocaleDateString('es-AR')}</td>
                      <td>
                        <button class="btn btn-sm btn-success" 
                                onclick="prepararAlta(${adm.paciente_id}, null, ${adm.id})">
                          <i class="fas fa-sign-out-alt me-1"></i>
                          Dar Alta
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      `;
    } else {
      listaDiv.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
          <p>No hay casos pendientes de alta médica</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
  }
}

// Preparar alta desde pendientes
function prepararAlta(pacienteId, internacionId, admisionId) {
  document.getElementById('formNuevaAlta').reset();
  document.getElementById('nuevoPacienteId').value = pacienteId;
  if (internacionId) document.getElementById('nuevaInternacionId').value = internacionId;
  if (admisionId) document.getElementById('nuevaAdmisionId').value = admisionId;
  new bootstrap.Modal(document.getElementById('modalNuevaAlta')).show();
}

// Cargar pacientes para filtro
async function cargarPacientesParaFiltro() {
  try {
    const response = await fetch('/medico/altas-medicas/api/pacientes-filtro');
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

// Cargar altas
async function cargarAltas(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', altasPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/altas-medicas/api/altas?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-altas');
    const tablaDiv = document.getElementById('tabla-altas');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarAltas(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-altas').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron altas médicas</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar altas:', error);
    mostrarAlerta('error', 'Error al cargar altas médicas');
  }
}

// Mostrar altas en la tabla
function mostrarAltas(altas) {
  const tbody = document.getElementById('tbody-altas');
  
  tbody.innerHTML = altas.map(alta => {
    const fechaAlta = new Date(alta.fecha_alta);
    
    const tipoColors = {
      'Voluntaria': 'info',
      'Medica': 'success',
      'Contraindicada': 'warning'
    };
    
    const estadoColors = {
      'Estable': 'success',
      'Grave': 'warning',
      'Critico': 'danger',
      'Fallecido': 'dark'
    };
    
    const origen = alta.internacion ? 
      `Internación - Hab. ${alta.internacion.habitacion?.numero || 'N/A'}` : 
      `Admisión #${alta.admision?.id || 'N/A'}`;
    
    return `
      <tr>
        <td>
          <strong>${alta.paciente?.usuario?.nombre || 'N/A'} ${alta.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${alta.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          <span class="badge bg-${tipoColors[alta.tipo_alta] || 'secondary'}">
            ${alta.tipo_alta}
          </span>
        </td>
        <td>
          <span class="badge bg-${estadoColors[alta.estado_paciente] || 'secondary'}">
            ${alta.estado_paciente}
          </span>
        </td>
        <td>
          ${fechaAlta.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fechaAlta.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <small>${origen}</small>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-info" 
                  onclick="verDetalle(${alta.id})"
                  title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
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
  cargarAltas(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Mostrar modal nueva alta
function mostrarModalNuevaAlta() {
  document.getElementById('formNuevaAlta').reset();
  new bootstrap.Modal(document.getElementById('modalNuevaAlta')).show();
}

// Crear alta
async function crearAlta() {
  try {
    const formData = new FormData(document.getElementById('formNuevaAlta'));
    const data = Object.fromEntries(formData.entries());
    
    // Convertir a números
    data.paciente_id = parseInt(data.paciente_id);
    if (data.internacion_id) data.internacion_id = parseInt(data.internacion_id);
    if (data.admision_id) data.admision_id = parseInt(data.admision_id);
    
    const response = await fetch('/medico/altas-medicas/api/altas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalNuevaAlta')).hide();
      cargarAltas();
      cargarEstadisticas();
      cargarPendientesAlta();
    } else {
      mostrarAlerta('error', result.message || 'Error al registrar alta');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al registrar alta médica');
  }
}

// Ver detalle
async function verDetalle(id) {
  try {
    const response = await fetch(`/medico/altas-medicas/api/altas/${id}`);
    const data = await response.json();
    
    if (data.success) {
      altaActual = data.data;
      const alta = data.data;
      const fechaAlta = new Date(alta.fecha_alta);
      
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
                <td>${alta.paciente.usuario.nombre} ${alta.paciente.usuario.apellido}</td>
              </tr>
              <tr>
                <th>DNI:</th>
                <td>${alta.paciente.usuario.dni}</td>
              </tr>
              <tr>
                <th>Obra Social:</th>
                <td>${alta.paciente.obraSocial?.nombre || 'Sin obra social'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-sign-out-alt me-2"></i>
              Información del Alta
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Tipo de Alta:</th>
                <td><span class="badge bg-info">${alta.tipo_alta}</span></td>
              </tr>
              <tr>
                <th>Estado Paciente:</th>
                <td><span class="badge bg-${{'Estable': 'success', 'Grave': 'warning', 'Critico': 'danger', 'Fallecido': 'dark'}[alta.estado_paciente]}">${alta.estado_paciente}</span></td>
              </tr>
              <tr>
                <th>Fecha Alta:</th>
                <td>${fechaAlta.toLocaleString('es-AR')}</td>
              </tr>
            </table>
          </div>
          
          ${alta.internacion ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-bed me-2"></i>
                Internación Asociada
              </h6>
              <div class="alert alert-info">
                <strong>Habitación:</strong> ${alta.internacion.habitacion?.numero || 'N/A'} - 
                <strong>Cama:</strong> ${alta.internacion.cama?.numero || 'N/A'}
                <br>
                <strong>Sector:</strong> ${alta.internacion.habitacion?.sector?.nombre || 'N/A'}
                <br>
                <strong>Tipo:</strong> ${alta.internacion.tipoInternacion?.nombre || 'N/A'}
              </div>
            </div>
          ` : ''}
          
          ${alta.admision ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-clipboard-check me-2"></i>
                Admisión Asociada
              </h6>
              <div class="alert alert-info">
                ID Admisión: ${alta.admision.id}
                <br>
                Fecha: ${new Date(alta.admision.fecha).toLocaleDateString('es-AR')}
                <br>
                Estado: ${alta.admision.estado}
              </div>
            </div>
          ` : ''}
          
          ${alta.instrucciones_post_alta ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-notes-medical me-2"></i>
                Instrucciones Post-Alta
              </h6>
              <div class="border rounded p-3 bg-light" style="white-space: pre-wrap;">
${alta.instrucciones_post_alta}
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

// Imprimir alta
function imprimirAlta() {
  if (!altaActual) return;
  
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>Alta Médica</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; text-align: center; }
          .info { margin: 20px 0; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
          table { width: 100%; }
          th { text-align: left; width: 40%; }
        </style>
      </head>
      <body>
        <h1>ALTA MÉDICA</h1>
        
        <div class="section">
          <h3>Información del Paciente</h3>
          <table>
            <tr><th>Nombre:</th><td>${altaActual.paciente.usuario.nombre} ${altaActual.paciente.usuario.apellido}</td></tr>
            <tr><th>DNI:</th><td>${altaActual.paciente.usuario.dni}</td></tr>
            <tr><th>Obra Social:</th><td>${altaActual.paciente.obraSocial?.nombre || 'Sin obra social'}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Información del Alta</h3>
          <table>
            <tr><th>Tipo de Alta:</th><td>${altaActual.tipo_alta}</td></tr>
            <tr><th>Estado del Paciente:</th><td>${altaActual.estado_paciente}</td></tr>
            <tr><th>Fecha:</th><td>${new Date(altaActual.fecha_alta).toLocaleString('es-AR')}</td></tr>
          </table>
        </div>
        
        ${altaActual.instrucciones_post_alta ? `
          <div class="section">
            <h3>Instrucciones Post-Alta</h3>
            <p style="white-space: pre-wrap;">${altaActual.instrucciones_post_alta}</p>
          </div>
        ` : ''}
      </body>
    </html>
  `);
  ventanaImpresion.document.close();
  ventanaImpresion.print();
}

// Actualizar tabla
function actualizarTabla() {
  cargarAltas();
  cargarEstadisticas();
  cargarPendientesAlta();
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