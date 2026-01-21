let paginaNotificaciones = 1;
let paginaNoticias = 1;
const itemsPorPagina = 10;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstadisticas();
  actualizarNotificaciones();
  cargarNoticias();
  
  // Formulario crear notificación
  document.getElementById('formCrearNotificacion').addEventListener('submit', function(e) {
    e.preventDefault();
    crearNotificacion();
  });
  
  // Auto-refresh cada 2 minutos
  setInterval(() => {
    cargarEstadisticas();
    if (document.getElementById('filtroLeida').value === 'false') {
      actualizarNotificaciones();
    }
  }, 120000);
});

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const response = await fetch('/medico/comunicaciones/api/notificaciones/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-total').textContent = data.data.total;
      document.getElementById('stat-no-leidas').textContent = data.data.noLeidas;
      document.getElementById('stat-leidas').textContent = data.data.leidas;
      document.getElementById('stat-24h').textContent = data.data.ultimas24h;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Actualizar notificaciones
async function actualizarNotificaciones(pagina = 1) {
  try {
    paginaNotificaciones = pagina;
    
    const params = new URLSearchParams({
      page: pagina,
      limit: itemsPorPagina,
      leida: document.getElementById('filtroLeida').value
    });
    
    document.getElementById('loading-notificaciones').classList.remove('d-none');
    document.getElementById('lista-notificaciones').classList.add('d-none');
    document.getElementById('sin-notificaciones').classList.add('d-none');
    
    const response = await fetch(`/medico/comunicaciones/api/notificaciones?${params.toString()}`);
    const data = await response.json();
    
    document.getElementById('loading-notificaciones').classList.add('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarNotificaciones(data.data);
      mostrarPaginacionNotificaciones(data.pagination);
      document.getElementById('lista-notificaciones').classList.remove('d-none');
    } else {
      document.getElementById('sin-notificaciones').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    document.getElementById('loading-notificaciones').classList.add('d-none');
    mostrarAlerta('error', 'Error al cargar notificaciones');
  }
}

// Mostrar notificaciones
function mostrarNotificaciones(notificaciones) {
  const contenedor = document.getElementById('contenido-notificaciones');
  
  contenedor.innerHTML = notificaciones.map(notif => {
    const fecha = new Date(notif.created_at);
    const hace = calcularTiempoTranscurrido(fecha);
    
    return `
      <div class="list-group-item ${!notif.leida ? 'list-group-item-warning' : ''}">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-1">
              ${!notif.leida ? '<span class="badge bg-warning text-dark me-2">Nuevo</span>' : ''}
              <small class="text-muted">${hace}</small>
            </div>
            <p class="mb-1">${notif.mensaje}</p>
          </div>
          <div class="btn-group-vertical btn-group-sm" role="group">
            ${!notif.leida ? `
              <button class="btn btn-outline-success" 
                      onclick="marcarLeida(${notif.id})"
                      title="Marcar como leída">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            <button class="btn btn-outline-danger" 
                    onclick="eliminarNotificacion(${notif.id})"
                    title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mostrar paginación de notificaciones
function mostrarPaginacionNotificaciones(pagination) {
  const paginacionDiv = document.getElementById('paginacion-notificaciones');
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="actualizarNotificaciones(${pagination.page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  for (let i = 1; i <= Math.min(pagination.totalPages, 5); i++) {
    html += `
      <li class="page-item ${i === pagination.page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="actualizarNotificaciones(${i}); return false;">
          ${i}
        </a>
      </li>
    `;
  }
  
  html += `
    <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="actualizarNotificaciones(${pagination.page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginacionDiv.innerHTML = html;
}

// Marcar como leída
async function marcarLeida(id) {
  try {
    const response = await fetch(`/medico/comunicaciones/api/notificaciones/${id}/leida`, {
      method: 'PUT'
    });
    
    const data = await response.json();
    
    if (data.success) {
      actualizarNotificaciones(paginaNotificaciones);
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al marcar como leída');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al marcar como leída');
  }
}

// Marcar todas como leídas
async function marcarTodasLeidas() {
  if (!confirm('¿Marcar todas las notificaciones como leídas?')) return;
  
  try {
    const response = await fetch('/medico/comunicaciones/api/notificaciones/marcar-todas-leidas', {
      method: 'PUT'
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
      actualizarNotificaciones(paginaNotificaciones);
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al marcar notificaciones');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al marcar notificaciones');
  }
}

// Eliminar notificación
async function eliminarNotificacion(id) {
  if (!confirm('¿Está seguro de eliminar esta notificación?')) return;
  
  try {
    const response = await fetch(`/medico/comunicaciones/api/notificaciones/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      mostrarAlerta('success', data.message);
      actualizarNotificaciones(paginaNotificaciones);
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al eliminar notificación');
  }
}

// Cargar noticias
async function cargarNoticias(pagina = 1) {
  try {
    paginaNoticias = pagina;
    
    const params = new URLSearchParams({
      page: pagina,
      limit: 5
    });
    
    document.getElementById('loading-noticias').classList.remove('d-none');
    document.getElementById('lista-noticias').classList.add('d-none');
    
    const response = await fetch(`/medico/comunicaciones/api/noticias?${params.toString()}`);
    const data = await response.json();
    
    document.getElementById('loading-noticias').classList.add('d-none');
    
    if (data.success && data.data.length > 0) {
      mostrarNoticias(data.data);
      mostrarPaginacionNoticias(data.pagination);
      document.getElementById('lista-noticias').classList.remove('d-none');
    } else {
      document.getElementById('lista-noticias').innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="fas fa-newspaper fa-3x mb-3"></i>
          <p>No hay noticias disponibles</p>
        </div>
      `;
      document.getElementById('lista-noticias').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al cargar noticias:', error);
    document.getElementById('loading-noticias').classList.add('d-none');
  }
}

// Mostrar noticias
function mostrarNoticias(noticias) {
  const contenedor = document.getElementById('contenido-noticias');
  
  contenedor.innerHTML = noticias.map(noticia => {
    const fecha = new Date(noticia.fecha);
    
    return `
      <div class="card mb-3 border">
        <div class="card-body">
          <h6 class="card-title">
            <i class="fas fa-newspaper text-primary me-2"></i>
            ${noticia.titulo}
          </h6>
          <p class="card-text small text-muted mb-2">
            ${noticia.texto.substring(0, 150)}${noticia.texto.length > 150 ? '...' : ''}
          </p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="fas fa-user me-1"></i>
              ${noticia.autor ? `${noticia.autor.nombre} ${noticia.autor.apellido}` : 'Anónimo'}
              <br>
              <i class="fas fa-calendar me-1"></i>
              ${fecha.toLocaleDateString('es-AR')}
            </small>
            <button class="btn btn-sm btn-outline-primary" onclick="verNoticia(${noticia.id})">
              <i class="fas fa-eye me-1"></i>
              Leer más
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Mostrar paginación de noticias
function mostrarPaginacionNoticias(pagination) {
  const paginacionDiv = document.getElementById('paginacion-noticias');
  
  if (pagination.totalPages <= 1) {
    paginacionDiv.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `
    <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cargarNoticias(${pagination.page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  for (let i = 1; i <= Math.min(pagination.totalPages, 5); i++) {
    html += `
      <li class="page-item ${i === pagination.page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="cargarNoticias(${i}); return false;">
          ${i}
        </a>
      </li>
    `;
  }
  
  html += `
    <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="cargarNoticias(${pagination.page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginacionDiv.innerHTML = html;
}

// Ver noticia completa
async function verNoticia(id) {
  try {
    const response = await fetch(`/medico/comunicaciones/api/noticias/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const noticia = data.data;
      const fecha = new Date(noticia.fecha);
      
      document.getElementById('modalNoticiaBody').innerHTML = `
        <div class="mb-3">
          <h4>${noticia.titulo}</h4>
          <small class="text-muted">
            <i class="fas fa-user me-1"></i>
            ${noticia.autor ? `${noticia.autor.nombre} ${noticia.autor.apellido}` : 'Anónimo'}
            | 
            <i class="fas fa-calendar me-1"></i>
            ${fecha.toLocaleString('es-AR')}
          </small>
        </div>
        <div style="white-space: pre-wrap;">
          ${noticia.texto}
        </div>
      `;
      
      new bootstrap.Modal(document.getElementById('modalVerNoticia')).show();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al cargar noticia');
  }
}

// Crear notificación
async function crearNotificacion() {
  try {
    const formData = new FormData(document.getElementById('formCrearNotificacion'));
    const data = Object.fromEntries(formData.entries());
    data.usuario_id = parseInt(data.usuario_id);
    
    const response = await fetch('/medico/comunicaciones/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      mostrarAlerta('success', result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalCrearNotificacion')).hide();
      document.getElementById('formCrearNotificacion').reset();
    } else {
      mostrarAlerta('error', result.message || 'Error al enviar notificación');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al enviar notificación');
  }
}

// Calcular tiempo transcurrido
function calcularTiempoTranscurrido(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(diferencia / 3600000);
  const dias = Math.floor(diferencia / 86400000);
  
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
  if (dias < 30) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
  return fecha.toLocaleDateString('es-AR');
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertContainer.style.zIndex = '9999';
  alertContainer.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.remove();
  }, 5000);
}