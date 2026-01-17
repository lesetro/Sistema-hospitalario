
document.addEventListener('DOMContentLoaded', () => {
  let modeloActual = 'sectores';
  let paginaActual = 1;

  // Configuración de modelos
  const modelos = {
    'sectores': { nombre: 'Sectores', campos: ['nombre', 'descripcion'] },
    'especialidades': { nombre: 'Especialidades', campos: ['nombre', 'descripcion'] },
    'obras-sociales': { nombre: 'Obras Sociales', campos: ['nombre', 'descripcion'] },
    'tratamientos': { nombre: 'Tratamientos', campos: ['nombre', 'descripcion'] },
    'tipos-estudio': { nombre: 'Tipos de Estudio', campos: ['nombre', 'categoria', 'requiere_ayuno'] },
    'tipos-diagnostico': { nombre: 'Tipos de Diagnóstico', campos: ['nombre', 'descripcion', 'sistema_clasificacion'] },
    'diagnosticos': { nombre: 'Diagnósticos', campos: ['codigo', 'nombre', 'tipo_diagnostico_id', 'descripcion'] },
    'motivos-admision': { nombre: 'Motivos de Admisión', campos: ['nombre', 'descripcion'] },
    'motivos-consulta': { nombre: 'Motivos de Consulta', campos: ['nombre', 'descripcion'] },
    'formas-ingreso': { nombre: 'Formas de Ingreso', campos: ['nombre', 'descripcion'] },
    'tipos-servicio': { nombre: 'Tipos de Servicio', campos: ['nombre', 'descripcion'] },
    'tipos-internacion': { nombre: 'Tipos de Internación', campos: ['nombre', 'descripcion'] },
    'tipos-turno': { nombre: 'Tipos de Turno', campos: ['nombre', 'descripcion'] }
  };

  cargarEstadisticas();
  cargarDatos();

  // Eventos de navegación
  document.querySelectorAll('.btn-modelo').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-modelo').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      modeloActual = this.dataset.modelo;
      paginaActual = 1;
      document.getElementById('titulo-modelo').textContent = modelos[modeloActual].nombre;
      cargarDatos();
    });
  });

  // Búsqueda
  let timeoutBusqueda;
  document.getElementById('busqueda')?.addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => cargarDatos(1), 500);
  });

  // Botón nuevo
  document.getElementById('btnNuevo')?.addEventListener('click', abrirModalNuevo);

  // Botón guardar
  document.getElementById('btnGuardar')?.addEventListener('click', guardar);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  async function cargarEstadisticas() {
    try {
      const response = await fetch('/configuracion/normalizadores/api/estadisticas');
      const data = await response.json();

      if (data.success) {
        const e = data.estadisticas;
        document.getElementById('stat-sectores').textContent = e.sectores;
        document.getElementById('stat-especialidades').textContent = e.especialidades;
        document.getElementById('stat-obras-sociales').textContent = e.obras_sociales;
        document.getElementById('stat-total').textContent = 
          e.sectores + e.especialidades + e.obras_sociales + e.tratamientos +
          e.tipos_estudio + e.tipos_diagnostico + e.diagnosticos;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  async function cargarDatos(page = 1) {
    try {
      const busqueda = document.getElementById('busqueda')?.value || '';
      const params = new URLSearchParams({ page, limit: 20, search: busqueda });

      const response = await fetch(`/configuracion/normalizadores/api/${modeloActual}?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTabla(data.datos);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar datos');
    }
  }

  function renderizarTabla(datos) {
    const tbody = document.getElementById('tabla-body');

    if (datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros</td></tr>';
      return;
    }

    tbody.innerHTML = datos.map(d => `
      <tr>
        <td>${d.id}</td>
        <td><strong>${d.nombre}</strong></td>
        <td>${d.descripcion || d.codigo || '-'}</td>
        <td>${d.tipoDiagnostico ? d.tipoDiagnostico.nombre : '-'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info" onclick="verDetalle(${d.id})" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-warning" onclick="editar(${d.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger" onclick="eliminar(${d.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function abrirModalNuevo() {
    document.getElementById('form-id').value = '';
    document.getElementById('form-datos').reset();
    document.getElementById('modalTitle').textContent = `Nuevo ${modelos[modeloActual].nombre.slice(0, -1)}`;
    
    // Mostrar campos según modelo
    generarFormulario();
    
    const modal = new bootstrap.Modal(document.getElementById('modalForm'));
    modal.show();
  }

  window.editar = async function(id) {
    try {
      const response = await fetch(`/configuracion/normalizadores/api/${modeloActual}/${id}`);
      const data = await response.json();

      if (data.success) {
        document.getElementById('form-id').value = id;
        document.getElementById('modalTitle').textContent = `Editar ${modelos[modeloActual].nombre.slice(0, -1)}`;
        
        generarFormulario(data.dato);
        
        const modal = new bootstrap.Modal(document.getElementById('modalForm'));
        modal.show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar datos');
    }
  };

  window.verDetalle = async function(id) {
    try {
      const response = await fetch(`/configuracion/normalizadores/api/${modeloActual}/${id}`);
      const data = await response.json();

      if (data.success) {
        const d = data.dato;
        let html = `
          <p><strong>ID:</strong> ${d.id}</p>
          <p><strong>Nombre:</strong> ${d.nombre}</p>
        `;

        if (d.codigo) html += `<p><strong>Código:</strong> ${d.codigo}</p>`;
        if (d.descripcion) html += `<p><strong>Descripción:</strong> ${d.descripcion}</p>`;
        if (d.tipoDiagnostico) html += `<p><strong>Tipo:</strong> ${d.tipoDiagnostico.nombre}</p>`;
        if (d.sistema_clasificacion) html += `<p><strong>Sistema:</strong> ${d.sistema_clasificacion}</p>`;
        if (d.categoria) html += `<p><strong>Categoría:</strong> ${d.categoria}</p>`;

        document.getElementById('detalle-contenido').innerHTML = html;

        const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
        modal.show();
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar detalle');
    }
  };

  window.eliminar = async function(id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      const response = await fetch(`/configuracion/normalizadores/api/${modeloActual}/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', 'Eliminado correctamente');
        cargarDatos(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar');
    }
  };

  async function guardar() {
    const id = document.getElementById('form-id').value;
    const form = document.getElementById('form-datos');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const formData = new FormData(form);
    const datos = Object.fromEntries(formData);

    try {
      const url = id ? 
        `/configuracion/normalizadores/api/${modeloActual}/${id}` :
        `/configuracion/normalizadores/api/${modeloActual}`;

      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalForm')).hide();
        mostrarAlerta('success', data.message);
        cargarDatos(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar');
    }
  }

  function generarFormulario(datos = {}) {
    const container = document.getElementById('form-campos');
    const campos = modelos[modeloActual].campos;
    
    let html = '';

    campos.forEach(campo => {
      if (campo === 'tipo_diagnostico_id') {
        html += `
          <div class="mb-3">
            <label class="form-label">Tipo de Diagnóstico *</label>
            <select name="${campo}" class="form-select" required>
              <option value="">Seleccione...</option>
            </select>
          </div>
        `;
      } else if (campo === 'categoria') {
        html += `
          <div class="mb-3">
            <label class="form-label">Categoría *</label>
            <select name="${campo}" class="form-select" required>
              <option value="">Seleccione...</option>
              <option value="Imagenología" ${datos.categoria === 'Imagenología' ? 'selected' : ''}>Imagenología</option>
              <option value="Laboratorio" ${datos.categoria === 'Laboratorio' ? 'selected' : ''}>Laboratorio</option>
              <option value="Fisiológico" ${datos.categoria === 'Fisiológico' ? 'selected' : ''}>Fisiológico</option>
            </select>
          </div>
        `;
      } else if (campo === 'requiere_ayuno') {
        html += `
          <div class="mb-3 form-check">
            <input type="checkbox" name="${campo}" class="form-check-input" ${datos[campo] ? 'checked' : ''}>
            <label class="form-check-label">Requiere ayuno</label>
          </div>
        `;
      } else if (campo === 'descripcion' || campo === 'sistema_clasificacion') {
        html += `
          <div class="mb-3">
            <label class="form-label">${campo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
            <textarea name="${campo}" class="form-control" rows="2">${datos[campo] || ''}</textarea>
          </div>
        `;
      } else {
        html += `
          <div class="mb-3">
            <label class="form-label">${campo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${campo === 'nombre' || campo === 'codigo' ? '*' : ''}</label>
            <input type="text" name="${campo}" class="form-control" value="${datos[campo] || ''}" ${campo === 'nombre' || campo === 'codigo' ? 'required' : ''}>
          </div>
        `;
      }
    });

    container.innerHTML = html;

    // Cargar tipos de diagnóstico si es necesario
    if (modeloActual === 'diagnosticos') {
      cargarTiposDiagnostico(datos.tipo_diagnostico_id);
    }
  }

  async function cargarTiposDiagnostico(seleccionado) {
    const select = document.querySelector('select[name="tipo_diagnostico_id"]');
    const response = await fetch('/configuracion/normalizadores/api/tipos-diagnostico/lista');
    const data = await response.json();

    if (data.success) {
      data.tipos.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.nombre;
        if (t.id === seleccionado) option.selected = true;
        select.appendChild(option);
      });
    }
  }

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
          cargarDatos(newPage);
        }
      });
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