// Evaluaciones de Enfermería - Lista

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

// Seleccionar/deseleccionar todos
function toggleSelectAll() {
  const selectAll = document.getElementById('select-all');
  const checkboxes = document.querySelectorAll('.checkbox-evaluacion');
  
  checkboxes.forEach(cb => {
    cb.checked = selectAll.checked;
  });
  
  actualizarBotonExportar();
}

// Actualizar estado del botón exportar
function actualizarBotonExportar() {
  const checkboxes = document.querySelectorAll('.checkbox-evaluacion:checked');
  const btnExportar = document.getElementById('btn-exportar');
  
  btnExportar.disabled = checkboxes.length === 0;
}

// Event listeners para checkboxes
document.querySelectorAll('.checkbox-evaluacion').forEach(cb => {
  cb.addEventListener('change', actualizarBotonExportar);
});

// Editar evaluación
async function editarEvaluacion(id) {
  try {
    const response = await fetch(`/enfermero/evaluaciones/${id}`);
    // Aquí cargarías los datos en el modal
    // Por simplicidad, mostramos el modal vacío
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEvaluacion'));
    document.getElementById('edit-evaluacion-id').value = id;
    modal.show();
    
  } catch (error) {
    console.error('Error al cargar evaluación:', error);
    alert('Error al cargar la evaluación');
  }
}

// Mostrar/ocultar sección de derivación
document.getElementById('edit-tipo-egreso')?.addEventListener('change', function() {
  const seccion = document.getElementById('seccion-derivacion');
  if (this.value === 'DERIVACION_MEDICO' || this.value === 'DERIVACION_URGENCIA') {
    seccion.style.display = 'block';
  } else {
    seccion.style.display = 'none';
  }
});

// Guardar edición
async function guardarEdicion() {
  const id = document.getElementById('edit-evaluacion-id').value;
  const datos = {
    signos_vitales: document.getElementById('edit-signos-vitales').value,
    observaciones: document.getElementById('edit-observaciones').value,
    tipo_egreso: document.getElementById('edit-tipo-egreso').value,
    medico_id: document.getElementById('edit-medico-id')?.value || null
  };
  
  try {
    const response = await fetch(`/enfermero/evaluaciones/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Evaluación actualizada correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar los cambios');
  }
}

// Exportar seleccionados
async function exportarSeleccionados() {
  const checkboxes = document.querySelectorAll('.checkbox-evaluacion:checked');
  const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
  
  if (ids.length === 0) {
    alert('Seleccione al menos una evaluación');
    return;
  }
  
  try {
    const response = await fetch('/enfermero/evaluaciones/api/exportar-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    
    const result = await response.json();
    alert(result.message);
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al exportar');
  }
}