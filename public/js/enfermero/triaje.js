// Triaje - Lista de pacientes

document.addEventListener('DOMContentLoaded', function() {
  actualizarEstadisticas();
  
  // Actualizar cada 30 segundos
  setInterval(actualizarEstadisticas, 30000);
});

// Actualizar estadísticas en tiempo real
async function actualizarEstadisticas() {
  try {
    const response = await fetch('/enfermero/triaje/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('stat-total').textContent = data.estadisticas.total;
      document.getElementById('stat-rojo').textContent = data.estadisticas.rojo;
      document.getElementById('stat-amarillo').textContent = data.estadisticas.amarillo;
      document.getElementById('stat-verde').textContent = data.estadisticas.verde;
      document.getElementById('stat-negro').textContent = data.estadisticas.negro;
      document.getElementById('stat-pendientes').textContent = data.estadisticas.pendientes;
    }
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }
}

// Atender paciente
function atenderPaciente(id) {
  window.location.href = `/enfermero/triaje/${id}`;
}

// Limpiar filtros
function limpiarFiltros() {
  document.getElementById('filtro-nivel').value = '';
  document.getElementById('filtro-estado').value = 'PENDIENTE_EVALUACION';
  document.getElementById('filtro-fecha').value = '';
  document.getElementById('form-filtros').submit();
}

// Resaltar filas según nivel de triaje
document.querySelectorAll('.triaje-rojo').forEach(row => {
  row.style.backgroundColor = '#fff5f5';
});

document.querySelectorAll('.triaje-amarillo').forEach(row => {
  row.style.backgroundColor = '#fffbf0';
});