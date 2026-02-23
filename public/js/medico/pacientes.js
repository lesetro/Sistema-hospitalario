let paginaActual = 1;
const pacientesPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  console.log(' Página cargada - Iniciando cargas de datos');
  
  cargarEstadisticas();
  cargarObrasSociales();
  cargarPacientes();
  
  const formFiltros = document.getElementById('formFiltros');
  if (formFiltros) {
    formFiltros.addEventListener('submit', function(e) {
      e.preventDefault();
      paginaActual = 1;
      cargarPacientes();
    });
  }
});

async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/pacientes/api/estadisticas');
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.success) {
      const statTotal = document.getElementById('stat-total-pacientes');
      const statInternados = document.getElementById('stat-internados');
      const statEvaluaciones = document.getElementById('stat-evaluaciones-mes');
      
      if (statTotal) statTotal.textContent = data.data.totalPacientes || 0;
      if (statInternados) statInternados.textContent = data.data.pacientesInternados || 0;
      if (statEvaluaciones) statEvaluaciones.textContent = data.data.evaluacionesMes || 0;
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error.message);
  }
}

async function cargarObrasSociales() {
  try {
    const response = await fetch('/medico/pacientes/api/obras-sociales');
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.success && data.data) {
      const select = document.getElementById('filtroObraSocial');
      if (select) {
        data.data.forEach(os => {
          const option = document.createElement('option');
          option.value = os.id;
          option.textContent = os.nombre;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar obras sociales:', error.message);
  }
}

async function cargarPacientes(pagina = paginaActual) {
  try {
    const formFiltros = document.getElementById('formFiltros');
    const formData = formFiltros ? new FormData(formFiltros) : new FormData();
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', pacientesPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/pacientes/api/pacientes?${params.toString()}`);
    if (!response.ok) return;
    
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-pacientes');
    const tablaDiv = document.getElementById('tabla-pacientes');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (tablaDiv) tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      mostrarPacientes(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      const tbody = document.getElementById('tbody-pacientes');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4">
              <i class="fas fa-user-slash fa-3x text-muted mb-3 d-block"></i>
              <p class="text-muted">No se encontraron pacientes</p>
            </td>
          </tr>
        `;
      }
      const paginacion = document.getElementById('paginacion');
      if (paginacion) paginacion.innerHTML = '';
    }
  } catch (error) {
    console.error('❌ Error al cargar pacientes:', error.message);
    mostrarAlerta('error', 'Error al cargar pacientes');
  }
}

function mostrarPacientes(pacientes) {
  const tbody = document.getElementById('tbody-pacientes');
  if (!tbody) return;
  
  tbody.innerHTML = pacientes.map(paciente => {
    const estadoClass = {
      'Activo': 'success',
      'Inactivo': 'warning',
      'Baja': 'danger'
    }[paciente.estado] || 'secondary';
    
    const ultimaConsulta = paciente.ultimaEvaluacion 
      ? new Date(paciente.ultimaEvaluacion.fecha).toLocaleDateString('es-AR')
      : 'Sin consultas';

    const nombreCompleto = `${paciente.usuario?.nombre || ''} ${paciente.usuario?.apellido || ''}`.trim();
    const nombreEscapado = nombreCompleto.replace(/'/g, "\\'");
    
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-circle me-2">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <strong>${nombreCompleto || 'N/A'}</strong>
              ${paciente.internacionActiva ? 
                '<br><small class="badge bg-danger"><i class="fas fa-bed me-1"></i>Internado</small>' : ''}
              <br>
              <small class="text-muted">
                ${paciente.totalEvaluaciones || 0} evaluación${paciente.totalEvaluaciones !== 1 ? 'es' : ''}
              </small>
            </div>
          </div>
        </td>
        <td>
          <i class="fas fa-id-card me-1"></i>
          ${paciente.usuario?.dni || 'N/A'}
        </td>
        <td>
          ${paciente.obraSocial ? 
            `<span class="badge bg-info">${paciente.obraSocial.nombre}</span>` : 
            '<span class="text-muted">Sin obra social</span>'}
        </td>
        <td>
          <span class="badge bg-${estadoClass}">${paciente.estado || 'N/A'}</span>
        </td>
        <td>
          <small>
            <i class="fas fa-calendar me-1"></i>
            ${ultimaConsulta}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">

            <!--  Ver detalle → nueva página -->
            <button class="btn btn-sm btn-outline-primary" 
                    onclick="window.location.href='/medico/pacientes/${paciente.id}/detalle'"
                    title="Ver detalle completo">
              <i class="fas fa-eye"></i>
            </button>

            <!--  Nueva evaluación → página evaluaciones con paciente precargado -->
            <button class="btn btn-sm btn-outline-success"
                    onclick="window.location.href='/medico/evaluaciones?paciente_dni=${paciente.usuario.dni}'"

                    title="Nueva evaluación médica">
              <i class="fas fa-stethoscope"></i>
            </button>

            <!--  Solicitar estudio → página estudios con paciente precargado -->
            <button class="btn btn-sm btn-outline-info"
                    onclick="window.location.href='/medico/estudios-solicitados?paciente_dni=${paciente.usuario.dni}'"
                    title="Solicitar estudio">
              <i class="fas fa-x-ray"></i>
            </button>

            <!--  Solicitar control → modal en esta misma página -->
            <button class="btn btn-sm btn-outline-warning" 
                    onclick="abrirModalControles(${paciente.id}, '${nombreEscapado}')"
                    title="Solicitar control de enfermería">
              <i class="fas fa-heartbeat"></i>
            </button>
            <!--  NUEVO: Derivar a cirugía -->
            <button class="btn btn-sm btn-outline-danger"
                    onclick="abrirModalDerivarCirugia(${paciente.id}, '${nombreEscapado}')"
                    title="Derivar a cirugía de urgencia">
              <i class="fas fa-procedures"></i>
            </button>
          
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function mostrarPaginacion(pagination) {
  const paginacionDiv = document.getElementById('paginacion');
  if (!paginacionDiv) return;
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = `
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
  cargarPacientes(pagina);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function verDetallePaciente(id) {
  window.location.href = `/medico/pacientes/${id}/detalle`;
}

async function verHistorial(pacienteId) {
  try {
    const response = await fetch(`/medico/pacientes/api/pacientes/${pacienteId}/historial`);
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.success) {
      const historial = data.data;
      const modal = document.getElementById('modalHistorialBody');
      
      if (modal) {
        if (historial && historial.length > 0) {
          modal.innerHTML = `
            <div class="timeline">
              ${historial.map(item => {
                const tipoIcon = {
                  'Consulta': 'stethoscope',
                  'Internacion': 'bed',
                  'Cirugia': 'procedures',
                  'Estudio': 'x-ray',
                  'Alta': 'sign-out-alt',
                  'Otro': 'notes-medical'
                }[item.tipo_evento] || 'circle';
                
                return `
                  <div class="timeline-item mb-3 p-3 border-start border-primary border-3">
                    <div class="d-flex justify-content-between">
                      <h6><i class="fas fa-${tipoIcon} me-2"></i>${item.tipo_evento || 'N/A'}</h6>
                      <small class="text-muted">${new Date(item.fecha).toLocaleDateString('es-AR')}</small>
                    </div>
                    <p class="mb-0">${item.descripcion || 'N/A'}</p>
                    ${item.motivo_consulta ? `<small class="text-muted">Motivo: ${item.motivo_consulta?.nombre || 'N/A'}</small>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        } else {
          modal.innerHTML = `
            <div class="text-center py-4 text-muted">
              <i class="fas fa-clipboard-list fa-3x mb-3"></i>
              <p>No hay historial médico registrado</p>
            </div>
          `;
        }
        
        new bootstrap.Modal(document.getElementById('modalHistorial')).show();
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar historial:', error.message);
    mostrarAlerta('error', 'Error al cargar historial médico');
  }
}

function limpiarFiltros() {
  const form = document.getElementById('formFiltros');
  if (form) form.reset();
  paginaActual = 1;
  cargarPacientes();
}

// ========================================
//  SOLICITAR CONTROLES DE ENFERMERÍA 
// ========================================
function abrirModalControles(pacienteId, nombrePaciente) {
  document.getElementById('controlPacienteId').value = pacienteId;
  document.getElementById('controlPacienteNombre').textContent = nombrePaciente;
  new bootstrap.Modal(document.getElementById('modalSolicitarControles')).show();
}

async function confirmarSolicitarControles() {
  const pacienteId = document.getElementById('controlPacienteId').value;
  
  if (!pacienteId) {
    mostrarAlerta('error', 'Error: ID de paciente no válido');
    return;
  }

  try {
    const response = await fetch(`/medico/pacientes/${pacienteId}/solicitar-controles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    bootstrap.Modal.getInstance(document.getElementById('modalSolicitarControles')).hide();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al solicitar controles');
  }
}

// ========================================
// ALERTAS
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
  setTimeout(() => alertContainer.remove(), 5000);
}
// ========================================
// DERIVAR A CIRUGÍA DE URGENCIA
// ========================================
function abrirModalDerivarCirugia(pacienteId, nombrePaciente) {
  document.getElementById('cirugiaPacienteId').value = pacienteId;
  document.getElementById('cirugiaPacienteNombre').textContent = nombrePaciente;
  document.getElementById('cirugiaPrioridad').value = 'ALTA';
  document.getElementById('cirugiaObservaciones').value = '';
  new bootstrap.Modal(document.getElementById('modalDerivarCirugia')).show();
}

async function confirmarDerivarCirugia() {
  const pacienteId = document.getElementById('cirugiaPacienteId').value;
  const prioridad = document.getElementById('cirugiaPrioridad').value;
  const observaciones = document.getElementById('cirugiaObservaciones').value;
  
  if (!pacienteId) {
    mostrarAlerta('error', 'Error: ID de paciente no válido');
    return;
  }

  try {
    const response = await fetch(`/medico/pacientes/${pacienteId}/derivar-cirugia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prioridad, observaciones })
    });
    
    const data = await response.json();
    bootstrap.Modal.getInstance(document.getElementById('modalDerivarCirugia')).hide();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
      cargarPacientes(); // Refrescar lista
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al derivar a cirugía');
  }
}