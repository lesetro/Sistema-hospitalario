document.addEventListener('DOMContentLoaded', () => {
  let paginaActual = 1;

  cargarEstadisticas();
  cargarPersonal();

  // ============================================================================
  // FUNCIÓN AUXILIAR: Normalizar tipo de personal para URLs
  // ============================================================================
  function normalizarTipo(tipo) {
    const tipos = {
      'Médico': 'medico',
      'Enfermero': 'enfermero',
      'Administrativo': 'administrativo'
    };
    return tipos[tipo] || tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================
  async function cargarEstadisticas() {
    try {
      const response = await fetch('/personal/api/estadisticas');
      const data = await response.json();

      if (data.success) {
        document.getElementById('total-medicos').textContent = data.resumen.total_medicos;
        document.getElementById('total-enfermeros').textContent = data.resumen.total_enfermeros;
        document.getElementById('total-administrativos').textContent = data.resumen.total_administrativos;
        document.getElementById('sin-asignar').textContent = 
          data.resumen.medicos_sin_sector + data.resumen.enfermeros_sin_sector;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  // ============================================================================
  // BUSCAR PERSONAL
  // ============================================================================
  async function cargarPersonal(page = 1) {
    try {
      showLoading();

      const busqueda = document.getElementById('busqueda')?.value || '';
      const tipoPersonal = document.getElementById('filtro-tipo')?.value || '';
      const sector = document.getElementById('filtro-sector')?.value || '';
      const sinAsignar = document.getElementById('filtro-sin-asignar')?.checked || false;

      const params = new URLSearchParams({
        page, limit: 10, busqueda, tipo_personal: tipoPersonal, sector_id: sector, sin_asignar: sinAsignar
      });

      const response = await fetch(`/personal/api/buscar?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTablaPersonal(data.personal);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Error al cargar personal:', error);
      mostrarAlerta('error', 'Error al cargar personal');
    }
  }

  function renderizarTablaPersonal(personal) {
    const tbody = document.getElementById('tabla-personal-body');

    if (personal.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay personal registrado</td></tr>';
      return;
    }

    tbody.innerHTML = personal.map(p => {
      const tipoNormalizado = normalizarTipo(p.tipo);
      
      return `
        <tr>
          <td><span class="badge bg-primary">${p.tipo}</span></td>
          <td>${p.nombre}<br><small class="text-muted">DNI: ${p.dni}</small></td>
          <td>${p.email || 'N/A'}</td>
          <td>${p.sector}</td>
          <td><small>${p.detalle}</small></td>
          <td><span class="badge bg-${p.estado === 'Activo' ? 'success' : 'secondary'}">${p.estado}</span></td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-info btn-ver" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              ${!p.sector_id ? `
                <button class="btn btn-warning btn-asignar-sector" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Asignar sector">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
              ` : ''}
              <button class="btn btn-success btn-turno" data-usuario="${p.usuario_id}" title="Gestionar turno">
                <i class="fas fa-clock"></i>
              </button>
              ${p.estado === 'Activo' ? `
                <button class="btn btn-danger btn-baja" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Dar de baja">
                  <i class="fas fa-user-times"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    agregarEventos();
  }

  function agregarEventos() {
    document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.addEventListener('click', function() {
        console.log('Ver detalles - tipo:', this.dataset.tipo, 'id:', this.dataset.id);
        verDetalles(this.dataset.tipo, this.dataset.id);
      });
    });

    document.querySelectorAll('.btn-asignar-sector').forEach(btn => {
      btn.addEventListener('click', function() {
        abrirModalAsignarSector(this.dataset.tipo, this.dataset.id);
      });
    });

    document.querySelectorAll('.btn-turno').forEach(btn => {
      btn.addEventListener('click', function() {
        abrirModalTurno(this.dataset.usuario);
      });
    });

    document.querySelectorAll('.btn-baja').forEach(btn => {
      btn.addEventListener('click', function() {
        confirmarBaja(this.dataset.tipo, this.dataset.id);
      });
    });
  }

  // ============================================================================
  // VER DETALLES
  // ============================================================================
  async function verDetalles(tipo, id) {
    try {
      console.log(`Fetching: /personal/api/${tipo}/${id}/detalles`);
      const response = await fetch(`/personal/api/${tipo}/${id}/detalles`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        mostrarModalDetalles(data.empleado);
      } else {
        mostrarAlerta('error', data.message || 'Error al cargar detalles');
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      mostrarAlerta('error', 'Error al cargar detalles del empleado');
    }
  }

  function mostrarModalDetalles(empleado) {
    console.log('Mostrando modal con empleado:', empleado);
    
    document.getElementById('detalle-nombre').textContent = `${empleado.usuario.nombre} ${empleado.usuario.apellido}`;
    document.getElementById('detalle-dni').textContent = empleado.usuario.dni;
    document.getElementById('detalle-email').textContent = empleado.usuario.email || 'N/A';
    document.getElementById('detalle-sector').textContent = empleado.sector?.nombre || 'Sin asignar';
    
    // Estado del usuario
    const estadoUsuario = empleado.usuario.estado || empleado.estado || 'Desconocido';
    document.getElementById('detalle-estado').innerHTML = 
      `<span class="badge bg-${estadoUsuario === 'Activo' ? 'success' : 'secondary'}">${estadoUsuario}</span>`;

    // Información adicional según tipo
    let infoAdicional = '';
    if (empleado.matricula) {
      infoAdicional += `<p><strong>Matrícula:</strong> ${empleado.matricula}</p>`;
    }
    if (empleado.especialidad) {
      infoAdicional += `<p><strong>Especialidad:</strong> ${empleado.especialidad.nombre}</p>`;
    }
    if (empleado.nivel) {
      infoAdicional += `<p><strong>Nivel:</strong> ${empleado.nivel}</p>`;
    }
    if (empleado.responsabilidad) {
      infoAdicional += `<p><strong>Responsabilidad:</strong> ${empleado.responsabilidad}</p>`;
    }
    if (empleado.fecha_ingreso) {
      infoAdicional += `<p><strong>Fecha Ingreso:</strong> ${new Date(empleado.fecha_ingreso).toLocaleDateString('es-AR')}</p>`;
    }

    const infoDiv = document.getElementById('detalle-info-adicional');
    if (infoDiv) {
      infoDiv.innerHTML = infoAdicional || '<p class="text-muted">Sin información adicional</p>';
    }

    // Turnos
    const turnosDiv = document.getElementById('detalle-turnos');
    if (empleado.turnos && empleado.turnos.length > 0) {
      turnosDiv.innerHTML = empleado.turnos.map(t => `
        <div class="alert alert-info mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong><i class="fas fa-clock me-2"></i>${t.tipo}</strong><br>
              <small>
                 <strong>Días:</strong> ${t.dias}<br>
                 <strong>Horario:</strong> ${t.hora_inicio.substring(0, 5)} - ${t.hora_fin.substring(0, 5)}<br>
                 <strong>Sector:</strong> ${t.sector?.nombre || 'N/A'}
              </small>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      turnosDiv.innerHTML = '<div class="alert alert-warning"> Sin turnos asignados</div>';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
  }

  // ============================================================================
  // ASIGNAR SECTOR
  // ============================================================================
  function abrirModalAsignarSector(tipo, id) {
    document.getElementById('asignar-tipo').value = tipo;
    document.getElementById('asignar-id').value = id;
    const modal = new bootstrap.Modal(document.getElementById('modalAsignarSector'));
    modal.show();
  }

  document.getElementById('btnConfirmarAsignar')?.addEventListener('click', async function() {
    const tipo = document.getElementById('asignar-tipo').value;
    const id = document.getElementById('asignar-id').value;
    const sectorId = document.getElementById('asignar-sector-select').value;

    if (!sectorId) {
      mostrarAlerta('warning', 'Seleccione un sector');
      return;
    }

    try {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Asignando...';
      
      const response = await fetch(`/personal/api/${tipo}/${id}/asignar-sector`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector_id: sectorId })
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalAsignarSector')).hide();
        mostrarAlerta('success', 'Sector asignado correctamente');
        cargarPersonal(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al asignar sector');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-check me-2"></i>Asignar';
    }
  });

  // ============================================================================
  // GESTIONAR TURNO
  // ============================================================================
  function abrirModalTurno(usuarioId) {
    document.getElementById('turno-usuario-id').value = usuarioId;
    document.getElementById('form-turno').reset();
    const modal = new bootstrap.Modal(document.getElementById('modalTurno'));
    modal.show();
  }

  document.getElementById('btnGuardarTurno')?.addEventListener('click', async function() {
    const formData = {
      usuario_id: document.getElementById('turno-usuario-id').value,
      tipo: document.getElementById('turno-tipo').value,
      dias: document.getElementById('turno-dias').value,
      hora_inicio: document.getElementById('turno-hora-inicio').value,
      hora_fin: document.getElementById('turno-hora-fin').value,
      sector_id: document.getElementById('turno-sector').value
    };

    if (!formData.tipo || !formData.dias || !formData.hora_inicio || !formData.hora_fin) {
      mostrarAlerta('warning', 'Complete todos los campos obligatorios');
      return;
    }

    try {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      const response = await fetch('/personal/api/turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalTurno')).hide();
        mostrarAlerta('success', 'Turno guardado correctamente');
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al guardar turno');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
  });

  // ============================================================================
  // BAJA EMPLEADO
  // ============================================================================
  async function confirmarBaja(tipo, id) {
    if (!confirm('¿Está seguro de dar de baja a este empleado?')) return;

    const motivo = prompt('Ingrese el motivo de la baja:');
    if (!motivo || !motivo.trim()) {
      mostrarAlerta('warning', 'Debe ingresar un motivo');
      return;
    }

    try {
      showLoading();
      
      const response = await fetch(`/personal/api/${tipo}/${id}/baja`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo.trim() })
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', 'Empleado dado de baja correctamente');
        cargarPersonal(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al dar de baja al empleado');
    } finally {
      hideLoading();
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    const { page, totalPages } = pagination;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination justify-content-end mb-0">';
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>`;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    if (totalPages > 5) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li></ul>`;
    
    container.innerHTML = html;

    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.dataset.page);
        if (newPage && newPage !== page && newPage >= 1 && newPage <= totalPages) {
          cargarPersonal(newPage);
        }
      });
    });
  }

  function showLoading() {
    document.getElementById('loading')?.classList.remove('d-none');
  }

  function hideLoading() {
    document.getElementById('loading')?.classList.add('d-none');
  }

  function mostrarAlerta(tipo, mensaje) {
    const container = document.getElementById('alerta-container');
    const clase = tipo === 'success' ? 'alert-success' : tipo === 'error' ? 'alert-danger' : 'alert-warning';
    const icono = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle';
    
    container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
      <i class="fas fa-${icono} me-2"></i>${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    
    setTimeout(() => container.innerHTML = '', 5000);
  }

  // ============================================================================
  // EVENTOS DE FILTROS
  // ============================================================================
  
  // Búsqueda con debounce
  let timeoutBusqueda;
  document.getElementById('busqueda')?.addEventListener('input', function() {
    if (this.value.length >= 3 || this.value.length === 0) {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(() => cargarPersonal(1), 500);
    }
  });

  document.getElementById('filtro-tipo')?.addEventListener('change', () => cargarPersonal(1));
  document.getElementById('filtro-sector')?.addEventListener('change', () => cargarPersonal(1));
  document.getElementById('filtro-sin-asignar')?.addEventListener('change', () => cargarPersonal(1));
});