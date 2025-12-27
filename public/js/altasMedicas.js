document.addEventListener('DOMContentLoaded', () => {
  let paginaActual = 1;
  let filtrosActivos = {
    search: '',
    tipo_alta: '',
    estado_paciente: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  // Cargar datos iniciales
  cargarEstadisticas();
  cargarAltas();

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  // Búsqueda con debounce
  let timeoutBusqueda;
  document.getElementById('busqueda')?.addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    filtrosActivos.search = this.value;
    timeoutBusqueda = setTimeout(() => {
      paginaActual = 1;
      cargarAltas();
    }, 500);
  });

  // Filtros
  document.getElementById('filtro-tipo-alta')?.addEventListener('change', function() {
    filtrosActivos.tipo_alta = this.value;
    paginaActual = 1;
    cargarAltas();
  });

  document.getElementById('filtro-estado')?.addEventListener('change', function() {
    filtrosActivos.estado_paciente = this.value;
    paginaActual = 1;
    cargarAltas();
  });

  document.getElementById('fecha-desde')?.addEventListener('change', function() {
    filtrosActivos.fecha_desde = this.value;
    paginaActual = 1;
    cargarAltas();
  });

  document.getElementById('fecha-hasta')?.addEventListener('change', function() {
    filtrosActivos.fecha_hasta = this.value;
    paginaActual = 1;
    cargarAltas();
  });

  // Limpiar filtros
  document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtro-tipo-alta').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('fecha-desde').value = '';
    document.getElementById('fecha-hasta').value = '';
    
    filtrosActivos = {
      search: '',
      tipo_alta: '',
      estado_paciente: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    
    paginaActual = 1;
    cargarAltas();
  });

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  async function cargarEstadisticas() {
    try {
      const response = await fetch('/altas-medicas/api/estadisticas');
      const data = await response.json();

      if (data.success) {
        const e = data.estadisticas;
        document.getElementById('stat-total').textContent = e.total_altas;
        document.getElementById('stat-mes').textContent = e.altas_mes;
        document.getElementById('stat-medicas').textContent = e.por_tipo.medicas;
        document.getElementById('stat-voluntarias').textContent = e.por_tipo.voluntarias;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  async function cargarAltas(page = 1) {
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...filtrosActivos
      });

      const response = await fetch(`/altas-medicas/api/lista?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTabla(data.altas);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar altas médicas');
      console.error(error);
    }
  }

  function renderizarTabla(altas) {
    const tbody = document.getElementById('tabla-altas');

    if (altas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p class="text-muted">No se encontraron altas médicas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = altas.map(alta => {
      const badgeTipo = {
        'Voluntaria': 'bg-info',
        'Medica': 'bg-success',
        'Contraindicada': 'bg-warning'
      }[alta.tipo_alta] || 'bg-secondary';

      const badgeEstado = {
        'Estable': 'bg-success',
        'Grave': 'bg-warning',
        'Critico': 'bg-danger',
        'Fallecido': 'bg-dark',
        'Sin_Evaluar': 'bg-secondary'
      }[alta.estado_paciente] || 'bg-secondary';

      const iconoInternacion = alta.internacion ? 
        `<i class="fas fa-bed text-primary" title="Con internación"></i>` : 
        `<i class="fas fa-user-check text-muted" title="Sin internación"></i>`;

      return `
        <tr>
          <td>${formatearFecha(alta.fecha_alta)}</td>
          <td>
            <strong>${alta.paciente.nombre}</strong><br>
            <small class="text-muted">DNI: ${alta.paciente.dni}</small>
          </td>
          <td>
            ${alta.paciente.edad} años<br>
            <small class="text-muted">${alta.paciente.sexo}</small>
          </td>
          <td>
            ${alta.medico.nombre}<br>
            <small class="text-muted">${alta.medico.especialidad}</small>
          </td>
          <td>
            <span class="badge ${badgeTipo}">${alta.tipo_alta}</span>
          </td>
          <td>
            <span class="badge ${badgeEstado}">${formatearEstado(alta.estado_paciente)}</span>
          </td>
          <td class="text-center">${iconoInternacion}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="verDetalle(${alta.id})" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.verDetalle = async function(id) {
    try {
      const response = await fetch(`/altas-medicas/api/detalle/${id}`);
      const data = await response.json();

      if (data.success) {
        mostrarModalDetalle(data.alta);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar detalle');
      console.error(error);
    }
  };

  function mostrarModalDetalle(alta) {
    const modal = document.getElementById('modalDetalle');
    const contenido = document.getElementById('detalle-contenido');

    const internacionHTML = alta.internacion ? `
      <div class="col-md-12 mb-3">
        <h6 class="border-bottom pb-2"><i class="fas fa-bed me-2"></i>Información de Internación</h6>
        <div class="row">
          <div class="col-md-6">
            <p><strong>Tipo:</strong> ${alta.internacion.tipo_internacion}</p>
            <p><strong>Cama:</strong> ${alta.internacion.cama.numero}</p>
            <p><strong>Habitación:</strong> ${alta.internacion.cama.habitacion}</p>
            <p><strong>Sector:</strong> ${alta.internacion.cama.sector}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Fecha inicio:</strong> ${formatearFecha(alta.internacion.fecha_inicio)}</p>
            <p><strong>Días internado:</strong> ${alta.internacion.dias_internado}</p>
            <p><strong>Estado operación:</strong> ${alta.internacion.estado_operacion}</p>
            <p><strong>Estado estudios:</strong> ${alta.internacion.estado_estudios}</p>
          </div>
        </div>
      </div>
    ` : '<div class="col-12"><p class="text-muted"><i class="fas fa-info-circle me-2"></i>Sin internación registrada</p></div>';

    const instruccionesHTML = alta.instrucciones_post_alta ? `
      <div class="col-12 mb-3">
        <h6 class="border-bottom pb-2"><i class="fas fa-file-medical me-2"></i>Instrucciones Post-Alta</h6>
        <div class="alert alert-info">
          <pre class="mb-0" style="white-space: pre-wrap;">${alta.instrucciones_post_alta}</pre>
        </div>
      </div>
    ` : '';

    contenido.innerHTML = `
      <div class="row">
        <!-- Información del Alta -->
        <div class="col-md-6 mb-3">
          <h6 class="border-bottom pb-2"><i class="fas fa-calendar-check me-2"></i>Datos del Alta</h6>
          <p><strong>Fecha de alta:</strong> ${formatearFecha(alta.fecha_alta)}</p>
          <p><strong>Tipo de alta:</strong> <span class="badge bg-primary">${alta.tipo_alta}</span></p>
          <p><strong>Estado paciente:</strong> <span class="badge bg-info">${formatearEstado(alta.estado_paciente)}</span></p>
          <p><strong>Registrada:</strong> ${formatearFecha(alta.created_at)}</p>
        </div>

        <!-- Información del Paciente -->
        <div class="col-md-6 mb-3">
          <h6 class="border-bottom pb-2"><i class="fas fa-user me-2"></i>Datos del Paciente</h6>
          <p><strong>Nombre:</strong> ${alta.paciente.nombre_completo}</p>
          <p><strong>DNI:</strong> ${alta.paciente.dni}</p>
          <p><strong>Edad:</strong> ${alta.paciente.edad} años</p>
          <p><strong>Sexo:</strong> ${alta.paciente.sexo}</p>
          <p><strong>Obra Social:</strong> ${alta.paciente.obra_social}</p>
        </div>

        <!-- Información del Médico -->
        <div class="col-md-6 mb-3">
          <h6 class="border-bottom pb-2"><i class="fas fa-user-md me-2"></i>Médico Responsable</h6>
          <p><strong>Nombre:</strong> ${alta.medico.nombre_completo}</p>
          <p><strong>Matrícula:</strong> ${alta.medico.matricula}</p>
          <p><strong>Especialidad:</strong> ${alta.medico.especialidad}</p>
          <p><strong>Sector:</strong> ${alta.medico.sector}</p>
        </div>

        <!-- Contacto -->
        <div class="col-md-6 mb-3">
          <h6 class="border-bottom pb-2"><i class="fas fa-address-book me-2"></i>Contacto</h6>
          <p><strong>Email paciente:</strong> ${alta.paciente.email || 'No disponible'}</p>
          <p><strong>Teléfono:</strong> ${alta.paciente.telefono || 'No disponible'}</p>
          <p><strong>Email médico:</strong> ${alta.medico.email || 'No disponible'}</p>
        </div>

        ${internacionHTML}
        ${instruccionesHTML}
      </div>
    `;

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }

  function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    const { page, totalPages } = pagination;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination justify-content-end mb-0">';
    
    // Anterior
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>`;
    
    // Páginas
    const maxPages = 5;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
    }

    // Siguiente
    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li></ul>`;
    
    container.innerHTML = html;

    // Eventos de paginación
    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.closest('.page-link').dataset.page);
        if (newPage && newPage !== page) {
          cargarAltas(newPage);
        }
      });
    });
  }

  function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearEstado(estado) {
    const estados = {
      'Estable': 'Estable',
      'Grave': 'Grave',
      'Critico': 'Crítico',
      'Fallecido': 'Fallecido',
      'Sin_Evaluar': 'Sin Evaluar'
    };
    return estados[estado] || estado;
  }

  function mostrarAlerta(tipo, mensaje) {
    const container = document.getElementById('alerta-container');
    const clase = tipo === 'success' ? 'alert-success' : 'alert-danger';
    
    container.innerHTML = `
      <div class="alert ${clase} alert-dismissible fade show">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    setTimeout(() => container.innerHTML = '', 5000);
  }
});