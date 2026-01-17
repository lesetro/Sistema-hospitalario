// Detalle de Evaluación

// Completar evaluación
async function completarEvaluacion(id) {
  const observaciones = prompt('Observaciones finales (opcional):');
  
  if (observaciones === null) return; // Cancelado
  
  try {
    const response = await fetch(`/enfermero/evaluaciones/${id}/completar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        observaciones_finales: observaciones
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Evaluación completada correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al completar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al completar la evaluación');
  }
}

// Derivar a médico
async function derivarMedico(id) {
  const motivo = prompt('Motivo de la derivación:');
  if (!motivo) {
    alert('Debe ingresar un motivo');
    return;
  }
  
  const urgente = confirm('¿Es una derivación urgente?');
  
  try {
    const response = await fetch(`/enfermero/evaluaciones/${id}/derivar-medico`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        motivo_derivacion: motivo,
        urgente: urgente
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Paciente derivado correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al derivar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al derivar al paciente');
  }
}