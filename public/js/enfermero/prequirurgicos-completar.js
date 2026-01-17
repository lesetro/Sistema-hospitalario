// Completar Preparación Pre-quirúrgica

// Validar checklist
function validarChecklist() {
  const requeridos = [
    'check-higiene',
    'check-joyas',
    'check-esmalte',
    'check-consentimiento',
    'check-estudios',
    'check-alergias'
  ];
  
  const faltantes = [];
  
  requeridos.forEach(id => {
    const checkbox = document.getElementById(id);
    if (!checkbox.checked) {
      faltantes.push(checkbox.nextElementSibling.textContent);
    }
  });
  
  return faltantes;
}

// Enviar formulario
document.getElementById('form-completar')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validar checklist
  const faltantes = validarChecklist();
  if (faltantes.length > 0) {
    alert(`Los siguientes items obligatorios no están marcados:\n\n${faltantes.join('\n')}`);
    return;
  }
  
  // Verificar ayuno
  const ayuno = parseInt(document.querySelector('[name="ayuno_horas"]').value);
  if (ayuno < 8) {
    if (!confirm('⚠️ ATENCIÓN: El ayuno es menor a 8 horas. ¿Desea continuar de todos modos?')) {
      return;
    }
  }
  
  // Confirmar
  if (!confirm('¿Confirma que desea completar la preparación pre-quirúrgica?\n\nVerifique que todos los datos sean correctos.')) {
    return;
  }
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  // Obtener ID del procedimiento desde la URL
  const procId = window.location.pathname.split('/')[3];
  
  try {
    const response = await fetch(`/enfermero/prequirurgicos/${procId}/completar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✓ Preparación pre-quirúrgica completada correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al completar la preparación');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Resaltar items requeridos
document.querySelectorAll('[required]').forEach(input => {
  const label = input.nextElementSibling || input.previousElementSibling;
  if (label && label.tagName === 'LABEL') {
    label.style.fontWeight = 'bold';
  }
});

// Contador de ayuno
document.querySelector('[name="ayuno_horas"]')?.addEventListener('change', function() {
  const horas = parseInt(this.value);
  if (horas < 8) {
    this.classList.add('is-invalid');
    alert('⚠️ ADVERTENCIA: El ayuno mínimo recomendado es de 8 horas');
  } else {
    this.classList.remove('is-invalid');
    this.classList.add('is-valid');
  }
});