// emergencias.js
let paginaActual = 1;
const emergenciasPorPagina = 10;
let intervaloActualizacion;

document.addEventListener('DOMContentLoaded', function() {
  //  NO hacer polling si no estamos en la página de emergencias
  if (!document.getElementById('tabla-emergencias')) {
    return;
  }
  
  cargarEmergencias();
  cargarDiagnosticos();
  cargarTratamientos();
  
  intervaloActualizacion = setInterval(cargarEmergencias, 30000);
  
  const formEvaluacion = document.getElementById('formEvaluacionMedica');
  if (formEvaluacion) {
    formEvaluacion.addEventListener('submit', function(e) {
      e.preventDefault();
      guardarEvaluacionMedica();
    });
  }
});

window.addEventListener('beforeunload', function() {
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
});

async function cargarEmergencias(pagina = paginaActual) {
  try {
    const url = `/medico/emergencias/api/lista?page=${pagina}&limit=${emergenciasPorPagina}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        clearInterval(intervaloActualizacion);
        mostrarAlerta('error', 'Sesión expirada');
        window.location.href = '/auth/login';
      }
      return;
    }
    
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-emergencias');
    const tablaDiv = document.getElementById('tabla-emergencias');
    const contador = document.getElementById('contador-emergencias');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (tablaDiv) tablaDiv.classList.remove('d-none');
    
    if (contador) {
      contador.innerHTML = data.pagination?.total || 0;
    }
    
    if (data.success && data.data && data.data.length > 0) {
      mostrarEmergencias(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      const tbody = document.getElementById('tbody-emergencias');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4">
              <i class="fas fa-check-circle fa-3x text-success mb-3 d-block"></i>
              <h5>No hay emergencias pendientes</h5>
            </td>
          </tr>
        `;
      }
      const paginacion = document.getElementById('paginacion');
      if (paginacion) paginacion.innerHTML = '';
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar');
  }
}

function mostrarEmergencias(emergencias) {
  const tbody = document.getElementById('tbody-emergencias');
  if (!tbody) return;
  
  const medicoIdElement = document.getElementById('medico-actual-id');
  const medicoActualId = medicoIdElement ? medicoIdElement.value : null;
  
  tbody.innerHTML = emergencias.map(emergencia => {
    const paciente = emergencia.paciente?.usuario;
    const evaluacion = emergencia.evaluacion_enfermeria;
    const fechaRegistro = new Date(emergencia.fecha_registro);
    const ahora = new Date();
    const minutosEspera = Math.floor((ahora - fechaRegistro) / (1000 * 60));
    
    // Triaje
    const nivelTriaje = evaluacion?.nivel_triaje;
    const tieneTriaje = !!nivelTriaje;
    const triajeClass = {
      'Rojo': 'danger',
      'Amarillo': 'warning',
      'Verde': 'success',
      'Negro': 'dark'
    }[nivelTriaje] || 'secondary';
    
    const triajeIcon = {
      'Rojo': 'heartbeat',
      'Amarillo': 'exclamation-triangle',
      'Verde': 'shield-alt',
      'Negro': 'skull-crossbones'
    }[nivelTriaje] || 'question-circle';
    
    const estadoClass = {
      'PENDIENTE': 'warning',
      'ASIGNADO': 'primary',
      'COMPLETADO': 'success'
    }[emergencia.estado] || 'secondary';
    
    const puedeAtender = emergencia.estado === 'ASIGNADO' && 
                         emergencia.medico_id && 
                         emergencia.medico_id.toString() === medicoActualId;
    
    return `
      <tr class="${emergencia.estado === 'PENDIENTE' ? 'table-warning animate-pulse' : ''}">
        <td>
          <div>
            <i class="fas fa-user-circle me-2"></i>
            <strong>${paciente?.nombre || 'N/A'} ${paciente?.apellido || ''}</strong>
          </div>
          <small class="text-muted">
            DNI: ${paciente?.dni || 'N/A'} | Edad: ${emergencia.edad || 'N/A'}
          </small>
        </td>
        
        <td>
          ${tieneTriaje ? `
            <span class="badge bg-${triajeClass}">
              <i class="fas fa-${triajeIcon} me-1"></i>
              ${nivelTriaje}
            </span>
          ` : '<span class="badge bg-secondary">Sin triaje</span>'}
        </td>
        
        <td>
          <div class="d-flex align-items-center">
            <i class="fas fa-clock me-2 text-muted"></i>
            <div>
              <div><strong>${minutosEspera} min</strong></div>
              <small class="text-muted">${fechaRegistro.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
          </div>
        </td>
        
        <td>
          <small>
            <i class="fas fa-user-nurse me-1"></i>
            ${evaluacion?.enfermero?.usuario?.nombre || 'N/A'}
          </small>
        </td>
        
        <td>
          <span class="badge bg-${estadoClass}">
            ${emergencia.estado || 'N/A'}
          </span>
          ${emergencia.estado === 'ASIGNADO' && emergencia.medico_asignado ? `
            <br><small class="text-muted">
              <i class="fas fa-user-md me-1"></i>
              Dr. ${emergencia.medico_asignado.usuario?.nombre || ''} ${emergencia.medico_asignado.usuario?.apellido || ''}
            </small>
          ` : ''}
        </td>
        
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleEmergencia(${emergencia.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            
            ${emergencia.estado === 'PENDIENTE' ? `
              <button class="btn btn-sm btn-success" 
                      onclick="aceptarEmergencia(${emergencia.id})"
                      title="Aceptar">
                <i class="fas fa-user-md"></i> Aceptar
              </button>
            ` : ''}
            
            ${puedeAtender ? `
              <button class="btn btn-sm btn-primary" 
                      onclick="atenderPaciente(${emergencia.id}, ${emergencia.paciente_id})"
                      title="Atender">
                <i class="fas fa-stethoscope"></i> Atender
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function aceptarEmergencia(id) {
  if (!confirm('¿Aceptar este paciente?')) return;
  
  try {
    const response = await fetch(`/medico/emergencias/api/${id}/aceptar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', 'Paciente aceptado');
      setTimeout(() => {
        window.location.href = '/medico/pacientes';
      }, 1000);
    } else {
      mostrarAlerta('error', data.message || 'Error');
    }
  } catch (error) {
    mostrarAlerta('error', 'Error');
  }
}

async function verDetalleEmergencia(id) {
  try {
    const response = await fetch(`/medico/emergencias/api/${id}`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data.success) return;

    const emergencia = data.data;
    const paciente = emergencia.paciente?.usuario;
    const evaluacion = emergencia.evaluacion_enfermeria;

    const modal = document.getElementById('modalDetalleEmergenciaBody');
    if (!modal) return;

    modal.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <h6 class="text-primary">
            <i class="fas fa-user-circle me-2"></i>
            Información del Paciente
          </h6>
          <table class="table table-sm">
            <tr><th width="40%">Nombre:</th><td>${paciente?.nombre || 'N/A'} ${paciente?.apellido || ''}</td></tr>
            <tr><th>DNI:</th><td>${paciente?.dni || 'N/A'}</td></tr>
            <tr><th>Teléfono:</th><td>${paciente?.telefono || 'N/A'}</td></tr>
            <tr><th>Edad:</th><td>${emergencia.edad || 'N/A'}</td></tr>
            <tr><th>Obra Social:</th><td>${emergencia.paciente?.obraSocial?.nombre || 'Sin obra social'}</td></tr>
          </table>
        </div>

        <div class="col-md-6">
          <h6 class="text-primary">
            <i class="fas fa-notes-medical me-2"></i>
            Evaluación de Enfermería
          </h6>

          ${evaluacion ? `
            <table class="table table-sm">
              <tr><th width="40%">Fecha:</th><td>${new Date(evaluacion.fecha).toLocaleString('es-AR')}</td></tr>
              <tr>
                <th>Triaje:</th>
                <td>
                  ${evaluacion.nivel_triaje 
                    ? `<span class="badge bg-${getTriajeClass(evaluacion.nivel_triaje)}">${evaluacion.nivel_triaje}</span>` 
                    : '<span class="badge bg-secondary">Sin triaje</span>'}
                </td>
              </tr>
              <tr><th>Signos vitales:</th><td>${evaluacion.signos_vitales || 'N/A'}</td></tr>
              <tr><th>Observaciones:</th><td>${evaluacion.observaciones || 'N/A'}</td></tr>
              <tr><th>Enfermero:</th><td>${evaluacion.enfermero?.usuario?.nombre || 'N/A'}</td></tr>
            </table>
          ` : '<p class="text-muted">Sin evaluación de enfermería</p>'}
        </div>
      </div>
    `;

    new bootstrap.Modal(document.getElementById('modalDetalleEmergencia')).show();
  } catch (error) {
    mostrarAlerta('error', 'Error');
  }
}

async function atenderPaciente(listaEsperaId, pacienteId) {
  window.location.href = `/medico/pacientes?paciente_id=${pacienteId}`;
}

function getTriajeClass(triaje) {
  const classes = {
    'I': 'danger',
    'II': 'warning',
    'III': 'warning',
    'IV': 'success',
    'V': 'info',
    'Rojo': 'danger',
    'Amarillo': 'warning',
    'Verde': 'success',
    'Negro': 'dark'
  };
  return classes[triaje] || 'secondary';
}

function getEstadoClass(estado) {
  const classes = {
    'PENDIENTE': 'warning',
    'ASIGNADO': 'primary',
    'COMPLETADO': 'success'
  };
  return classes[estado] || 'secondary';
}

function recargarEmergencias() {
  cargarEmergencias(paginaActual);
  mostrarAlerta('info', 'Actualizado');
}

function mostrarAlerta(tipo, mensaje) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertContainer.style.zIndex = '9999';
  alertContainer.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.remove();
  }, 5000);
}

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

function cambiarPagina(pagina) {
  paginaActual = pagina;
  cargarEmergencias(pagina);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}