// ============================================
// VARIABLES GLOBALES
// ============================================
let paginaActual = 1;
const estudiosPorPagina = 10;
let chartCategorias = null;
let pacienteSeleccionadoId = null;
let archivoSimulado = null;
let timeoutBusqueda = null;

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

function formatearFechaHora(fecha) {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

function mostrarAlerta(tipo, mensaje) {
  alert(mensaje);
}

function getEstadoClass(estado) {
  return { 'Pendiente': 'warning', 'Realizado': 'success', 'Cancelado': 'danger' }[estado] || 'secondary';
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('URL completa:', window.location.href);
  console.log('paciente_dni:', new URLSearchParams(window.location.search).get('paciente_dni'));
  console.log('paciente_id:', new URLSearchParams(window.location.search).get('paciente_id'));
  
  inicializarEventos();
  await cargarDatosIniciales();

  const urlParams = new URLSearchParams(window.location.search);
  const pacienteDni = urlParams.get('paciente_dni');
  const pacienteId = urlParams.get('paciente_id');  

  if (pacienteDni) {
  precargarPacienteEnEstudio(pacienteDni);
} else if (pacienteId) {
  precargarPacienteEnEstudioPorId(pacienteId);
}
});

async function precargarPacienteEnEstudio(dni) {
  try {
    new bootstrap.Modal(document.getElementById('modalNuevoEstudio')).show();

    const res = await fetch(`/medico/estudios-solicitados/api/buscar-pacientes?busqueda=${dni}`);
    const data = await res.json();

    console.log('DNI recibido:', dni);        
    console.log('Respuesta API:', data);   

    if (data.success && data.data.length > 0) {
      const paciente = data.data[0];
      //  Poner DNI en el input
      document.getElementById('inputBuscarPaciente').value = paciente.dni;
      //  seleccionarPaciente hace todo lo demás
      await seleccionarPaciente(paciente.id, paciente.nombre, paciente.apellido, paciente.dni);
    }
  } catch (error) {
    console.error('Error al precargar paciente:', error);
  }
}

function inicializarEventos() {
  // Filtros
  document.getElementById('formFiltros').addEventListener('submit', e => {
    e.preventDefault();
    paginaActual = 1;
    cargarEstudios();
  });
  
  // Formulario nuevo estudio
  document.getElementById('formNuevoEstudio').addEventListener('submit', e => {
    e.preventDefault();
    crearEstudio();
  });
  
  // Búsqueda de paciente con debounce
  document.getElementById('inputBuscarPaciente').addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(buscarPaciente, 300);
  });
  
  // Cerrar resultados de búsqueda al hacer clic fuera
  document.addEventListener('click', e => {
    const resultados = document.getElementById('resultadosBusqueda');
    const input = document.getElementById('inputBuscarPaciente');
    if (!resultados.contains(e.target) && e.target !== input) {
      resultados.classList.add('d-none');
    }
  });
  
  // Validar formulario en cambios
  document.getElementById('nuevoEvaluacionId').addEventListener('change', validarFormulario);
  document.getElementById('nuevoTipoEstudio').addEventListener('change', function() {
    mostrarInfoTipoEstudio(this.value);
    validarFormulario();
  });
  
  // Botones principales
  document.getElementById('btnNuevoEstudio').addEventListener('click', mostrarModalNuevoEstudio);
  document.getElementById('btnActualizar').addEventListener('click', actualizarTabla);
}

async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarEstadisticas(),
      cargarDistribucionCategorias(),
      cargarTiposEstudio(),
      cargarEstudios()
    ]);
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    mostrarAlerta('error', 'Error al cargar datos iniciales');
  }
}

// ============================================
// ESTADÍSTICAS Y GRÁFICOS
// ============================================
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-pendientes').textContent = data.data.Pendiente || 0;
      document.getElementById('stat-realizados').textContent = data.data.Realizado || 0;
      document.getElementById('stat-cancelados').textContent = data.data.Cancelado || 0;
      document.getElementById('stat-mes').textContent = data.data.estudiosMes || 0;
      mostrarGraficoUrgencias(data.data.porUrgencia);
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

function mostrarGraficoUrgencias(datos = {}) {
  const loadingDiv = document.getElementById('loading-urgencias');
  const graficoDiv = document.getElementById('grafico-urgencias');
  
  loadingDiv.classList.add('d-none');
  graficoDiv.classList.remove('d-none');
  
  const normal = datos.Normal || 0;
  const alta = datos.Alta || 0;
  const total = normal + alta;
  const pctNormal = total > 0 ? (normal / total * 100).toFixed(1) : 0;
  const pctAlta = total > 0 ? (alta / total * 100).toFixed(1) : 0;
  
  graficoDiv.innerHTML = `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span><i class="fas fa-circle text-primary me-2"></i>Normal</span>
        <strong>${normal} (${pctNormal}%)</strong>
      </div>
      <div class="progress" style="height: 25px;">
        <div class="progress-bar bg-primary" style="width: ${pctNormal}%">${pctNormal}%</div>
      </div>
    </div>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span><i class="fas fa-circle text-danger me-2"></i>Alta</span>
        <strong>${alta} (${pctAlta}%)</strong>
      </div>
      <div class="progress" style="height: 25px;">
        <div class="progress-bar bg-danger" style="width: ${pctAlta}%">${pctAlta}%</div>
      </div>
    </div>
  `;
}

async function cargarDistribucionCategorias() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/por-categoria');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-categorias');
    const canvas = document.getElementById('chartCategorias');
    
    loadingDiv.classList.add('d-none');
    canvas.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      if (chartCategorias) chartCategorias.destroy();
      
      chartCategorias = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: data.data.map(i => i.categoria),
          datasets: [{
            data: data.data.map(i => i.total),
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)',
              'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    } else {
      canvas.parentElement.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-chart-pie fa-3x mb-3"></i>
          <p>No hay datos para mostrar</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar distribución:', error);
  }
}

// ============================================
// TIPOS DE ESTUDIO
// ============================================
async function cargarTiposEstudio() {
  try {
    const response = await fetch('/medico/estudios-solicitados/api/tipos-estudio');
    const data = await response.json();
    
    if (data.success) {
      const selectFiltro = document.getElementById('filtroTipoEstudio');
      const selectNuevo = document.getElementById('nuevoTipoEstudio');
      
      // Limpiar opciones existentes (excepto la primera)
      [selectFiltro, selectNuevo].forEach(select => {
        while (select.children.length > 1) select.removeChild(select.lastChild);
      });
      
      data.data.forEach(tipo => {
        // Para filtro
        const optFiltro = document.createElement('option');
        optFiltro.value = tipo.id;
        optFiltro.textContent = `${tipo.nombre} (${tipo.categoria})`;
        selectFiltro.appendChild(optFiltro);
        
        // Para nuevo estudio
        const optNuevo = document.createElement('option');
        optNuevo.value = tipo.id;
        optNuevo.textContent = `${tipo.nombre} - ${tipo.categoria}`;
        optNuevo.dataset.ayuno = tipo.requiere_ayuno;
        selectNuevo.appendChild(optNuevo);
      });
    }
  } catch (error) {
    console.error('Error al cargar tipos de estudio:', error);
  }
}

function mostrarInfoTipoEstudio(tipoId) {
  const infoDiv = document.getElementById('infoTipoEstudio');
  if (!tipoId) {
    infoDiv.innerHTML = '';
    return;
  }
  
  const option = document.getElementById('nuevoTipoEstudio').selectedOptions[0];
  infoDiv.innerHTML = option?.dataset.ayuno === 'true' 
    ? '<span class="badge bg-warning"><i class="fas fa-ban me-1"></i>Requiere ayuno</span>' 
    : '';
}

// ============================================
// BÚSQUEDA Y SELECCIÓN DE PACIENTES
// ============================================
async function buscarPaciente() {
  const input = document.getElementById('inputBuscarPaciente');
  const resultadosDiv = document.getElementById('resultadosBusqueda');
  const busqueda = input.value.trim();
  
  if (busqueda.length < 2) {
    resultadosDiv.classList.add('d-none');
    return;
  }
  
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/buscar-pacientes?busqueda=${encodeURIComponent(busqueda)}`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      resultadosDiv.innerHTML = data.data.map(p => `
        <button type="button" class="list-group-item list-group-item-action" 
                onclick="seleccionarPaciente(${p.id}, '${p.nombre}', '${p.apellido}', '${p.dni}')">
          <div class="d-flex justify-content-between align-items-center">
            <div><i class="fas fa-user me-2 text-primary"></i><strong>${p.nombre} ${p.apellido}</strong></div>
            <span class="badge bg-secondary">DNI: ${p.dni}</span>
          </div>
        </button>
      `).join('');
    } else {
      resultadosDiv.innerHTML = `
        <div class="list-group-item text-muted text-center">
          <i class="fas fa-search me-2"></i>No se encontraron pacientes
        </div>
      `;
    }
    resultadosDiv.classList.remove('d-none');
  } catch (error) {
    console.error('Error al buscar:', error);
  }
}

async function seleccionarPaciente(id, nombre, apellido, dni) {
  pacienteSeleccionadoId = id;
  
  // Ocultar búsqueda, mostrar seleccionado
  document.getElementById('resultadosBusqueda').classList.add('d-none');
  document.getElementById('inputBuscarPaciente').value = '';
  document.getElementById('inputBuscarPaciente').closest('.col-md-12').classList.add('d-none');
  
  document.getElementById('pacienteSeleccionado').classList.remove('d-none');
  document.getElementById('nombrePacienteSeleccionado').textContent = `${nombre} ${apellido}`;
  document.getElementById('dniPacienteSeleccionado').textContent = `DNI: ${dni}`;
  document.getElementById('nuevoPacienteId').value = id;
  
  await cargarEvaluacionesPaciente(id);
}

async function cargarEvaluacionesPaciente(pacienteId) {
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/paciente/${pacienteId}/evaluaciones`);
    const data = await response.json();
    
    const contenedores = ['contenedorTipoEstudio', 'contenedorUrgencia', 'contenedorObservaciones'];
    
    if (data.success) {
      //  Siempre mostrar tipo estudio, urgencia y observaciones
      contenedores.forEach(id => document.getElementById(id).classList.remove('d-none'));
      
      if (data.data.tieneEvaluaciones) {
        const select = document.getElementById('nuevoEvaluacionId');
        select.innerHTML = '<option value="">Sin evaluación asociada (opcional)</option>';
        data.data.evaluaciones.forEach(e => {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = `#${e.id} - ${formatearFecha(e.fecha)} - ${e.motivo}`;
          select.appendChild(opt);
        });
        document.getElementById('contenedorEvaluacion').classList.remove('d-none');
        document.getElementById('sinEvaluaciones').classList.add('d-none');
        document.getElementById('infoEvaluacion').innerHTML = 
          `<small class="text-success"><i class="fas fa-check me-1"></i>${data.data.evaluaciones.length} evaluación(es) disponibles</small>`;
      } else {
        //  Mostrar aviso pero NO bloquear
        document.getElementById('contenedorEvaluacion').classList.add('d-none');
        document.getElementById('sinEvaluaciones').classList.remove('d-none');
      }
    }
  } catch (error) {
    console.error('Error al cargar evaluaciones:', error);
  }
  validarFormulario();
}


function limpiarPaciente() {
  pacienteSeleccionadoId = null;
  
  // Mostrar búsqueda
  const inputContainer = document.getElementById('inputBuscarPaciente').closest('.col-md-12');
  inputContainer.classList.remove('d-none');
  document.getElementById('inputBuscarPaciente').value = '';
  
  // Ocultar todo
  ['pacienteSeleccionado', 'contenedorEvaluacion', 'sinEvaluaciones', 
   'contenedorTipoEstudio', 'contenedorUrgencia', 'contenedorObservaciones'].forEach(id => {
    document.getElementById(id).classList.add('d-none');
  });
  
  document.getElementById('nuevoPacienteId').value = '';
  document.getElementById('nuevoEvaluacionId').innerHTML = '<option value="">Seleccione una evaluación</option>';
  
  validarFormulario();
}

function validarFormulario() {
  const paciente = document.getElementById('nuevoPacienteId').value;
  const tipo = document.getElementById('nuevoTipoEstudio').value;


  console.log('VALIDANDO FORMULARIO:');
  console.log('  - Paciente ID:', paciente);
  console.log('  - Tipo Estudio ID:', tipo);
  console.log('  - Botón habilitado:', !!(paciente && tipo));
  //  SOLO validar paciente y tipo (evaluación es opcional)
  document.getElementById('btnSubmitEstudio').disabled = !(paciente && tipo);
}

// ============================================
// MODAL NUEVO ESTUDIO
// ============================================
function mostrarModalNuevoEstudio() {
  document.getElementById('formNuevoEstudio').reset();
  limpiarPaciente();
  
  const modal = new bootstrap.Modal(document.getElementById('modalNuevoEstudio'));
  modal.show();
  
  setTimeout(() => document.getElementById('inputBuscarPaciente').focus(), 500);
}

async function crearEstudio() {
  const btn = document.getElementById('btnSubmitEstudio');
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
    
    //  evaluacion_medica_id es opcional
    const evaluacionId = document.getElementById('nuevoEvaluacionId').value;
    
    const data = {
      paciente_id: parseInt(document.getElementById('nuevoPacienteId').value),
      tipo_estudio_id: parseInt(document.getElementById('nuevoTipoEstudio').value),
      urgencia: document.getElementById('nuevaUrgencia').value || 'Normal',
      observaciones: document.getElementById('nuevasObservaciones').value || ''
    };
    
    //  SOLO agregar evaluacion_medica_id si existe
    if (evaluacionId && evaluacionId !== '') {
      data.evaluacion_medica_id = parseInt(evaluacionId);
    }
    
    console.log('📤 Enviando:', data);
    
    //  Solo paciente y tipo son obligatorios
    if (!data.paciente_id || !data.tipo_estudio_id) {
      throw new Error('Complete todos los campos requeridos');
    }
    
    const response = await fetch('/medico/estudios-solicitados/api/estudios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('📥 Resultado:', result);
    
    if (result.success) {
      mostrarAlerta('success', 'Estudio solicitado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoEstudio')).hide();
      await actualizarTodo();
    } else {
      throw new Error(result.message || 'Error al crear estudio');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarAlerta('error', error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save me-2"></i>Solicitar Estudio';
    validarFormulario();
  }
}
// ============================================
// LISTADO DE ESTUDIOS
// ============================================
async function cargarEstudios(pagina = paginaActual) {
  try {
    const params = new URLSearchParams({ page: pagina, limit: estudiosPorPagina });
    
    const formData = new FormData(document.getElementById('formFiltros'));
    for (let [key, value] of formData.entries()) {
      if (value && value !== 'TODOS' && value !== 'TODAS') {
        params.append(key, value);
      }
    }
    
    const response = await fetch(`/medico/estudios-solicitados/api/estudios?${params}`);
    const data = await response.json();
    
    document.getElementById('loading-estudios').classList.add('d-none');
    document.getElementById('tabla-estudios').classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarEstudios(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-estudios').innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="fas fa-flask fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron estudios</p>
            <button class="btn btn-sm btn-primary" onclick="mostrarModalNuevoEstudio()">
              <i class="fas fa-plus me-1"></i>Solicitar primer estudio
            </button>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar estudios:', error);
    document.getElementById('loading-estudios').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar estudios.
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="cargarEstudios()">
          <i class="fas fa-redo me-1"></i>Reintentar
        </button>
      </div>
    `;
  }
}

function mostrarEstudios(estudios) {
  document.getElementById('tbody-estudios').innerHTML = estudios.map(e => {
    const fecha = formatearFecha(e.created_at || e.createdAt);
    const paciente = e.paciente?.usuario;
    const tipo = e.tipo_estudio;
    
    return `
      <tr>
        <td>
          <strong>${paciente?.nombre || 'N/A'} ${paciente?.apellido || ''}</strong><br>
          <small class="text-muted">DNI: ${paciente?.dni || 'N/A'}</small>
        </td>
        <td>
          <span class="badge bg-primary">${tipo?.nombre || 'N/A'}</span><br>
          <small class="text-muted">${tipo?.categoria || ''}</small>
          ${tipo?.requiere_ayuno ? '<br><small class="badge bg-warning"><i class="fas fa-ban me-1"></i>Ayuno</small>' : ''}
        </td>
        <td>
          <span class="badge bg-${getEstadoClass(e.estado)}">${e.estado}</span>
          ${e.estado === 'Realizado' && e.fecha_realizacion ? 
            `<br><small class="text-muted">${formatearFecha(e.fecha_realizacion)}</small>` : ''}
        </td>
        <td><span class="badge bg-${e.urgencia === 'Alta' ? 'danger' : 'info'}">${e.urgencia}</span></td>
        <td><small>${fecha}</small></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-info" onclick="verDetalle(${e.id})" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            ${e.estado === 'Pendiente' ? `
              <button class="btn btn-sm btn-outline-success" onclick="abrirCargarResultados(${e.id})" title="Resultados">
                <i class="fas fa-file-upload"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="cancelarEstudio(${e.id})" title="Cancelar">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
            ${e.estado === 'Realizado' ? `
              <button class="btn btn-sm btn-outline-secondary" onclick="verResultados(${e.id})" title="Ver resultados">
                <i class="fas fa-file-medical"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
function mostrarPaginacion(pagination) {
  const div = document.getElementById('paginacion');
  
  if (pagination.totalPages <= 1) {
    div.innerHTML = '';
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
  
  div.innerHTML = html;
}

function cambiarPagina(pagina) {
  paginaActual = pagina;
  cargarEstudios(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// ============================================
// VER DETALLE
// ============================================
async function verDetalle(id) {
  const modalBody = document.getElementById('modalDetalleEstudioBody');
  modalBody.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  new bootstrap.Modal(document.getElementById('modalDetalleEstudio')).show();
  
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const e = data.data;
      const paciente = e.paciente?.usuario;
      
      modalBody.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-user me-2"></i>Paciente</h6>
            <p><strong>${paciente?.nombre || ''} ${paciente?.apellido || ''}</strong><br>DNI: ${paciente?.dni || 'N/A'}</p>
          </div>
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-flask me-2"></i>Estudio</h6>
            <p><strong>${e.tipo_estudio?.nombre || 'N/A'}</strong><br>${e.tipo_estudio?.categoria || ''}</p>
          </div>
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-info-circle me-2"></i>Estado</h6>
            <p>
              <span class="badge bg-${getEstadoClass(e.estado)}">${e.estado}</span>
              <span class="badge bg-${e.urgencia === 'Alta' ? 'danger' : 'info'} ms-1">${e.urgencia}</span>
            </p>
          </div>
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-calendar me-2"></i>Fecha</h6>
            <p>${formatearFechaHora(e.created_at || e.createdAt)}</p>
          </div>
          ${e.observaciones ? `
            <div class="col-12">
              <h6 class="text-primary"><i class="fas fa-comment me-2"></i>Observaciones</h6>
              <div class="alert alert-secondary">${e.observaciones.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      modalBody.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
    }
  } catch (error) {
    console.error('Error:', error);
    modalBody.innerHTML = '<div class="alert alert-danger">Error al cargar detalle</div>';
  }
}

// ============================================
// CARGAR RESULTADOS
// ============================================
async function abrirCargarResultados(id) {
  document.getElementById('estudioIdResultados').value = id;
  document.getElementById('resultadosTexto').value = '';
  document.getElementById('notasArchivo').value = '';
  document.getElementById('previewArchivo').classList.add('d-none');
  archivoSimulado = null;
  
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const e = data.data;
      const paciente = e.paciente?.usuario;
      document.getElementById('infoEstudioResultados').innerHTML = `
        <div class="d-flex justify-content-between">
          <div><strong>${paciente?.nombre} ${paciente?.apellido}</strong>
          <span class="text-muted ms-2">DNI: ${paciente?.dni}</span></div>
          <span class="badge bg-primary">${e.tipo_estudio?.nombre}</span>
        </div>
      `;
    }
    
    new bootstrap.Modal(document.getElementById('modalCargarResultados')).show();
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar información');
  }
}

function simularCargaArchivo() {
  const input = document.getElementById('archivoResultado');
  
  if (input.files?.[0]) {
    const file = input.files[0];
    archivoSimulado = { nombre: file.name, tamano: (file.size / 1024).toFixed(2) + ' KB', tipo: file.type };
  } else {
    const archivos = [
      { nombre: 'resultados_laboratorio.pdf', tamano: '245 KB', tipo: 'application/pdf' },
      { nombre: 'radiografia_torax.jpg', tamano: '1.8 MB', tipo: 'image/jpeg' }
    ];
    archivoSimulado = archivos[Math.floor(Math.random() * archivos.length)];
  }
  
  document.getElementById('previewArchivo').classList.remove('d-none');
  document.getElementById('nombreArchivo').textContent = archivoSimulado.nombre;
  document.getElementById('tamanoArchivo').textContent = archivoSimulado.tamano;
  document.getElementById('iconoArchivo').className = 
    `fas fa-file-${archivoSimulado.tipo.includes('pdf') ? 'pdf text-danger' : 'image text-primary'} fa-2x me-3`;
  
  mostrarAlerta('info', `Archivo "${archivoSimulado.nombre}" simulado`);
}

function quitarArchivo() {
  archivoSimulado = null;
  document.getElementById('previewArchivo').classList.add('d-none');
  document.getElementById('archivoResultado').value = '';
}

async function guardarResultados() {
  const estudioId = document.getElementById('estudioIdResultados').value;
  const tabActiva = document.querySelector('#tabResultados .nav-link.active').id;
  
  let resultados = '';
  
  if (tabActiva === 'tab-texto') {
    resultados = document.getElementById('resultadosTexto').value.trim();
    if (!resultados) {
      mostrarAlerta('error', 'Ingrese los resultados');
      return;
    }
  } else {
    if (!archivoSimulado) {
      mostrarAlerta('error', 'Adjunte un archivo');
      return;
    }
    const notas = document.getElementById('notasArchivo').value.trim();
    resultados = `[ARCHIVO ADJUNTO - SIMULACIÓN]\nNombre: ${archivoSimulado.nombre}\nTamaño: ${archivoSimulado.tamano}\n${notas ? '\nNotas: ' + notas : ''}`;
  }
  
  const btn = document.getElementById('btnGuardarResultados');
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${estudioId}/completar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultados })
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', 'Resultados guardados');
      bootstrap.Modal.getInstance(document.getElementById('modalCargarResultados')).hide();
      await actualizarTodo();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al guardar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Resultados';
  }
}

// ============================================
// CANCELAR ESTUDIO
// ============================================
async function cancelarEstudio(id) {
  if (!confirm('¿Cancelar estudio? Esta acción no se puede deshacer.')) return;
  
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', 'Estudio cancelado');
      await actualizarTodo();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cancelar');
  }
}
// ============================================
// VER RESULTADOS
// ============================================
async function verResultados(id) {
  try {
    const response = await fetch(`/medico/estudios-solicitados/api/estudios/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const e = data.data;
      
      // Usar el nuevo campo 'resultados'
      if (e.resultados) {
        const fecha = e.fecha_realizacion ? formatearFechaHora(e.fecha_realizacion) : 'N/A';
        alert(`RESULTADOS DEL ESTUDIO\n\nFecha: ${fecha}\n\n${e.resultados}`);
      } else {
        alert('No hay resultados registrados');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar resultados');
  }
}

// ============================================
// ACTUALIZAR
// ============================================
async function actualizarTodo() {
  await Promise.all([
    cargarEstudios(),
    cargarEstadisticas(),
    cargarDistribucionCategorias()
  ]);
}

function actualizarTabla() {
  const btn = document.getElementById('btnActualizar');
  const originalHTML = btn.innerHTML;
  
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
  btn.disabled = true;
  
  paginaActual = 1;
  
  actualizarTodo().finally(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  });
}

async function precargarPacienteEnEstudioPorId(id) {
  try {
    new bootstrap.Modal(document.getElementById('modalNuevoEstudio')).show();

    // Buscar por ID en el endpoint que ya existe
    const res = await fetch(`/medico/estudios-solicitados/api/buscar-pacientes?busqueda=${id}`);
    const data = await res.json();

    console.log('Buscando por ID:', id, '→', data);

    if (data.success && data.data.length > 0) {
      const paciente = data.data.find(p => p.id == id) || data.data[0];
      document.getElementById('inputBuscarPaciente').value = paciente.dni;
      await seleccionarPaciente(paciente.id, paciente.nombre, paciente.apellido, paciente.dni);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}