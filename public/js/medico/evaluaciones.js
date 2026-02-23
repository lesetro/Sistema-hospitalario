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
  cargarUrgenciasPendientes();
  
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarEvaluaciones();
  });

  document.getElementById('formNuevaEvaluacion').addEventListener('submit', function(e) {
    e.preventDefault();
    crearEvaluacion();
  });

  document.getElementById('formEditarEvaluacion').addEventListener('submit', function(e) {
    e.preventDefault();
    actualizarEvaluacion();
  });

  let timeoutDiagnostico;
  document.getElementById('filtroDiagnostico')?.addEventListener('input', function(e) {
    clearTimeout(timeoutDiagnostico);
    timeoutDiagnostico = setTimeout(() => {
      if (e.target.value.length >= 3) cargarDiagnosticos(e.target.value);
    }, 300);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const pacienteDni = urlParams.get('paciente_dni');
  if (pacienteDni) {
    precargarPacienteEnEvaluacion(pacienteDni);
  }
});

//  Fuera del DOMContentLoaded
async function precargarPacienteEnEvaluacion(dni) {
  try {
    const res = await fetch(`/medico/evaluaciones/api/pacientes-filtro?busqueda=${dni}`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      const paciente = data.data[0];
      document.getElementById('busquedaPaciente').value = `${paciente.usuario.nombre} ${paciente.usuario.apellido}`;
      document.getElementById('nuevoPaciente').innerHTML = `
        <option value="${paciente.id}" selected>
          ${paciente.usuario.nombre} ${paciente.usuario.apellido} (${paciente.usuario.dni})
        </option>
      `;
    }
  } catch (error) {
    console.error('Error al precargar paciente:', error);
  } finally {
    new bootstrap.Modal(document.getElementById('modalNuevaEvaluacion')).show();
  }
}

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
// Declarar la variable fuera para que persista
let timeoutPaciente;

async function cargarPacientesParaFiltro() {
  document.getElementById('busquedaPaciente').addEventListener('input', e => {
    clearTimeout(timeoutPaciente);
    
    timeoutPaciente = setTimeout(async () => {
      const valor = e.target.value.trim();
      
      const select = document.getElementById('nuevoPaciente');
      
      if (valor.length < 3) {
        select.innerHTML = '<option value="">Escriba para buscar...</option>';
        return;
      }

      try {
        const res = await fetch(`/medico/evaluaciones/api/pacientes-filtro?busqueda=${encodeURIComponent(valor)}`);
        const data = await res.json();
        
        if (data.success) {
          select.innerHTML = '<option value="">Seleccione paciente</option>';
          data.data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.usuario.nombre} ${p.usuario.apellido} (${p.usuario.dni})`;
            select.appendChild(opt);
          });
        } else {
          select.innerHTML = '<option value="">No se encontraron resultados</option>';
        }
      } catch (error) {
        select.innerHTML = '<option value="">Error al buscar</option>';
        console.error(error);
      }
    }, 400);
  });
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
        <td class="text-monospace">
          <div>Eval: <strong>${evaluacion.id}</strong></div>
          <div>Pac: <strong>${evaluacion.paciente?.usuario?.id || '-'}</strong></div>
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
             
            <button class="btn btn-sm btn-outline-success" 
                    onclick="abrirModalSolicitarControl(${evaluacion.id}, '${evaluacion.paciente?.usuario?.nombre || ''} ${evaluacion.paciente?.usuario?.apellido || ''}')"
                    title="Solicitar Control de Enfermería">
                    <i class="fas fa-clipboard-check"></i>
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
function verDetalleEvaluacion(id) {
  window.location.href = `/medico/evaluaciones/${id}`;
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
async function cargarUrgenciasPendientes() {
  try {
    const response = await fetch('/medico/emergencias/api/lista?estado=PENDIENTE,ASIGNADO');
    const data = await response.json();
    
    const loading = document.getElementById('loading-urgencias');
    const tabla = document.getElementById('tabla-urgencias');
    const tbody = document.getElementById('tbody-urgencias');
    
    //  Si no existen los elementos, salir sin error
    if (!loading || !tabla || !tbody) return;
    
    loading.classList.add('d-none');
    tabla.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      tbody.innerHTML = data.data.map(e => `
        <tr>
          <td>${e.paciente?.usuario?.nombre} ${e.paciente?.usuario?.apellido}</td>
          <td>${e.evaluacion_enfermeria?.nivel_triaje || 'Sin triaje'}</td>
          <td>${Math.floor((Date.now() - new Date(e.fecha_registro)) / 60000)} min</td>
          <td>${e.evaluacion_enfermeria?.enfermero?.usuario?.nombre || 'N/A'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="atenderPaciente(${e.id}, ${e.paciente_id})">
              Atender
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay urgencias pendientes</td></tr>';
    }
  } catch (error) {
    console.error(error);
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
//  Función para solicitar control
function abrirModalSolicitarControl(evaluacionId, pacienteName) {
  document.getElementById('solicitarControlEvaluacionId').value = evaluacionId;
  document.getElementById('solicitarControlEvaluacionInfo').textContent = pacienteName;
  
  const modal = new bootstrap.Modal(document.getElementById('modalSolicitarControl'));
  modal.show();
}

//  Confirmar solicitud de control
function confirmarSolicitarControl() {
  const evaluacionId = document.getElementById('solicitarControlEvaluacionId').value;
  
  if (!evaluacionId) {
    mostrarAlerta('error', 'Error: ID de evaluación no válido');
    return;
  }

  fetch(`/medico/evaluaciones/${evaluacionId}/solicitar-control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      evaluacion_medica_id: evaluacionId
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      mostrarAlerta('success', 'Control de enfermería solicitado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalSolicitarControl')).hide();
      cargarEvaluaciones(); // Recargar tabla
      cargarEstadisticas(); // Actualizar estadísticas
    } else {
      mostrarAlerta('error', data.message || 'No se pudo solicitar el control');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al solicitar el control');
  });
}