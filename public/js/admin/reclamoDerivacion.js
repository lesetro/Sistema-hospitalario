
document.addEventListener('DOMContentLoaded', () => {
  let seccionActual = 'reclamos';
  let paginaActual = 1;

  cargarEstadisticasReclamos();
  cargarEstadisticasDerivaciones();
  cargarReclamos();

  // Tabs de navegación
  document.querySelectorAll('.btn-seccion').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-seccion').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      seccionActual = this.dataset.seccion;
      paginaActual = 1;
      
      if (seccionActual === 'reclamos') {
        document.getElementById('filtros-reclamos').classList.remove('d-none');
        document.getElementById('filtros-derivaciones').classList.add('d-none');
        cargarReclamos();
      } else {
        document.getElementById('filtros-reclamos').classList.add('d-none');
        document.getElementById('filtros-derivaciones').classList.remove('d-none');
        cargarDerivaciones();
      }
    });
  });

  // ============================================================================
  // RECLAMOS
  // ============================================================================
  async function cargarEstadisticasReclamos() {
    try {
      const response = await fetch('/reclamos-derivaciones/api/reclamos/estadisticas');
      const data = await response.json();

      if (data.success) {
        document.getElementById('reclamos-total').textContent = data.estadisticas.total;
        document.getElementById('reclamos-pendientes').textContent = data.estadisticas.pendientes;
        document.getElementById('reclamos-resueltos').textContent = data.estadisticas.resueltos;
        document.getElementById('reclamos-hoy').textContent = data.estadisticas.hoy;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function cargarReclamos(page = 1) {
    try {
      showLoading();

      const estado = document.getElementById('reclamos-estado')?.value || '';
      const fechaDesde = document.getElementById('reclamos-fecha-desde')?.value || '';
      const fechaHasta = document.getElementById('reclamos-fecha-hasta')?.value || '';
      const busqueda = document.getElementById('reclamos-busqueda')?.value || '';

      const params = new URLSearchParams({
        page, limit: 10, estado, fecha_desde: fechaDesde, fecha_hasta: fechaHasta, busqueda
      });

      const response = await fetch(`/reclamos-derivaciones/api/reclamos?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarReclamos(data.reclamos);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      mostrarAlerta('error', 'Error al cargar reclamos');
    }
  }

  function renderizarReclamos(reclamos) {
    const tbody = document.getElementById('tabla-contenido');

    if (reclamos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reclamos</td></tr>';
      return;
    }

    tbody.innerHTML = reclamos.map(r => `
      <tr>
        <td>#${r.id}</td>
        <td>${r.usuario}<br><small class="text-muted">DNI: ${r.dni}</small></td>
        <td>${r.texto.substring(0, 100)}${r.texto.length > 100 ? '...' : ''}</td>
        <td>${new Date(r.fecha).toLocaleDateString('es-AR')}</td>
        <td><span class="badge bg-${r.estado === 'Pendiente' ? 'warning' : 'success'}">${r.estado}</span></td>
        <td>
          <button class="btn btn-sm btn-info me-1" onclick="verDetalleReclamo(${r.id}, '${r.usuario}', '${r.dni}', \`${r.texto.replace(/`/g, '\\`')}\`, '${r.fecha}', '${r.estado}')">
            <i class="fas fa-eye"></i>
          </button>
          ${r.estado === 'Pendiente' ? `
            <button class="btn btn-sm btn-success" onclick="cambiarEstadoReclamo(${r.id}, 'Resuelto')">
              <i class="fas fa-check"></i> Resolver
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  window.verDetalleReclamo = function(id, usuario, dni, texto, fecha, estado) {
    document.getElementById('detalle-reclamo-usuario').textContent = usuario;
    document.getElementById('detalle-reclamo-dni').textContent = dni;
    document.getElementById('detalle-reclamo-fecha').textContent = new Date(fecha).toLocaleDateString('es-AR');
    document.getElementById('detalle-reclamo-estado').innerHTML = 
      `<span class="badge bg-${estado === 'Pendiente' ? 'warning' : 'success'}">${estado}</span>`;
    document.getElementById('detalle-reclamo-texto').textContent = texto;

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleReclamo'));
    modal.show();
  };

  window.cambiarEstadoReclamo = async function(id, estado) {
    if (!confirm(`¿Marcar reclamo como ${estado}?`)) return;

    try {
      const response = await fetch(`/reclamos-derivaciones/api/reclamos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', data.message);
        cargarReclamos(paginaActual);
        cargarEstadisticasReclamos();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cambiar estado');
    }
  };

  // ============================================================================
  // DERIVACIONES
  // ============================================================================
  async function cargarEstadisticasDerivaciones() {
    try {
      const response = await fetch('/reclamos-derivaciones/api/derivaciones/estadisticas');
      const data = await response.json();

      if (data.success) {
        document.getElementById('derivaciones-total').textContent = data.estadisticas.total;
        document.getElementById('derivaciones-pendientes').textContent = data.estadisticas.pendientes;
        document.getElementById('derivaciones-internas').textContent = data.estadisticas.internas;
        document.getElementById('derivaciones-externas').textContent = data.estadisticas.externas;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function cargarDerivaciones(page = 1) {
    try {
      showLoading();

      const estado = document.getElementById('derivaciones-estado')?.value || '';
      const tipo = document.getElementById('derivaciones-tipo')?.value || '';
      const sector = document.getElementById('derivaciones-sector')?.value || '';

      const params = new URLSearchParams({ page, limit: 10, estado, tipo, sector_origen: sector });

      const response = await fetch(`/reclamos-derivaciones/api/derivaciones?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarDerivaciones(data.derivaciones);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      mostrarAlerta('error', 'Error al cargar derivaciones');
    }
  }

  function renderizarDerivaciones(derivaciones) {
    const tbody = document.getElementById('tabla-contenido');

    if (derivaciones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay derivaciones</td></tr>';
      return;
    }

    tbody.innerHTML = derivaciones.map(d => `
      <tr>
        <td>#${d.id}</td>
        <td>${d.paciente}<br><small class="text-muted">DNI: ${d.dni}</small></td>
        <td>${d.origen}</td>
        <td>${d.destino}</td>
        <td><span class="badge bg-${d.tipo === 'Interna' ? 'info' : 'warning'}">${d.tipo}</span></td>
        <td><span class="badge bg-${getEstadoBadge(d.estado)}">${d.estado}</span></td>
        <td>${new Date(d.fecha).toLocaleDateString('es-AR')}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info" onclick="verDetalleDerivacion(${d.id})">
              <i class="fas fa-eye"></i>
            </button>
            ${d.estado === 'Pendiente' ? `
              <button class="btn btn-warning" onclick="abrirModalEditarDerivacion(${d.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-success" onclick="cambiarEstadoDerivacion(${d.id}, 'Aprobada')">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-danger" onclick="rechazarDerivacion(${d.id})">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.verDetalleDerivacion = async function(id) {
    try {
      const response = await fetch(`/reclamos-derivaciones/api/derivaciones/${id}/detalles`);
      const data = await response.json();

      if (data.success) {
        const d = data.derivacion;
        
        document.getElementById('detalle-derivacion-paciente').textContent = 
          `${d.paciente.usuario.nombre} ${d.paciente.usuario.apellido}`;
        document.getElementById('detalle-derivacion-dni').textContent = d.paciente.usuario.dni;
        document.getElementById('detalle-derivacion-origen').textContent = d.origen.nombre;
        document.getElementById('detalle-derivacion-destino').textContent = d.destino?.nombre || 'Hospital externo';
        document.getElementById('detalle-derivacion-tipo').innerHTML = 
          `<span class="badge bg-${d.tipo === 'Interna' ? 'info' : 'warning'}">${d.tipo}</span>`;
        document.getElementById('detalle-derivacion-estado').innerHTML = 
          `<span class="badge bg-${getEstadoBadge(d.estado)}">${d.estado}</span>`;
        document.getElementById('detalle-derivacion-motivo').textContent = d.motivo || 'Sin especificar';

        // Recursos disponibles
        const recursosDiv = document.getElementById('detalle-recursos');
        if (d.recursos) {
          recursosDiv.innerHTML = `
            <div class="alert alert-${d.recursos.puede_derivar ? 'success' : 'danger'}">
              <strong>Recursos disponibles:</strong><br>
               Camas: ${d.recursos.camas_disponibles}<br>
               Médicos: ${d.recursos.medicos_disponibles}<br>
              ${d.recursos.puede_derivar ? '✅ Puede derivarse' : '❌ No hay recursos suficientes'}
            </div>
          `;
        } else {
          recursosDiv.innerHTML = '';
        }

        const modal = new bootstrap.Modal(document.getElementById('modalDetalleDerivacion'));
        modal.show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar detalles');
    }
  };

  window.abrirModalEditarDerivacion = async function(id) {
    try {
      const response = await fetch(`/reclamos-derivaciones/api/derivaciones/${id}/detalles`);
      const data = await response.json();

      if (data.success) {
        const d = data.derivacion;
        
        document.getElementById('editar-id').value = d.id;
        document.getElementById('editar-tipo').value = d.tipo;
        document.getElementById('editar-destino').value = d.destino_id || '';
        document.getElementById('editar-motivo').value = d.motivo || '';

        // Mostrar/ocultar destino según tipo
        document.getElementById('editar-tipo').dispatchEvent(new Event('change'));

        const modal = new bootstrap.Modal(document.getElementById('modalEditarDerivacion'));
        modal.show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar derivación');
    }
  };

  document.getElementById('editar-tipo')?.addEventListener('change', function() {
    const destinoDiv = document.getElementById('campo-destino');
    if (this.value === 'Externa') {
      destinoDiv.classList.add('d-none');
      document.getElementById('editar-destino').required = false;
    } else {
      destinoDiv.classList.remove('d-none');
      document.getElementById('editar-destino').required = true;
    }
  });

  document.getElementById('btnGuardarDerivacion')?.addEventListener('click', async function() {
    const id = document.getElementById('editar-id').value;
    const tipo = document.getElementById('editar-tipo').value;
    const destinoId = document.getElementById('editar-destino').value;
    const motivo = document.getElementById('editar-motivo').value;

    if (!tipo || !motivo || (tipo === 'Interna' && !destinoId)) {
      mostrarAlerta('warning', 'Complete todos los campos obligatorios');
      return;
    }

    try {
      this.disabled = true;
      const response = await fetch(`/reclamos-derivaciones/api/derivaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, destino_id: destinoId || null, motivo })
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarDerivacion')).hide();
        mostrarAlerta('success', 'Derivación actualizada');
        cargarDerivaciones(paginaActual);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al actualizar');
    } finally {
      this.disabled = false;
    }
  });

  window.cambiarEstadoDerivacion = async function(id, estado) {
    if (!confirm(`¿${estado === 'Aprobada' ? 'Aprobar' : 'Cambiar'} esta derivación?`)) return;

    try {
      const response = await fetch(`/reclamos-derivaciones/api/derivaciones/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', data.message);
        cargarDerivaciones(paginaActual);
        cargarEstadisticasDerivaciones();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cambiar estado');
    }
  };

  window.rechazarDerivacion = async function(id) {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (!motivo) return;

    try {
      const response = await fetch(`/reclamos-derivaciones/api/derivaciones/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Rechazada', motivo_rechazo: motivo })
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', 'Derivación rechazada');
        cargarDerivaciones(paginaActual);
        cargarEstadisticasDerivaciones();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al rechazar');
    }
  };

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

    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li></ul>`;
    
    container.innerHTML = html;

    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.dataset.page);
        if (newPage && newPage !== page) {
          if (seccionActual === 'reclamos') {
            cargarReclamos(newPage);
          } else {
            cargarDerivaciones(newPage);
          }
        }
      });
    });
  }

  function getEstadoBadge(estado) {
    const colores = { 'Pendiente': 'warning', 'Aprobada': 'success', 'Rechazada': 'danger' };
    return colores[estado] || 'secondary';
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
    container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
      ${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }

  // Filtros
  document.getElementById('reclamos-estado')?.addEventListener('change', () => cargarReclamos(1));
  document.getElementById('derivaciones-estado')?.addEventListener('change', () => cargarDerivaciones(1));
  document.getElementById('derivaciones-tipo')?.addEventListener('change', () => cargarDerivaciones(1));
  document.getElementById('derivaciones-sector')?.addEventListener('change', () => cargarDerivaciones(1));
});