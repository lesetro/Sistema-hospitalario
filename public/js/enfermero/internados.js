// Pacientes Internados

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    input.value = '';
  });
  form.submit();
}

// Actualizar estadísticas
async function actualizarEstadisticas() {
  try {
    const response = await fetch('/enfermero/internados/api/estadisticas');
    const data = await response.json();
    
    if (data.success) {
      console.log('Estadísticas actualizadas:', data.estadisticas);
      location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Cambiar estado del paciente
function cambiarEstado(internacionId) {
  document.getElementById('estado-internacion-id').value = internacionId;
  const modal = new bootstrap.Modal(document.getElementById('modalCambiarEstado'));
  modal.show();
}

// Guardar cambio de estado
async function guardarEstado() {
  const internacionId = document.getElementById('estado-internacion-id').value;
  const datos = {
    estado_paciente: document.getElementById('nuevo-estado').value,
    observaciones: document.getElementById('estado-observaciones').value
  };
  
  if (!datos.estado_paciente || !datos.observaciones) {
    alert('Complete todos los campos');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/internados/${internacionId}/actualizar-estado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Estado actualizado correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar el estado');
  }
}

// Registrar evolución
function registrarEvolucion(internacionId) {
  document.getElementById('evolucion-internacion-id').value = internacionId;
  const modal = new bootstrap.Modal(document.getElementById('modalEvolucion'));
  modal.show();
}

// Guardar evolución
async function guardarEvolucion() {
  const internacionId = document.getElementById('evolucion-internacion-id').value;
  const datos = {
    signos_vitales: document.getElementById('evol-signos-vitales').value,
    observaciones: document.getElementById('evol-observaciones').value,
    procedimientos_realizados: document.getElementById('evol-procedimientos').value,
    medicacion_administrada: document.getElementById('evol-medicacion').value,
    cambios_notables: document.getElementById('evol-cambios').value
  };
  
  if (!datos.signos_vitales || !datos.observaciones) {
    alert('Complete los campos obligatorios');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/internados/${internacionId}/evolucion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Evolución registrada correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la evolución');
  }
}

// Filtro por sector en tiempo real
document.getElementById('filtro-sector')?.addEventListener('change', function() {
  if (this.value) {
    // Aquí podrías cargar habitaciones del sector seleccionado
    console.log('Sector seleccionado:', this.value);
  }
});