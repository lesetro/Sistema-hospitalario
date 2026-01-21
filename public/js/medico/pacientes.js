let paginaActual = 1;
const pacientesPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Página cargada - Iniciando cargas de datos');
  
  cargarEstadisticas();
  cargarObrasSociales();
  cargarPacientes();
  
  // Formulario de filtros
  const formFiltros = document.getElementById('formFiltros');
  if (formFiltros) {
    formFiltros.addEventListener('submit', function(e) {
      e.preventDefault();
      paginaActual = 1;
      cargarPacientes();
    });
  }
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    const url = '/medico/pacientes/api/estadisticas';
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
      
      const statTotal = document.getElementById('stat-total-pacientes');
      const statInternados = document.getElementById('stat-internados');
      const statEvaluaciones = document.getElementById('stat-evaluaciones-mes');
      
      if (statTotal) {
        statTotal.textContent = data.data.totalPacientes || 0;
        console.log('✅ Total pacientes actualizado:', data.data.totalPacientes);
      }
      if (statInternados) {
        statInternados.textContent = data.data.pacientesInternados || 0;
        console.log('✅ Internados actualizado:', data.data.pacientesInternados);
      }
      if (statEvaluaciones) {
        statEvaluaciones.textContent = data.data.evaluacionesMes || 0;
        console.log('✅ Evaluaciones mes actualizado:', data.data.evaluacionesMes);
      }
    } else {
      console.warn('⚠️ Respuesta success falsa');
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error.message, error);
  }
}

// ========================================
// CARGAR OBRAS SOCIALES
// ========================================
async function cargarObrasSociales() {
  try {
    const url = '/medico/pacientes/api/obras-sociales';
    console.log('🏥 Cargando obras sociales desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Obras sociales obtenidas:', data);
    
    if (data.success && data.data) {
      const select = document.getElementById('filtroObraSocial');
      if (select) {
        data.data.forEach(os => {
          const option = document.createElement('option');
          option.value = os.id;
          option.textContent = os.nombre;
          select.appendChild(option);
        });
        console.log('✅ Obras sociales cargadas:', data.data.length);
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar obras sociales:', error.message);
  }
}

// ========================================
// CARGAR PACIENTES
// ========================================
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
    
    const url = `/medico/pacientes/api/pacientes?${params.toString()}`;
    console.log('👥 Cargando pacientes desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos pacientes:', data);
    
    const loadingDiv = document.getElementById('loading-pacientes');
    const tablaDiv = document.getElementById('tabla-pacientes');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (tablaDiv) tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Pacientes encontrados:', data.data.length);
      mostrarPacientes(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      console.warn('⚠️ Sin pacientes o respuesta vacía');
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

// ========================================
// MOSTRAR PACIENTES EN LA TABLA
// ========================================
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
    
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <div class="avatar-circle me-2">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <strong>${paciente.usuario?.nombre || 'N/A'} ${paciente.usuario?.apellido || ''}</strong>
              ${paciente.internacionActiva ? 
                '<br><small class="badge bg-danger"><i class="fas fa-bed me-1"></i>Internado</small>' : 
                ''
              }
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
            '<span class="text-muted">Sin obra social</span>'
          }
        </td>
        <td>
          <span class="badge bg-${estadoClass}">
            ${paciente.estado || 'N/A'}
          </span>
        </td>
        <td>
          <small>
            <i class="fas fa-calendar me-1"></i>
            ${ultimaConsulta}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" 
                    onclick="verDetallePaciente(${paciente.id})"
                    title="Ver detalle completo">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verHistorial(${paciente.id})"
                    title="Ver historial médico">
              <i class="fas fa-clipboard-list"></i>
            </button>
            <a href="/medico/evaluaciones?paciente_id=${paciente.id}" 
               class="btn btn-sm btn-outline-success"
               title="Ver evaluaciones">
              <i class="fas fa-stethoscope"></i>
            </a>
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
  cargarPacientes(pagina);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// VER DETALLE DEL PACIENTE
// ========================================
async function verDetallePaciente(id) {
  try {
    console.log('🔍 Obteniendo detalle del paciente:', id);
    const response = await fetch(`/medico/pacientes/api/pacientes/${id}`);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos del paciente:', data);
    
    if (data.success) {
      const { paciente, evaluaciones, internaciones, historial, estadisticas } = data.data;
      
      const modal = document.getElementById('modalDetallePacienteBody');
      if (modal) {
        modal.innerHTML = `
          <ul class="nav nav-tabs" id="tabsPaciente" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-info">
                <i class="fas fa-user me-1"></i> Información
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-evaluaciones">
                <i class="fas fa-stethoscope me-1"></i> Evaluaciones (${estadisticas?.totalEvaluaciones || 0})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-internaciones">
                <i class="fas fa-bed me-1"></i> Internaciones (${estadisticas?.totalInternaciones || 0})
              </button>
            </li>
          </ul>
          
          <div class="tab-content mt-3">
            <!-- Tab Información -->
            <div class="tab-pane fade show active" id="tab-info">
              <div class="row g-3">
                <div class="col-md-6">
                  <h6 class="text-primary mb-3">
                    <i class="fas fa-user-circle me-2"></i>
                    Datos Personales
                  </h6>
                  <table class="table table-sm">
                    <tr>
                      <th width="40%">Nombre Completo:</th>
                      <td>${paciente?.usuario?.nombre || 'N/A'} ${paciente?.usuario?.apellido || ''}</td>
                    </tr>
                    <tr>
                      <th>DNI:</th>
                      <td>${paciente?.usuario?.dni || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Fecha Nacimiento:</th>
                      <td>${paciente?.usuario?.fecha_nacimiento ? new Date(paciente.usuario.fecha_nacimiento).toLocaleDateString('es-AR') : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Sexo:</th>
                      <td>${paciente?.usuario?.sexo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Teléfono:</th>
                      <td>${paciente?.usuario?.telefono || 'No registrado'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>${paciente?.usuario?.email || 'No registrado'}</td>
                    </tr>
                  </table>
                </div>
                
                <div class="col-md-6">
                  <h6 class="text-primary mb-3">
                    <i class="fas fa-hospital me-2"></i>
                    Información Médica
                  </h6>
                  <table class="table table-sm">
                    <tr>
                      <th width="40%">Obra Social:</th>
                      <td>${paciente?.obraSocial?.nombre || 'Sin obra social'}</td>
                    </tr>
                    <tr>
                      <th>Estado:</th>
                      <td><span class="badge bg-${paciente?.estado === 'Activo' ? 'success' : 'secondary'}">${paciente?.estado || 'N/A'}</span></td>
                    </tr>
                    <tr>
                      <th>Fecha Ingreso:</th>
                      <td>${paciente?.fecha_ingreso ? new Date(paciente.fecha_ingreso).toLocaleDateString('es-AR') : 'N/A'}</td>
                    </tr>
                    ${paciente?.observaciones ? `
                      <tr>
                        <th>Observaciones:</th>
                        <td>${paciente.observaciones}</td>
                      </tr>
                    ` : ''}
                  </table>
                </div>
              </div>
            </div>
            
            <!-- Tab Evaluaciones -->
            <div class="tab-pane fade" id="tab-evaluaciones">
              ${evaluaciones && evaluaciones.length > 0 ? `
                <div class="timeline">
                  ${evaluaciones.map(ev => {
                    const fecha = new Date(ev.fecha);
                    return `
                      <div class="timeline-item">
                        <div class="timeline-marker bg-primary"></div>
                        <div class="timeline-content">
                          <h6>${fecha.toLocaleDateString('es-AR')}</h6>
                          ${ev.diagnostico ? `<p class="mb-1"><strong>Diagnóstico:</strong> ${ev.diagnostico.nombre}</p>` : ''}
                          ${ev.observaciones_diagnostico ? `<p class="mb-0 text-muted">${ev.observaciones_diagnostico}</p>` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : '<p class="text-muted text-center py-4">No hay evaluaciones registradas</p>'}
            </div>
            
            <!-- Tab Internaciones -->
            <div class="tab-pane fade" id="tab-internaciones">
              ${internaciones && internaciones.length > 0 ? `
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Fecha Inicio</th>
                        <th>Habitación</th>
                        <th>Estado</th>
                        <th>Fecha Alta</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${internaciones.map(int => `
                        <tr>
                          <td>${new Date(int.fecha_inicio).toLocaleDateString('es-AR')}</td>
                          <td>${int.cama?.habitacion?.numero || 'N/A'} - Cama ${int.cama?.numero || 'N/A'}</td>
                          <td><span class="badge bg-${int.fecha_alta ? 'success' : 'warning'}">${int.fecha_alta ? 'Alta' : 'Activa'}</span></td>
                          <td>${int.fecha_alta ? new Date(int.fecha_alta).toLocaleDateString('es-AR') : '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : '<p class="text-muted text-center py-4">No hay internaciones registradas</p>'}
            </div>
          </div>
        `;
        
        new bootstrap.Modal(document.getElementById('modalDetallePaciente')).show();
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar detalle:', error.message);
    mostrarAlerta('error', 'Error al cargar detalle del paciente');
  }
}

// ========================================
// VER HISTORIAL MÉDICO
// ========================================
async function verHistorial(pacienteId) {
  try {
    console.log('📋 Obteniendo historial del paciente:', pacienteId);
    const response = await fetch(`/medico/pacientes/api/pacientes/${pacienteId}/historial`);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Historial obtenido:', data);
    
    if (data.success) {
      const historial = data.data;
      const modal = document.getElementById('modalHistorialBody');
      
      if (modal) {
        if (historial && historial.length > 0) {
          modal.innerHTML = `
            <div class="timeline">
              ${historial.map(item => {
                const fecha = new Date(item.fecha);
                const tipoIcon = {
                  'Consulta': 'stethoscope',
                  'Internacion': 'bed',
                  'Cirugia': 'procedures',
                  'Estudio': 'x-ray',
                  'Otro': 'notes-medical'
                }[item.tipo_evento] || 'circle';
                
                return `
                  <div class="timeline-item">
                    <div class="timeline-marker bg-primary">
                      <i class="fas fa-${tipoIcon}"></i>
                    </div>
                    <div class="timeline-content">
                      <div class="d-flex justify-content-between">
                        <h6>${item.tipo_evento || 'N/A'}</h6>
                        <small class="text-muted">${fecha.toLocaleDateString('es-AR')}</small>
                      </div>
                      <p class="mb-0">${item.descripcion || 'N/A'}</p>
                      ${item.motivo_consulta ? 
                        `<small class="text-muted">Motivo: ${item.motivo_consulta?.nombre || 'N/A'}</small>` : 
                        ''
                      }
                    </div>
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

// ========================================
// LIMPIAR FILTROS
// ========================================
function limpiarFiltros() {
  const form = document.getElementById('formFiltros');
  if (form) form.reset();
  paginaActual = 1;
  cargarPacientes();
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