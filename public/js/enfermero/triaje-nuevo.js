// Registro de nuevo triaje

let nivelSeleccionado = null;

// Buscar paciente por DNI
async function buscarPaciente() {
  const dni = document.getElementById('input-dni').value.trim();
  
  if (!dni || dni.length < 7) {
    alert('Por favor ingrese un DNI válido (mínimo 7 dígitos)');
    return;
  }

  try {
    const response = await fetch(`/enfermero/triaje/api/buscar-paciente?dni=${dni}`);
    const data = await response.json();
    
    if (data.encontrado) {
      mostrarInfoPaciente(data.paciente);
      document.getElementById('form-triaje').style.display = 'block';
    } else {
      if (confirm('Paciente no encontrado. ¿Desea registrar un nuevo paciente?')) {
        window.location.href = `/enfermero/pacientes/nuevo?dni=${dni}`;
      }
    }
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    alert('Error al buscar el paciente. Intente nuevamente.');
  }
}

// Mostrar información del paciente
function mostrarInfoPaciente(paciente) {
  document.getElementById('info-paciente').style.display = 'block';
  document.getElementById('paciente-id').value = paciente.id;
  document.getElementById('paciente-nombre').textContent = `${paciente.nombre} ${paciente.apellido}`;
  document.getElementById('paciente-dni').textContent = paciente.dni;
  
  const edad = calcularEdad(paciente.fecha_nacimiento);
  document.getElementById('paciente-edad').textContent = `${edad} años`;
  document.getElementById('paciente-sexo').textContent = paciente.sexo;
}

// Calcular edad
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

// Seleccionar nivel de triaje
function seleccionarNivel(nivel) {
  // Remover selección anterior
  document.querySelectorAll('.selectable-card').forEach(card => {
    card.classList.remove('selected-card');
  });
  
  // Marcar nueva selección
  const card = document.querySelector(`[data-nivel="${nivel}"]`);
  card.classList.add('selected-card');
  
  nivelSeleccionado = nivel;
  document.getElementById('nivel-triaje').value = nivel;
}

// Enviar formulario
document.getElementById('form-triaje')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!nivelSeleccionado) {
    alert('Por favor seleccione un nivel de triaje');
    return;
  }
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch('/enfermero/triaje/nuevo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Triaje registrado correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar el triaje');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Permitir Enter en el campo DNI
document.getElementById('input-dni')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPaciente();
  }
});