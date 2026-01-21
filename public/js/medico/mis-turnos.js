let paginaActual = 1;
const turnosPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Página cargada - Iniciando cargas de datos');
  
  cargarEstadisticas();
  cargarTurnos();
  
  // Formulario de filtros
  const formFiltros = document.getElementById('formFiltros');
  if (formFiltros) {
    formFiltros.addEventListener('submit', function(e) {
      e.preventDefault();
      paginaActual = 1;
      cargarTurnos();
    });
  }
  
  // Formulario de cancelación
  const formCancelar = document.getElementById('formCancelarTurno');
  if (formCancelar) {
    formCancelar.addEventListener('submit', function(e) {
      e.preventDefault();
      cancelarTurno();
    });
  }
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    const url = '/medico/mis-turnos/api/estadisticas';
    console.log('📊 Cargando estadísticas desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos estadísticas:', data);
    
    if (data.success) {
      console.log('✅ Actualizando elementos HTML...');
      
      const statPendientes = document.getElementById('stat-pendientes');
      const statConfirmados = document.getElementById('stat-confirmados');
      const statCompletados = document.getElementById('stat-completados');
      const statCancelados = document.getElementById('stat-cancelados');
      
      if (statPendientes) {
        statPendientes.textContent = data.data.PENDIENTE || 0;
        console.log('✅ Pendientes actualizado:', data.data.PENDIENTE);
      }
      if (statConfirmados) {
        statConfirmados.textContent = data.data.CONFIRMADO || 0;
        console.log('✅ Confirmados actualizado:', data.data.CONFIRMADO);
      }
      if (statCompletados) {
        statCompletados.textContent = data.data.COMPLETADO || 0;
        console.log('✅ Completados actualizado:', data.data.COMPLETADO);
      }
      if (statCancelados) {
        statCancelados.textContent = data.data.CANCELADO || 0;
        console.log('✅ Cancelados actualizado:', data.data.CANCELADO);
      }
    } else {
      console.warn('⚠️ Respuesta success falsa');
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error.message, error);
  }
}

// ========================================
// CARGAR TURNOS
// ========================================
async function cargarTurnos(pagina = paginaActual) {
  try {
    const formFiltros = document.getElementById('formFiltros');
    const formData = formFiltros ? new FormData(formFiltros) : new FormData();
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', turnosPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const url = `/medico/mis-turnos/api/turnos?${params.toString()}`;
    console.log('📅 Cargando turnos desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos turnos:', data);
    
    const loadingDiv = document.getElementById('loading-turnos');
    const tablaDiv = document.getElementById('tabla-turnos');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (tablaDiv) tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Turnos encontrados:', data.data.length);
      mostrarTurnos(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      console.warn('⚠️ Sin turnos o respuesta vacía');
      const tbody = document.getElementById('tbody-turnos');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-4">
              <i class="fas fa-calendar-times fa-3x text-muted mb-3 d-block"></i>
              <p class="text-muted">No se encontraron turnos</p>
            </td>
          </tr>
        `;
      }
      const paginacion = document.getElementById('paginacion');
      if (paginacion) paginacion.innerHTML = '';
    }
  } catch (error) {
    console.error('❌ Error al cargar turnos:', error.message);
    mostrarAlerta('error', 'Error al cargar turnos');
  }
}

// ========================================
// MOSTRAR TURNOS EN LA TABLA
// ========================================
function mostrarTurnos(turnos) {
  const tbody = document.getElementById('tbody-turnos');
  if (!tbody) return;
  
  tbody.innerHTML = turnos.map(turno => {
    const fecha = new Date(turno.fecha);
    const estadoClass = {
      'PENDIENTE': 'warning',
      'CONFIRMADO': 'success',
      'COMPLETADO': 'info',
      'CANCELADO': 'danger'
    }[turno.estado] || 'secondary';
    
    const estadoIcon = {
      'PENDIENTE': 'clock',
      'CONFIRMADO': 'check-circle',
      'COMPLETADO': 'calendar-check',
      'CANCELADO': 'times-circle'
    }[turno.estado] || 'question-circle';
    
    return `
      <tr>
        <td>
          <div>
            <i class="fas fa-calendar-alt me-2"></i>
            <strong>${fecha.toLocaleDateString('es-AR')}</strong>
          </div>
          <small class="text-muted">
            <i class="fas fa-clock me-1"></i>
            ${turno.hora_inicio || 'N/A'} - ${turno.hora_fin || 'N/A'}
          </small>
        </td>
        <td>
          <div>
            <i class="fas fa-user-circle me-2"></i>
            <strong>${turno.paciente?.usuario?.nombre || 'N/A'} ${turno.paciente?.usuario?.apellido || ''}</strong>
          </div>
          <small class="text-muted">
            DNI: ${turno.paciente?.usuario?.dni || 'N/A'}
          </small>
        </td>
        <td>
          <span class="badge bg-${estadoClass}">
            <i class="fas fa-${estadoIcon} me-1"></i>
            ${turno.estado || 'N/A'}
          </span>
        </td>
        <td>
          ${turno.tipo_estudio ? 
            `<span class="badge bg-secondary">
              <i class="fas fa-x-ray me-1"></i>
              ${turno.tipo_estudio.nombre}
            </span>` : 
            `<span class="badge bg-primary">
              <i class="fas fa-stethoscope me-1"></i>
              Consulta
            </span>`
          }
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleTurno(${turno.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            ${turno.estado === 'PENDIENTE' ? `
              <button class="btn btn-sm btn-outline-success" 
                      onclick="confirmarTurno(${turno.id})"
                      title="Confirmar">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            ${turno.estado === 'CONFIRMADO' ? `
              <button class="btn btn-sm btn-outline-primary" 
                      onclick="completarTurno(${turno.id})"
                      title="Completar">
                <i class="fas fa-check-double"></i>
              </button>
            ` : ''}
            ${['PENDIENTE', 'CONFIRMADO'].includes(turno.estado) ? `
              <button class="btn btn-sm btn-outline-danger" 
                      onclick="mostrarModalCancelar(${turno.id})"
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

// ========================================
// MOSTRAR PAGINACIÓN
// ========================================
function mostrarPaginacion(pagination) {
  const paginacionDiv = document.getElementById('paginacion');
  if (!paginacionDiv) return;
  
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

// ========================================
// CAMBIAR PÁGINA
// ========================================
function cambiarPagina(pagina) {
  paginaActual = pagina;
  cargarTurnos(pagina);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// VER DETALLE DEL TURNO
// ========================================
async function verDetalleTurno(id) {
  try {
    console.log('🔍 Obteniendo detalle del turno:', id);
    const response = await fetch(`/medico/mis-turnos/api/turnos/${id}`);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos del turno:', data);
    
    if (data.success) {
      const turno = data.data;
      const fecha = new Date(turno.fecha);
      
      const modal = document.getElementById('modalDetalleTurnoBody');
      if (modal) {
        modal.innerHTML = `
          <div class="row g-3">
            <div class="col-md-6">
              <h6 class="text-primary">
                <i class="fas fa-user-circle me-2"></i>
                Información del Paciente
              </h6>
              <table class="table table-sm">
                <tr>
                  <th width="40%">Nombre:</th>
                  <td>${turno.paciente?.usuario?.nombre || 'N/A'} ${turno.paciente?.usuario?.apellido || ''}</td>
                </tr>
                <tr>
                  <th>DNI:</th>
                  <td>${turno.paciente?.usuario?.dni || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Teléfono:</th>
                  <td>${turno.paciente?.usuario?.telefono || 'No registrado'}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>${turno.paciente?.usuario?.email || 'No registrado'}</td>
                </tr>
                <tr>
                  <th>Obra Social:</th>
                  <td>${turno.paciente?.obraSocial?.nombre || 'Sin obra social'}</td>
                </tr>
              </table>
            </div>
            
            <div class="col-md-6">
              <h6 class="text-primary">
                <i class="fas fa-calendar-alt me-2"></i>
                Información del Turno
              </h6>
              <table class="table table-sm">
                <tr>
                  <th width="40%">Fecha:</th>
                  <td>${fecha.toLocaleDateString('es-AR')}</td>
                </tr>
                <tr>
                  <th>Hora Inicio:</th>
                  <td>${turno.hora_inicio || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Hora Fin:</th>
                  <td>${turno.hora_fin || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Estado:</th>
                  <td><span class="badge bg-${getEstadoClass(turno.estado)}">${turno.estado || 'N/A'}</span></td>
                </tr>
                <tr>
                  <th>Sector:</th>
                  <td>${turno.sector?.nombre || 'N/A'}</td>
                </tr>
                ${turno.tipo_estudio ? `
                  <tr>
                    <th>Tipo Estudio:</th>
                    <td>${turno.tipo_estudio.nombre}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          </div>
        `;
        
        new bootstrap.Modal(document.getElementById('modalDetalleTurno')).show();
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar detalle:', error.message);
    mostrarAlerta('error', 'Error al cargar detalle del turno');
  }
}

// ========================================
// CONFIRMAR TURNO
// ========================================
async function confirmarTurno(id) {
  if (!confirm('¿Está seguro de confirmar este turno?')) return;
  
  try {
    console.log('✅ Confirmando turno:', id);
    const response = await fetch(`/medico/mis-turnos/api/turnos/${id}/confirmar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('📦 Respuesta confirmación:', data);
    
    if (data.success) {
      mostrarAlerta('success', 'Turno confirmado correctamente');
      cargarTurnos();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al confirmar turno');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    mostrarAlerta('error', 'Error al confirmar turno');
  }
}

// ========================================
// COMPLETAR TURNO
// ========================================
async function completarTurno(id) {
  if (!confirm('¿Está seguro de marcar este turno como completado?')) return;
  
  try {
    console.log('✅ Completando turno:', id);
    const response = await fetch(`/medico/mis-turnos/api/turnos/${id}/completar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('📦 Respuesta completación:', data);
    
    if (data.success) {
      mostrarAlerta('success', 'Turno completado correctamente');
      cargarTurnos();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al completar turno');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    mostrarAlerta('error', 'Error al completar turno');
  }
}

// ========================================
// MOSTRAR MODAL DE CANCELACIÓN
// ========================================
function mostrarModalCancelar(id) {
  const inputId = document.getElementById('cancelarTurnoId');
  const textarea = document.getElementById('motivoCancelacion');
  
  if (inputId) inputId.value = id;
  if (textarea) textarea.value = '';
  
  new bootstrap.Modal(document.getElementById('modalCancelarTurno')).show();
}

// ========================================
// CANCELAR TURNO
// ========================================
async function cancelarTurno() {
  const inputId = document.getElementById('cancelarTurnoId');
  const textarea = document.getElementById('motivoCancelacion');
  
  const id = inputId?.value;
  const motivo = textarea?.value?.trim();
  
  if (!motivo) {
    mostrarAlerta('error', 'Debe ingresar un motivo de cancelación');
    return;
  }
  
  try {
    console.log('❌ Cancelando turno:', id);
    const response = await fetch(`/medico/mis-turnos/api/turnos/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });
    
    const data = await response.json();
    console.log('📦 Respuesta cancelación:', data);
    
    if (data.success) {
      mostrarAlerta('success', 'Turno cancelado correctamente');
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelarTurno'));
      if (modal) modal.hide();
      cargarTurnos();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al cancelar turno');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    mostrarAlerta('error', 'Error al cancelar turno');
  }
}

// ========================================
// LIMPIAR FILTROS
// ========================================
function limpiarFiltros() {
  const form = document.getElementById('formFiltros');
  if (form) form.reset();
  paginaActual = 1;
  cargarTurnos();
}

// ========================================
// FUNCIÓN AUXILIAR - OBTENER CLASE DE ESTADO
// ========================================
function getEstadoClass(estado) {
  const classes = {
    'PENDIENTE': 'warning',
    'CONFIRMADO': 'success',
    'COMPLETADO': 'info',
    'CANCELADO': 'danger'
  };
  return classes[estado] || 'secondary';
}

// ========================================
// FUNCIÓN PARA MOSTRAR ALERTAS
// ========================================
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