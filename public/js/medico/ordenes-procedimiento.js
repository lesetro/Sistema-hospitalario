// ============================================
// BÚSQUEDA DE PACIENTES
// ============================================

let timeoutBusqueda;
const inputBusqueda = document.getElementById('buscar-paciente');
const resultadosDiv = document.getElementById('resultados-paciente');

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    const busqueda = this.value.trim();
    
    if (busqueda.length < 2) {
      resultadosDiv.style.display = 'none';
      return;
    }
    
    timeoutBusqueda = setTimeout(() => {
      buscarPacientes(busqueda);
    }, 300);
  });
}

async function buscarPacientes(busqueda) {
  try {
    const response = await fetch(`/medico/pacientes/api/buscar?q=${encodeURIComponent(busqueda)}`);
    const data = await response.json();
    
    if (data.success && data.pacientes.length > 0) {
      mostrarResultados(data.pacientes);
    } else {
      resultadosDiv.innerHTML = '<div class="list-group-item text-muted">No se encontraron pacientes</div>';
      resultadosDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    resultadosDiv.innerHTML = '<div class="list-group-item text-danger">Error al buscar</div>';
    resultadosDiv.style.display = 'block';
  }
}

function mostrarResultados(pacientes) {
  resultadosDiv.innerHTML = '';
  
  pacientes.forEach(paciente => {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'list-group-item list-group-item-action';
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${paciente.nombre}</strong>
          <br>
          <small class="text-muted">DNI: ${paciente.dni}</small>
        </div>
        <i class="fas fa-chevron-right"></i>
      </div>
    `;
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      seleccionarPaciente(paciente);
    });
    
    resultadosDiv.appendChild(item);
  });
  
  resultadosDiv.style.display = 'block';
}

function seleccionarPaciente(paciente) {
  document.getElementById('paciente_id').value = paciente.id;
  document.getElementById('buscar-paciente').value = `${paciente.nombre} - DNI: ${paciente.dni}`;
  resultadosDiv.style.display = 'none';
  
  // Si tiene evaluación médica reciente, asignarla
  if (paciente.ultima_evaluacion_id) {
    document.getElementById('evaluacion_medica_id').value = paciente.ultima_evaluacion_id;
  }
}

// Cerrar resultados al hacer click fuera
document.addEventListener('click', function(event) {
  if (inputBusqueda && !inputBusqueda.contains(event.target) && !resultadosDiv.contains(event.target)) {
    resultadosDiv.style.display = 'none';
  }
});

// ============================================
// ENVÍO DEL FORMULARIO DE CREAR
// ============================================

const formCrear = document.getElementById('form-crear-orden');
if (formCrear) {
  formCrear.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Validación básica
    if (!data.paciente_id) {
      alert('Por favor seleccione un paciente');
      return;
    }
    
    if (!data.nombre || !data.descripcion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Deshabilitar botón de envío
    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoBtnOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando...';
    
    try {
      const response = await fetch('/medico/ordenes-procedimiento/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        window.location.href = result.redirect;
      } else {
        alert('Error: ' + result.message);
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoBtnOriginal;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la orden. Por favor intente nuevamente.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = textoBtnOriginal;
    }
  });
}

// ============================================
// CANCELAR ORDEN (desde lista)
// ============================================

function cancelarOrden(id) {
  if (confirm('¿Está seguro de cancelar esta orden?\n\nEsta acción no se puede deshacer.')) {
    const motivo = prompt('Ingrese el motivo de cancelación:');
    
    if (motivo && motivo.trim() !== '') {
      ejecutarCancelacion(id, motivo);
    } else if (motivo !== null) {
      alert('Debe ingresar un motivo de cancelación');
    }
  }
}

async function ejecutarCancelacion(id, motivo) {
  try {
    const response = await fetch(`/medico/ordenes-procedimiento/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo_cancelacion: motivo })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cancelar la orden');
  }
}

// ============================================
// VALIDACIÓN DE PRIORIDAD
// ============================================

const selectPrioridad = document.getElementById('prioridad');
if (selectPrioridad) {
  selectPrioridad.addEventListener('change', function() {
    if (this.value === 'URGENTE') {
      const confirmado = confirm('¿Confirma que esta orden es URGENTE?\n\nLas órdenes urgentes tienen prioridad máxima y deben ser atendidas de inmediato por enfermería.');
      if (!confirmado) {
        this.value = 'ALTA';
      }
    }
  });
}