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
      document.getElementById('resultados-busqueda').innerHTML = '<p class="text-muted">No se encontraron evaluaciones Medicas previas</p>';
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
            <small>${evalu.fecha}</small>
            <br>
            <span class="badge bg-warning text-dark">${evalu.estado_control}</span>
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
  const peso = parseFloat(document.getElementById('input-peso').value);
  const altura = parseFloat(document.getElementById('input-altura').value);
  
  if (!peso || !altura) {
    alert('Ingrese peso y altura para calcular el IMC');
    return;
  }
  
  // ✅ Validación de rangos
  if (peso < 0.5 || peso > 300) {
    alert('El peso debe estar entre 0.5 y 300 kg');
    return;
  }
  
  if (altura < 30 || altura > 250) {
    alert('La altura debe estar entre 30 y 250 cm');
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

// ✅ Validar rangos de signos vitales
function validarSignosVitales(data) {
  const errores = [];
  
  // Temperatura
  if (data.temperatura) {
    const temp = parseFloat(data.temperatura);
    if (temp < 35 || temp > 42) {
      errores.push('La temperatura debe estar entre 35°C y 42°C');
    }
  }
  
  // Frecuencia cardíaca
  if (data.frecuencia_cardiaca) {
    const fc = parseInt(data.frecuencia_cardiaca);
    if (fc < 30 || fc > 220) {
      errores.push('La frecuencia cardíaca debe estar entre 30 y 220 lpm');
    }
  }
  
  // Frecuencia respiratoria
  if (data.frecuencia_respiratoria) {
    const fr = parseInt(data.frecuencia_respiratoria);
    if (fr < 8 || fr > 40) {
      errores.push('La frecuencia respiratoria debe estar entre 8 y 40 rpm');
    }
  }
  
  // Saturación de oxígeno
  if (data.nivel_oxigeno) {
    const o2 = parseInt(data.nivel_oxigeno);
    if (o2 < 70 || o2 > 100) {
      errores.push('La saturación de oxígeno debe estar entre 70% y 100%');
    }
  }
  
  // Presión arterial (validar formato)
  if (data.presion_arterial) {
    const paPattern = /^\d{2,3}\/\d{2,3}$/;
    if (!paPattern.test(data.presion_arterial)) {
      errores.push('La presión arterial debe tener formato: 120/80');
    }
  }
  
  return errores;
}

// Enviar formulario
document.getElementById('form-control')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  // ✅ Validar signos vitales
  const errores = validarSignosVitales(data);
  
  if (errores.length > 0) {
    alert('Errores de validación:\n\n' + errores.join('\n'));
    return;
  }
  
  // ✅ Confirmar antes de enviar
  if (!confirm('¿Está seguro de guardar este control de enfermería?')) {
    return;
  }
  
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
      alert('✅ Control registrado correctamente');
      window.location.href = result.redirect;
    } else {
      alert('❌ ' + (result.message || 'Error al registrar el control'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al enviar el formulario');
  }
});

// Permitir Enter en búsqueda
document.getElementById('input-busqueda')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarEvaluacion();
  }
});

// ✅ Validación en tiempo real de temperatura
document.querySelector('input[name="temperatura"]')?.addEventListener('blur', function() {
  const temp = parseFloat(this.value);
  if (temp && (temp < 35 || temp > 42)) {
    this.classList.add('is-invalid');
    alert('⚠️ Temperatura fuera de rango normal (35-42°C). Verifique el valor.');
  } else {
    this.classList.remove('is-invalid');
  }
});

// ✅ Validación en tiempo real de frecuencia cardíaca
document.querySelector('input[name="frecuencia_cardiaca"]')?.addEventListener('blur', function() {
  const fc = parseInt(this.value);
  if (fc && (fc < 30 || fc > 220)) {
    this.classList.add('is-invalid');
    alert('⚠️ Frecuencia cardíaca fuera de rango normal (30-220 lpm). Verifique el valor.');
  } else {
    this.classList.remove('is-invalid');
  }
});