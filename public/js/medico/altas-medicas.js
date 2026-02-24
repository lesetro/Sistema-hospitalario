// ========================================
// VARIABLES GLOBALES
// ========================================
let paginaActual = 1;
const limitePorPagina = 10;
let pendientesData = null;
let tabActual = 'internaciones';

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🏥 Inicializando módulo de Altas Médicas...');
  
  // Cargar estadísticas
  cargarEstadisticas();
  
  // Cargar pacientes para filtro
  cargarPacientesFiltro();
  
  // Cargar pendientes de la primera pestaña
  cargarPendientes('internaciones');
  
  // Cargar historial de altas
  actualizarTabla();
  
  
  // Event listener para filtros del historial
  const formFiltrosHistorial = document.getElementById('formFiltrosHistorial');
  if (formFiltrosHistorial) {
    formFiltrosHistorial.addEventListener('submit', function(e) {
      e.preventDefault();
      paginaActual = 1;
      actualizarTabla();
    });
  }
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    console.log('📊 Cargando estadísticas...');
    
    const response = await fetch('/medico/altas-medicas/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      const stats = data.data;
      
      document.getElementById('stat-total').textContent = stats.totalAltas || 0;
      document.getElementById('stat-mes').textContent = stats.esteMes || 0;
      document.getElementById('stat-semana').textContent = stats.estaSemana || 0;
      document.getElementById('stat-hoy').textContent = stats.hoy || 0;
      
      console.log('✅ Estadísticas cargadas:', stats);
    } else {
      console.error('❌ Error en respuesta:', data.message);
      mostrarError('Error al cargar estadísticas');
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
    mostrarError('Error de conexión al cargar estadísticas');
  }
}

// ========================================
// CARGAR PENDIENTES
// ========================================
async function cargarPendientes(tipo) {
  try {
    console.log(`📋 Cargando pendientes de tipo: ${tipo}`);
    tabActual = tipo;
    
    // Mostrar loading
    mostrarLoading(tipo);
    
    const response = await fetch('/medico/altas-medicas/pendientes');
    const data = await response.json();
    
    if (data.success) {
      pendientesData = data.data;
      
      // Actualizar contadores
      document.getElementById('contador-internaciones').textContent = 
        pendientesData.internaciones?.length || 0;
      document.getElementById('contador-admisiones').textContent = 
        pendientesData.admisiones?.length || 0;
      document.getElementById('contador-solicitudes').textContent = 
        pendientesData.listasEsperaAltas?.length || 0;
      
      // Renderizar la lista correspondiente
      switch(tipo) {
        case 'internaciones':
          renderizarInternaciones(pendientesData.internaciones);
          break;
        case 'admisiones':
          renderizarAdmisiones(pendientesData.admisiones);
          break;
        case 'solicitudes':
          renderizarSolicitudes(pendientesData.listasEsperaAltas);
          break;
      }
      
      console.log('✅ Pendientes cargados:', pendientesData);
    } else {
      console.error('❌ Error en respuesta:', data.message);
      mostrarError('Error al cargar pendientes');
    }
  } catch (error) {
    console.error('❌ Error al cargar pendientes:', error);
    mostrarError('Error de conexión al cargar pendientes');
  }
}

// ========================================
// RENDERIZAR INTERNACIONES
// ========================================
function renderizarInternaciones(internaciones) {
  const container = document.getElementById('lista-internaciones');
  const loading = document.getElementById('loading-internaciones');
  
  loading.style.display = 'none';
  
  if (!internaciones || internaciones.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No hay internaciones pendientes de alta
      </div>
    `;
    return;
  }
  
  let html = '<div class="list-group">';
  
  internaciones.forEach(internacion => {
    const paciente = internacion.paciente?.usuario;
    const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Desconocido';
    const dniPaciente = paciente?.dni || 'N/A';
    const fechaInicio = internacion.fecha_inicio ? 
      new Date(internacion.fecha_inicio).toLocaleDateString('es-AR') : 'N/A';
    const habitacion = internacion.habitacion?.numero || 'N/A';
    const cama = internacion.cama?.numero || 'N/A';
    const admisionId = internacion.admision_id || internacion.admision?.id || null;
    
    // Calcular días de internación
    const diasInternacion = internacion.fecha_inicio ? 
      Math.floor((new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24)) : 0;
    
    html += `
      <div class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <i class="fas fa-user me-2 text-primary"></i>
              ${nombrePaciente}
            </h6>
            <div class="row g-2 small text-muted mt-2">
              <div class="col-md-3">
                <i class="fas fa-id-card me-1"></i>
                <strong>DNI:</strong> ${dniPaciente}
              </div>
              <div class="col-md-3">
                <i class="fas fa-calendar me-1"></i>
                <strong>Ingreso:</strong> ${fechaInicio}
              </div>
              <div class="col-md-2">
                <i class="fas fa-door-open me-1"></i>
                <strong>Hab:</strong> ${habitacion}
              </div>
              <div class="col-md-2">
                <i class="fas fa-bed me-1"></i>
                <strong>Cama:</strong> ${cama}
              </div>
              <div class="col-md-2">
                <i class="fas fa-clock me-1"></i>
                <strong>${diasInternacion} días</strong>
              </div>
            </div>
          </div>
          <div class="ms-3">
            <button class="btn btn-success btn-sm" 
                    onclick="abrirModalAlta(${internacion.id}, ${internacion.paciente_id}, 'internacion', ${admisionId})">
              <i class="fas fa-sign-out-alt me-1"></i>
              Dar Alta
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// ========================================
// RENDERIZAR ADMISIONES
// ========================================
function renderizarAdmisiones(admisiones) {
  const container = document.getElementById('lista-admisiones');
  const loading = document.getElementById('loading-admisiones');
  
  loading.style.display = 'none';
  
  if (!admisiones || admisiones.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No hay admisiones pendientes de alta
      </div>
    `;
    return;
  }
  
  let html = '<div class="list-group">';
  
  admisiones.forEach(admision => {
    const paciente = admision.paciente?.usuario;
    const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Desconocido';
    const dniPaciente = paciente?.dni || 'N/A';
    const fechaAdmision = admision.fecha ? 
      new Date(admision.fecha).toLocaleDateString('es-AR') : 'N/A';
    const estado = admision.estado || 'Pendiente';
    
    html += `
      <div class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <i class="fas fa-user me-2 text-info"></i>
              ${nombrePaciente}
            </h6>
            <div class="row g-2 small text-muted mt-2">
              <div class="col-md-4">
                <i class="fas fa-id-card me-1"></i>
                <strong>DNI:</strong> ${dniPaciente}
              </div>
              <div class="col-md-4">
                <i class="fas fa-calendar me-1"></i>
                <strong>Fecha:</strong> ${fechaAdmision}
              </div>
              <div class="col-md-4">
                <i class="fas fa-info-circle me-1"></i>
                <strong>Estado:</strong> <span class="badge bg-warning">${estado}</span>
              </div>
            </div>
          </div>
          <div class="ms-3">
            <button class="btn btn-success btn-sm" 
                    onclick="abrirModalAlta(null, ${admision.paciente_id}, 'admision', ${admision.id})">
              <i class="fas fa-sign-out-alt me-1"></i>
              Dar Alta
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// ========================================
// RENDERIZAR SOLICITUDES DE ENFERMERÍA
// ========================================
function renderizarSolicitudes(solicitudes) {
  const container = document.getElementById('lista-solicitudes');
  const loading = document.getElementById('loading-solicitudes');
  
  loading.style.display = 'none';
  
  if (!solicitudes || solicitudes.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No hay solicitudes de alta desde enfermería
      </div>
    `;
    return;
  }
  
  let html = '<div class="list-group">';
  
  solicitudes.forEach(solicitud => {
    const paciente = solicitud.paciente?.usuario;
    const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Desconocido';
    const dniPaciente = paciente?.dni || 'N/A';
    const telefonoPaciente = paciente?.telefono || 'N/A';
    const fechaRegistro = solicitud.fecha_registro ? 
      new Date(solicitud.fecha_registro).toLocaleString('es-AR') : 'N/A';
    const enfermero = solicitud.enfermero_creador?.usuario;
    const nombreEnfermero = enfermero ? `${enfermero.nombre} ${enfermero.apellido}` : 'N/A';
    const tipoTurno = solicitud.tipo_turno?.nombre || 'Alta Médica';
    
    // Obtener observaciones de evaluación de enfermería si existe
    const evaluacion = solicitud.evaluaciones_enfermeria?.[0];
    const observaciones = evaluacion?.observaciones || 'Sin observaciones';
    const signosVitales = evaluacion?.signos_vitales || null;
    
    html += `
      <div class="list-group-item list-group-item-action border-start border-warning border-4">
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-2">
              <h6 class="mb-0">
                <i class="fas fa-user me-2 text-warning"></i>
                ${nombrePaciente}
              </h6>
              <span class="badge bg-warning text-dark ms-2">${tipoTurno}</span>
            </div>
            
            <div class="row g-2 small mb-2">
              <div class="col-md-3">
                <i class="fas fa-id-card me-1 text-muted"></i>
                <strong>DNI:</strong> ${dniPaciente}
              </div>
              <div class="col-md-3">
                <i class="fas fa-phone me-1 text-muted"></i>
                <strong>Tel:</strong> ${telefonoPaciente}
              </div>
              <div class="col-md-3">
                <i class="fas fa-user-nurse me-1 text-muted"></i>
                <strong>Enfermero:</strong> ${nombreEnfermero}
              </div>
              <div class="col-md-3">
                <i class="fas fa-clock me-1 text-muted"></i>
                <strong>Registrado:</strong> ${fechaRegistro}
              </div>
            </div>
            
            ${observaciones !== 'Sin observaciones' ? `
              <div class="mt-2 p-2 bg-light rounded">
                <small class="text-muted">
                  <i class="fas fa-comment-medical me-1"></i>
                  <strong>Observaciones de Enfermería:</strong><br>
                  ${observaciones}
                </small>
              </div>
            ` : ''}
            
            ${signosVitales ? `
              <div class="mt-2">
                <small class="text-muted">
                  <i class="fas fa-heartbeat me-1"></i>
                  <strong>Signos Vitales:</strong> ${signosVitales}
                </small>
              </div>
            ` : ''}
          </div>
          
          <div class="ms-3">
            <button class="btn btn-success btn-sm" 
                    onclick="abrirModalAltaSolicitud(${solicitud.id}, ${solicitud.paciente_id}, '${nombrePaciente}')">
              <i class="fas fa-check-circle me-1"></i>
              Otorgar Alta
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// ========================================
// ABRIR MODAL ALTA (INTERNACIONES/ADMISIONES)
// ========================================
function abrirModalAlta(internacionId, pacienteId, tipo, admisionId = null) {
  console.log(' Abriendo modal alta:', { internacionId, pacienteId, tipo, admisionId });
  
  document.getElementById('formNuevaAlta').reset();
  document.getElementById('nuevoPacienteId').value = pacienteId;
  
  if (tipo === 'internacion') {
    //  Solo enviar internacion_id (la admisión ya fue procesada)
    document.getElementById('nuevaInternacionId').value = internacionId;
    document.getElementById('nuevaAdmisionId').value = ''; 
    
    document.getElementById('textoInfoSeleccionada').textContent = 
      `Alta médica para internación ID: ${internacionId}`;
    
  } else if (tipo === 'admision') {
    // Solo admisión (sin internación)
    document.getElementById('nuevaInternacionId').value = '';
    document.getElementById('nuevaAdmisionId').value = admisionId;
    document.getElementById('textoInfoSeleccionada').textContent = 
      `Alta médica para admisión ID: ${admisionId}`;
  }
  
  document.getElementById('infoSeleccionada').style.display = 'block';
  
  const modal = new bootstrap.Modal(document.getElementById('modalNuevaAlta'));
  modal.show();
}
// ========================================
// ABRIR MODAL ALTA DESDE SOLICITUD
// ========================================
function abrirModalAltaSolicitud(listaEsperaId, pacienteId, nombrePaciente) {
  console.log(' Abriendo modal alta solicitud:', { listaEsperaId, pacienteId, nombrePaciente });
  
  // Llenar datos
  document.getElementById('solicitudListaEsperaId').value = listaEsperaId;
  document.getElementById('solicitudPacienteId').value = pacienteId;
  document.getElementById('solicitudNombrePaciente').textContent = 'Paciente: ' + nombrePaciente;
  
  // Resetear selects a valores por defecto
  document.getElementById('solicitudTipoAlta').value = 'Medica';
  document.getElementById('solicitudEstadoPaciente').value = 'Estable';
  document.getElementById('solicitudInstrucciones').value = 'Seguimiento ambulatorio. Control en 7 días.';
  
  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('modalAltaSolicitud'));
  modal.show();
}


// ========================================
// SUBMIT NUEVA ALTA
// ========================================
async function submitNuevaAlta() {
  console.log('submitNuevaAlta() INICIADA');
  
  try {
    const data = {
      paciente_id: document.getElementById('nuevoPacienteId').value,
      internacion_id: document.getElementById('nuevaInternacionId').value || null,
      admision_id: document.getElementById('nuevaAdmisionId').value || null,
      tipo_alta: document.getElementById('nuevoTipoAlta').value,
      estado_paciente: document.getElementById('nuevoEstadoPaciente').value,
      instrucciones_post_alta: document.getElementById('nuevasInstrucciones').value
    };
    
    console.log(' Data a enviar:', data);
    
    // Validaciones
    if (!data.paciente_id) {
      alert('Debe especificar un paciente');
      return;
    }
    
    if (!data.internacion_id && !data.admision_id) {
      alert('Debe especificar una internación o admisión');
      return;
    }
    
    if (!data.tipo_alta) {
      alert('Debe seleccionar el tipo de alta');
      return;
    }
    
    if (!data.estado_paciente) {
      alert('Debe seleccionar el estado del paciente');
      return;
    }
    
    // Deshabilitar botón mientras procesa
    const btnSubmit = document.querySelector('#modalNuevaAlta .btn-success');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    
    const response = await fetch('/medico/altas-medicas/altas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log(' Response status:', response.status);
    
    const result = await response.json();
    console.log(' Result:', result);
    
    if (result.success) {
      alert('¡Alta registrada correctamente!');
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaAlta'));
      modal.hide();
      
      // Recargar datos
      await cargarPendientes(tabActual);
      await cargarEstadisticas();
      await actualizarTabla();
      
    } else {
      alert('Error: ' + (result.message || 'No se pudo registrar el alta'));
    }
    
  } catch (error) {
    console.error('❌ Error en submitNuevaAlta:', error);
    alert('Error de conexión al registrar el alta');
  } finally {
    // Restaurar botón
    const btnSubmit = document.querySelector('#modalNuevaAlta .btn-success');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Registrar Alta';
    }
  }
}

// ========================================
// ACTUALIZAR TABLA DE HISTORIAL
// ========================================
async function actualizarTabla() {
  try {
    console.log(' Actualizando tabla de historial...');
    
    const loading = document.getElementById('loading-altas');
    const tabla = document.getElementById('tabla-altas');
    
    loading.style.display = 'block';
    tabla.classList.add('d-none');
    
    // Obtener filtros
    const formData = new FormData(document.getElementById('formFiltrosHistorial'));
    const params = new URLSearchParams({
      ...Object.fromEntries(formData),
      page: paginaActual,
      limit: limitePorPagina
    });
    
    const response = await fetch(`/medico/altas-medicas/altas?${params}`);
    const data = await response.json();
    
    if (data.success) {
      renderizarTablaAltas(data.data);
      renderizarPaginacion(data.pagination);
      
      loading.style.display = 'none';
      tabla.classList.remove('d-none');
      
      console.log('✅ Tabla actualizada');
    } else {
      console.error('❌ Error en respuesta:', data.message);
      mostrarError('Error al cargar historial');
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar tabla:', error);
    mostrarError('Error de conexión al cargar historial');
  }
}

// ========================================
// RENDERIZAR TABLA DE ALTAS
// ========================================
function renderizarTablaAltas(altas) {
  const tbody = document.getElementById('tbody-altas');
  
  if (!altas || altas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-3x mb-3"></i>
          <p>No se encontraron altas médicas</p>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  altas.forEach(alta => {
    const paciente = alta.paciente?.usuario;
    const nombrePaciente = paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Desconocido';
    const fechaAlta = alta.fecha_alta ? 
      new Date(alta.fecha_alta).toLocaleString('es-AR') : 'N/A';
    const origen = alta.origen || 'DIRECTO';
    
    // Badge de origen
    const origenBadge = origen === 'ENFERMERIA' ? 
      '<span class="badge bg-warning">Enfermería</span>' : 
      '<span class="badge bg-primary">Directo</span>';
    
    // Badge de tipo de alta
    let tipoBadge = '';
    switch(alta.tipo_alta) {
      case 'Alta Voluntaria':
        tipoBadge = '<span class="badge bg-info">Voluntaria</span>';
        break;
      case 'Alta Médica':
        tipoBadge = '<span class="badge bg-success">Médica</span>';
        break;
      case 'Alta por Mejoría':
        tipoBadge = '<span class="badge bg-primary">Por Mejoría</span>';
        break;
      default:
        tipoBadge = `<span class="badge bg-secondary">${alta.tipo_alta}</span>`;
    }
    
    // Badge de estado
    let estadoBadge = '';
    switch(alta.estado_paciente) {
      case 'Estable':
        estadoBadge = '<span class="badge bg-success">Estable</span>';
        break;
      case 'Mejorado':
        estadoBadge = '<span class="badge bg-info">Mejorado</span>';
        break;
      case 'Recuperado':
        estadoBadge = '<span class="badge bg-primary">Recuperado</span>';
        break;
      default:
        estadoBadge = `<span class="badge bg-secondary">${alta.estado_paciente}</span>`;
    }
    
    html += `
      <tr>
        <td>
          <strong>${nombrePaciente}</strong><br>
          <small class="text-muted">DNI: ${paciente?.dni || 'N/A'}</small>
        </td>
        <td>${tipoBadge}</td>
        <td>${estadoBadge}</td>
        <td><small>${fechaAlta}</small></td>
        <td>${origenBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="verDetalleAlta(${alta.id})">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// ========================================
// RENDERIZAR PAGINACIÓN
// ========================================
function renderizarPaginacion(pagination) {
  const paginacionDiv = document.getElementById('paginacion');
  
  if (!pagination || pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Botón anterior
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${pagination.page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  // Números de página
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
      html += `
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">
            ${i}
          </a>
        </li>
      `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  // Botón siguiente
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
  actualizarTabla();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// VER DETALLE DE ALTA
// ========================================
async function verDetalleAlta(altaId) {
  try {
    console.log('🔍 Cargando detalle de alta:', altaId);
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
    const modalBody = document.getElementById('modalDetalleBody');
    
    // Mostrar loading
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary"></div>
        <p class="mt-2 text-muted">Cargando detalle...</p>
      </div>
    `;
    modal.show();
    
    const response = await fetch(`/medico/altas-medicas/altas/${altaId}`);
    const data = await response.json();
    
    if (data.success) {
      const alta = data.data;
      const paciente = alta.paciente?.usuario;
      const obraSocial = alta.paciente?.obraSocial;
      const internacion = alta.internacion;
      const admision = alta.admision;
      
      let html = `
        <div class="row">
          <div class="col-md-6">
            <h6 class="border-bottom pb-2 mb-3">
              <i class="fas fa-user me-2 text-primary"></i>
              Información del Paciente
            </h6>
            <table class="table table-sm">
              <tr>
                <td class="text-muted"><strong>Nombre:</strong></td>
                <td>${paciente?.nombre || 'N/A'} ${paciente?.apellido || ''}</td>
              </tr>
              <tr>
                <td class="text-muted"><strong>DNI:</strong></td>
                <td>${paciente?.dni || 'N/A'}</td>
              </tr>
              <tr>
                <td class="text-muted"><strong>Obra Social:</strong></td>
                <td>${obraSocial?.nombre || 'Particular'}</td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="border-bottom pb-2 mb-3">
              <i class="fas fa-file-medical me-2 text-success"></i>
              Información del Alta
            </h6>
            <table class="table table-sm">
              <tr>
                <td class="text-muted"><strong>Fecha Alta:</strong></td>
                <td>${alta.fecha_alta ? new Date(alta.fecha_alta).toLocaleString('es-AR') : 'N/A'}</td>
              </tr>
              <tr>
                <td class="text-muted"><strong>Tipo:</strong></td>
                <td><span class="badge bg-success">${alta.tipo_alta}</span></td>
              </tr>
              <tr>
                <td class="text-muted"><strong>Estado:</strong></td>
                <td><span class="badge bg-info">${alta.estado_paciente}</span></td>
              </tr>
              <tr>
                <td class="text-muted"><strong>Origen:</strong></td>
                <td><span class="badge bg-${alta.origen === 'ENFERMERIA' ? 'warning' : 'primary'}">${alta.origen || 'DIRECTO'}</span></td>
              </tr>
            </table>
          </div>
        </div>
      `;
      
      // Información de internación si existe
      if (internacion) {
        const sector = internacion.habitacion?.sector;
        const tipoInternacion = internacion.tipoInternacion;
        
        html += `
          <div class="row mt-3">
            <div class="col-12">
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fas fa-bed me-2 text-info"></i>
                Información de Internación
              </h6>
              <table class="table table-sm">
                <tr>
                  <td class="text-muted" width="200"><strong>Fecha Inicio:</strong></td>
                  <td>${internacion.fecha_inicio ? new Date(internacion.fecha_inicio).toLocaleString('es-AR') : 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-muted"><strong>Habitación:</strong></td>
                  <td>${internacion.habitacion?.numero || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-muted"><strong>Cama:</strong></td>
                  <td>${internacion.cama?.numero || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-muted"><strong>Sector:</strong></td>
                  <td>${sector?.nombre || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-muted"><strong>Tipo:</strong></td>
                  <td>${tipoInternacion?.nombre || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      }
      
      // Información de admisión si existe
      if (admision) {
        html += `
          <div class="row mt-3">
            <div class="col-12">
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fas fa-file-alt me-2 text-warning"></i>
                Información de Admisión
              </h6>
              <table class="table table-sm">
                <tr>
                  <td class="text-muted" width="200"><strong>Fecha Admisión:</strong></td>
                  <td>${admision.fecha ? new Date(admision.fecha).toLocaleString('es-AR') : 'N/A'}</td>
                </tr>
                <tr>
                  <td class="text-muted"><strong>Estado:</strong></td>
                  <td><span class="badge bg-secondary">${admision.estado}</span></td>
                </tr>
              </table>
            </div>
          </div>
        `;
      }
      
      // Instrucciones post-alta
      if (alta.instrucciones_post_alta) {
        html += `
          <div class="row mt-3">
            <div class="col-12">
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fas fa-notes-medical me-2 text-primary"></i>
                Instrucciones Post-Alta
              </h6>
              <div class="p-3 bg-light rounded">
                ${alta.instrucciones_post_alta}
              </div>
            </div>
          </div>
        `;
      }
      
      modalBody.innerHTML = html;
      
    } else {
      console.error('❌ Error en respuesta:', data.message);
      modalBody.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar el detalle del alta
        </div>
      `;
    }
    
  } catch (error) {
    console.error('❌ Error al ver detalle:', error);
    document.getElementById('modalDetalleBody').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Error de conexión
      </div>
    `;
  }
}

// ========================================
// CARGAR PACIENTES PARA FILTRO
// ========================================
async function cargarPacientesFiltro(busqueda = '') {
  try {
    const params = new URLSearchParams({ busqueda });
    const response = await fetch(`/medico/altas-medicas/pacientes/filtro?${params}`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('filtroPaciente');
      
      // Limpiar opciones excepto "Todos"
      select.innerHTML = '<option value="">Todos</option>';
      
      data.data.forEach(paciente => {
        const usuario = paciente.usuario;
        const nombre = `${usuario.apellido}, ${usuario.nombre} (DNI: ${usuario.dni})`;
        const option = new Option(nombre, paciente.id);
        select.add(option);
      });
    }
  } catch (error) {
    console.error('❌ Error al cargar pacientes:', error);
  }
}





async function submitAltaSolicitud() {
  console.log(' Procesando alta desde solicitud...');
  
  try {
    const listaEsperaId = document.getElementById('solicitudListaEsperaId').value;
    const tipoAlta = document.getElementById('solicitudTipoAlta').value;
    const estadoPaciente = document.getElementById('solicitudEstadoPaciente').value;
    const instrucciones = document.getElementById('solicitudInstrucciones').value;
    
    if (!tipoAlta || !estadoPaciente) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    
    // Deshabilitar botón
    const btnSubmit = document.querySelector('#modalAltaSolicitud .btn-success');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    
    const response = await fetch('/medico/altas-medicas/solicitud', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lista_espera_id: listaEsperaId,
        tipo_alta: tipoAlta,
        estado_paciente: estadoPaciente,
        instrucciones_post_alta: instrucciones
      })
    });
    
    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📦 Result:', result);
    
    if (result.success) {
      alert('¡Alta médica otorgada correctamente!');
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalAltaSolicitud'));
      modal.hide();
      
      // Recargar datos
      await cargarPendientes('solicitudes');
      await cargarEstadisticas();
      await actualizarTabla();
      
    } else {
      alert('Error: ' + (result.message || 'No se pudo registrar el alta'));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error de conexión al procesar el alta');
  } finally {
    // Restaurar botón
    const btnSubmit = document.querySelector('#modalAltaSolicitud .btn-success');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fas fa-check me-2"></i>Otorgar Alta';
    }
  }
}
// ========================================
// MOSTRAR LOADING
// ========================================
function mostrarLoading(tipo) {
  const loadingId = `loading-${tipo}`;
  const listaId = `lista-${tipo}`;
  
  const loading = document.getElementById(loadingId);
  const lista = document.getElementById(listaId);
  
  if (loading) loading.style.display = 'block';
  if (lista) lista.innerHTML = '';
}

// ========================================
// MOSTRAR ERROR
// ========================================
function mostrarError(mensaje) {
  alert('Error: ' + mensaje);
}

// ========================================
// MOSTRAR ÉXITO
// ========================================
function mostrarExito(mensaje) {
  alert(mensaje);
}