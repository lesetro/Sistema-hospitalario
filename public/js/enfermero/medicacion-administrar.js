// Administrar Medicación

// Enviar formulario
document.getElementById('form-administrar')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validar reacciones adversas
  const reacciones = document.querySelector('[name="reacciones_adversas"]').value;
  if (reacciones && reacciones.trim() !== '') {
    if (!confirm('⚠️ ATENCIÓN: Ha registrado reacciones adversas.\n\nSe notificará al médico inmediatamente.\n\n¿Desea continuar?')) {
      return;
    }
  }
  
  // Confirmar administración
  if (!confirm('¿Confirma que ha administrado la medicación según lo indicado en la receta?')) {
    return;
  }
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  // Obtener ID de la receta desde la URL
  const recetaId = window.location.pathname.split('/')[3];
  
  try {
    const response = await fetch(`/enfermero/medicacion/${recetaId}/administrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.tiene_reacciones) {
        alert('✓ Administración registrada.\n\n⚠️ Se ha notificado al médico sobre las reacciones adversas.');
      } else {
        alert('✓ Administración de medicación registrada correctamente');
      }
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar la administración');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Alerta si hay reacciones adversas
document.querySelector('[name="reacciones_adversas"]')?.addEventListener('change', function() {
  if (this.value.trim() !== '') {
    this.classList.add('border-danger');
  } else {
    this.classList.remove('border-danger');
  }
});

// Validar hora de administración
document.querySelector('[name="hora_administracion"]')?.addEventListener('change', function() {
  const horaActual = new Date();
  const horaSeleccionada = new Date();
  const [horas, minutos] = this.value.split(':');
  horaSeleccionada.setHours(horas, minutos);
  
  if (horaSeleccionada > horaActual) {
    alert('⚠️ La hora de administración no puede ser futura');
    this.value = horaActual.toTimeString().slice(0, 5);
  }
});