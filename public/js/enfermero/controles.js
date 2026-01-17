// Controles de Enfermería - Lista

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
  form.submit();
}

// Editar control
function editarControl(id) {
  window.location.href = `/enfermero/controles/${id}`;
}

// Ver historial del paciente
async function verHistorial(pacienteId) {
  const modal = new bootstrap.Modal(document.getElementById('modalHistorial'));
  modal.show();
  
  try {
    const response = await fetch(`/enfermero/controles/api/historial/${pacienteId}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarHistorial(data.controles);
    } else {
      document.getElementById('contenido-historial').innerHTML = '<p class="text-center text-muted">No hay historial disponible</p>';
    }
  } catch (error) {
    console.error('Error al cargar historial:', error);
    document.getElementById('contenido-historial').innerHTML = '<p class="text-center text-danger">Error al cargar el historial</p>';
  }
}

// Mostrar historial en modal
function mostrarHistorial(controles) {
  let html = '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Fecha</th><th>Enfermero</th><th>Peso</th><th>P.A.</th><th>Temp.</th><th>Grupo</th></tr></thead><tbody>';
  
  controles.forEach(control => {
    html += `
      <tr>
        <td><small>${new Date(control.fecha).toLocaleDateString('es-AR')}</small></td>
        <td><small>${control.enfermero}</small></td>
        <td><small>${control.peso || 'N/A'} kg</small></td>
        <td><small>${control.presion_arterial || 'N/A'}</small></td>
        <td><small>${control.temperatura || 'N/A'}°C</small></td>
        <td><small>${control.grupo_sanguineo || 'N/A'} ${control.factor_rh || ''}</small></td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  document.getElementById('contenido-historial').innerHTML = html;
}