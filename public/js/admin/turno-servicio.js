// /public/js/admin/turnos-servicio.js - PARA VISTA DE SERVICIO (/turnos/servicio/:id)

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ turnos-servicio.js inicializado');

  // ============================================================================
  // VARIABLES GLOBALES
  // ============================================================================
  let datosServicio = { listaEspera: [], turnos: [], estadisticas: {} };
  let capacidadHoy = null;
  let servicioId = null;
  let medicosDisponibles = [];

  // ============================================================================
  // OBTENER ID DEL SERVICIO
  // ============================================================================
  function obtenerServicioId() {
  // Si ya lo tenemos, retornarlo
  if (window.servicioIdGlobal) {
    return window.servicioIdGlobal;
  }
  
  // Opción 1: Del atributo data en el HTML
  const dataElement = document.getElementById('page-data');
  if (dataElement && dataElement.dataset.servicioId) {
    window.servicioIdGlobal = dataElement.dataset.servicioId;
    console.log('✅ Servicio ID desde data:', window.servicioIdGlobal);
    return window.servicioIdGlobal;
  }
  
  // Opción 2: De la URL
  const pathParts = window.location.pathname.split('/');
  const servicioIndex = pathParts.indexOf('servicio');
  if (servicioIndex !== -1 && pathParts[servicioIndex + 1]) {
    window.servicioIdGlobal = pathParts[servicioIndex + 1];
    console.log('✅ Servicio ID desde URL:', window.servicioIdGlobal);
    return window.servicioIdGlobal;
  }
  
  // Opción 3: De un campo oculto
  const hiddenField = document.querySelector('input[type="hidden"][id*="servicio"], input[type="hidden"][name*="servicio"]');
  if (hiddenField && hiddenField.value) {
    window.servicioIdGlobal = hiddenField.value;
    console.log('✅ Servicio ID desde campo oculto:', window.servicioIdGlobal);
    return window.servicioIdGlobal;
  }
  
  console.error('❌ No se pudo obtener servicioId');
  return null;
}

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================
  function showLoading() {
    document.getElementById('loading')?.classList.remove('d-none');
  }

  function hideLoading() {
    document.getElementById('loading')?.classList.add('d-none');
  }

  function mostrarMensaje(mensaje, tipo = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  function formatearSexo(sexo) {
    if (!sexo) return 'No especificado';
    const sexoStr = String(sexo).toUpperCase();
    const map = {
      'M': '♂ Masculino',
      'F': '♀ Femenino',
      'MASCULINO': '♂ Masculino',
      'FEMENINO': '♀ Femenino'
    };
    return map[sexoStr] || sexo;
  }

  function getPrioridadColor(prioridad) {
    return {
      'ALTA': 'danger',
      'MEDIA': 'warning',
      'BAJA': 'success'
    }[prioridad] || 'secondary';
  }

  function getEstadoColor(estado) {
    return {
      'PENDIENTE': 'warning',
      'CONFIRMADO': 'info',
      'COMPLETADO': 'success',
      'CANCELADO': 'danger',
      'ASIGNADO': 'primary'
    }[estado] || 'secondary';
  }

  // ============================================================================
  // CARGAR DATOS DEL SERVICIO
  // ============================================================================
  async function cargarDatosServicio() {
    try {
      servicioId = obtenerServicioId();
      if (!servicioId) throw new Error('No se pudo identificar el servicio');

      showLoading();
      
      const fecha = document.getElementById('filtro-fecha')?.value || new Date().toISOString().split('T')[0];
      const url = `/turnos/api/servicio/${servicioId}/datos?fecha=${fecha}`;
      
      console.log('🔍 Cargando datos desde:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      datosServicio = data;
      renderizarDatos();
      hideLoading();
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      hideLoading();
      mostrarMensaje(`Error: ${error.message}`, 'danger');
    }
  }

  // ============================================================================
  // RENDERIZAR DATOS
  // ============================================================================
  function renderizarDatos() {
    // Actualizar estadísticas
    const stats = datosServicio.estadisticas || {};
    document.getElementById('total-espera').textContent = stats.enEspera || 0;
    document.getElementById('total-turnos').textContent = stats.turnosHoy || 0;
    document.getElementById('contador-espera').textContent = stats.enEspera || 0;
    document.getElementById('contador-turnos').textContent = stats.turnosHoy || 0;
    
    // Calcular disponibles
    const disponibles = capacidadHoy === null ? '∞' : Math.max(0, capacidadHoy - (stats.turnosHoy || 0));
    document.getElementById('disponibles').textContent = disponibles;
    document.getElementById('capacidad-hoy').textContent = capacidadHoy === null ? '∞' : capacidadHoy;
    
    // Renderizar listas
    renderizarListaEspera();
    renderizarTurnos();
  }

  function renderizarListaEspera() {
    const tbody = document.getElementById('tabla-espera');
    const lista = datosServicio.listaEspera || [];
    
    if (lista.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td class="text-center py-4" colspan="5">
            <i class="fas fa-check-circle text-success fa-2x mb-2"></i>
            <p class="mb-0">No hay pacientes en espera</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = lista.map((paciente, index) => `
      <tr class="${paciente.prioridad === 'ALTA' ? 'table-danger' : paciente.prioridad === 'MEDIA' ? 'table-warning' : ''}">
        <td class="text-center">${index + 1}</td>
        <td>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-link p-0 me-2 btn-ver-detalle-paciente" 
                    data-paciente-id="${paciente.paciente.id}"
                    title="Ver detalles">
              <i class="fas fa-eye text-info"></i>
            </button>
            <div>
              <strong>${paciente.paciente.nombre} ${paciente.paciente.apellido}</strong>
              <br>
              <small class="text-muted">
                DNI: ${paciente.paciente.dni} | ${formatearSexo(paciente.paciente.sexo)}
                ${paciente.tipoTurno ? `<br>Tipo: ${paciente.tipoTurno}` : ''}
              </small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge bg-${getPrioridadColor(paciente.prioridad)}">
            ${paciente.prioridad}
          </span>
        </td>
        <td>${paciente.diasEspera || 0} días</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-sm btn-info btn-ver-detalle-paciente" 
                    data-paciente-id="${paciente.paciente.id}"
                    title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-success btn-asignar-turno" 
                    data-lista-id="${paciente.id}"
                    data-paciente-nombre="${paciente.paciente.nombre} ${paciente.paciente.apellido}"
                    data-paciente-dni="${paciente.paciente.dni}"
                    title="Asignar turno"
                    ${capacidadHoy !== null && (datosServicio.estadisticas?.turnosHoy || 0) >= capacidadHoy ? 'disabled' : ''}>
              <i class="fas fa-calendar-plus"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderizarTurnos() {
    const tbody = document.getElementById('tabla-turnos');
    const turnos = datosServicio.turnos || [];
    
    if (turnos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td class="text-center py-4" colspan="4">
            <i class="fas fa-calendar-times text-muted fa-2x mb-2"></i>
            <p class="mb-0">No hay turnos asignados para esta fecha</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = turnos.map(turno => `
      <tr>
        <td>
          <strong>${turno.hora_inicio}</strong>
          ${turno.hora_fin ? `<br><small class="text-muted">hasta ${turno.hora_fin}</small>` : ''}
        </td>
        <td>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-link p-0 me-2 btn-ver-detalle-paciente" 
                    data-paciente-id="${turno.paciente.id}"
                    title="Ver detalles">
              <i class="fas fa-eye text-info"></i>
            </button>
            <div>
              <strong>${turno.paciente.nombre} ${turno.paciente.apellido}</strong>
              <br>
              <small class="text-muted">DNI: ${turno.paciente.dni}</small>
              ${turno.medico ? `<br><small class="text-muted">Médico: ${turno.medico.nombre} ${turno.medico.apellido}</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge bg-${getEstadoColor(turno.estado)}">
            ${turno.estado}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger btn-cancelar-turno" 
                  data-turno-id="${turno.id}"
                  title="Cancelar turno">
            <i class="fas fa-times"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ============================================================================
  // CARGAR MÉDICOS DISPONIBLES
  // ============================================================================
  async function cargarMedicosDisponibles() {
    try {
      const response = await fetch(`/turnos/api/servicio/${servicioId}/medicos`);
      if (!response.ok) return;
      
      const data = await response.json();
      medicosDisponibles = data.medicos || [];
      
      // Llenar select de médicos
      const selectMedico = document.getElementById('modal-medico');
      if (selectMedico) {
        selectMedico.innerHTML = '<option value="">Seleccione médico...</option>';
        medicosDisponibles.forEach(medico => {
          const option = document.createElement('option');
          option.value = medico.id;
          const nombre = medico.nombre || '';
          const apellido = medico.apellido || '';
          const especialidad = medico.especialidad || '';
          option.textContent = `Dr/a. ${nombre} ${apellido}${especialidad ? ` - ${especialidad}` : ''}`;
          selectMedico.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error al cargar médicos:', error);
    }
  }

  // ============================================================================
  // CARGAR HORARIOS DISPONIBLES - CORREGIDO
  // ============================================================================
  async function cargarHorariosDisponibles() {
    try {
      const medicoId = document.getElementById('modal-medico').value;
      const fecha = document.getElementById('modal-fecha').value;
      const selectHora = document.getElementById('modal-hora');
      const btnConfirmar = document.getElementById('btnConfirmarAsignacion');
      
      // Validaciones
      if (!medicoId || !fecha) {
        selectHora.disabled = true;
        selectHora.innerHTML = '<option value="">Seleccione médico y fecha</option>';
        if (btnConfirmar) btnConfirmar.disabled = true;
        return;
      }
      
      // Mostrar loading
      selectHora.disabled = true;
      selectHora.innerHTML = '<option value="">Cargando horarios...</option>';
      
      // usa 'horarios' en lugar de 'horarios-disponibles'
      const url = `/turnos/api/medico/${medicoId}/horarios?fecha=${fecha}&tipo_servicio_id=${servicioId}`;
      console.log('🔍 Consultando horarios:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (!data.success || !data.horarios || data.horarios.length === 0) {
        selectHora.innerHTML = `<option value="">${data.message || 'No hay horarios'}</option>`;
        return;
      }
      
      // Llenar horarios
      selectHora.innerHTML = '<option value="">Seleccione hora</option>';
      data.horarios.forEach(hora => {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        selectHora.appendChild(option);
      });
      
      selectHora.disabled = false;
      
    } catch (error) {
      console.error('❌ Error al cargar horarios:', error);
      const selectHora = document.getElementById('modal-hora');
      if (selectHora) {
        selectHora.innerHTML = '<option value="">Error al cargar horarios</option>';
      }
    }
  }

  // ============================================================================
  // VALIDAR HORARIO EN TIEMPO REAL
  // ============================================================================

async function validarHorarioSeleccionado() {
  try {
    const hora = document.getElementById('modal-hora').value;
    const fecha = document.getElementById('modal-fecha').value;
    const medicoId = document.getElementById('modal-medico').value;
    const btnConfirmar = document.getElementById('btnConfirmarAsignacion');
    const validacionDiv = document.getElementById('validacion-horario');
    
    if (!hora) {
      if (btnConfirmar) btnConfirmar.disabled = true;
      if (validacionDiv) validacionDiv.innerHTML = '';
      return;
    }
    
    // Asegurar que tenemos el servicioId global
    if (!servicioId) {
      servicioId = obtenerServicioId(); // Llamar a la función que obtiene el ID
    }
    
    if (!servicioId) {
      if (validacionDiv) {
        validacionDiv.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error: No se pudo identificar el servicio
          </div>
        `;
      }
      if (btnConfirmar) btnConfirmar.disabled = true;
      return;
    }
    
    // Mostrar validación
    if (validacionDiv) {
      validacionDiv.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Validando horario...
        </div>
      `;
    }
    
    // **CORRECCIÓN: Usar la ruta correcta que incluye el servicio_id**
    const response = await fetch(`/turnos/api/servicio/${servicioId}/validar-horario`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medico_id: medicoId || null,
        fecha: fecha,
        hora: hora,
        tipo_servicio_id: parseInt(servicioId), // Asegurar que sea número
        duracion: 30
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (validacionDiv) {
      if (data.disponible) {
        validacionDiv.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            ${data.mensaje}
          </div>
        `;
        if (btnConfirmar) btnConfirmar.disabled = false;
      } else {
        validacionDiv.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-times-circle me-2"></i>
            ${data.mensaje}
          </div>
        `;
        if (btnConfirmar) btnConfirmar.disabled = true;
      }
    }
    
  } catch (error) {
    console.error('❌ Error al validar:', error);
    const validacionDiv = document.getElementById('validacion-horario');
    if (validacionDiv) {
      validacionDiv.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error: ${error.message}
        </div>
      `;
    }
    const btnConfirmar = document.getElementById('btnConfirmarAsignacion');
    if (btnConfirmar) btnConfirmar.disabled = true;
  }
}

  // ============================================================================
  // MODAL ASIGNAR TURNO
  // ============================================================================
  function abrirModalAsignarTurno(listaId, pacienteNombre, pacienteDni) {
    const modal = document.getElementById('modalAsignarTurno');
    if (!modal) return;
    
    // Llenar datos
    document.getElementById('modal-paciente-nombre').textContent = pacienteNombre;
    document.getElementById('modal-paciente-dni').textContent = `DNI: ${pacienteDni}`;
    document.getElementById('modal-lista-id').value = listaId;
    
    // Resetear formulario
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('modal-fecha').value = hoy;
    document.getElementById('modal-fecha').min = hoy;
    
    // Resetear selects
    document.getElementById('modal-medico').value = '';
    document.getElementById('modal-hora').innerHTML = '<option value="">Seleccione médico y fecha primero</option>';
    document.getElementById('modal-hora').disabled = true;
    document.getElementById('btnConfirmarAsignacion').disabled = true;
    document.getElementById('validacion-horario').innerHTML = '';
    
    // Configurar eventos
    const medicoSelect = document.getElementById('modal-medico');
    const fechaInput = document.getElementById('modal-fecha');
    const horaSelect = document.getElementById('modal-hora');
    
    medicoSelect.onchange = cargarHorariosDisponibles;
    fechaInput.onchange = cargarHorariosDisponibles;
    horaSelect.onchange = validarHorarioSeleccionado;
    
    new bootstrap.Modal(modal).show();
  }

  async function confirmarAsignacionTurno() {
    const listaId = document.getElementById('modal-lista-id').value;
    const fecha = document.getElementById('modal-fecha').value;
    const hora = document.getElementById('modal-hora').value;
    const medicoId = document.getElementById('modal-medico').value || '';
    
    if (!fecha || !hora) {
      mostrarMensaje('Complete fecha y hora', 'warning');
      return;
    }
    
    try {
      const btn = document.getElementById('btnConfirmarAsignacion');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Asignando...';
      
      const response = await fetch('/turnos/api/servicio/asignar-turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lista_espera_id: listaId,
          fecha: fecha,
          hora_inicio: hora,
          medico_id: medicoId || null,
          tipo_servicio_id: servicioId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('modalAsignarTurno')).hide();
        setTimeout(() => {
          cargarDatosServicio();
          mostrarMensaje('✅ Turno asignado correctamente');
        }, 300);
      } else {
        mostrarMensaje(`❌ ${data.message}`, 'danger');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje(`Error: ${error.message}`, 'danger');
    } finally {
      const btn = document.getElementById('btnConfirmarAsignacion');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check me-2"></i>Asignar Turno';
    }
  }

  // ============================================================================
  // CANCELAR TURNO
  // ============================================================================
  async function cancelarTurno(turnoId) {
    if (!confirm('¿Cancelar este turno? El paciente volverá a lista de espera.')) return;
    
    try {
      const response = await fetch(`/turnos/api/servicio/turno/${turnoId}/cancelar`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      if (data.success) {
        cargarDatosServicio();
        mostrarMensaje('✅ Turno cancelado');
      } else {
        mostrarMensaje(`❌ ${data.message}`, 'danger');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al cancelar', 'danger');
    }
  }

  // ============================================================================
  // CAPACIDAD
  // ============================================================================
  function abrirModalCapacidad() {
    const input = document.getElementById('input-capacidad');
    if (input) input.value = capacidadHoy === null ? '' : capacidadHoy;
    new bootstrap.Modal(document.getElementById('modalCapacidad')).show();
  }

  function guardarCapacidad() {
    const input = document.getElementById('input-capacidad');
    const valor = input.value.trim();
    capacidadHoy = valor === '' ? null : parseInt(valor);
    
    // Actualizar UI
    document.getElementById('capacidad-hoy').textContent = capacidadHoy === null ? '∞' : capacidadHoy;
    const disponibles = capacidadHoy === null ? '∞' : Math.max(0, capacidadHoy - (datosServicio.estadisticas?.turnosHoy || 0));
    document.getElementById('disponibles').textContent = disponibles;
    
    bootstrap.Modal.getInstance(document.getElementById('modalCapacidad')).hide();
    mostrarMensaje('✅ Capacidad actualizada');
  }

  // ============================================================================
  // DETALLES DE PACIENTE (similar a turnos.js pero simplificado)
  // ============================================================================
  async function verDetallesPaciente(pacienteId) {
    try {
      const response = await fetch(`/turnos/api/paciente/${pacienteId}/detalles`);
      if (!response.ok) throw new Error('Error al cargar detalles');
      
      const data = await response.json();
      mostrarModalDetalles(data);
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al cargar detalles', 'danger');
    }
  }

  function mostrarModalDetalles(data) {
    // Llenar datos básicos (similar a la otra función pero simplificado)
    document.getElementById('detalle-nombre').textContent = `${data.paciente.nombre} ${data.paciente.apellido}`;
    document.getElementById('detalle-dni').textContent = data.paciente.dni;
    document.getElementById('detalle-sexo').textContent = formatearSexo(data.paciente.sexo);
    
    new bootstrap.Modal(document.getElementById('modalDetallesPaciente')).show();
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================
  
  // Botones principales
  document.getElementById('btnActualizar')?.addEventListener('click', cargarDatosServicio);
  document.getElementById('filtro-fecha')?.addEventListener('change', cargarDatosServicio);
  
  // Botones modales
  document.getElementById('btnConfirmarAsignacion')?.addEventListener('click', confirmarAsignacionTurno);
  document.getElementById('editar-capacidad')?.addEventListener('click', abrirModalCapacidad);
  document.getElementById('btnGuardarCapacidad')?.addEventListener('click', guardarCapacidad);
  
  // Event delegation para botones dinámicos
  document.addEventListener('click', function(e) {
    // Detalles de paciente
    if (e.target.closest('.btn-ver-detalle-paciente')) {
      const btn = e.target.closest('.btn-ver-detalle-paciente');
      verDetallesPaciente(btn.dataset.pacienteId);
    }
    
    // Asignar turno
    if (e.target.closest('.btn-asignar-turno')) {
      const btn = e.target.closest('.btn-asignar-turno');
      abrirModalAsignarTurno(
        btn.dataset.listaId,
        btn.dataset.pacienteNombre,
        btn.dataset.pacienteDni
      );
    }
    
    // Cancelar turno
    if (e.target.closest('.btn-cancelar-turno')) {
      const btn = e.target.closest('.btn-cancelar-turno');
      cancelarTurno(btn.dataset.turnoId);
    }
  });

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  servicioId = obtenerServicioId();
  if (servicioId) {
    cargarDatosServicio();
    cargarMedicosDisponibles();
    console.log('✅ Vista de servicio lista para:', servicioId);
  } else {
    console.error('❌ No se pudo inicializar la vista de servicio');
  }
});