// Comunicaciones

// Marcar notificación como leída
async function marcarLeida(notifId) {
  try {
    // ✅ CORRECCIÓN
    const response = await fetch(`/enfermero/comunicaciones/${notifId}/marcar-leida`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      location.reload();
    } else {
      alert(result.message || 'Error al marcar como leída');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al marcar como leída');
  }
}

// Marcar todas como leídas
async function marcarTodasLeidas() {
  if (!confirm('¿Marcar todas las notificaciones como leídas?')) {
    return;
  }
  
  try {
    const response = await fetch('/enfermero/comunicaciones/marcar-todas-leidas', {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Todas las notificaciones marcadas como leídas');
      location.reload();
    } else {
      alert(result.message || 'Error al marcar notificaciones');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al marcar notificaciones');
  }
}

// Eliminar notificación
async function eliminarNotificacion(notifId) {
  if (!confirm('¿Eliminar esta notificación?')) {
    return;
  }
  
  try {
    // ✅ CORRECCIÓN
    const response = await fetch(`/enfermero/comunicaciones/${notifId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      location.reload();
    } else {
      alert(result.message || 'Error al eliminar notificación');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar notificación');
  }
}

// Filtros
function filtrarLeidas(leida) {
  window.location.href = `/enfermero/comunicaciones?leida=${leida}`;
}

function mostrarTodas() {
  window.location.href = '/enfermero/comunicaciones';
}

// Nuevo mensaje
function nuevoMensaje() {
  document.getElementById('resultado-busqueda').style.display = 'none';
  document.getElementById('buscar-destinatario').value = '';
  document.getElementById('mensaje-texto').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalNuevoMensaje'));
  modal.show();
}

// Buscar destinatario
async function buscarDestinatario() {
  const busqueda = document.getElementById('buscar-destinatario').value.trim();
  
  if (busqueda.length < 2) {
    alert('Ingrese al menos 2 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/comunicaciones/api/buscar-personal?busqueda=${busqueda}`);
    const data = await response.json();
    
    if (data.success && data.personal.length > 0) {
      mostrarResultadosPersonal(data.personal);
    } else {
      alert('No se encontró personal con ese nombre');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar personal');
  }
}

// Mostrar resultados de búsqueda de personal
function mostrarResultadosPersonal(personal) {
  const select = document.getElementById('select-destinatario');
  select.innerHTML = '';
  
  personal.forEach(p => {
    const option = document.createElement('option');
    option.value = JSON.stringify({ tipo: p.tipo, id: p.id });
    option.textContent = p.nombre;
    select.appendChild(option);
  });
  
  document.getElementById('resultado-busqueda').style.display = 'block';
}

// Enviar mensaje
async function enviarMensaje() {
  const selectDestinatario = document.getElementById('select-destinatario');
  const mensaje = document.getElementById('mensaje-texto').value.trim();
  
  if (!selectDestinatario.value) {
    alert('Seleccione un destinatario');
    return;
  }
  
  if (!mensaje) {
    alert('Escriba un mensaje');
    return;
  }
  
  const destinatario = JSON.parse(selectDestinatario.value);
  
  try {
    // ✅ CORRECCIÓN
    const response = await fetch('/enfermero/comunicaciones/mensaje', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destinatario_tipo: destinatario.tipo,
        destinatario_id: destinatario.id,
        mensaje: mensaje
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Mensaje enviado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevoMensaje')).hide();
      location.reload();
    } else {
      alert(result.message || 'Error al enviar mensaje');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar mensaje');
  }
}

// Actualizar contador en header (si existe)
async function actualizarContadorHeader() {
  try {
    // ✅ CORRECCIÓN
    const response = await fetch('/enfermero/comunicaciones/api/contador');
    const data = await response.json();
    
    if (data.success) {
      const badge = document.getElementById('header-contador-mensajes');
      if (badge) {
        if (data.count > 0) {
          badge.textContent = data.count;
          badge.style.display = 'inline';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error al actualizar contador:', error);
  }
}

// Actualizar contador al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  actualizarContadorHeader();
  
  // Actualizar cada 30 segundos
  setInterval(actualizarContadorHeader, 30000);
});

// Enter en búsqueda de destinatario
document.getElementById('buscar-destinatario')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarDestinatario();
  }
});