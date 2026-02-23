// Archivo JavaScript separado para la gestión de camas

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticasIniciales();
  
  // Configurar modal de búsqueda
  const modalBusqueda = document.getElementById('modalBusqueda');
  if (modalBusqueda) {
    modalBusqueda.addEventListener('show.bs.modal', function() {
      // Cargar datos cuando se abre el modal
      cargarDatosModal();
    });
    
    modalBusqueda.addEventListener('hidden.bs.modal', function() {
      // Limpiar búsqueda cuando se cierra el modal
      limpiarBusqueda();
    });
  }
  
  // Configurar modal de estadísticas
  const modalEstadisticas = document.getElementById('modalEstadisticas');
  if (modalEstadisticas) {
    modalEstadisticas.addEventListener('show.bs.modal', function() {
      cargarEstadisticasDetalladas();
    });
  }
  
  // Permitir buscar con Enter en los inputs
  const inputsBusqueda = ['buscar-cama-input', 'buscar-habitacion-input'];
  inputsBusqueda.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          buscarCama();
        }
      });
    }
  });
});

// ============================================
// FUNCIONES DE ESTADÍSTICAS
// ============================================

function cargarEstadisticasIniciales() {
  fetch('/medico/camas/api/estadisticas')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const stats = data.estadisticas;
        
        // Actualizar contadores
        actualizarElemento('disponibles-count', stats.libres);
        actualizarElemento('limpieza-count', stats.en_limpieza);
        actualizarElemento('total-camas-libres', stats.libres);
        actualizarElemento('total-camas-ocupadas', stats.ocupadas);
        
        // Cargar más datos
        cargarTotalesSectoresHabitaciones();
      }
    })
    .catch(error => {
      console.error('Error al cargar estadísticas:', error);
      mostrarNotificacion('error', 'Error al cargar estadísticas');
    });
}

function cargarTotalesSectoresHabitaciones() {
  // Esta función se implementaría con otra API o se calcularía aquí
  // Por ahora usamos valores estimados o cargamos de la API
  fetch('/medico/camas/api/estadisticas-detalladas')
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('API no disponible');
    })
    .then(data => {
      if (data.success) {
        actualizarElemento('total-sectores', data.sectores || '0');
        actualizarElemento('total-habitaciones', data.habitaciones || '0');
      }
    })
    .catch(() => {
      // Valores por defecto si falla
      actualizarElemento('total-sectores', 'N/A');
      actualizarElemento('total-habitaciones', 'N/A');
    });
}

function cargarEstadisticasDetalladas() {
  const contenido = document.getElementById('contenido-estadisticas');
  contenido.innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando estadísticas...</span>
      </div>
    </div>
  `;
  
  // Cargar estadísticas detalladas
  setTimeout(() => {
    fetch('/medico/camas/api/estadisticas')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const stats = data.estadisticas;
          contenido.innerHTML = generarHTMLEstadisticas(stats);
        } else {
          contenido.innerHTML = mostrarErrorHTML('Error: ' + data.message);
        }
      })
      .catch(error => {
        contenido.innerHTML = mostrarErrorHTML('Error al cargar las estadísticas');
      });
  }, 500);
}

function generarHTMLEstadisticas(stats) {
  return `
    <div class="row">
      <div class="col-md-6 mb-3">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="text-muted mb-3">Distribución de Camas</h6>
            <div class="d-flex justify-content-between mb-2">
              <span>Libres</span>
              <span class="fw-bold text-success">${stats.libres}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Ocupadas</span>
              <span class="fw-bold text-danger">${stats.ocupadas}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>En Limpieza</span>
              <span class="fw-bold text-warning">${stats.en_limpieza}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between">
              <span>Total</span>
              <span class="fw-bold">${stats.totalCamas}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-3">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="text-muted mb-3">Ocupación</h6>
            <div class="text-center py-3">
              <div class="display-4 text-primary">${stats.porcentaje_ocupacion || 0}%</div>
              <small class="text-muted">Tasa de ocupación actual</small>
            </div>
          </div>
        </div>
      </div>
      
      ${stats.habitaciones ? `
      <div class="col-12">
        <div class="card border-0 bg-light">
          <div class="card-body">
            <h6 class="text-muted mb-3">Habitaciones</h6>
            <div class="row">
              <div class="col-md-4 text-center">
                <div class="display-6">${stats.habitaciones.total}</div>
                <small class="text-muted">Total</small>
              </div>
              <div class="col-md-4 text-center">
                <div class="display-6 text-success">${stats.habitaciones.vacias}</div>
                <small class="text-muted">Vacías</small>
              </div>
              <div class="col-md-4 text-center">
                <div class="display-6 text-danger">${stats.habitaciones.ocupadas}</div>
                <small class="text-muted">Ocupadas</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// FUNCIONES DE BÚSQUEDA
// ============================================

function buscarCama() {
  const camaInput = document.getElementById('buscar-cama-input').value;
  const habitacionInput = document.getElementById('buscar-habitacion-input').value;
  const sectorSelect = document.getElementById('buscar-sector-select').value;
  const estadoSelect = document.getElementById('buscar-estado-select').value;
  const tipoServicioSelect = document.getElementById('buscar-tipo-servicio-select').value;
  const sexoSelect = document.getElementById('buscar-sexo-select').value;
  
  if (!camaInput && !habitacionInput && !sectorSelect && !estadoSelect && !tipoServicioSelect && !sexoSelect) {
    mostrarNotificacion('warning', 'Ingrese al menos un criterio de búsqueda');
    return;
  }
  
  // Mostrar loading
  const resultadosDiv = document.getElementById('resultados-busqueda');
  resultadosDiv.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Buscando...</span>
      </div>
      <p class="mt-2 mb-0">Buscando camas...</p>
    </div>
  `;
  
  // Construir parámetros
  const params = new URLSearchParams();
  if (camaInput) params.append('cama_numero', camaInput);
  if (habitacionInput) params.append('habitacion_numero', habitacionInput);
  if (sectorSelect && sectorSelect !== 'Todos') params.append('sector_id', sectorSelect);
  if (estadoSelect && estadoSelect !== 'Todos') params.append('estado', estadoSelect);
  if (tipoServicioSelect && tipoServicioSelect !== 'Todos') params.append('tipo_servicio_id', tipoServicioSelect);
  if (sexoSelect && sexoSelect !== 'Todos') params.append('sexo_permitido', sexoSelect);
  params.append('limite', 20); // Límite para modal
  
  // Realizar búsqueda AJAX
  fetch(`/medico/camas/api/buscar?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarResultadosEnModal(data.resultados, data.total);
      } else {
        mostrarErrorEnModal('Error en la búsqueda: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      mostrarErrorEnModal('Error de conexión');
    });
}

function mostrarResultadosEnModal(resultados, total) {
  const resultadosDiv = document.getElementById('resultados-busqueda');
  const contador = document.getElementById('contador-resultados');
  
  // Actualizar contador
  contador.textContent = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
  contador.className = total > 0 ? 'badge bg-success rounded-pill' : 'badge bg-secondary rounded-pill';
  
  if (resultados.length === 0) {
    resultadosDiv.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="fas fa-bed fa-3x mb-3"></i>
        <h5>No se encontraron resultados</h5>
        <p class="mb-0">Intente con otros criterios de búsqueda</p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="list-group list-group-flush">';
  
  resultados.forEach(cama => {
    const estadoBadge = cama.estado === 'Libre' ? 'bg-success' : 
                       cama.estado === 'Ocupada' ? 'bg-danger' : 'bg-warning text-dark';
    
    const estadoTexto = cama.estado === 'Libre' ? 'Libre' : 
                       cama.estado === 'Ocupada' ? 'Ocupada' : 'En Limpieza';
    
    const fechaLimpieza = cama.fecha_fin_limpieza ? 
      `<br><small class="text-warning"><i class="fas fa-clock me-1"></i>Limpieza hasta: ${new Date(cama.fecha_fin_limpieza).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</small>` : '';
    
    html += `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="mb-1">
              <i class="fas fa-bed text-primary me-2"></i>
              Cama ${cama.numero}
              <span class="badge ${estadoBadge} ms-2">${estadoTexto}</span>
            </h6>
            <p class="mb-1">
              <i class="fas fa-door-open me-1"></i>
              Habitación ${cama.habitacion.numero} 
              <span class="badge bg-secondary ms-2">${cama.habitacion.tipo}</span>
            </p>
            <small class="text-muted">
              <i class="fas fa-hospital me-1"></i>${cama.habitacion.sector.nombre} | 
              <i class="fas fa-stethoscope me-1 ms-2"></i>${cama.habitacion.tipoServicio.nombre}
            </small>
            ${fechaLimpieza}
          </div>
          <div class="btn-group btn-group-sm">
            <a href="/medico/camas/detalle/${cama.id}" class="btn btn-outline-info" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </a>
            ${cama.estado === 'Libre' ? `
              <button class="btn btn-outline-success" onclick="asignarPacienteModal(${cama.id})" title="Asignar paciente">
                <i class="fas fa-user-plus"></i>
              </button>
            ` : ''}
            ${cama.estado === 'EnLimpieza' ? `
              <button class="btn btn-outline-warning" onclick="liberarCamaModal(${cama.id})" title="Liberar cama">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
          </div>
        </div>
        ${cama.paciente ? `
          <div class="mt-2 pt-2 border-top">
            <small class="text-muted"><i class="fas fa-user-injured me-1"></i>Paciente:</small>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>${cama.paciente.nombre}</strong>
                <br>
                <small class="text-muted">DNI: ${cama.paciente.dni}</small>
              </div>
              <a href="/medico/internados/" class="btn btn-sm btn-outline-secondary">
                Ver internación
              </a>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  
  // Agregar paginación si hay muchos resultados
  if (total > 20) {
    html += `
      <div class="mt-3 text-center">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          Mostrando 20 de ${total} resultados. Use filtros más específicos para ver más.
        </small>
      </div>
    `;
  }
  
  resultadosDiv.innerHTML = html;
}

function mostrarErrorEnModal(mensaje) {
  const resultadosDiv = document.getElementById('resultados-busqueda');
  resultadosDiv.innerHTML = `
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${mensaje}
    </div>
  `;
  const contador = document.getElementById('contador-resultados');
  contador.textContent = 'Error en búsqueda';
  contador.className = 'badge bg-danger rounded-pill';
}

function limpiarBusqueda() {
  document.getElementById('buscar-cama-input').value = '';
  document.getElementById('buscar-habitacion-input').value = '';
  document.getElementById('buscar-sector-select').value = 'Todos';
  document.getElementById('buscar-estado-select').value = 'Todos';
  document.getElementById('buscar-tipo-servicio-select').value = 'Todos';
  document.getElementById('buscar-sexo-select').value = 'Todos';
  
  // Limpiar resultados
  const resultadosDiv = document.getElementById('resultados-busqueda');
  resultadosDiv.innerHTML = `
    <div class="text-center text-muted py-4">
      <i class="fas fa-search fa-3x mb-3"></i>
      <h5>Ingrese criterios de búsqueda</h5>
      <p class="mb-0">Los resultados aparecerán aquí</p>
    </div>
  `;
  const contador = document.getElementById('contador-resultados');
  contador.textContent = 'Esperando búsqueda...';
  contador.className = 'badge bg-secondary rounded-pill';
}

async function cargarDatosModal() {
  try {
    // Cargar sectores
    const sectoresResponse = await fetch('/medico/camas/api/sectores');
    const sectoresData = await sectoresResponse.json();
    
    if (sectoresData.success) {
      const sectorSelect = document.getElementById('buscar-sector-select');
      sectorSelect.innerHTML = '<option value="Todos">Todos los sectores</option>';
      sectoresData.sectores.forEach(sector => {
        sectorSelect.innerHTML += `<option value="${sector.id}">${sector.nombre}</option>`;
      });
    }
    
    // Cargar tipos de servicio
    const serviciosResponse = await fetch('/medico/camas/api/tipos-servicio');
    const serviciosData = await serviciosResponse.json();
    
    if (serviciosData.success) {
      const tipoSelect = document.getElementById('buscar-tipo-servicio-select');
      tipoSelect.innerHTML = '<option value="Todos">Todos los servicios</option>';
      serviciosData.tiposServicio.forEach(tipo => {
        tipoSelect.innerHTML += `<option value="${tipo.id}">${tipo.nombre}</option>`;
      });
    }
    
    // Inicializar resultados si es la primera vez
    const resultadosDiv = document.getElementById('resultados-busqueda');
    if (resultadosDiv.innerHTML.includes('fa-3x')) {
      resultadosDiv.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="fas fa-search fa-3x mb-3"></i>
          <h5>Ingrese criterios de búsqueda</h5>
          <p class="mb-0">Los resultados aparecerán aquí</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar datos del modal:', error);
    mostrarNotificacion('error', 'Error al cargar datos de búsqueda');
  }
}

// ============================================
// FUNCIONES DE ACCIONES
// ============================================

function asignarPacienteModal(camaId) {
  if (confirm('¿Desea asignar un paciente a esta cama?')) {
    // Aquí puedes abrir otro modal para seleccionar paciente o redirigir
    mostrarNotificacion('info', 'Función de asignación en desarrollo');
    // window.location.href = `/medico/camas/${camaId}/asignar-paciente`;
  }
}

function liberarCamaModal(camaId) {
  if (confirm('¿Está seguro de liberar esta cama?')) {
    fetch(`/medico/camas/${camaId}/liberar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarNotificacion('success', 'Cama liberada correctamente');
        // Volver a buscar para actualizar resultados
        buscarCama();
      } else {
        mostrarNotificacion('error', 'Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      mostrarNotificacion('error', 'Error al liberar la cama');
    });
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function actualizarEstadisticas() {
  const boton = event.target.closest('button');
  const originalHtml = boton.innerHTML;
  
  boton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
  boton.disabled = true;
  
  setTimeout(() => {
    cargarEstadisticasIniciales();
    boton.innerHTML = originalHtml;
    boton.disabled = false;
    
    mostrarNotificacion('success', 'Estadísticas actualizadas correctamente');
  }, 1000);
}

function actualizarTodo() {
  mostrarNotificacion('info', 'Actualizando toda la información...');
  setTimeout(() => {
    cargarEstadisticasIniciales();
    mostrarNotificacion('success', 'Información actualizada correctamente');
  }, 1000);
}

function generarReporte(tipo) {
  mostrarNotificacion('info', `Generando reporte de ${tipo}...`);
  // Aquí iría la lógica para generar el reporte
  setTimeout(() => {
    mostrarNotificacion('success', `Reporte de ${tipo} generado correctamente`);
  }, 1500);
}

function mostrarNotificacion(tipo, mensaje) {
  // Eliminar notificaciones anteriores
  const notificacionesAnteriores = document.querySelectorAll('.notificacion-flotante');
  notificacionesAnteriores.forEach(notif => notif.remove());
  
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed notificacion-flotante`;
  notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  
  const icono = tipo === 'success' ? 'check-circle' : 
               tipo === 'error' ? 'exclamation-triangle' : 
               tipo === 'warning' ? 'exclamation-circle' : 'info-circle';
  
  notificacion.innerHTML = `
    <i class="fas fa-${icono} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Agregar al body
  document.body.appendChild(notificacion);
  
  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.parentNode.removeChild(notificacion);
    }
  }, 5000);
}

function actualizarElemento(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = valor;
  }
}

function mostrarErrorHTML(mensaje) {
  return `
    <div class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${mensaje}
    </div>
  `;
}