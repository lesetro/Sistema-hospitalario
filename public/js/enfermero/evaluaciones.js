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
  
  if (btnExportar) {
    btnExportar.disabled = checkboxes.length === 0;
  }
}

// Event listeners para checkboxes
document.querySelectorAll('.checkbox-evaluacion').forEach(cb => {
  cb.addEventListener('change', actualizarBotonExportar);
});

// Editar evaluación (modal)
async function editarEvaluacion(id) {
  try {
    // Guardar el ID en el modal
    document.getElementById('edit-evaluacion-id').value = id;
    
    // Opcional: Limpiar campos antes de cargar nuevos datos
    document.getElementById('edit-signos-vitales').value = '';
    document.getElementById('edit-observaciones').value = '';
    document.getElementById('edit-tipo-egreso').value = 'PENDIENTE_EVALUACION';
    document.getElementById('edit-medico-id').value = '';
    document.getElementById('edit-motivo-derivacion').value = '';
    
    // Mostrar modal inmediatamente
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEvaluacion'));
    modal.show();
    
    // Cargar datos en segundo plano (sin bloquear la UI)
    setTimeout(async () => {
      try {
        // Intentar cargar datos de la evaluación
        const response = await fetch(`/enfermero/evaluaciones/${id}/datos`);
        
        if (response.ok) {
          const evaluacion = await response.json();
          
          document.getElementById('edit-signos-vitales').value = evaluacion.signos_vitales || '';
          document.getElementById('edit-observaciones').value = evaluacion.observaciones || '';
          document.getElementById('edit-nivel-triaje').value = evaluacion.nivel_triaje || '';
          document.getElementById('edit-tipo-egreso').value = evaluacion.tipo_egreso || 'PENDIENTE_EVALUACION';
          
          if (evaluacion.medico_id) {
            document.getElementById('edit-medico-id').value = evaluacion.medico_id;
          }
        }
        
        // Cargar lista de médicos
        await cargarMedicosEnModal();
        
      } catch (error) {
        console.warn('No se pudieron cargar todos los datos:', error);
      }
    }, 100);
    
  } catch (error) {
    console.error('Error al abrir modal de edición:', error);
    alert('Error al cargar la evaluación');
  }
}

// Función auxiliar para cargar médicos en modal
async function cargarMedicosEnModal() {
  try {
    const select = document.getElementById('edit-medico-id');
    if (!select) return;
    
    // Limpiar opciones existentes
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    const response = await fetch('/enfermero/evaluaciones/api/medicos');
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.medicos) {
        result.medicos.forEach(medico => {
          const option = document.createElement('option');
          option.value = medico.id;
          option.textContent = medico.nombre || `Médico ${medico.id}`;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error al cargar médicos:', error);
  }
}

// Mostrar/ocultar sección de derivación en modal
document.getElementById('edit-tipo-egreso')?.addEventListener('change', function() {
  const seccion = document.getElementById('seccion-derivacion');
  if (this.value === 'DERIVACION_MEDICO' || this.value === 'DERIVACION_URGENCIA') {
    if (seccion) seccion.style.display = 'block';
  } else {
    if (seccion) seccion.style.display = 'none';
  }
});

// Guardar edición desde modal
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