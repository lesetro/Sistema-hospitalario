let paginaActual = 1;
const itemsPorPagina = 10;
let itemActual = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  cargarRecientes();
  cargarPacientesParaFiltro();
  cargarItems();
  
  // Formulario de filtros
  document.getElementById('formFiltros').addEventListener('submit', function(e) {
    e.preventDefault();
    paginaActual = 1;
    cargarItems();
  });
  
  // Formulario nuevo
  document.getElementById('formNuevo').addEventListener('submit', function(e) {
    e.preventDefault();
    crear();
  });
  
  // Formulario editar
  document.getElementById('formEditar').addEventListener('submit', function(e) {
    e.preventDefault();
    actualizar();
  });
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/recetas-certificados/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-recetas').textContent = data.data.totalRecetas;
      document.getElementById('stat-certificados').textContent = data.data.totalCertificados;
      document.getElementById('stat-mes').textContent = data.data.esteMes;
      document.getElementById('stat-semana').textContent = data.data.estaSemana;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Cargar recientes
async function cargarRecientes() {
  try {
    const response = await fetch('/medico/recetas-certificados/api/items/recientes?limite=5');
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-recientes');
    const listaDiv = document.getElementById('lista-recientes');
    
    loadingDiv.classList.add('d-none');
    listaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      listaDiv.innerHTML = `
        <div class="list-group list-group-flush">
          ${data.data.map(item => {
            const fecha = new Date(item.fecha);
            const tipoIcon = item.tipo === 'Receta Medica' ? 'prescription' : 'certificate';
            const tipoColor = item.tipo === 'Receta Medica' ? 'primary' : 'success';
            
            return `
              <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <h6 class="mb-1">
                      <i class="fas fa-${tipoIcon} text-${tipoColor} me-2"></i>
                      ${item.tipo}
                    </h6>
                    <p class="mb-1">
                      <strong>Paciente:</strong> ${item.paciente.usuario.nombre} ${item.paciente.usuario.apellido}
                    </p>
                    <p class="mb-0 text-muted small">
                      ${item.contenido.substring(0, 80)}...
                    </p>
                  </div>
                  <small class="text-muted">${fecha.toLocaleDateString('es-AR')}</small>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      listaDiv.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-file-prescription fa-3x mb-3"></i>
          <p>No hay emisiones recientes</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar recientes:', error);
  }
}

// Cargar pacientes para filtro
async function cargarPacientesParaFiltro() {
  try {
    const response = await fetch('/medico/recetas-certificados/api/pacientes-filtro');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('filtroPaciente');
      
      data.data.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = `${paciente.usuario.nombre} ${paciente.usuario.apellido} (${paciente.usuario.dni})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
  }
}

// Cargar items
async function cargarItems(pagina = paginaActual) {
  try {
    const formData = new FormData(document.getElementById('formFiltros'));
    const params = new URLSearchParams();
    
    params.append('page', pagina);
    params.append('limit', itemsPorPagina);
    
    for (let [key, value] of formData.entries()) {
      if (value) params.append(key, value);
    }
    
    const response = await fetch(`/medico/recetas-certificados/api/items?${params.toString()}`);
    const data = await response.json();
    
    const loadingDiv = document.getElementById('loading-items');
    const tablaDiv = document.getElementById('tabla-items');
    
    loadingDiv.classList.add('d-none');
    tablaDiv.classList.remove('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarItems(data.data);
      mostrarPaginacion(data.pagination);
    } else {
      document.getElementById('tbody-items').innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3 d-block"></i>
            <p class="text-muted">No se encontraron registros</p>
          </td>
        </tr>
      `;
      document.getElementById('paginacion').innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar items:', error);
    mostrarAlerta('error', 'Error al cargar registros');
  }
}

// Mostrar items en la tabla
function mostrarItems(items) {
  const tbody = document.getElementById('tbody-items');
  
  tbody.innerHTML = items.map(item => {
    const fecha = new Date(item.fecha);
    const tipoIcon = item.tipo === 'Receta Medica' ? 'prescription' : 'certificate';
    const tipoColor = item.tipo === 'Receta Medica' ? 'primary' : 'success';
    
    return `
      <tr>
        <td>
          <span class="badge bg-${tipoColor}">
            <i class="fas fa-${tipoIcon} me-1"></i>
            ${item.tipo}
          </span>
        </td>
        <td>
          <strong>${item.paciente?.usuario?.nombre || 'N/A'} ${item.paciente?.usuario?.apellido || ''}</strong>
          <br>
          <small class="text-muted">DNI: ${item.paciente?.usuario?.dni || 'N/A'}</small>
        </td>
        <td>
          ${fecha.toLocaleDateString('es-AR')}
          <br>
          <small class="text-muted">${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
        </td>
        <td>
          <small>${item.contenido.substring(0, 60)}${item.contenido.length > 60 ? '...' : ''}</small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" 
                    onclick="verDetalle(${item.id})"
                    title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" 
                    onclick="mostrarModalEditar(${item.id})"
                    title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" 
                    onclick="eliminar(${item.id})"
                    title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" 
                    onclick="generarPDF(${item.id})"
                    title="Generar PDF">
              <i class="fas fa-file-pdf"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Mostrar paginación
function mostrarPaginacion(pagination) {
  const paginacionDiv = document.getElementById('paginacion');
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${pagination.page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 || 
      i === pagination.totalPages || 
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      html += `
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">
            ${i}
          </a>
        </li>
      `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  html += `
    <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cambiarPagina(${pagination.page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginacionDiv.innerHTML = html;
}

// Cambiar página
function cambiarPagina(pagina) {
  paginaActual = pagina;
  cargarItems(pagina);
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// Mostrar modal nuevo
function mostrarModalNuevo() {
  document.getElementById('formNuevo').reset();
  new bootstrap.Modal(document.getElementById('modalNuevo')).show();
}

// Crear
async function crear() {
  try {
    const formData = new FormData(document.getElementById('formNuevo'));
    const data = Object.fromEntries(formData.entries());
    
    data.paciente_id = parseInt(data.paciente_id);
    if (data.evaluacion_medica_id) {
      data.evaluacion_medica_id = parseInt(data.evaluacion_medica_id);
    }
    
    const response = await fetch('/medico/recetas-certificados/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalNuevo')).hide();
      cargarItems();
      cargarEstadisticas();
      cargarRecientes();
    } else {
      mostrarAlerta('error', result.message || 'Error al crear');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear');
  }
}

// Ver detalle
async function verDetalle(id) {
  try {
    const response = await fetch(`/medico/recetas-certificados/api/items/${id}`);
    const data = await response.json();
    
    if (data.success) {
      itemActual = data.data;
      const item = data.data;
      const fecha = new Date(item.fecha);
      const tipoIcon = item.tipo === 'Receta Medica' ? 'prescription' : 'certificate';
      const tipoColor = item.tipo === 'Receta Medica' ? 'primary' : 'success';
      
      document.getElementById('modalDetalleBody').innerHTML = `
        <div class="text-center mb-4">
          <h4>
            <i class="fas fa-${tipoIcon} text-${tipoColor} me-2"></i>
            ${item.tipo}
          </h4>
          <small class="text-muted">${fecha.toLocaleString('es-AR')}</small>
        </div>
        
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <h6 class="text-primary">Paciente</h6>
            <p class="mb-0">
              <strong>${item.paciente.usuario.nombre} ${item.paciente.usuario.apellido}</strong>
              <br>
              DNI: ${item.paciente.usuario.dni}
              <br>
              ${item.paciente.obraSocial ? `Obra Social: ${item.paciente.obraSocial.nombre}` : 'Sin obra social'}
            </p>
          </div>
          
          ${item.evaluacionMedica ? `
            <div class="col-md-6">
              <h6 class="text-primary">Evaluación Médica Asociada</h6>
              <p class="mb-0">
                ID: ${item.evaluacionMedica.id}
                <br>
                Fecha: ${new Date(item.evaluacionMedica.fecha).toLocaleDateString('es-AR')}
                ${item.evaluacionMedica.diagnostico ? `<br>Diagnóstico: ${item.evaluacionMedica.diagnostico.codigo} - ${item.evaluacionMedica.diagnostico.nombre}` : ''}
              </p>
            </div>
          ` : ''}
        </div>
        
        <div>
          <h6 class="text-primary mb-2">Contenido</h6>
          <div class="border rounded p-3 bg-light" style="white-space: pre-wrap; font-family: monospace;">
${item.contenido}
          </div>
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalDetalle')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar detalle');
  }
}

// Mostrar modal editar
async function mostrarModalEditar(id) {
  try {
    const response = await fetch(`/medico/recetas-certificados/api/items/${id}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('editarId').value = data.data.id;
      document.getElementById('editarContenido').value = data.data.contenido;
      new bootstrap.Modal(document.getElementById('modalEditar')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar datos');
  }
}

// Actualizar
async function actualizar() {
  try {
    const id = document.getElementById('editarId').value;
    const formData = new FormData(document.getElementById('formEditar'));
    const data = Object.fromEntries(formData.entries());
    
    const response = await fetch(`/medico/recetas-certificados/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      cargarItems();
    } else {
      mostrarAlerta('error', result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al actualizar');
  }
}

// Eliminar
async function eliminar(id) {
  if (!confirm('¿Está seguro de eliminar este registro?')) return;
  
  try {
    const response = await fetch(`/medico/recetas-certificados/api/items/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
      cargarItems();
      cargarEstadisticas();
      cargarRecientes();
    } else {
      mostrarAlerta('error', data.message || 'Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al eliminar');
  }
}

// Generar PDF
async function generarPDF(id) {
  try {
    const response = await fetch(`/medico/recetas-certificados/api/items/${id}/pdf`);
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('info', 'Funcionalidad de PDF en desarrollo. Datos disponibles en consola.');
      console.log('Datos para PDF:', data.data);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al generar PDF');
  }
}

// Imprimir detalle
function imprimirDetalle() {
  if (!itemActual) return;
  
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>${itemActual.tipo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .info { margin: 20px 0; }
          .contenido { border: 1px solid #ccc; padding: 15px; background: #f9f9f9; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${itemActual.tipo}</h1>
        <div class="info">
          <strong>Fecha:</strong> ${new Date(itemActual.fecha).toLocaleString('es-AR')}<br>
          <strong>Paciente:</strong> ${itemActual.paciente.usuario.nombre} ${itemActual.paciente.usuario.apellido}<br>
          <strong>DNI:</strong> ${itemActual.paciente.usuario.dni}
        </div>
        <h2>Contenido:</h2>
        <div class="contenido">${itemActual.contenido}</div>
      </body>
    </html>
  `);
  ventanaImpresion.document.close();
  ventanaImpresion.print();
}

// Actualizar tabla
function actualizarTabla() {
  cargarItems();
  cargarEstadisticas();
  cargarRecientes();
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
  const alertContainer = document.createElement('div');
  const alertClass = tipo === 'success' ? 'success' : tipo === 'info' ? 'info' : 'danger';
  const icon = tipo === 'success' ? 'check-circle' : tipo === 'info' ? 'info-circle' : 'exclamation-circle';
  
  alertContainer.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertContainer.style.zIndex = '9999';
  alertContainer.innerHTML = `
    <i class="fas fa-${icon} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.remove();
  }, 5000);
}