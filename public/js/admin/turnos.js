

document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================================================
  // CORRECCIÓN GLOBAL: LIMPIAR BACKDROP AL CERRAR CUALQUIER MODAL
  // ============================================================================
  function limpiarBackdrop() {
    // Remover todos los backdrops
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.remove();
    });
    
    // Limpiar clases del body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  // Aplicar limpieza a TODOS los modales cuando se cierren
  const modales = [
    'modalDetallesPaciente',
    'modalAsignarTurno',
    'modalCambiarEstado'
  ];

  modales.forEach(modalId => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      // Evento cuando el modal se oculta completamente
      modalElement.addEventListener('hidden.bs.modal', function () {
        limpiarBackdrop();
      });
    }
  });

  // ============================================================================
  // CARGAR DASHBOARD AL INICIO
  // ============================================================================
  cargarDashboard();

  // ============================================================================
  // FUNCIÓN: CARGAR DASHBOARD
  // ============================================================================
  async function cargarDashboard() {
    const url = '/turnos/api/dashboard';
    const params = new URLSearchParams(window.location.search);
    const fullUrl = params.toString() ? `${url}?${params}` : url;

    try {
      showLoading();
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.turnos) {
        renderizarTurnos(data.turnos);
      }

      if (data.listasEspera) {
        renderizarListasEspera(data.listasEspera);
      }

      if (data.estadisticas) {
        renderizarEstadisticas(data.estadisticas);
      }

      hideLoading();
    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error);
      hideLoading();
      
      const errorMsg = error.message || 'Error desconocido';
      alert(`❌ Error al cargar datos: ${errorMsg}`);
      
      const tbody1 = document.getElementById('tabla-turnos-body');
      const tbody2 = document.getElementById('tabla-listas-body');
      if (tbody1) tbody1.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${errorMsg}</td></tr>`;
      if (tbody2) tbody2.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error: ${errorMsg}</td></tr>`;
    }
  }

  // ============================================================================
  // FUNCIÓN: RENDERIZAR TURNOS
  // ============================================================================
  function renderizarTurnos(turnos) {
    const tbody = document.getElementById('tabla-turnos-body');
    if (!tbody) return;

    if (turnos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay turnos registrados</td></tr>';
      return;
    }

    tbody.innerHTML = turnos.map(turno => `
      <tr>
        <td>${turno.id}</td>
        <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
        <td>${turno.horaInicio}</td>
        <td>
          ${turno.paciente.nombre} ${turno.paciente.apellido}
          <br><small class="text-muted">DNI: ${turno.paciente.dni}</small>
        </td>
        <td>${turno.medico?.nombre || '-'} ${turno.medico?.apellido || ''}</td>
        <td>
          <span class="badge bg-${getBadgeColor(turno.estado)}">
            ${turno.estado}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info btn-ver-detalles" 
                    data-paciente-id="${turno.paciente.id}"
                    title="Ver detalles del paciente">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-warning btn-cambiar-estado" 
                    data-id="${turno.id}" 
                    data-estado-actual="${turno.estado}"
                    title="Cambiar estado">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    agregarEventosBotones();
  }

  // ============================================================================
  // FUNCIÓN: RENDERIZAR LISTAS DE ESPERA
  // ============================================================================
  function renderizarListasEspera(listas) {
    const tbody = document.getElementById('tabla-listas-body');
    if (!tbody) return;

    if (listas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay listas de espera</td></tr>';
      return;
    }

    tbody.innerHTML = listas.map(lista => `
      <tr class="${lista.prioridad === 'ALTA' ? 'table-danger' : ''}">
        <td>${lista.id}</td>
        <td>
          ${lista.paciente.nombre} ${lista.paciente.apellido}
          <br><small class="text-muted">DNI: ${lista.paciente.dni}</small>
        </td>
        <td>
          <span class="badge bg-${getPrioridadColor(lista.prioridad)}">
            ${lista.prioridad}
          </span>
        </td>
        <td>${lista.diasEspera} días</td>
        <td>${lista.tipoTurno?.nombre || '-'}</td>
        <td>
          <span class="badge bg-${getBadgeColor(lista.estado)}">
            ${lista.estado}
          </span>
        </td>
        <td>${lista.turnoAsignado ? `${new Date(lista.turnoAsignado.fecha).toLocaleDateString('es-AR')} ${lista.turnoAsignado.hora}` : '-'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info btn-ver-detalles" 
                    data-paciente-id="${lista.paciente.id}"
                    title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            ${lista.estado === 'PENDIENTE' ? `
              <button class="btn btn-success btn-asignar-turno" 
                      data-lista-id="${lista.id}"
                      data-paciente-nombre="${lista.paciente.nombre} ${lista.paciente.apellido}"
                      title="Asignar turno">
                <i class="fas fa-calendar-plus"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    agregarEventosBotones();
  }

  // ============================================================================
  // FUNCIÓN: RENDERIZAR ESTADÍSTICAS
  // ============================================================================
  function renderizarEstadisticas(stats) {
    const turnosTotal = document.getElementById('turnos-total');
    const turnosPendientes = document.getElementById('turnos-pendientes');
    const listasTotal = document.getElementById('listas-total');
    const listasPendientes = document.getElementById('listas-pendientes');

    if (turnosTotal) turnosTotal.textContent = stats.turnos.total;
    if (turnosPendientes) turnosPendientes.textContent = stats.turnos.pendientes;
    if (listasTotal) listasTotal.textContent = stats.listasEspera.total;
    if (listasPendientes) listasPendientes.textContent = stats.listasEspera.pendientes;
  }

  // ============================================================================
  // EVENTOS: AGREGAR A BOTONES
  // ============================================================================
  function agregarEventosBotones() {
    // Botón Ver Detalles
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
      btn.addEventListener('click', function() {
        const pacienteId = this.dataset.pacienteId;
        verDetallesPaciente(pacienteId);
      });
    });

    // Botón Asignar Turno
    document.querySelectorAll('.btn-asignar-turno').forEach(btn => {
      btn.addEventListener('click', function() {
        const listaId = this.dataset.listaId;
        const pacienteNombre = this.dataset.pacienteNombre;
        abrirModalAsignarTurno(listaId, pacienteNombre);
      });
    });

    // Botón Cambiar Estado
    document.querySelectorAll('.btn-cambiar-estado').forEach(btn => {
      btn.addEventListener('click', function() {
        const turnoId = this.dataset.id;
        const estadoActual = this.dataset.estadoActual;
        abrirModalCambiarEstado(turnoId, estadoActual);
      });
    });
  }

  // ============================================================================
  // FUNCIÓN: VER DETALLES DE PACIENTE
  // ============================================================================
  async function verDetallesPaciente(pacienteId) {
    try {
      showLoading();
      
      if (!pacienteId) {
        throw new Error('ID de paciente no válido');
      }
      
      console.log(`🔍 Cargando detalles del paciente ID: ${pacienteId}`);
      
      const response = await fetch(`/turnos/api/paciente/${pacienteId}/detalles`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();

      if (!data.paciente) {
        throw new Error('No se encontraron datos del paciente');
      }

      mostrarModalDetalles(data);
      hideLoading();
    } catch (error) {
      console.error('❌ Error al cargar detalles:', error);
      hideLoading();
      alert(`❌ Error al cargar detalles del paciente: ${error.message}`);
    }
  }

  // ============================================================================
  // FUNCIÓN: MOSTRAR MODAL DE DETALLES
  // ============================================================================
  function mostrarModalDetalles(data) {
    const modal = document.getElementById('modalDetallesPaciente');
    if (!modal) {
      console.error('❌ Modal de detalles no encontrado en el DOM');
      alert('❌ Error: Modal no encontrado. Verifique que el HTML esté correcto.');
      return;
    }

    const elementos = {
      'detalle-nombre': `${data.paciente.nombre} ${data.paciente.apellido}`,
      'detalle-dni': data.paciente.dni,
      'detalle-sexo': data.paciente.sexo,
      'detalle-email': data.paciente.email || '-',
      'detalle-telefono': data.paciente.telefono || '-',
      'detalle-obra-social': data.paciente.obraSocial,
      'stat-admisiones': data.estadisticas.totalAdmisiones,
      'stat-turnos': data.estadisticas.totalTurnos,
      'stat-pendientes': data.estadisticas.turnosPendientes
    };

    Object.keys(elementos).forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = elementos[id];
      } else {
        console.warn(` Elemento #${id} no encontrado`);
      }
    });

    // Historial de admisiones
    const tbody = document.getElementById('historial-admisiones');
    if (tbody) {
      if (data.admisiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin admisiones</td></tr>';
      } else {
        tbody.innerHTML = data.admisiones.map(adm => `
          <tr>
            <td>${new Date(adm.fecha).toLocaleDateString('es-AR')}</td>
            <td>${adm.medico?.usuario?.nombre || '-'}</td>
            <td>${adm.sector?.nombre || '-'}</td>
            <td><span class="badge bg-${getBadgeColor(adm.estado)}">${adm.estado}</span></td>
          </tr>
        `).join('');
      }
    }

    // Historial de turnos
    const tbodyTurnos = document.getElementById('historial-turnos');
    if (tbodyTurnos) {
      if (data.turnos.length === 0) {
        tbodyTurnos.innerHTML = '<tr><td colspan="4" class="text-center">Sin turnos</td></tr>';
      } else {
        tbodyTurnos.innerHTML = data.turnos.map(turno => `
          <tr>
            <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
            <td>${turno.hora_inicio}</td>
            <td>${turno.medico?.usuario?.nombre || '-'}</td>
            <td><span class="badge bg-${getBadgeColor(turno.estado)}">${turno.estado}</span></td>
          </tr>
        `).join('');
      }
    }

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  // ============================================================================
  // FUNCIÓN: CARGAR MÉDICOS
  // ============================================================================
  async function cargarMedicos() {
    try {
      const response = await fetch('/turnos/api/medicos');
      
      if (!response.ok) {
        throw new Error('Error al cargar médicos');
      }
      
      const data = await response.json();

      const select = document.getElementById('asignar-medico');
      if (!select) return;

      select.innerHTML = '<option value="">Seleccione médico</option>';
      
      if (data.medicos && data.medicos.length > 0) {
        data.medicos.forEach(medico => {
          const option = document.createElement('option');
          option.value = medico.id;
          option.textContent = `Dr/a. ${medico.usuario.nombre} ${medico.usuario.apellido} - ${medico.especialidad?.nombre || 'Sin especialidad'}`;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option value="">No hay médicos disponibles</option>';
      }
    } catch (error) {
      console.error('❌ Error al cargar médicos:', error);
      const select = document.getElementById('asignar-medico');
      if (select) {
        select.innerHTML = '<option value="">Error al cargar médicos</option>';
      }
    }
  }

  // ============================================================================
  // FUNCIÓN: CARGAR HORARIOS DISPONIBLES
  // ============================================================================
  async function cargarHorariosDisponibles() {
    const medicoId = document.getElementById('asignar-medico').value;
    const fecha = document.getElementById('asignar-fecha').value;
    const selectHora = document.getElementById('asignar-hora');

    if (!medicoId || !fecha) {
      selectHora.disabled = true;
      selectHora.innerHTML = '<option value="">Seleccione médico y fecha primero</option>';
      return;
    }

    try {
      selectHora.disabled = true;
      selectHora.innerHTML = '<option value="">Cargando horarios...</option>';

      const response = await fetch(`/turnos/api/medico/${medicoId}/horarios?fecha=${fecha}`);
      const data = await response.json();

      if (!data.success) {
        selectHora.innerHTML = `<option value="">❌ ${data.message}</option>`;
        return;
      }

      if (data.horarios.length === 0) {
        selectHora.innerHTML = '<option value="">No hay horarios disponibles</option>';
        return;
      }

      selectHora.innerHTML = '<option value="">Seleccione un horario</option>';
      data.horarios.forEach(hora => {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        selectHora.appendChild(option);
      });

      selectHora.disabled = false;

      const infoDiv = document.getElementById('info-horario');
      if (infoDiv && data.turnoPersonal) {
        infoDiv.innerHTML = `
          <small class="text-muted">
            <i class="fas fa-info-circle me-1"></i>
            El médico atiende los ${data.turnoPersonal.dia} de ${data.turnoPersonal.horaInicio} a ${data.turnoPersonal.horaFin}
          </small>
        `;
      }

    } catch (error) {
      console.error('Error al cargar horarios:', error);
      selectHora.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
  }

  // ============================================================================
  // FUNCIÓN: ABRIR MODAL ASIGNAR TURNO
  // ============================================================================
  async function abrirModalAsignarTurno(listaId, pacienteNombre) {
    const modal = document.getElementById('modalAsignarTurno');
    if (!modal) {
      alert('❌ Error: Modal de asignar turno no encontrado');
      return;
    }

    document.getElementById('asignar-paciente-nombre').textContent = pacienteNombre;
    document.getElementById('asignar-lista-id').value = listaId;

    // Reset de campos
    document.getElementById('asignar-fecha').value = '';
    document.getElementById('asignar-medico').value = '';
    
    const selectHora = document.getElementById('asignar-hora');
    selectHora.innerHTML = '<option value="">Seleccione médico y fecha primero</option>';
    selectHora.disabled = true;

    const infoDiv = document.getElementById('info-horario');
    if (infoDiv) infoDiv.innerHTML = '';

    // Cargar médicos
    await cargarMedicos();

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  // ============================================================================
  // EVENTOS PARA CARGAR HORARIOS
  // ============================================================================
  const selectMedico = document.getElementById('asignar-medico');
  const selectFecha = document.getElementById('asignar-fecha');
  
  if (selectMedico) {
    selectMedico.addEventListener('change', cargarHorariosDisponibles);
  }
  
  if (selectFecha) {
    selectFecha.addEventListener('change', cargarHorariosDisponibles);
  }

  // ============================================================================
  // FUNCIÓN: CONFIRMAR ASIGNACIÓN DE TURNO
  // ============================================================================
  const btnConfirmarAsignacion = document.getElementById('btnConfirmarAsignacion');
  if (btnConfirmarAsignacion) {
    btnConfirmarAsignacion.addEventListener('click', async function() {
      const listaId = document.getElementById('asignar-lista-id').value;
      const fecha = document.getElementById('asignar-fecha').value;
      const hora = document.getElementById('asignar-hora').value;
      const medicoId = document.getElementById('asignar-medico').value;
      const sectorId = document.getElementById('asignar-sector').value;

      if (!fecha || !hora) {
        alert('❌ Complete fecha y hora del turno');
        return;
      }

      try {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Asignando...';
        
        const response = await fetch('/turnos/api/asignar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lista_espera_id: listaId,
            fecha,
            hora_inicio: hora,
            medico_id: medicoId || null,
            sector_id: sectorId || null
          })
        });

        const data = await response.json();

        if (data.success) {
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalAsignarTurno'));
          if (modal) {
            modal.hide();
          }
          
          setTimeout(() => {
            limpiarBackdrop();
            alert('✅ Turno asignado correctamente');
            cargarDashboard();
          }, 300);
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al asignar turno: ' + error.message);
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-check me-2"></i>Asignar Turno';
      }
    });
  }

  // ============================================================================
  // FUNCIÓN: ABRIR MODAL CAMBIAR ESTADO
  // ============================================================================
  function abrirModalCambiarEstado(turnoId, estadoActual) {
    const modal = document.getElementById('modalCambiarEstado');
    if (!modal) {
      alert('❌ Error: Modal de cambiar estado no encontrado');
      return;
    }

    document.getElementById('cambiar-turno-id').value = turnoId;
    document.getElementById('cambiar-estado-actual').textContent = estadoActual;
    
    const select = document.getElementById('cambiar-nuevo-estado');
    if (select) {
      if (estadoActual === 'PENDIENTE') {
        select.value = 'CONFIRMADO';
      } else if (estadoActual === 'CONFIRMADO') {
        select.value = 'COMPLETADO';
      }
    }

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  // ============================================================================
  // FUNCIÓN: CONFIRMAR CAMBIO DE ESTADO
  // ============================================================================
  const btnConfirmarCambioEstado = document.getElementById('btnConfirmarCambioEstado');
  if (btnConfirmarCambioEstado) {
    btnConfirmarCambioEstado.addEventListener('click', async function() {
      const turnoId = document.getElementById('cambiar-turno-id').value;
      const nuevoEstado = document.getElementById('cambiar-nuevo-estado').value;

      if (!nuevoEstado) {
        alert('❌ Seleccione un estado');
        return;
      }

      try {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        
        const response = await fetch(`/turnos/api/turno/${turnoId}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });

        const data = await response.json();

        if (data.success) {
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalCambiarEstado'));
          if (modal) {
            modal.hide();
          }
          
          setTimeout(() => {
            limpiarBackdrop();
            alert(`✅ Turno ${nuevoEstado}`);
            cargarDashboard();
          }, 300);
        } else {
          alert('❌ ' + data.message);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al cambiar estado: ' + error.message);
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambio';
      }
    });
  }

  // ============================================================================
  // BOTÓN ACTUALIZAR
  // ============================================================================
  const btnActualizar = document.getElementById('btnActualizar');
  if (btnActualizar) {
    btnActualizar.addEventListener('click', () => {
      cargarDashboard();
    });
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function getBadgeColor(estado) {
    const colores = {
      'PENDIENTE': 'warning',
      'Pendiente': 'warning',
      'CONFIRMADO': 'info',
      'COMPLETADO': 'success',
      'Completada': 'success',
      'CANCELADO': 'danger',
      'Cancelada': 'danger',
      'ASIGNADO': 'primary'
    };
    return colores[estado] || 'secondary';
  }

  function getPrioridadColor(prioridad) {
    const colores = {
      'ALTA': 'danger',
      'MEDIA': 'warning',
      'BAJA': 'success'
    };
    return colores[prioridad] || 'secondary';
  }

  function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('d-none');
    }
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('d-none');
    }
  }
});