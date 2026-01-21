let paginaActual = 1;
const evaluacionesPorPagina = 10;
let diagnosticosCache = [];
let tratamientosCache = [];

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarPacientesParaFiltro();
  cargarDiagnosticos();
  cargarTratamientos();
  cargarEvaluaciones();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarEvaluaciones();
  });
  
  // Formulario nueva evaluación
  document.getElementById('formNuevaEvaluacion').addEventListener('submit', function(e) {
    e.preventDefault();
    crearEvaluacion();
  });
  
  // Formulario editar evaluación
  document.getElementById('formEditarEvaluacion').addEventListener('submit', function(e) {
    e.preventDefault();
    actualizarEvaluacion();
  });
  
  // Búsqueda de diagnósticos en tiempo real
  let timeoutDiagnostico;
  document.getElementById('filtroDiagnostico')?.addEventListener('input', function(e) {
    clearTimeout(timeoutDiagnostico);
    timeoutDiagnostico = setTimeout(() => {
      if (e.target.value.length >= 3) {
        cargarDiagnosticos(e.target.value);
      }
    }, 300);
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/evaluaciones/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-total').textContent = data.data.totalEvaluaciones;
      document.getElementById('stat-mes').textContent = data.data.evaluacionesMes;
      document.getElementById('stat-semana').textContent = data.data.evaluacionesSemana;
      document.getElementById('stat-hoy').textContent = data.data.evaluacionesHoy;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar pacientes para filtro y nueva evaluación
async function cargarPacientesParaFiltro() {
  try {
    const response = await fetch('/medico/evaluaciones/api/pacientes-filtro');
    const data = await response.json();
    
    if (data.success) {
      const selectFiltro = document.getElementById('filtroPaciente');
      const selectNuevo = document.getElementById('nuevoPaciente');
      
      data.data.forEach(paciente => {
        const nombre = `${paciente.usuario.nombre} ${paciente.usuario.apellido} (${paciente.usuario.dni})`;
        
        // Para filtro
        const optionFiltro = document.createElement('option');
        optionFiltro.value = paciente.id;
        optionFiltro.textContent = nombre;
        selectFiltro.appendChild(optionFiltro);
        
        // Para nueva evaluación
        const optionNuevo = document.createElement('option');
        optionNuevo.value = paciente.id;
        optionNuevo.textContent = nombre;
        selectNuevo.appendChild(optionNuevo);
      });
    }
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
  }
}

// Cargar diagnósticos
async function cargarDiagnosticos(busqueda = '') {
  try {
    const params = busqueda ? `?busqueda=${busqueda}` : '';
    const response = await fetch(`/medico/evaluaciones/api/diagnosticos${params}`);
    const data = await response.json();
    
    if (data.success) {
      diagnosticosCache = data.data;
      
      // Actualizar selects
      const selectNuevo = document.getElementById('nuevoDiagnostico');
      const selectEditar = document.getElementById('editarDiagnostico');
      
      [selectNuevo, selectEditar].forEach(select => {
        if (!select) return;
        
        const valorActual = select.value;
        select.innerHTML = '<option value="">Sin diagnóstico</option>';
        
        data.data.forEach(diagnostico => {
          const option = document.createElement('option');
          option.value = diagnostico.id;
          option.textContent = `${diagnostico.codigo} - ${diagnostico.nombre}`;
          select.appendChild(option);
        });
        
        if (valorActual) select.value = valorActual;
      });
    }
  } catch (error) {
    console.error('Error al cargar diagnósticos:', error);
  }
}

// Cargar tratamientos
async function cargarTratamientos(busqueda = '') {
  try {
    const params = busqueda ? `?busqueda=${busqueda}` : '';
    const response = await fetch(`/medico/evaluaciones/api/tratamientos${params}`);
    const data = await response.json();
    
    if (data.success) {
      tratamientosCache = data.data;
      
      // Actualizar selects
      const selectNuevo = document.getElementById('nuevoTratamiento');
      const selectEditar = document.getElementById('editarTratamiento');
      
      [selectNuevo, selectEditar].forEach(select => {
        if (!select) return;
        
        const valorActual = select.value;
        select.innerHTML = '<option value="">Sin tratamiento</option>';
        
        data.data.forEach(tratamiento => {
          const option = document.createElement('option');
          option.value = tratamiento.id;
          option.textContent = tratamiento.nombre;
          select.appendChild(option);
        });
        
        if (valorActual) select.value = valorActual;
      });
    }
  } catch (error) {
    console.error('Error al cargar tratamientos:', error);
  }
}

// Cargar evaluaciones
async function cargarEvaluaciones(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', evaluacionesPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/evaluaciones/api/evaluaciones?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-evaluaciones');
    const tablaDiv = document.getElementById('tabla-evaluaciones');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarEvaluaciones(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-evaluaciones').innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <i class="fas fa-clipboard fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron evaluaciones</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar evaluaciones:', error);
    mostrarAlerta('error', 'Error al cargar evaluaciones');
  }
}

// Mostrar evaluaciones en la tabla
function mostrarEvaluaciones(evaluaciones) {
  const tbody = document.getElementById('tbody-evaluaciones');
  
  tbody.innerHTML = evaluaciones.map(evaluacion => {
    const fecha = new Date(evaluacion.fecha);
    
    return `
      <tr>
        <td>
          <i class="fas fa-calendar me-1"></i>
          ${fecha.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <strong>${evaluacion.paciente?.usuario?.nombre || 'N/A'} ${evaluacion.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${evaluacion.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          ${evaluacion.diagnostico ? 
            `<span class="badge bg-info">${evaluacion.diagnostico.codigo}</span>
             <br><small>${evaluacion.diagnostico.nombre}</small>` : 
            '<span class="text-muted">Sin diagnóstico</span>'
          }
        </td>
        <td>
          ${evaluacion.tratamiento ? 
            `<span class="badge bg-success">${evaluacion.tratamiento.nombre}</span>` : 
            '<span class="text-muted">Sin tratamiento</span>'
          }
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalleEvaluacion(${evaluacion.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" 
                    onclick="mostrarModalEditar(${evaluacion.id})"
                    title="Editar">
              <i class="fas fa-edit"></i>
            </button>
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
  cargarEvaluaciones(pagina);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mostrar modal nueva evaluación
function mostrarModalNuevaEvaluacion() {
  document.getElementById('formNuevaEvaluacion').reset();
  new bootstrap.Modal(document.getElementById('modalNuevaEvaluacion')).show();
}

// Crear evaluación
async function crearEvaluacion() {
  try {
    const formData = new FormData(document.getElementById('formNuevaEvaluacion'));
    const data = Object.fromEntries(formData.entries());
    
    // Convertir valores vacíos a null
    Object.keys(data).forEach(key => {
      if (data[key] === '') data[key] = null;
    });
    
    const response = await fetch('/medico/evaluaciones/api/evaluaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Evaluación creada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevaEvaluacion')).hide();
      cargarEvaluaciones();
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', result.message || 'Error al crear evaluación');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear evaluación');
  }
}

// Ver detalle de evaluación
async function verDetalleEvaluacion(id) {
  try {
    const response = await fetch(`/medico/evaluaciones/api/evaluaciones/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const ev = data.data;
      const fecha = new Date(ev.fecha);
      
      document.getElementById('modalDetalleEvaluacionBody').innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-user-circle me-2"></i>
              Información del Paciente
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Paciente:</th>
                <td>${ev.paciente?.usuario?.nombre} ${ev.paciente?.usuario?.apellido}</td>
              </tr>
              <tr>
                <th>DNI:</th>
                <td>${ev.paciente?.usuario?.dni}</td>
              </tr>
              <tr>
                <th>Obra Social:</th>
                <td>${ev.paciente?.obraSocial?.nombre || 'Sin obra social'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary mb-3">
              <i class="fas fa-calendar me-2"></i>
              Información de la Evaluación
            </h6>
            <table class="table table-sm">
              <tr>
                <th width="40%">Fecha:</th>
                <td>${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR')}</td>
              </tr>
              ${ev.diagnostico ? `
                <tr>
                  <th>Diagnóstico:</th>
                  <td>
                    <strong>${ev.diagnostico.codigo}</strong> - ${ev.diagnostico.nombre}
                    <br>
                    <small class="text-muted">${ev.diagnostico.tipoDiagnostico?.nombre || ''}</small>
                  </td>
                </tr>
              ` : ''}
              ${ev.tratamiento ? `
                <tr>
                  <th>Tratamiento:</th>
                  <td>${ev.tratamiento.nombre}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          ${ev.observaciones_diagnostico ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-notes-medical me-2"></i>
                Observaciones
              </h6>
              <div class="alert alert-info">
                ${ev.observaciones_diagnostico}
              </div>
            </div>
          ` : ''}
          
          ${ev.procedimientos_enfermeria?.length > 0 ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-syringe me-2"></i>
                Procedimientos de Enfermería
              </h6>
              <ul class="list-group">
                ${ev.procedimientos_enfermeria.map(proc => `
                  <li class="list-group-item">${proc.nombre}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${ev.recetas_certificados?.length > 0 ? `
            <div class="col-12">
              <h6 class="text-primary mb-2">
                <i class="fas fa-file-prescription me-2"></i>
                Recetas y Certificados
              </h6>
              <ul class="list-group">
                ${ev.recetas_certificados.map(rc => `
                  <li class="list-group-item">
                    <strong>${rc.tipo}:</strong> ${rc.contenido.substring(0, 100)}...
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalleEvaluacion')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Mostrar modal editar
async function mostrarModalEditar(id) {
  try {
    const response = await fetch(`/medico/evaluaciones/api/evaluaciones/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const ev = data.data;
      
      document.getElementById('editarEvaluacionId').value = ev.id;
      document.getElementById('editarDiagnostico').value = ev.diagnostico_id || '';
      document.getElementById('editarTratamiento').value = ev.tratamiento_id || '';
      document.getElementById('editarObservaciones').value = ev.observaciones_diagnostico || '';
      
      new bootstrap.Modal(document.getElementById('modalEditarEvaluacion')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar evaluación');
  }
}

// Actualizar evaluación
async function actualizarEvaluacion() {
  try {
    const id = document.getElementById('editarEvaluacionId').value;
    const formData = new FormData(document.getElementById('formEditarEvaluacion'));
    const data = Object.fromEntries(formData.entries());
    
    Object.keys(data).forEach(key => {
      if (data[key] === '') data[key] = null;
    });
    
    const response = await fetch(`/medico/evaluaciones/api/evaluaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Evaluación actualizada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalEditarEvaluacion')).hide();
      cargarEvaluaciones();
    } else {
      mostrarAlerta('error', result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al actualizar evaluación');
  }
}

// Limpiar filtros
function limpiarFiltros() {
  document.getElementById('formFiltros').reset();
  paginaActual = 1;
  cargarEvaluaciones();
}

// Actualizar tabla
function actualizarTabla() {
  cargarEvaluaciones();
  cargarEstadisticas();
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