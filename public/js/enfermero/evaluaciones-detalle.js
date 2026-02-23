// Detalle de Evaluación - Solo para enfermeros

// Tomar orden médica
async function tomarEvaluacion(id) {
  if (!confirm('¿Confirmas que quieres tomar esta orden médica?')) return;
  
  try {
    const response = await fetch(`/enfermero/evaluaciones/${id}/tomar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Orden médica asignada correctamente');
      window.location.href = result.redirect || `/enfermero/evaluaciones/${id}`;
    } else {
      alert(result.message || 'Error al tomar la orden');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al tomar la orden médica');
  }
}

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
  
  const urgente = confirm('¿Es una derivación urgente? (Aceptar = Sí / Cancelar = No)');
  
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

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Vista de detalle de evaluación cargada');
});