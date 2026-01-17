// Registro de Signos Vitales

// Actualizar valor de dolor
function actualizarDolor(valor) {
  document.getElementById('valor-dolor').textContent = valor;
}

// Validar valores en tiempo real
function validarValores() {
  const alertasContainer = document.getElementById('alertas-container');
  const alertas = [];
  
  // Presión Arterial
  const pa = document.getElementById('presion-arterial').value;
  if (pa) {
    const [sistolica, diastolica] = pa.split('/').map(Number);
    if (sistolica > 140 || sistolica < 90 || diastolica > 90 || diastolica < 60) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'Presión arterial fuera de rango normal (90/60 - 140/90)'
      });
    }
  }
  
  // Frecuencia Cardíaca
  const fc = document.getElementById('frecuencia-cardiaca').value;
  if (fc) {
    const fcNum = Number(fc);
    if (fcNum > 100 || fcNum < 60) {
      alertas.push({
        tipo: 'warning',
        mensaje: `Frecuencia cardíaca ${fcNum > 100 ? 'alta' : 'baja'} (normal: 60-100 lpm)`
      });
    }
  }
  
  // Temperatura
  const temp = document.getElementById('temperatura').value;
  if (temp) {
    const tempNum = Number(temp);
    if (tempNum >= 38) {
      alertas.push({
        tipo: 'danger',
        mensaje: 'Fiebre detectada (≥38°C)'
      });
    } else if (tempNum < 36) {
      alertas.push({
        tipo: 'warning',
        mensaje: 'Hipotermia detectada (<36°C)'
      });
    }
  }
  
  // Saturación de Oxígeno
  const spo2 = document.getElementById('saturacion-oxigeno').value;
  if (spo2) {
    const spo2Num = Number(spo2);
    if (spo2Num < 95) {
      alertas.push({
        tipo: 'danger',
        mensaje: 'Saturación de oxígeno baja (<95%)'
      });
    }
  }
  
  // Mostrar alertas
  if (alertas.length > 0) {
    let html = '<div class="alert-container">';
    alertas.forEach(alerta => {
      html += `
        <div class="alert alert-${alerta.tipo} alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          ${alerta.mensaje}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    });
    html += '</div>';
    alertasContainer.innerHTML = html;
  } else {
    alertasContainer.innerHTML = '';
  }
}

// Event listeners para validación en tiempo real
['presion-arterial', 'frecuencia-cardiaca', 'temperatura', 'saturacion-oxigeno'].forEach(id => {
  document.getElementById(id)?.addEventListener('blur', validarValores);
});

// Enviar formulario
document.getElementById('form-signos-vitales')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch('/enfermero/signos-vitales/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.alertas && result.alertas.length > 0) {
        const alertasTexto = result.alertas.join('\n');
        alert(`Signos vitales registrados.\n\n⚠️ ALERTAS:\n${alertasTexto}`);
      } else {
        alert('Signos vitales registrados correctamente');
      }
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar signos vitales');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar el formulario');
  }
});

// Atajos de teclado
document.addEventListener('keydown', function(e) {
  // Ctrl + S para guardar
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    document.getElementById('form-signos-vitales').requestSubmit();
  }
});