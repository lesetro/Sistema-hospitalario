document.addEventListener('DOMContentLoaded', () => {
  cargarContador();
  cargarMensajes();

  // Auto-refresh cada 30 segundos
  setInterval(cargarContador, 30000);

  // Eventos
  document.getElementById('btnEnviarMensaje')?.addEventListener('click', enviarMensaje);
  document.getElementById('btnMarcarTodosLeidos')?.addEventListener('click', marcarTodosLeidos);
  document.getElementById('filtroNoLeidos')?.addEventListener('change', () => cargarMensajes(1));
  
  // Tabs
  document.querySelectorAll('#mensajesTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remover activo de todos
      document.querySelectorAll('#mensajesTabs .nav-link').forEach(t => t.classList.remove('active'));
      
      // Agregar activo al clickeado
      tab.classList.add('active');
      
      // Mostrar/ocultar filtros según tipo
      const tipo = tab.dataset.tipo;
      const filtrosDiv = document.getElementById('filtrosRecibidos');
      
      if (tipo === 'recibidos') {
        filtrosDiv.style.display = 'block';
      } else {
        filtrosDiv.style.display = 'none';
      }
      
      // Cargar mensajes del tipo seleccionado
      cargarMensajes(1, tipo);
    });
  });
});

// Variable global para tipo actual
let tipoActual = 'recibidos';
let paginaActual = 1;

// ============================================================================
// CONTADOR
// ============================================================================
async function cargarContador() {
  try {
    const response = await fetch('/comunicacion/api/contador');
    const data = await response.json();

    if (data.success) {
      const badge = document.getElementById('contador-mensajes');
      if (badge) {
        badge.textContent = data.contador;
        badge.style.display = data.contador > 0 ? 'inline' : 'none';
      }
    }
  } catch (error) {
    console.error('Error al cargar contador:', error);
  }
}

// ============================================================================
// MENSAJES
// ============================================================================
async function cargarMensajes(page = 1, tipo = tipoActual) {
  try {
    paginaActual = page;
    tipoActual = tipo;
    
    const soloNoLeidos = tipo === 'recibidos' ? 
      (document.getElementById('filtroNoLeidos')?.checked || false) : 
      false;
    
    const params = new URLSearchParams({
      page,
      limit: 20,
      tipo,
      solo_no_leidos: soloNoLeidos
    });

    const response = await fetch(`/comunicacion/api/mensajes?${params}`);
    const data = await response.json();

    if (data.success) {
      renderizarMensajes(data.mensajes);
      renderizarPaginacion(data.pagination);
    } else {
      mostrarAlerta('error', data.message || 'Error al cargar mensajes');
    }
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    mostrarAlerta('error', 'Error al cargar mensajes');
  }
}

function renderizarMensajes(mensajes) {
  const container = document.getElementById('lista-mensajes');

  if (mensajes.length === 0) {
    let mensajeVacio = '';
    
    switch(tipoActual) {
      case 'enviados':
        mensajeVacio = 'No has enviado ningún mensaje';
        break;
      case 'eliminados':
        mensajeVacio = 'No hay mensajes eliminados';
        break;
      default:
        mensajeVacio = 'No hay mensajes recibidos';
    }
    
    container.innerHTML = `<div class="text-center text-muted py-5">${mensajeVacio}</div>`;
    return;
  }

  container.innerHTML = mensajes.map(m => {
    // Determinar título según tipo
    let titulo = '';
    let badgeLeido = !m.leida && tipoActual === 'recibidos' ? 
      '<span class="badge bg-primary me-2">Nuevo</span>' : '';
    
    if (tipoActual === 'recibidos') {
      titulo = `<small class="d-block text-muted">De: ${m.remitente} ${m.rol ? `(${m.rol})` : ''}</small>`;
    } else if (tipoActual === 'enviados') {
      titulo = `<small class="d-block text-muted">Para: ${m.destinatario} ${m.rol ? `(${m.rol})` : ''}</small>`;
    } else if (tipoActual === 'eliminados') {
      const remitente = m.remitente || 'Sistema';
      titulo = `<small class="d-block text-muted">${m.tipo_mensaje === 'enviados' ? 'Enviado a' : 'Recibido de'}: ${remitente}</small>`;
    }

    return `
    <div class="card mb-2 ${!m.leida && tipoActual === 'recibidos' ? 'border-primary' : ''}">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            ${badgeLeido}
            <p class="mb-1">${m.mensaje}</p>
            ${titulo}
            <small class="text-muted">${new Date(m.fecha).toLocaleString('es-AR')}</small>
          </div>
          <div class="btn-group btn-group-sm">
            ${!m.leida && tipoActual === 'recibidos' ? `
              <button class="btn btn-sm btn-outline-primary" onclick="marcarLeido(${m.id})" title="Marcar como leído">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            
            ${tipoActual === 'eliminados' ? `
              <button class="btn btn-sm btn-outline-success" onclick="restaurarMensaje(${m.id})" title="Restaurar">
                <i class="fas fa-undo"></i>
              </button>
            ` : `
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarMensaje(${m.id})" title="Eliminar">
                <i class="fas fa-trash"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

// ============================================================================
// ENVIAR MENSAJE
// ============================================================================
async function enviarMensaje() {
  const destinatarioId = document.getElementById('destinatario').value;
  const mensaje = document.getElementById('mensaje').value;

  if (!destinatarioId || !mensaje.trim()) {
    mostrarAlerta('warning', 'Seleccione un destinatario y escriba un mensaje');
    return;
  }

  try {
    const response = await fetch('/comunicacion/api/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinatario_id: destinatarioId,
        mensaje: mensaje.trim()
      })
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', 'Mensaje enviado correctamente');
      document.getElementById('mensaje').value = '';
      document.getElementById('destinatario').value = '';
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoMensaje'))?.hide();
      
      // Cambiar a pestaña "enviados" y recargar
      setTimeout(() => {
        document.querySelector('[data-tipo="enviados"]').click();
      }, 500);
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    mostrarAlerta('error', 'Error al enviar mensaje');
  }
}

// ============================================================================
// ACCIONES
// ============================================================================
window.marcarLeido = async function(id) {
  try {
    const response = await fetch(`/comunicacion/api/mensajes/${id}/leer`, {
      method: 'PUT'
    });

    const data = await response.json();

    if (data.success) {
      cargarMensajes(paginaActual);
      cargarContador();
    }
  } catch (error) {
    mostrarAlerta('error', 'Error al marcar como leído');
  }
};

async function marcarTodosLeidos() {
  if (!confirm('¿Marcar todos los mensajes recibidos como leídos?')) return;

  try {
    const response = await fetch('/comunicacion/api/mensajes/leer-todos', {
      method: 'PUT'
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', 'Todos los mensajes marcados como leídos');
      cargarMensajes(paginaActual);
      cargarContador();
    }
  } catch (error) {
    mostrarAlerta('error', 'Error al marcar mensajes');
  }
}

window.eliminarMensaje = async function(id) {
  if (!confirm('¿Eliminar este mensaje?')) return;

  try {
    const response = await fetch(`/comunicacion/api/mensajes/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', 'Mensaje eliminado');
      cargarMensajes(paginaActual);
      cargarContador();
    }
  } catch (error) {
    mostrarAlerta('error', 'Error al eliminar mensaje');
  }
};

window.restaurarMensaje = async function(id) {
  if (!confirm('¿Restaurar este mensaje?')) return;

  try {
    const response = await fetch(`/comunicacion/api/mensajes/${id}/restaurar`, {
      method: 'PUT'
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', 'Mensaje restaurado');
      
      // Si estamos en eliminados, volver a cargar
      if (tipoActual === 'eliminados') {
        cargarMensajes(paginaActual);
      }
    }
  } catch (error) {
    mostrarAlerta('error', 'Error al restaurar mensaje');
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

  let html = '<ul class="pagination justify-content-center mb-0">';
  
  // Anterior
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${page - 1}">« Anterior</a></li>`;
  
  // Páginas
  const maxPages = 5;
  let startPage = Math.max(1, page - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  if (endPage - startPage + 1 < maxPages) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }

  // Siguiente
  html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${page + 1}">Siguiente »</a></li></ul>`;
  
  container.innerHTML = html;

  // Eventos
  container.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const newPage = parseInt(e.target.dataset.page);
      if (newPage && newPage !== page) {
        cargarMensajes(newPage, tipoActual);
      }
    });
  });
}

function mostrarAlerta(tipo, mensaje) {
  const container = document.getElementById('alerta-container');
  const clase = tipo === 'success' ? 'alert-success' : 
                tipo === 'error' ? 'alert-danger' : 'alert-warning';
  
  container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
    ${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  
  setTimeout(() => container.innerHTML = '', 5000);
}