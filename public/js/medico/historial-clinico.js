let pacienteSeleccionado = null;
let paginaHistorial = 1;
const registrosPorPagina = 20;

document.addEventListener('DOMContentLoaded', function() {
  // Búsqueda de paciente con autocompletado
  let timeoutBusqueda;
  document.getElementById('buscarPaciente').addEventListener('input', function(e) {
    clearTimeout(timeoutBusqueda);
    const query = e.target.value;
    
    if (query.length >= 2) {
      timeoutBusqueda = setTimeout(() => {
        buscarPacienteAutocompletado(query);
      }, 300);
    } else {
      document.getElementById('resultados-busqueda').style.display = 'none';
    }
  });
  
  // Formulario nueva entrada
  document.getElementById('formNuevaEntrada').addEventListener('submit', function(e) {
    e.preventDefault();
    crearEntradaHistorial();
  });
  
  // Cargar cuando se cambia a pestaña de historial completo
  document.getElementById('tab-historial-completo').addEventListener('click', function() {
    if (pacienteSeleccionado) {
      cargarHistorialCompleto();
    }
  });
});

// Buscar paciente con autocompletado
async function buscarPacienteAutocompletado(query) {
  try {
    const response = await fetch(`/medico/buscar-paciente/api/busqueda-rapida?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    const resultadosDiv = document.getElementById('resultados-busqueda');
    
    if (data.success && data.data.length > 0) {
      resultadosDiv.innerHTML = data.data.map(paciente => `
        <button class="list-group-item list-group-item-action" 
                onclick='seleccionarPaciente(${JSON.stringify(paciente).replace(/'/g, "&#39;")})'>
          <strong>${paciente.usuario.nombre} ${paciente.usuario.apellido}</strong>
          <br>
          <small class="text-muted">DNI: ${paciente.usuario.dni}</small>
        </button>
      `).join('');
      resultadosDiv.style.display = 'block';
    } else {
      resultadosDiv.innerHTML = '<div class="list-group-item text-muted">No se encontraron pacientes</div>';
      resultadosDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
}

// Seleccionar paciente
async function seleccionarPaciente(paciente) {
  pacienteSeleccionado = paciente;
  
  // Ocultar resultados
  document.getElementById('resultados-busqueda').style.display = 'none';
  document.getElementById('buscarPaciente').value = 
    `${paciente.usuario.nombre} ${paciente.usuario.apellido} (${paciente.usuario.dni})`;
  
  // Mostrar información del paciente
  await mostrarInfoPaciente(paciente.id);
  
  // Cargar historial
  await cargarResumenHistorial(paciente.id);
  await cargarLineaTiempo(paciente.id);
  
  // Preparar formulario nueva entrada
  document.getElementById('nuevaEntradaPacienteId').value = paciente.id;
  
  // Mostrar contenido
  document.getElementById('mensaje-inicial').classList.add('d-none');
  document.getElementById('contenido-historial').classList.remove('d-none');
}

// Mostrar información del paciente
async function mostrarInfoPaciente(pacienteId) {
  try {
    const response = await fetch(`/medico/historial-clinico/api/paciente/${pacienteId}/info`);
    const data = await response.json();
    
    if (data.success) {
      const paciente = data.data;
      const fechaNac = new Date(paciente.usuario.fecha_nacimiento);
      const edad = Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));
      
      document.getElementById('info-paciente-seleccionado').innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h5><i class="fas fa-user-circle me-2"></i>${paciente.usuario.nombre} ${paciente.usuario.apellido}</h5>
                <p class="mb-0">
                  <strong>DNI:</strong> ${paciente.usuario.dni} |
                  <strong>Edad:</strong> ${edad} años |
                  <strong>Sexo:</strong> ${paciente.usuario.sexo}
                </p>
              </div>
              <div class="col-md-6 text-md-end">
                <p class="mb-0">
                  <strong>Obra Social:</strong> ${paciente.obraSocial?.nombre || 'Sin obra social'}<br>
                  <strong>Estado:</strong> <span class="badge bg-${paciente.estado === 'Activo' ? 'success' : 'warning'}">${paciente.estado}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('info-paciente-seleccionado').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Cargar resumen del historial
async function cargarResumenHistorial(pacienteId) {
  try {
    const response = await fetch(`/medico/historial-clinico/api/paciente/${pacienteId}/resumen`);
    const data = await response.json();
    
    if (data.success) {
      const resumen = data.data;
      
      document.getElementById('estadisticas-historial').innerHTML = `
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-clipboard-list fa-2x text-primary mb-2"></i>
              <h3>${resumen.total}</h3>
              <p class="mb-0">Total Registros</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-notes-medical fa-2x text-success mb-2"></i>
              <h3>${resumen.porTipo?.Consulta || 0}</h3>
              <p class="mb-0">Consultas</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-bed fa-2x text-warning mb-2"></i>
              <h3>${resumen.porTipo?.Internacion || 0}</h3>
              <p class="mb-0">Internaciones</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-procedures fa-2x text-danger mb-2"></i>
              <h3>${resumen.porTipo?.Cirugia || 0}</h3>
              <p class="mb-0">Cirugías</p>
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Cargar línea de tiempo
async function cargarLineaTiempo(pacienteId) {
  try {
    document.getElementById('loading-linea-tiempo').classList.remove('d-none');
    document.getElementById('contenido-linea-tiempo').classList.add('d-none');
    
    const response = await fetch(`/medico/historial-clinico/api/paciente/${pacienteId}/linea-tiempo`);
    const data = await response.json();
    
    document.getElementById('loading-linea-tiempo').classList.add('d-none');
    
    if (data.success && data.data.length > 0) {
      document.getElementById('contenido-linea-tiempo').innerHTML = `
        <div class="timeline">
          ${data.data.map(evento => {
            const fecha = new Date(evento.fecha);
            return `
              <div class="timeline-item">
                <div class="timeline-marker bg-${evento.color}">
                  <i class="fas fa-${evento.icono} text-white"></i>
                </div>
                <div class="timeline-content">
                  <div class="d-flex justify-content-between">
                    <h6 class="mb-1">${evento.tipo}</h6>
                    <small class="text-muted">${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <p class="mb-0">${evento.descripcion}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      document.getElementById('contenido-linea-tiempo').classList.remove('d-none');
    } else {
      document.getElementById('contenido-linea-tiempo').innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-inbox fa-3x mb-3"></i>
          <p>No hay eventos registrados en la línea de tiempo</p>
        </div>
      `;
      document.getElementById('contenido-linea-tiempo').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loading-linea-tiempo').classList.add('d-none');
    mostrarAlerta('error', 'Error al cargar línea de tiempo');
  }
}

// Cargar historial completo
async function cargarHistorialCompleto(pagina = 1) {
  try {
    if (!pacienteSeleccionado) return;
    
    document.getElementById('loading-historial-completo').classList.remove('d-none');
    document.getElementById('contenido-historial-completo').classList.add('d-none');
    
    const params = new URLSearchParams({
      page: pagina,
      limit: registrosPorPagina,
      tipoEvento: document.getElementById('filtroTipoEvento').value || 'TODOS',
      fechaDesde: document.getElementById('filtroFechaDesde').value || '',
      fechaHasta: document.getElementById('filtroFechaHasta').value || ''
    });
    
    const response = await fetch(
      `/medico/historial-clinico/api/paciente/${pacienteSeleccionado.id}/historial?${params.toString()}`
    );
    const data = await response.json();
    
    document.getElementById('loading-historial-completo').classList.add('d-none');
    
    if (data.success && data.data.length > 0) {
      const tbody = document.getElementById('tbody-historial');
      tbody.innerHTML = data.data.map(registro => {
        const fecha = new Date(registro.fecha);
        return `
          <tr>
            <td>
              ${fecha.toLocaleDateString('es-AR')}
              <br>
              <small class="text-muted">${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
            </td>
            <td>
              <span class="badge bg-primary">${registro.tipo_evento}</span>
              ${registro.motivo_consulta ? `<br><small>${registro.motivo_consulta.nombre}</small>` : ''}
            </td>
            <td>${registro.descripcion}</td>
          </tr>
        `;
      }).join('');
      
      mostrarPaginacionHistorial(data.pagination);
      document.getElementById('contenido-historial-completo').classList.remove('d-none');
    } else {
      document.getElementById('contenido-historial-completo').innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-inbox fa-3x mb-3"></i>
          <p>No hay registros en el historial</p>
        </div>
      `;
      document.getElementById('contenido-historial-completo').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loading-historial-completo').classList.add('d-none');
    mostrarAlerta('error', 'Error al cargar historial');
  }
}

// Mostrar paginación del historial
function mostrarPaginacionHistorial(pagination) {
  const paginacionDiv = document.getElementById('paginacion-historial');
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cargarHistorialCompleto(${pagination.page - 1}); return false;">
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
          <a class="page-link" href="#" onclick="cargarHistorialCompleto(${i}); return false;">
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
      <a class="page-link" href="#" onclick="cargarHistorialCompleto(${pagination.page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginacionDiv.innerHTML = html;
}

// Crear entrada en historial
async function crearEntradaHistorial() {
  try {
    const formData = new FormData(document.getElementById('formNuevaEntrada'));
    const data = Object.fromEntries(formData.entries());
    data.paciente_id = parseInt(document.getElementById('nuevaEntradaPacienteId').value);
    
    const response = await fetch('/medico/historial-clinico/api/historial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      document.getElementById('formNuevaEntrada').reset();
      
      // Recargar datos
      await cargarResumenHistorial(pacienteSeleccionado.id);
      await cargarLineaTiempo(pacienteSeleccionado.id);
      
      // Volver a la pestaña de línea de tiempo
      document.getElementById('tab-linea-tiempo').click();
    } else {
      mostrarAlerta('error', result.message || 'Error al crear entrada');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear entrada en historial');
  }
}

// Limpiar selección
function limpiarSeleccion() {
  pacienteSeleccionado = null;
  document.getElementById('buscarPaciente').value = '';
  document.getElementById('resultados-busqueda').style.display = 'none';
  document.getElementById('info-paciente-seleccionado').classList.add('d-none');
  document.getElementById('contenido-historial').classList.add('d-none');
  document.getElementById('mensaje-inicial').classList.remove('d-none');
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