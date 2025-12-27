document.addEventListener('DOMContentLoaded', () => {
  let paginaActual = 1;
  let mostrarAntiguas = false;
  let busqueda = '';

  cargarEstadisticas();
  cargarNoticias();

  // Búsqueda
  let timeoutBusqueda;
  document.getElementById('busqueda')?.addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    busqueda = this.value;
    timeoutBusqueda = setTimeout(() => {
      paginaActual = 1;
      cargarNoticias();
    }, 500);
  });

  // Checkbox antiguas
  document.getElementById('mostrarAntiguas')?.addEventListener('change', function() {
    mostrarAntiguas = this.checked;
    paginaActual = 1;
    cargarNoticias();
  });

  // Botón nueva noticia
  document.getElementById('btnNuevaNoticia')?.addEventListener('click', abrirModalNueva);

  // Botón guardar
  document.getElementById('btnGuardar')?.addEventListener('click', guardarNoticia);

  async function cargarEstadisticas() {
    try {
      const response = await fetch('/noticias/api/estadisticas');
      const data = await response.json();
      if (data.success) {
        document.getElementById('stat-total').textContent = data.estadisticas.total;
        document.getElementById('stat-activas').textContent = data.estadisticas.activas;
        document.getElementById('stat-mes').textContent = data.estadisticas.mes_actual;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  async function cargarNoticias(page = 1) {
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        search: busqueda,
        mostrar_antiguas: mostrarAntiguas
      });

      const response = await fetch(`/noticias/api/lista?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTabla(data.noticias);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar noticias');
    }
  }

  function renderizarTabla(noticias) {
    const tbody = document.getElementById('tabla-noticias');

    if (noticias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay noticias</td></tr>';
      return;
    }

    tbody.innerHTML = noticias.map(n => {
      const badgeEstado = n.es_antigua ? 
        '<span class="badge bg-danger"><i class="fas fa-eye-slash me-1"></i>Oculta</span>' :
        '<span class="badge bg-success"><i class="fas fa-eye me-1"></i>Visible</span>';

      return `
        <tr>
          <td>${formatearFecha(n.fecha)}</td>
          <td>
            <strong>${n.titulo}</strong><br>
            <small class="text-muted">${n.texto}</small>
          </td>
          <td>${n.autor}</td>
          <td>${badgeEstado}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-info" onclick="verDetalle(${n.id})" title="Ver">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-warning" onclick="editar(${n.id})" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              ${n.es_antigua ? 
                `<button class="btn btn-success" onclick="restaurar(${n.id})" title="Restaurar">
                  <i class="fas fa-undo"></i>
                </button>` :
                `<button class="btn btn-danger" onclick="eliminar(${n.id})" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>`
              }
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.verDetalle = async function(id) {
    try {
      const response = await fetch(`/noticias/api/detalle/${id}`);
      const data = await response.json();

      if (data.success) {
        const n = data.noticia;
        document.getElementById('detalle-contenido').innerHTML = `
          <p><strong>Título:</strong> ${n.titulo}</p>
          <p><strong>Fecha:</strong> ${formatearFecha(n.fecha)}</p>
          <p><strong>Autor:</strong> ${n.autor}</p>
          <p><strong>Estado:</strong> ${n.es_antigua ? 'Oculta' : 'Visible'}</p>
          <hr>
          <h6>Contenido:</h6>
          <p style="white-space: pre-wrap;">${n.texto}</p>
        `;
        new bootstrap.Modal(document.getElementById('modalDetalle')).show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar detalle');
    }
  };

  function abrirModalNueva() {
    document.getElementById('form-id').value = '';
    document.getElementById('form-noticia').reset();
    document.getElementById('modalTitle').textContent = 'Nueva Noticia';
    new bootstrap.Modal(document.getElementById('modalForm')).show();
  }

  window.editar = async function(id) {
    try {
      const response = await fetch(`/noticias/api/detalle/${id}`);
      const data = await response.json();

      if (data.success) {
        const n = data.noticia;
        document.getElementById('form-id').value = id;
        document.getElementById('form-titulo').value = n.titulo;
        document.getElementById('form-texto').value = n.texto;
        document.getElementById('form-fecha').value = n.fecha.split('T')[0];
        document.getElementById('modalTitle').textContent = 'Editar Noticia';
        new bootstrap.Modal(document.getElementById('modalForm')).show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar noticia');
    }
  };

  async function guardarNoticia() {
    const id = document.getElementById('form-id').value;
    const form = document.getElementById('form-noticia');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData);

    try {
      const url = id ? `/noticias/api/actualizar/${id}` : '/noticias/api/crear';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalForm')).hide();
        mostrarAlerta('success', data.message);
        cargarNoticias(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar');
    }
  }

  window.eliminar = async function(id) {
    if (!confirm('¿Eliminar esta noticia? Se ocultará del home.')) return;

    try {
      const response = await fetch(`/noticias/api/eliminar/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', data.message);
        cargarNoticias(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar');
    }
  };

  window.restaurar = async function(id) {
    try {
      const response = await fetch(`/noticias/api/restaurar/${id}`, { method: 'PUT' });
      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', data.message);
        cargarNoticias(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al restaurar');
    }
  };

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
        if (newPage && newPage !== page) cargarNoticias(newPage);
      });
    });
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-AR', { 
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  }

  function mostrarAlerta(tipo, mensaje) {
    const container = document.getElementById('alerta-container');
    const clase = tipo === 'success' ? 'alert-success' : 'alert-danger';
    container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
      ${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }
});

