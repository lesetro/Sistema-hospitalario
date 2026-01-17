// Ejecutar Procedimiento

// Enviar formulario
document.getElementById('form-ejecutar')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!confirm('¿Confirma que desea completar este procedimiento?')) {
    return;
  }
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  // Obtener ID del procedimiento desde la URL
  const procId = window.location.pathname.split('/')[3];
  
  try {
    const response = await fetch(`/enfermero/procedimientos/${procId}/ejecutar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Procedimiento completado correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al completar el procedimiento');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Cancelar procedimiento
async function cancelarProcedimiento() {
  const motivo = prompt('Ingrese el motivo de cancelación:');
  
  if (!motivo) {
    return;
  }
  
  const procId = window.location.pathname.split('/')[3];
  
  try {
    const response = await fetch(`/enfermero/procedimientos/${procId}/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo_cancelacion: motivo })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al cancelar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cancelar el procedimiento');
  }
}

// Validación de formulario
document.querySelector('textarea[name="observaciones"]')?.addEventListener('blur', function() {
  if (this.value.trim().length < 20) {
    alert('Las observaciones deben tener al menos 20 caracteres');
    this.focus();
  }
});