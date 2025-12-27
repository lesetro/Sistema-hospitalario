document.addEventListener('DOMContentLoaded', () => {
  
  let paginaActual = 1;
  const limit = 10;

  // ============================================================================
  // CARGAR PACIENTES AL INICIO
  // ============================================================================
  cargarPacientes();

  // ============================================================================
  // FUNCIÓN: CARGAR PACIENTES
  // ============================================================================
  async function cargarPacientes(page = 1) {
    try {
      showLoading();

      const busqueda = document.getElementById('busqueda').value;
      const estado = document.getElementById('filtro-estado').value;
      const obraSocialId = document.getElementById('filtro-obra-social').value;

      const params = new URLSearchParams({
        page,
        limit,
        busqueda,
        estado,
        obra_social_id: obraSocialId
      });

      const response = await fetch(`/pacientes/api/lista?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTablaPacientes(data.pacientes);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      } else {
        mostrarAlerta('error', data.message);
      }

      hideLoading();
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      hideLoading();
      mostrarAlerta('error', 'Error al cargar la lista de pacientes');
    }
  }

  // ============================================================================
  // FUNCIÓN: RENDERIZAR TABLA
  // ============================================================================
  function renderizarTablaPacientes(pacientes) {
    const tbody = document.getElementById('tabla-pacientes-body');

    if (pacientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron pacientes</td></tr>';
      return;
    }

    tbody.innerHTML = pacientes.map(p => `
      <tr>
        <td>${p.dni}</td>
        <td>${p.nombreCompleto}</td>
        <td>${p.email}</td>
        <td>${p.telefono}</td>
        <td>${p.sexo}</td>
        <td>${p.obra_social}</td>
        <td>
          <span class="badge bg-${getEstadoBadge(p.estado)}">
            ${p.estado}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info btn-ver-detalles" 
                    data-id="${p.id}"
                    title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-warning btn-editar" 
                    data-id="${p.id}"
                    title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            ${p.estado === 'Activo' ? `
              <button class="btn btn-danger btn-baja" 
                      data-id="${p.id}"
                      title="Dar de baja">
                <i class="fas fa-user-times"></i>
              </button>
            ` : `
              <button class="btn btn-success btn-reactivar" 
                      data-id="${p.id}"
                      title="Reactivar">
                <i class="fas fa-user-check"></i>
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join('');

    agregarEventosBotones();
  }

  // ============================================================================
  // FUNCIÓN: RENDERIZAR PAGINACIÓN
  // ============================================================================
  function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    const { page, totalPages } = pagination;

    let html = '<ul class="pagination justify-content-end mb-0">';

    // Botón anterior
    html += `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page - 1}">Anterior</a>
      </li>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        html += `
          <li class="page-item ${i === page ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
      } else if (i === page - 3 || i === page + 3) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    // Botón siguiente
    html += `
      <li class="page-item ${page === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a>
      </li>
    `;

    html += '</ul>';
    container.innerHTML = html;

    // Agregar eventos a los botones de paginación
    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.dataset.page);
        if (newPage && newPage !== page) {
          cargarPacientes(newPage);
        }
      });
    });
  }

  // ============================================================================
  // FUNCIÓN: AGREGAR EVENTOS A BOTONES
  // ============================================================================
  function agregarEventosBotones() {
    // Ver detalles
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        verDetallesPaciente(id);
      });
    });

    // Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        abrirModalEditar(id);
      });
    });

    // Dar de baja
    document.querySelectorAll('.btn-baja').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        abrirModalBaja(id);
      });
    });

    // Reactivar
    document.querySelectorAll('.btn-reactivar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        reactivarPaciente(id);
      });
    });
  }

  // ============================================================================
  // FUNCIÓN: VER DETALLES DE PACIENTE
  // ============================================================================
  async function verDetallesPaciente(id) {
    try {
      showLoading();

      const response = await fetch(`/pacientes/api/${id}/detalles`);
      const data = await response.json();

      if (data.success) {
        mostrarModalDetalles(data);
      } else {
        mostrarAlerta('error', data.message);
      }

      hideLoading();
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      hideLoading();
      mostrarAlerta('error', 'Error al cargar detalles del paciente');
    }
  }

  // ============================================================================
  // FUNCIÓN: MOSTRAR MODAL DE DETALLES
  // ============================================================================
  function mostrarModalDetalles(data) {
    const { paciente, admisiones, turnos, internaciones, historial, facturas, estadisticas } = data;

    // Datos personales
    document.getElementById('detalle-nombre').textContent = paciente.nombreCompleto;
    document.getElementById('detalle-dni').textContent = paciente.dni;
    document.getElementById('detalle-email').textContent = paciente.email;
    document.getElementById('detalle-telefono').textContent = paciente.telefono || 'Sin teléfono';
    document.getElementById('detalle-sexo').textContent = paciente.sexo;
    document.getElementById('detalle-fecha-nacimiento').textContent = new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR');
    document.getElementById('detalle-obra-social').textContent = paciente.obra_social;
    document.getElementById('detalle-estado').innerHTML = `<span class="badge bg-${getEstadoBadge(paciente.estado)}">${paciente.estado}</span>`;
    document.getElementById('detalle-fecha-ingreso').textContent = new Date(paciente.fecha_ingreso).toLocaleDateString('es-AR');
    document.getElementById('detalle-observaciones').textContent = paciente.observaciones || 'Sin observaciones';

    // Estadísticas
    document.getElementById('stat-admisiones').textContent = estadisticas.totalAdmisiones;
    document.getElementById('stat-turnos').textContent = estadisticas.totalTurnos;
    document.getElementById('stat-turnos-pendientes').textContent = estadisticas.turnosPendientes;
    document.getElementById('stat-internaciones').textContent = estadisticas.totalInternaciones;

    // Historial de admisiones
    const tbodyAdmisiones = document.getElementById('historial-admisiones');
    if (admisiones.length === 0) {
      tbodyAdmisiones.innerHTML = '<tr><td colspan="4" class="text-center">Sin admisiones</td></tr>';
    } else {
      tbodyAdmisiones.innerHTML = admisiones.slice(0, 5).map(adm => `
        <tr>
          <td>${new Date(adm.fecha).toLocaleDateString('es-AR')}</td>
          <td>${adm.medico ? `Dr/a. ${adm.medico.usuario.nombre} ${adm.medico.usuario.apellido}` : 'Sin médico'}</td>
          <td>${adm.sector?.nombre || '-'}</td>
          <td><span class="badge bg-${getEstadoBadge(adm.estado)}">${adm.estado}</span></td>
        </tr>
      `).join('');
    }

    // Historial de turnos
    const tbodyTurnos = document.getElementById('historial-turnos');
    if (turnos.length === 0) {
      tbodyTurnos.innerHTML = '<tr><td colspan="4" class="text-center">Sin turnos</td></tr>';
    } else {
      tbodyTurnos.innerHTML = turnos.slice(0, 5).map(turno => `
        <tr>
          <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
          <td>${turno.hora_inicio}</td>
          <td>${turno.medico ? `Dr/a. ${turno.medico.usuario.nombre} ${turno.medico.usuario.apellido}` : '-'}</td>
          <td><span class="badge bg-${getEstadoBadge(turno.estado)}">${turno.estado}</span></td>
        </tr>
      `).join('');
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
  }

  // ============================================================================
  // FUNCIÓN: ABRIR MODAL EDITAR
  // ============================================================================
  async function abrirModalEditar(id) {
    try {
      const response = await fetch(`/pacientes/api/${id}/detalles`);
      const data = await response.json();

      if (data.success) {
        const { paciente } = data;

        document.getElementById('editar-id').value = paciente.id;
        document.getElementById('editar-nombre').value = paciente.nombreCompleto;
        document.getElementById('editar-dni').value = paciente.dni;
        document.getElementById('editar-email').value = paciente.email;
        document.getElementById('editar-telefono').value = paciente.telefono || '';
        document.getElementById('editar-obra-social').value = paciente.obra_social_id || '';
        document.getElementById('editar-observaciones').value = paciente.observaciones || '';

        const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al cargar datos del paciente');
    }
  }

  // ============================================================================
  // FUNCIÓN: GUARDAR EDICIÓN
  // ============================================================================
  const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');
  if (btnGuardarEdicion) {
    btnGuardarEdicion.addEventListener('click', async function() {
      const id = document.getElementById('editar-id').value;
      const telefono = document.getElementById('editar-telefono').value;
      const email = document.getElementById('editar-email').value;
      const obra_social_id = document.getElementById('editar-obra-social').value;
      const observaciones = document.getElementById('editar-observaciones').value;

      try {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        const response = await fetch(`/pacientes/api/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefono,
            email,
            obra_social_id: obra_social_id || null,
            observaciones
          })
        });

        const data = await response.json();

        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
          mostrarAlerta('success', 'Paciente actualizado correctamente');
          cargarPacientes(paginaActual);
        } else {
          mostrarAlerta('error', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error al actualizar paciente');
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
      }
    });
  }

  // ============================================================================
  // FUNCIÓN: ABRIR MODAL BAJA
  // ============================================================================
  function abrirModalBaja(id) {
    document.getElementById('baja-id').value = id;
    document.getElementById('baja-motivo').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalBaja'));
    modal.show();
  }

  // ============================================================================
  // FUNCIÓN: CONFIRMAR BAJA
  // ============================================================================
  const btnConfirmarBaja = document.getElementById('btnConfirmarBaja');
  if (btnConfirmarBaja) {
    btnConfirmarBaja.addEventListener('click', async function() {
      const id = document.getElementById('baja-id').value;
      const motivo = document.getElementById('baja-motivo').value;

      if (!motivo.trim()) {
        mostrarAlerta('warning', 'Debe especificar un motivo para la baja');
        return;
      }

      try {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';

        const response = await fetch(`/pacientes/api/${id}/baja`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo })
        });

        const data = await response.json();

        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
          mostrarAlerta('success', 'Paciente dado de baja correctamente');
          cargarPacientes(paginaActual);
        } else {
          mostrarAlerta('error', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error al dar de baja al paciente');
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Baja';
      }
    });
  }

  // ============================================================================
  // FUNCIÓN: REACTIVAR PACIENTE
  // ============================================================================
  async function reactivarPaciente(id) {
    if (!confirm('¿Está seguro de reactivar este paciente?')) return;

    try {
      const response = await fetch(`/pacientes/api/${id}/reactivar`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', 'Paciente reactivado correctamente');
        cargarPacientes(paginaActual);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al reactivar paciente');
    }
  }

  // ============================================================================
  // EVENTOS: BÚSQUEDA Y FILTROS
  // ============================================================================
  document.getElementById('busqueda').addEventListener('input', debounce(() => {
    cargarPacientes(1);
  }, 500));

  document.getElementById('filtro-estado').addEventListener('change', () => {
    cargarPacientes(1);
  });

  document.getElementById('filtro-obra-social').addEventListener('change', () => {
    cargarPacientes(1);
  });

  document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-obra-social').value = '';
    cargarPacientes(1);
  });

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function getEstadoBadge(estado) {
    const colores = {
      'Activo': 'success',
      'Inactivo': 'danger',
      'Pendiente': 'warning',
      'Completada': 'success',
      'Cancelada': 'danger',
      'PENDIENTE': 'warning',
      'CONFIRMADO': 'info',
      'COMPLETADO': 'success',
      'CANCELADO': 'danger'
    };
    return colores[estado] || 'secondary';
  }

  function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('d-none');
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('d-none');
  }

  function mostrarAlerta(tipo, mensaje) {
    const alertaContainer = document.getElementById('alerta-container');
    const tipoClase = tipo === 'success' ? 'alert-success' : tipo === 'error' ? 'alert-danger' : 'alert-warning';
    
    alertaContainer.innerHTML = `
      <div class="alert ${tipoClase} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    setTimeout(() => {
      alertaContainer.innerHTML = '';
    }, 5000);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});