// Nuevo Control de Enfermería

// Buscar evaluación
async function buscarEvaluacion() {
  const busqueda = document.getElementById('input-busqueda').value.trim();
  
  if (!busqueda) {
    alert('Ingrese un término de búsqueda');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/controles/api/evaluaciones-sin-control?busqueda=${busqueda}`);
    const data = await response.json();
    
    if (data.success && data.evaluaciones.length > 0) {
      mostrarResultados(data.evaluaciones);
    } else {
      document.getElementById('resultados-busqueda').innerHTML = '<p class="text-muted">No se encontraron evaluaciones sin control</p>';
      document.getElementById('resultados-busqueda').style.display = 'block';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar evaluaciones');
  }
}

// Mostrar resultados de búsqueda
function mostrarResultados(evaluaciones) {
  let html = '<div class="list-group">';
  
  evaluaciones.forEach(evalu => {
    html += `
      <a href="#" class="list-group-item list-group-item-action" onclick="seleccionarEvaluacion(${evalu.id}, '${evalu.paciente.nombre}', '${evalu.paciente.dni}'); return false;">
        <div class="d-flex justify-content-between">
          <div>
            <strong>${evalu.paciente.nombre}</strong>
            <br>
            <small class="text-muted">DNI: ${evalu.paciente.dni}</small>
          </div>
          <div>
            <small>${new Date(evalu.fecha).toLocaleDateString('es-AR')}</small>
          </div>
        </div>
      </a>
    `;
  });
  
  html += '</div>';
  document.getElementById('resultados-busqueda').innerHTML = html;
  document.getElementById('resultados-busqueda').style.display = 'block';
}

// Seleccionar evaluación
function seleccionarEvaluacion(evaluacionId, nombrePaciente, dniPaciente) {
  document.getElementById('evaluacion-id').value = evaluacionId;
  document.getElementById('paciente-nombre').textContent = nombrePaciente;
  document.getElementById('paciente-dni').textContent = dniPaciente;
  
  document.getElementById('info-paciente').style.display = 'block';
  document.getElementById('form-control').style.display = 'block';
  document.getElementById('resultados-busqueda').style.display = 'none';
}

// Calcular IMC
async function calcularIMC() {
  const peso = document.getElementById('input-peso').value;
  const altura = document.getElementById('input-altura').value;
  
  if (!peso || !altura) {
    alert('Ingrese peso y altura para calcular el IMC');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/controles/api/calcular-imc?peso=${peso}&altura=${altura}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('resultado-imc').value = data.imc;
      const categoriaDiv = document.getElementById('categoria-imc');
      categoriaDiv.innerHTML = `<strong>Categoría:</strong> ${data.categoria}`;
      categoriaDiv.style.display = 'block';
      
      // Cambiar color según categoría
      categoriaDiv.className = 'alert';
      if (data.categoria === 'Peso normal') {
        categoriaDiv.classList.add('alert-success');
      } else if (data.categoria === 'Sobrepeso') {
        categoriaDiv.classList.add('alert-warning');
      } else {
        categoriaDiv.classList.add('alert-danger');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al calcular IMC');
  }
}

// Enviar formulario
document.getElementById('form-control')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch('/enfermero/controles/nuevo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Control registrado correctamente');
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar el control');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Permitir Enter en búsqueda
document.getElementById('input-busqueda')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarEvaluacion();
  }
});