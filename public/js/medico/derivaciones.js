let paginaActual = 1;
const derivacionesPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarDerivacionesPendientes();
  cargarSectores();
  cargarPacientesParaFiltro();
  cargarDerivaciones();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarDerivaciones();
  });
  
  // Formulario nueva derivación
  document.getElementById('formNuevaDerivacion').addEventListener('submit', function(e) {
    e.preventDefault();
    crearDerivacion();
  });
  
  // Formulario gestionar derivación
  document.getElementById('formGestionarDerivacion').addEventListener('submit', function(e) {
    e.preventDefault();
    gestionarDerivacion();
  });
  
  // Mostrar/ocultar motivo rechazo
  document.getElementById('gestionarEstado').addEventListener('change', function(e) {
    const divMotivo = document.getElementById('divMotivoRechazo');
    const motivoInput = document.getElementById('motivoRechazo');
    
    if (e.target.value === 'Rechazada') {
      divMotivo.classList.remove('d-none');
      motivoInput.required = true;
    } else {
      divMotivo.classList.add('d-none');
      motivoInput.required = false;
    }
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/derivaciones/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-enviadas').textContent = data.data.enviadas;
      document.getElementById('stat-recibidas').textContent = data.data.recibidas;
      document.getElementById('stat-pendientes').textContent = data.data.pendientesRecibir;
      document.getElementById('stat-mes').textContent = data.data.esteMes;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar derivaciones pendientes
async function cargarDerivacionesPendientes() {
  try {
    const response = await fetch('/medico/derivaciones/api/derivaciones/pendientes');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-pendientes');
    const listaDiv = document.getElementById('lista-pendientes');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      listaDiv.innerHTML = `
        <div class="alert alert-warning mb-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Hay <strong>${data.data.length}</strong> derivación${data.data.length !== 1 ? 'es' : ''} pendiente${data.data.length !== 1 ? 's' : ''} de aprobar
        </div>
        
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(der => {
                const fecha = new Date(der.fecha);
                
                return `
                  <tr>
                    <td>
                      <strong>${der.paciente.usuario.nombre} ${der.paciente.usuario.apellido}</strong>
                      <br>
                      <small class="text-muted">${der.paciente.usuario.dni}</small>
                    </td>
                    <td>${der.origen.nombre}</td>
                    <td>${fecha.toLocaleDateString('es-AR')}</td>
                    <td>
                      <button class="btn btn-sm btn-warning" 
                              onclick="mostrarModalGestionar(${der.id})">
                        <i class="fas fa-tasks me-1"></i>
                        Gestionar
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
          <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
          <p>No hay derivaciones pendientes de aprobar</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
  }
}

// Cargar sectores
async function cargarSectores() {
  try {
    const response = await fetch('/medico/derivaciones/api/sectores');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('nuevoDestinoId');
      
      data.data.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector.id;
        option.textContent = sector.nombre;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar sectores:', error);
  }
}

// Cargar pacientes para filtro
async function cargarPacientesParaFiltro() {
  try {
    const response = await fetch('/medico/derivaciones/api/pacientes-filtro');
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

// Cargar derivaciones
async function cargarDerivaciones(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', derivacionesPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/derivaciones/api/derivaciones?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-derivaciones');
    const tablaDiv = document.getElementById('tabla-derivaciones');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarDerivaciones(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-derivaciones').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-exchange-alt fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron derivaciones</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar derivaciones:', error);
    mostrarAlerta('error', 'Error al cargar derivaciones');
  }
}

// Mostrar derivaciones en la tabla
function mostrarDerivaciones(derivaciones) {
  const tbody = document.getElementById('tbody-derivaciones');
  
  tbody.innerHTML = derivaciones.map(der => {
    const fecha = new Date(der.fecha);
    
    const tipoColors = {
      'Interna': 'primary',
      'Externa': 'info'
    };
    
    const estadoColors = {
      'Pendiente': 'warning',
      'Aprobada': 'success',
      'Rechazada': 'danger'
    };
    
    return `
      <tr>
        <td>
          <strong>${der.paciente?.usuario?.nombre || 'N/A'} ${der.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${der.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          <small>
            <strong>${der.origen?.nombre || 'N/A'}</strong>
            <br>
            <i class="fas fa-arrow-down text-primary"></i>
            <br>
            <strong>${der.destino?.nombre || 'N/A'}</strong>
          </small>
        </td>
        <td>
          <span class="badge bg-${tipoColors[der.tipo] || 'secondary'}">
            ${der.tipo}
          </span>
        </td>
        <td>
          <span class="badge bg-${estadoColors[der.estado] || 'secondary'}">
            ${der.estado}
          </span>
        </td>
        <td>
          ${fecha.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-info" 
                  onclick="verDetalle(${der.id})"
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
  cargarDerivaciones(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Mostrar modal nueva derivación
function mostrarModalNuevaDerivacion() {
  document.getElementById('formNuevaDerivacion').reset();
  new bootstrap.Modal(document.getElementById('modalNuevaDerivacion')).show();
}

// Crear derivación
async function crearDerivacion() {
  try {
    const formData = new FormData(document.getElementById('formNuevaDerivacion'));
    const data = Object.fromEntries(formData.entries());
    
    data.paciente_id = parseInt(data.paciente_id);
    data.destino_id = parseInt(data.destino_id);
    
    const response = await fetch('/medico/derivaciones/api/derivaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalNuevaDerivacion')).hide();
      cargarDerivaciones();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', result.message || 'Error al crear derivación');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear derivación');
  }
}

// Ver detalle
async function verDetalle(id) {
  try {
    const response = await fetch(`/medico/derivaciones/api/derivaciones/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const der = data.data;
      const fecha = new Date(der.fecha);
      
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
                <td>${der.paciente.usuario.nombre} ${der.paciente.usuario.apellido}</td>
              </tr>
              <tr>
                <th>DNI:</th>
                <td>${der.paciente.usuario.dni}</td>
              </tr>
              <tr>
                <th>Obra Social:</th>
                <td>${der.paciente.obraSocial?.nombre || 'Sin obra social'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-exchange-alt me-2"></i>
              Información de Derivación
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Tipo:</th>
                <td><span class="badge bg-info">${der.tipo}</span></td>
              </tr>
              <tr>
                <th>Estado:</th>
                <td><span class="badge bg-${{'Pendiente': 'warning', 'Aprobada': 'success', 'Rechazada': 'danger'}[der.estado]}">${der.estado}</span></td>
              </tr>
              <tr>
                <th>Fecha:</th>
                <td>${fecha.toLocaleString('es-AR')}</td>
              </tr>
              <tr>
                <th>Origen:</th>
                <td>${der.origen.nombre}</td>
              </tr>
              <tr>
                <th>Destino:</th>
                <td>${der.destino.nombre}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-12">
            <h6 class="text-primary mb-2">
              <i class="fas fa-comment me-2"></i>
              Motivo
            </h6>
            <div class="border rounded p-3 bg-light" style="white-space: pre-wrap;">
${der.motivo}
            </div>
          </div>
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Mostrar modal gestionar
function mostrarModalGestionar(id) {
  document.getElementById('gestionarId').value = id;
  document.getElementById('formGestionarDerivacion').reset();
  document.getElementById('divMotivoRechazo').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('modalGestionarDerivacion')).show();
}

// Gestionar derivación
async function gestionarDerivacion() {
  try {
    const id = document.getElementById('gestionarId').value;
    const formData = new FormData(document.getElementById('formGestionarDerivacion'));
    const data = Object.fromEntries(formData.entries());
    
    const response = await fetch(`/medico/derivaciones/api/derivaciones/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalGestionarDerivacion')).hide();
      cargarDerivaciones();
      cargarEstadisticas();
      cargarDerivacionesPendientes();
    } else {
      mostrarAlerta('error', result.message || 'Error al gestionar derivación');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al gestionar derivación');
  }
}

// Actualizar tabla
function actualizarTabla() {
  cargarDerivaciones();
  cargarEstadisticas();
  cargarDerivacionesPendientes();
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