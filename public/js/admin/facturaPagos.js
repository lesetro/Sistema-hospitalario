document.addEventListener('DOMContentLoaded', () => {
  let paginaActual = 1;
  const limit = 10;

  cargarFacturas();

  // ============================================================================
  // CARGAR FACTURAS
  // ============================================================================
  async function cargarFacturas(page = 1) {
    try {
      showLoading();

      const busqueda = document.getElementById('busqueda')?.value || '';
      const estado = document.getElementById('filtro-estado')?.value || '';
      const tipoPago = document.getElementById('filtro-tipo-pago')?.value || '';
      const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
      const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';

      const params = new URLSearchParams({
        page, limit, busqueda, estado, tipo_pago: tipoPago, fecha_desde: fechaDesde, fecha_hasta: fechaHasta
      });

      const response = await fetch(`/facturas/api/lista?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTablaFacturas(data.facturas);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }

      hideLoading();
    } catch (error) {
      console.error('Error:', error);
      hideLoading();
      mostrarAlerta('error', 'Error al cargar facturas');
    }
  }

  // ============================================================================
  // RENDERIZAR TABLA
  // ============================================================================
  function renderizarTablaFacturas(facturas) {
    const tbody = document.getElementById('tabla-facturas-body');

    if (facturas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay facturas</td></tr>';
      return;
    }

    tbody.innerHTML = facturas.map(f => `
      <tr>
        <td>#${f.id}</td>
        <td>${f.paciente}<br><small class="text-muted">DNI: ${f.dni}</small></td>
        <td>$${parseFloat(f.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        <td>${f.obra_social}</td>
        <td><span class="badge bg-${getTipoPagoBadge(f.tipo_pago)}">${f.tipo_pago}</span></td>
        <td><span class="badge bg-${getEstadoBadge(f.estado)}">${f.estado}</span></td>
        <td>$${parseFloat(f.totalPagado).toLocaleString('es-AR')}</td>
        <td class="${parseFloat(f.saldo) > 0 ? 'text-danger' : 'text-success'}">$${parseFloat(f.saldo).toLocaleString('es-AR')}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info btn-ver-detalles" data-id="${f.id}" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            ${f.estado === 'Pendiente' && parseFloat(f.saldo) > 0 ? `
              <button class="btn btn-success btn-registrar-pago" data-id="${f.id}" data-saldo="${f.saldo}" title="Registrar pago">
                <i class="fas fa-dollar-sign"></i>
              </button>
            ` : ''}
            ${f.estado === 'Pendiente' && f.cantidadPagos === 0 ? `
              <button class="btn btn-danger btn-anular" data-id="${f.id}" title="Anular">
                <i class="fas fa-ban"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    agregarEventosBotones();
  }

  // ============================================================================
  // EVENTOS BOTONES
  // ============================================================================
  function agregarEventosBotones() {
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
      btn.addEventListener('click', function() {
        verDetalles(this.dataset.id);
      });
    });

    document.querySelectorAll('.btn-registrar-pago').forEach(btn => {
      btn.addEventListener('click', function() {
        abrirModalPago(this.dataset.id, this.dataset.saldo);
      });
    });

    document.querySelectorAll('.btn-anular').forEach(btn => {
      btn.addEventListener('click', function() {
        abrirModalAnular(this.dataset.id);
      });
    });
  }

  // ============================================================================
  // VER DETALLES
  // ============================================================================
  async function verDetalles(id) {
    try {
      const response = await fetch(`/facturas/api/${id}/detalles`);
      const data = await response.json();

      if (data.success) {
        mostrarModalDetalles(data.factura);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al cargar detalles');
    }
  }

  function mostrarModalDetalles(factura) {
    document.getElementById('detalle-id').textContent = `#${factura.id}`;
    document.getElementById('detalle-paciente').textContent = `${factura.paciente.usuario.nombre} ${factura.paciente.usuario.apellido}`;
    document.getElementById('detalle-dni').textContent = factura.paciente.usuario.dni;
    document.getElementById('detalle-monto').textContent = `$${parseFloat(factura.monto).toLocaleString('es-AR')}`;
    document.getElementById('detalle-pagado').textContent = `$${parseFloat(factura.totalPagado).toLocaleString('es-AR')}`;
    document.getElementById('detalle-saldo').textContent = `$${parseFloat(factura.saldo).toLocaleString('es-AR')}`;
    document.getElementById('detalle-obra-social').textContent = factura.obra_social?.nombre || 'Sin obra social';
    document.getElementById('detalle-tipo-pago').innerHTML = `<span class="badge bg-${getTipoPagoBadge(factura.tipo_pago)}">${factura.tipo_pago}</span>`;
    document.getElementById('detalle-estado').innerHTML = `<span class="badge bg-${getEstadoBadge(factura.estado)}">${factura.estado}</span>`;
    document.getElementById('detalle-fecha').textContent = new Date(factura.fecha_emision).toLocaleDateString('es-AR');
    document.getElementById('detalle-descripcion').textContent = factura.descripcion;

    // Historial de pagos
    const tbody = document.getElementById('historial-pagos');
    if (factura.pagos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin pagos registrados</td></tr>';
    } else {
      tbody.innerHTML = factura.pagos.map(p => `
        <tr>
          <td>${new Date(p.fecha).toLocaleDateString('es-AR')}</td>
          <td>$${parseFloat(p.monto).toLocaleString('es-AR')}</td>
          <td>${p.metodo}</td>
          <td><span class="badge bg-${getEstadoBadge(p.estado)}">${p.estado}</span></td>
        </tr>
      `).join('');
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
  }

  // ============================================================================
  // NUEVA FACTURA
  // ============================================================================
  document.getElementById('btnNuevaFactura')?.addEventListener('click', () => {
    document.getElementById('form-nueva-factura').reset();
    document.getElementById('detalles-calculo').innerHTML = '';
    document.getElementById('monto-calculado').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaFactura'));
    modal.show();
  });

  // Cargar admisiones al seleccionar paciente
  document.getElementById('nueva-paciente')?.addEventListener('change', async function() {
    const pacienteId = this.value;
    if (!pacienteId) return;

    try {
      const response = await fetch(`/facturas/api/paciente/${pacienteId}/admisiones`);
      const data = await response.json();

      const select = document.getElementById('nueva-admision');
      select.innerHTML = '<option value="">Seleccione admisión...</option>';
      
      if (data.admisiones && data.admisiones.length > 0) {
        data.admisiones.forEach(adm => {
          const option = document.createElement('option');
          option.value = adm.id;
          option.textContent = `${new Date(adm.fecha).toLocaleDateString()} - ${adm.medico?.usuario.nombre || 'Sin médico'} - ${adm.sector?.nombre || ''}`;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option value="">Sin admisiones completadas</option>';
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });

  // Calcular monto automáticamente
  document.getElementById('btnCalcularMonto')?.addEventListener('click', async () => {
    const admisionId = document.getElementById('nueva-admision').value;
    const pacienteId = document.getElementById('nueva-paciente').value;

    if (!admisionId) {
      mostrarAlerta('warning', 'Seleccione una admisión');
      return;
    }

    try {
      const response = await fetch('/facturas/api/calcular-monto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admision_id: admisionId,
          paciente_id: pacienteId,
          incluir_estudios: document.getElementById('incluir-estudios')?.checked,
          incluir_medicamentos: document.getElementById('incluir-medicamentos')?.checked
        })
      });

      const data = await response.json();

      if (data.success) {
        document.getElementById('monto-calculado').value = data.montoTotal;
        
        const detallesDiv = document.getElementById('detalles-calculo');
        detallesDiv.innerHTML = '<h6>Detalles del cálculo:</h6><ul class="list-group">';
        data.detalles.forEach(d => {
          detallesDiv.innerHTML += `<li class="list-group-item d-flex justify-content-between">
            <span>${d.concepto}</span>
            <strong>$${d.monto.toLocaleString('es-AR')}</strong>
          </li>`;
        });
        detallesDiv.innerHTML += `</ul><div class="alert alert-success mt-2">Total: $${data.montoTotal}</div>`;
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al calcular monto');
    }
  });

  // Calcular porcentajes obra social
  document.getElementById('porcentaje-obra-social')?.addEventListener('input', function() {
    const monto = parseFloat(document.getElementById('monto-calculado').value) || 0;
    const porcentaje = parseFloat(this.value) || 0;
    
    const montoOS = (monto * porcentaje) / 100;
    const montoHospital = monto - montoOS;

    document.getElementById('info-division').innerHTML = `
      <div class="alert alert-info">
        <strong>División de factura:</strong><br>
        Obra Social (${porcentaje}%): $${montoOS.toLocaleString('es-AR', {minimumFractionDigits: 2})}<br>
        Hospital Público (${100-porcentaje}%): $${montoHospital.toLocaleString('es-AR', {minimumFractionDigits: 2})}
      </div>
    `;
  });

  // Crear factura
  document.getElementById('btnCrearFactura')?.addEventListener('click', async function() {
    const formData = {
      paciente_id: document.getElementById('nueva-paciente').value,
      monto: document.getElementById('monto-calculado').value,
      descripcion: document.getElementById('nueva-descripcion').value,
      admision_id: document.getElementById('nueva-admision').value,
      obra_social_id: document.getElementById('nueva-obra-social').value,
      porcentaje_obra_social: document.getElementById('porcentaje-obra-social').value || 0
    };

    if (!formData.paciente_id || !formData.monto) {
      mostrarAlerta('warning', 'Complete los campos obligatorios');
      return;
    }

    try {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';

      const response = await fetch('/facturas/api/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalNuevaFactura')).hide();
        mostrarAlerta('success', data.message);
        cargarFacturas(paginaActual);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al crear factura');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-save me-2"></i>Crear Factura';
    }
  });

  // ============================================================================
  // REGISTRAR PAGO
  // ============================================================================
  function abrirModalPago(id, saldo) {
    document.getElementById('pago-factura-id').value = id;
    document.getElementById('pago-monto').value = saldo;
    document.getElementById('pago-monto').max = saldo;
    document.getElementById('info-saldo').textContent = `Saldo pendiente: $${parseFloat(saldo).toLocaleString('es-AR')}`;
    const modal = new bootstrap.Modal(document.getElementById('modalPago'));
    modal.show();
  }

  document.getElementById('btnConfirmarPago')?.addEventListener('click', async function() {
    const id = document.getElementById('pago-factura-id').value;
    const monto = document.getElementById('pago-monto').value;
    const metodo = document.getElementById('pago-metodo').value;

    if (!monto || !metodo) {
      mostrarAlerta('warning', 'Complete todos los campos');
      return;
    }

    try {
      this.disabled = true;
      const response = await fetch(`/facturas/api/${id}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, metodo })
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalPago')).hide();
        mostrarAlerta('success', 'Pago registrado correctamente');
        cargarFacturas(paginaActual);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al registrar pago');
    } finally {
      this.disabled = false;
    }
  });

  // ============================================================================
  // ANULAR FACTURA
  // ============================================================================
  function abrirModalAnular(id) {
    document.getElementById('anular-id').value = id;
    document.getElementById('anular-motivo').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalAnular'));
    modal.show();
  }

  document.getElementById('btnConfirmarAnular')?.addEventListener('click', async function() {
    const id = document.getElementById('anular-id').value;
    const motivo = document.getElementById('anular-motivo').value;

    if (!motivo.trim()) {
      mostrarAlerta('warning', 'Ingrese un motivo');
      return;
    }

    try {
      this.disabled = true;
      const response = await fetch(`/facturas/api/${id}/anular`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalAnular')).hide();
        mostrarAlerta('success', 'Factura anulada');
        cargarFacturas(paginaActual);
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al anular factura');
    } finally {
      this.disabled = false;
    }
  });

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    const { page, totalPages } = pagination;

    let html = '<ul class="pagination justify-content-end mb-0">';
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>`;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        html += `<li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
    }

    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li></ul>`;
    
    container.innerHTML = html;

    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.dataset.page);
        if (newPage && newPage !== page) cargarFacturas(newPage);
      });
    });
  }

  function getTipoPagoBadge(tipo) {
    const colores = {
      'SISTEMA PUBLICO': 'success',
      'Obra Social': 'primary',
      'Efectivo': 'secondary',
      'Tarjeta': 'info'
    };
    return colores[tipo] || 'secondary';
  }

  function getEstadoBadge(estado) {
    return { 'Pagada': 'success', 'Completado': 'success', 'Pendiente': 'warning', 'Cancelada': 'danger' }[estado] || 'secondary';
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
  document.getElementById('busqueda')?.addEventListener('input', () => cargarFacturas(1));
  document.getElementById('filtro-estado')?.addEventListener('change', () => cargarFacturas(1));
  document.getElementById('filtro-tipo-pago')?.addEventListener('change', () => cargarFacturas(1));
  document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-tipo-pago').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    cargarFacturas(1);
  });
});