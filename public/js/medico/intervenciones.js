// ========================================
// MÓDULO DE CIRUGÍAS - MÉDICO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔪 Inicializando módulo de cirugías...');
  
  // Cargar datos iniciales
  cargarEstadisticas();
  cargarPacientes();
  
  // Event listeners
  const formFiltros = document.getElementById('formFiltros');
  if (formFiltros) {
    formFiltros.addEventListener('submit', function(e) {
      e.preventDefault();
      cargarPacientes();
    });
  }
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    console.log(' Cargando estadísticas...');
    const response = await fetch('/medico/intervenciones/api/estadisticas');
    const data = await response.json();
    
    console.log(' Respuesta estadísticas:', data);
    
    if (data.success) {
      const setTexto = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor || 0;
      };
      
      setTexto('stat-urgencias', data.data.pendientes_urgencia);
      setTexto('stat-en-curso', data.data.en_curso);
      setTexto('stat-programadas', data.data.programadas);
      setTexto('stat-hoy', data.data.finalizadas_hoy);
      setTexto('stat-mes', data.data.finalizadas_mes);
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
  }
}

// ========================================
// CARGAR PACIENTES PARA CIRUGÍA
// ========================================
async function cargarPacientes() {
  const loadingDiv = document.getElementById('loading-pacientes');
  const listaDiv = document.getElementById('lista-pacientes');
  const tbody = document.getElementById('tbody-pacientes');
  const sinPacientes = document.getElementById('sin-pacientes');
  const totalBadge = document.getElementById('total-pacientes');
  
  try {
    // Mostrar loading
    if (loadingDiv) loadingDiv.classList.remove('d-none');
    if (listaDiv) listaDiv.classList.add('d-none');
    if (sinPacientes) sinPacientes.classList.add('d-none');
    
    // Construir parámetros de filtro
    const params = new URLSearchParams();
    
    const origen = document.getElementById('filtroOrigen')?.value;
    const estado = document.getElementById('filtroEstado')?.value;
    const prioridad = document.getElementById('filtroPrioridad')?.value;
    
    if (origen && origen !== 'TODOS') params.append('origen', origen);
    if (estado && estado !== 'TODOS') params.append('estado', estado);
    if (prioridad && prioridad !== 'TODOS') params.append('prioridad', prioridad);
    
    console.log(' Buscando pacientes con filtros:', params.toString());
    
    const response = await fetch(`/medico/intervenciones/api/pacientes?${params.toString()}`);
    const data = await response.json();
    
    console.log(' Respuesta pacientes:', data);
    
    // Ocultar loading
    if (loadingDiv) loadingDiv.classList.add('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      if (listaDiv) listaDiv.classList.remove('d-none');
      if (totalBadge) totalBadge.textContent = data.data.length;
      mostrarPacientes(data.data);
    } else {
      if (sinPacientes) sinPacientes.classList.remove('d-none');
      if (totalBadge) totalBadge.textContent = '0';
      if (tbody) tbody.innerHTML = '';
    }
    
  } catch (error) {
    console.error('❌ Error al cargar pacientes:', error);
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (sinPacientes) sinPacientes.classList.remove('d-none');
    mostrarAlerta('error', 'Error al cargar pacientes: ' + error.message);
  }
}

// ========================================
// MOSTRAR PACIENTES EN TABLA
// ========================================
function mostrarPacientes(pacientes) {
  const tbody = document.getElementById('tbody-pacientes');
  if (!tbody) return;
  
  tbody.innerHTML = pacientes.map((p, index) => {
    // Badge de origen
    const origenBadge = p.origen === 'URGENCIA' 
      ? '<span class="badge bg-danger"><i class="fas fa-ambulance me-1"></i>Urgencia</span>'
      : '<span class="badge bg-info"><i class="fas fa-calendar me-1"></i>Programada</span>';
    
    // Badge de triage
    let triageBadge = '<span class="text-muted">-</span>';
    if (p.triage) {
      const coloresTriage = {
        'ROJO': 'danger',
        'NARANJA': 'warning',
        'AMARILLO': 'warning',
        'VERDE': 'success',
        'AZUL': 'info'
      };
      triageBadge = `<span class="badge bg-${coloresTriage[p.triage] || 'secondary'}">${p.triage}</span>`;
    }
    
    // Badge de estado
    const estadoColores = {
      'PENDIENTE': 'secondary',
      'ASIGNADO': 'info',
      'PROGRAMADA': 'info',
      'PRE_OPERATORIO': 'warning',
      'EN_CIRUGIA': 'danger',
      'POST_OPERATORIO': 'primary'
    };
    const estadoTexto = (p.estado || 'PENDIENTE').replace(/_/g, ' ');
    const estadoBadge = `<span class="badge bg-${estadoColores[p.estado] || 'secondary'}">${estadoTexto}</span>`;
    
    // Badge de prioridad
    const prioridadColores = {
      'ALTA': 'danger',
      'MEDIA': 'warning',
      'BAJA': 'success'
    };
    const prioridadBadge = `<span class="badge bg-${prioridadColores[p.prioridad] || 'secondary'}">${p.prioridad || 'N/A'}</span>`;
    
    // Evaluación médica
    const evaluacionIcon = p.tiene_evaluacion_medica 
      ? '<i class="fas fa-check-circle text-success" title="Tiene evaluación médica"></i>'
      : '<i class="fas fa-times-circle text-danger" title="Sin evaluación médica"></i>';
    
    // Datos del paciente con valores por defecto
    const pacienteNombre = p.paciente?.nombre || 'Sin nombre';
    const pacienteDni = p.paciente?.dni || 'N/A';
    const pacienteEdad = p.paciente?.edad;
    const pacienteId = p.paciente?.id || 0;
    
    // Botones de acción - usando data attributes en lugar de onclick con strings
    let acciones = `
      <button class="btn btn-sm btn-outline-info btn-ver-detalle" 
              data-paciente-id="${pacienteId}" 
              title="Ver detalle">
        <i class="fas fa-eye"></i>
      </button>
    `;
    
    if (p.tipo === 'LISTA_ESPERA') {
      if (!p.asignado_a_mi) {
        acciones += `
          <button class="btn btn-sm btn-outline-primary btn-aceptar" 
                  data-lista-id="${p.id}" 
                  title="Aceptar paciente">
            <i class="fas fa-user-plus"></i>
          </button>
        `;
      } else {
        acciones += `
          <button class="btn btn-sm btn-outline-success btn-crear-intervencion" 
                  data-lista-id="${p.id}"
                  data-paciente-id="${pacienteId}"
                  data-paciente-nombre="${pacienteNombre.replace(/"/g, '&quot;')}"
                  data-evaluacion-id="${p.evaluacion_medica_id || ''}"
                  title="Iniciar cirugía">
            <i class="fas fa-cut"></i>
          </button>
        `;
      }
    } else if (p.tipo === 'INTERVENCION') {
      if (p.estado !== 'FINALIZADA') {
        acciones += `
          <button class="btn btn-sm btn-outline-warning btn-actualizar-estado" 
                  data-intervencion-id="${p.id}"
                  data-estado-actual="${p.estado}"
                  title="Actualizar estado">
            <i class="fas fa-edit"></i>
          </button>
        `;
        
        if (p.estado === 'POST_OPERATORIO' || p.estado === 'EN_CIRUGIA') {
          acciones += `
            <button class="btn btn-sm btn-outline-success btn-finalizar" 
                    data-intervencion-id="${p.id}"
                    title="Finalizar">
              <i class="fas fa-check"></i>
            </button>
          `;
        }
      }
    }
    
    return `
      <tr data-index="${index}">
        <td>${origenBadge}</td>
        <td>
          <strong>${pacienteNombre}</strong><br>
          <small class="text-muted">DNI: ${pacienteDni}</small>
          ${pacienteEdad ? `<br><small class="text-muted">${pacienteEdad} años</small>` : ''}
        </td>
        <td>${triageBadge}</td>
        <td>${estadoBadge}</td>
        <td>${prioridadBadge}</td>
        <td>${p.tipo_procedimiento || '<span class="text-muted">Por definir</span>'}</td>
        <td class="text-center">${evaluacionIcon}</td>
        <td class="text-center">
          ${p.observaciones ? `
            <button class="btn btn-sm btn-outline-secondary btn-ver-observaciones" 
                    data-observaciones="${p.observaciones.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}"
                    title="Ver motivo de derivación">
              <i class="fas fa-comment-medical"></i>
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            ${acciones}
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Agregar event listeners a los botones
  agregarEventListenersBotones();
}

// ========================================
// EVENT LISTENERS PARA BOTONES
// ========================================
function agregarEventListenersBotones() {
  // Ver detalle
  document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
    btn.addEventListener('click', function() {
      const pacienteId = this.dataset.pacienteId;
      verDetallePaciente(pacienteId);
    });
  });
  
  // Aceptar paciente
  document.querySelectorAll('.btn-aceptar').forEach(btn => {
    btn.addEventListener('click', function() {
      const listaId = this.dataset.listaId;
      aceptarPaciente(listaId);
    });
  });
  
  // Crear intervención
  document.querySelectorAll('.btn-crear-intervencion').forEach(btn => {
    btn.addEventListener('click', function() {
      const listaId = this.dataset.listaId;
      const pacienteId = this.dataset.pacienteId;
      const pacienteNombre = this.dataset.pacienteNombre;
      const evaluacionId = this.dataset.evaluacionId || null;
      mostrarModalCrearIntervencion(listaId, pacienteId, pacienteNombre, evaluacionId);
    });
  });
  
  // Actualizar estado
  document.querySelectorAll('.btn-actualizar-estado').forEach(btn => {
    btn.addEventListener('click', function() {
      const intervencionId = this.dataset.intervencionId;
      const estadoActual = this.dataset.estadoActual;
      mostrarModalActualizarEstado(intervencionId, estadoActual);
    });
  });
  
  // Finalizar
  document.querySelectorAll('.btn-finalizar').forEach(btn => {
    btn.addEventListener('click', function() {
      const intervencionId = this.dataset.intervencionId;
      mostrarModalFinalizar(intervencionId);
    });
  });
  // Ver observaciones
  document.querySelectorAll('.btn-ver-observaciones').forEach(btn => {
    btn.addEventListener('click', function() {
      const observaciones = this.dataset.observaciones.replace(/&#10;/g, '\n');
      verObservaciones(observaciones);
    });
  });

}

// ========================================
// ACEPTAR PACIENTE
// ========================================
async function aceptarPaciente(listaEsperaId) {
  if (!confirm('¿Desea aceptar este paciente para cirugía?')) return;
  
  try {
    const response = await fetch(`/medico/intervenciones/api/aceptar/${listaEsperaId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
      actualizarTodo();
    } else {
      mostrarAlerta('error', data.message || 'Error al aceptar paciente');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al aceptar paciente');
  }
}

// ========================================
// VER DETALLE PACIENTE
// ========================================
async function verDetallePaciente(pacienteId) {
  try {
    const modalBody = document.getElementById('modalDetallePacienteBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetallePaciente'));
    modal.show();
    
    const response = await fetch(`/medico/intervenciones/api/paciente/${pacienteId}`);
    const data = await response.json();
    
    console.log('👤 Detalle paciente:', data);
    
    if (data.success) {
      const p = data.data;
      
      modalBody.innerHTML = `
        <div class="row g-4">
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-user me-2"></i>Datos del Paciente</h6>
            <table class="table table-sm">
              <tr><th>Nombre:</th><td>${p.paciente?.nombre || 'N/A'}</td></tr>
              <tr><th>DNI:</th><td>${p.paciente?.dni || 'N/A'}</td></tr>
              <tr><th>Edad:</th><td>${p.paciente?.edad || 'N/A'} años</td></tr>
              <tr><th>Sexo:</th><td>${p.paciente?.sexo || 'N/A'}</td></tr>
            </table>
          </div>
          
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-notes-medical me-2"></i>Estado Clínico</h6>
            <table class="table table-sm">
              <tr><th>Último Triage:</th><td>${p.ultimo_triage || 'Sin triage'}</td></tr>
              <tr><th>Evaluación Médica:</th><td>${p.tiene_evaluacion_medica ? '<span class="text-success">Sí</span>' : '<span class="text-danger">No</span>'}</td></tr>
              <tr><th>Internación:</th><td>${p.internacion ? 'Activa' : 'No'}</td></tr>
            </table>
          </div>
          
          ${p.evaluaciones_medicas?.length > 0 ? `
            <div class="col-12">
              <h6 class="text-primary"><i class="fas fa-stethoscope me-2"></i>Últimas Evaluaciones</h6>
              <div class="list-group">
                ${p.evaluaciones_medicas.slice(0, 3).map(e => `
                  <div class="list-group-item">
                    <div class="d-flex justify-content-between">
                      <strong>${e.diagnostico || 'Sin diagnóstico'}</strong>
                      <small>${new Date(e.fecha).toLocaleDateString('es-AR')}</small>
                    </div>
                    <small class="text-muted">${e.observaciones || ''}</small>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${p.intervenciones_anteriores?.length > 0 ? `
            <div class="col-12">
              <h6 class="text-primary"><i class="fas fa-history me-2"></i>Cirugías Anteriores</h6>
              <ul class="list-group">
                ${p.intervenciones_anteriores.map(i => `
                  <li class="list-group-item d-flex justify-content-between">
                    <span>${i.tipo_procedimiento}</span>
                    <small class="text-muted">${new Date(i.fecha_fin).toLocaleDateString('es-AR')}</small>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      modalBody.innerHTML = `<div class="alert alert-danger">Error al cargar datos: ${data.message || 'Error desconocido'}</div>`;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('modalDetallePacienteBody').innerHTML = 
      `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
}

// ========================================
// MODAL CREAR INTERVENCIÓN
// ========================================
async function mostrarModalCrearIntervencion(listaEsperaId, pacienteId, pacienteNombre, evaluacionId) {
  console.log(' Abriendo modal crear intervención:', { listaEsperaId, pacienteId, pacienteNombre });
  
  document.getElementById('crear-lista-espera-id').value = listaEsperaId;
  document.getElementById('crear-paciente-id').value = pacienteId;
  document.getElementById('crear-paciente-nombre').value = pacienteNombre;
  document.getElementById('crear-evaluacion-id').value = evaluacionId || '';
  
  // Limpiar campos
  document.getElementById('crear-tipo-procedimiento').value = '';
  document.getElementById('crear-observaciones').value = '';
  document.getElementById('crear-es-urgencia').checked = false;
  document.getElementById('crear-iniciar-inmediato').checked = false;
  
  // Cargar quirófanos
  await cargarQuirofanos();
  
  // Establecer fecha/hora actual
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('crear-fecha-inicio').value = now.toISOString().slice(0, 16);
  
  const modal = new bootstrap.Modal(document.getElementById('modalCrearIntervencion'));
  modal.show();
}

async function cargarQuirofanos() {
  try {
    console.log(' Cargando quirófanos...');
    const response = await fetch('/medico/intervenciones/api/quirofanos');
    const data = await response.json();
    
    console.log(' Respuesta quirófanos:', data);
    
    const select = document.getElementById('crear-quirofano');
    select.innerHTML = '<option value="">Seleccione quirófano...</option>';
    
    if (data.success && data.data && data.data.length > 0) {
      data.data.forEach(q => {
        const option = document.createElement('option');
        option.value = q.id;
        
        let texto = `Habitación ${q.numero}`;
        if (q.tipo_servicio) texto += ` - ${q.tipo_servicio}`;
        if (q.disponible) {
          texto += '  Disponible';
          if (q.camas_libres !== undefined) {
            texto += ` (${q.camas_libres}/${q.camas_total} camas)`;
          }
        } else {
          texto += ' ❌ En uso';
          if (q.en_uso_por) {
            texto += ` - ${q.en_uso_por.procedimiento || 'Cirugía en curso'}`;
          }
        }
        
        option.textContent = texto;
        option.disabled = !q.disponible;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = '<option value="">No hay quirófanos disponibles</option>';
      console.warn(' No se encontraron quirófanos');
    }
  } catch (error) {
    console.error('❌ Error al cargar quirófanos:', error);
    const select = document.getElementById('crear-quirofano');
    select.innerHTML = '<option value="">Error al cargar quirófanos</option>';
  }
}

async function confirmarCrearIntervencion() {
  try {
    const data = {
      paciente_id: document.getElementById('crear-paciente-id').value,
      lista_espera_id: document.getElementById('crear-lista-espera-id').value,
      evaluacion_medica_id: document.getElementById('crear-evaluacion-id').value || null,
      tipo_procedimiento: document.getElementById('crear-tipo-procedimiento').value,
      habitacion_id: document.getElementById('crear-quirofano').value,
      fecha_inicio: document.getElementById('crear-fecha-inicio').value,
      es_urgencia: document.getElementById('crear-es-urgencia').checked,
      iniciar_inmediatamente: document.getElementById('crear-iniciar-inmediato').checked,
      observaciones: document.getElementById('crear-observaciones').value
    };
    
    console.log(' Creando intervención:', data);
    
    if (!data.tipo_procedimiento) {
      mostrarAlerta('error', 'Ingrese el tipo de procedimiento');
      return;
    }
    
    if (!data.habitacion_id) {
      mostrarAlerta('error', 'Seleccione un quirófano');
      return;
    }
    
    const response = await fetch('/medico/intervenciones/api/intervenciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Intervención creada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalCrearIntervencion')).hide();
      actualizarTodo();
    } else {
      mostrarAlerta('error', result.message || 'Error al crear intervención');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear intervención: ' + error.message);
  }
}

// ========================================
// MODAL ACTUALIZAR ESTADO
// ========================================
function mostrarModalActualizarEstado(intervencionId, estadoActual) {
  document.getElementById('actualizar-intervencion-id').value = intervencionId;
  document.getElementById('actualizar-notas').value = '';
  
  const select = document.getElementById('actualizar-estado');
  
  // Habilitar solo transiciones válidas
  const transiciones = {
    'PROGRAMADA': ['PRE_OPERATORIO'],
    'PRE_OPERATORIO': ['EN_CIRUGIA'],
    'EN_CIRUGIA': ['POST_OPERATORIO'],
    'POST_OPERATORIO': []
  };
  
  Array.from(select.options).forEach(opt => {
    opt.disabled = !transiciones[estadoActual]?.includes(opt.value);
    opt.selected = false;
  });
  
  // Seleccionar el primer estado válido
  const estadosValidos = transiciones[estadoActual] || [];
  if (estadosValidos.length > 0) {
    select.value = estadosValidos[0];
  }
  
  const modal = new bootstrap.Modal(document.getElementById('modalActualizarEstado'));
  modal.show();
}

async function confirmarActualizarEstado() {
  try {
    const id = document.getElementById('actualizar-intervencion-id').value;
    const data = {
      estado_cirugia: document.getElementById('actualizar-estado').value,
      notas: document.getElementById('actualizar-notas').value
    };
    
    if (!data.estado_cirugia) {
      mostrarAlerta('error', 'Seleccione un estado');
      return;
    }
    
    const response = await fetch(`/medico/intervenciones/api/intervenciones/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Estado actualizado');
      bootstrap.Modal.getInstance(document.getElementById('modalActualizarEstado')).hide();
      actualizarTodo();
    } else {
      mostrarAlerta('error', result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al actualizar estado');
  }
}

// ========================================
// MODAL FINALIZAR CIRUGÍA
// ========================================
function mostrarModalFinalizar(intervencionId) {
  document.getElementById('finalizar-intervencion-id').value = intervencionId;
  document.getElementById('finalizar-resultado').value = '';
  document.getElementById('finalizar-notas').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalFinalizarCirugia'));
  modal.show();
}

async function confirmarFinalizarCirugia() {
  try {
    const id = document.getElementById('finalizar-intervencion-id').value;
    const data = {
      resultado_cirugia: document.getElementById('finalizar-resultado').value,
      notas_postoperatorio: document.getElementById('finalizar-notas').value
    };
    
    if (!data.resultado_cirugia) {
      mostrarAlerta('error', 'Seleccione el resultado de la cirugía');
      return;
    }
    
    const response = await fetch(`/medico/intervenciones/api/intervenciones/${id}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', 'Cirugía finalizada correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalFinalizarCirugia')).hide();
      actualizarTodo();
      
      if (result.data?.requiere_internacion) {
        setTimeout(() => {
          mostrarAlerta('info', 'El paciente requiere internación. Se notificará al área administrativa.');
        }, 1000);
      }
    } else {
      mostrarAlerta('error', result.message || 'Error al finalizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al finalizar cirugía');
  }
}

// ========================================
// FUNCIONES UTILITARIAS
// ========================================
function actualizarTodo() {
  cargarEstadisticas();
  cargarPacientes();
}

function mostrarAlerta(tipo, mensaje) {
  // Remover alertas anteriores del mismo tipo
  document.querySelectorAll('.alert-floating').forEach(el => el.remove());
  
  const alertClass = tipo === 'success' ? 'alert-success' : 
                     tipo === 'error' ? 'alert-danger' : 'alert-info';
  const iconClass = tipo === 'success' ? 'fa-check-circle' : 
                    tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  
  const alert = document.createElement('div');
  alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed alert-floating`;
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px;';
  alert.innerHTML = `
    <i class="fas ${iconClass} me-2"></i>${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 150);
    }
  }, 5000);
}
// ========================================
// VER OBSERVACIONES DE DERIVACIÓN
// ========================================
function verObservaciones(texto) {
  const modalBody = document.getElementById('modalDetallePacienteBody');
  if (!modalBody) return;
  
  // Cambiar título del modal temporalmente
  const modalTitle = document.querySelector('#modalDetallePaciente .modal-title');
  const tituloOriginal = modalTitle?.innerHTML;
  if (modalTitle) {
    modalTitle.innerHTML = '<i class="fas fa-comment-medical me-2"></i>Motivo de Derivación';
  }
  
  modalBody.innerHTML = `
    <div class="alert alert-info mb-0">
      <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${texto}</pre>
    </div>
  `;
  
  const modal = new bootstrap.Modal(document.getElementById('modalDetallePaciente'));
  modal.show();
  
  // Restaurar título cuando se cierre
  document.getElementById('modalDetallePaciente').addEventListener('hidden.bs.modal', function() {
    if (modalTitle && tituloOriginal) {
      modalTitle.innerHTML = tituloOriginal;
    }
  }, { once: true });
}