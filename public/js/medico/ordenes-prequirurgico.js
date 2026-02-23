// ============================================
// BÚSQUEDA DE PACIENTES
// ============================================

let timeoutBusqueda;
const inputBusqueda = document.getElementById('buscar-paciente');
const resultadosDiv = document.getElementById('resultados-paciente');
const evaluacionesContainer = document.getElementById('evaluaciones-container');
const intervencionesContainer = document.getElementById('intervenciones-container');
const selectEvaluaciones = document.getElementById('evaluacion_medica_id');
const selectIntervenciones = document.getElementById('intervencion_quirurgica_id');

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
    const response = await fetch(`/medico/ordenes-prequirurgico/api/buscar-paciente?q=${encodeURIComponent(busqueda)}`);
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
    
    // Mostrar si tiene evaluaciones disponibles
    const tieneEvaluaciones = paciente.evaluaciones && paciente.evaluaciones.length > 0;
    const badgeEvaluaciones = tieneEvaluaciones ? 
      `<span class="badge bg-info ms-2">${paciente.evaluaciones.length} eval.</span>` : 
      '<span class="badge bg-warning ms-2">Sin eval.</span>';
    
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${paciente.nombre_completo}</strong> ${badgeEvaluaciones}
          <br>
          <small class="text-muted">DNI: ${paciente.dni} | ${paciente.obra_social}</small>
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

// 🔴 NUEVA FUNCIÓN: Cargar evaluaciones en el select
function cargarEvaluacionesEnSelect(evaluaciones) {
  // Limpiar select
  selectEvaluaciones.innerHTML = '<option value="" disabled selected>-- Seleccione una evaluación --</option>';
  
  if (evaluaciones && evaluaciones.length > 0) {
    evaluaciones.forEach(evalua => {
      const option = document.createElement('option');
      option.value = evalua.id;
      option.textContent = evalua.display || `Evaluación del ${evalua.fecha_formateada}`;
      selectEvaluaciones.appendChild(option);
    });
    
    evaluacionesContainer.style.display = 'block';
  } else {
    // Si no hay evaluaciones, mostrar mensaje
    const option = document.createElement('option');
    option.value = '';
    option.disabled = true;
    option.textContent = 'No hay evaluaciones disponibles para este paciente';
    selectEvaluaciones.appendChild(option);
    
    evaluacionesContainer.style.display = 'block';
  }
}

// 🔴 NUEVA FUNCIÓN: Cargar intervenciones en el select
function cargarIntervencionesEnSelect(intervenciones) {
  // Limpiar select
  selectIntervenciones.innerHTML = '<option value="">-- Sin intervención asociada --</option>';
  
  if (intervenciones && intervenciones.length > 0) {
    intervenciones.forEach(interv => {
      const option = document.createElement('option');
      option.value = interv.id;
      option.textContent = `${interv.nombre} - ${interv.fecha_formateada || 'Sin fecha'}`;
      selectIntervenciones.appendChild(option);
    });
    
    intervencionesContainer.style.display = 'block';
  } else {
    intervencionesContainer.style.display = 'none';
  }
}

function seleccionarPaciente(paciente) {
  // Guardar ID del paciente
  document.getElementById('paciente_id').value = paciente.id;
  document.getElementById('buscar-paciente').value = `${paciente.nombre_completo} - DNI: ${paciente.dni}`;
  resultadosDiv.style.display = 'none';
  
  // 🔴 Cargar evaluaciones en el select
  if (paciente.evaluaciones && paciente.evaluaciones.length > 0) {
    cargarEvaluacionesEnSelect(paciente.evaluaciones);
  } else {
    // Si no hay evaluaciones, mostrar mensaje
    cargarEvaluacionesEnSelect([]);
  }
  
  // 🔴 Cargar intervenciones en el select
  cargarIntervencionesEnSelect(paciente.intervenciones);
  
  // Limpiar selecciones anteriores
  selectEvaluaciones.value = '';
  selectIntervenciones.value = '';
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

const formCrear = document.getElementById('form-crear-prequirurgico');
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
    
    // 🔴 VALIDACIÓN: Verificar que se seleccionó una evaluación
    if (!data.evaluacion_medica_id || data.evaluacion_medica_id === '') {
      alert('Por favor seleccione la evaluación médica asociada');
      return;
    }
    
    if (!data.descripcion) {
      alert('Por favor ingrese la descripción de la cirugía');
      return;
    }
    
    // Confirmación especial para pre-quirúrgico
    const confirmado = confirm('¿Confirma crear esta orden de preparación pre-quirúrgica?\n\nEl enfermero deberá completar un checklist completo antes de la intervención.');
    if (!confirmado) {
      return;
    }
    
    // Deshabilitar botón de envío
    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoBtnOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando...';
    
    try {
      const response = await fetch('/medico/ordenes-prequirurgico/crear', {
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
// CHECKLIST ESTÁNDAR (Información)
// ============================================

const btnVerChecklist = document.getElementById('btn-ver-checklist');
if (btnVerChecklist) {
  btnVerChecklist.addEventListener('click', function() {
    const checklist = `
CHECKLIST ESTÁNDAR PRE-QUIRÚRGICO:

✓ Ayuno de 8-12 horas
✓ Higiene corporal completa
✓ Retiro de joyas y accesorios
✓ Retiro de prótesis dentales
✓ Retiro de esmalte de uñas
✓ Consentimiento informado firmado
✓ Estudios pre-operatorios disponibles
✓ Vía venosa permeable
✓ Alergias verificadas y documentadas
✓ Zona quirúrgica marcada
✓ Premedicación administrada (si aplica)

Este checklist se agregará automáticamente. 
Use el campo "Checklist Específico" solo para agregar items adicionales particulares de este paciente.
    `;
    alert(checklist);
  });
}

// ============================================
// CANCELAR ORDEN
// ============================================

function cancelarOrden(id) {
  if (confirm('¿Está seguro de cancelar esta orden pre-quirúrgica?\n\nEsta acción no se puede deshacer.')) {
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
    const response = await fetch(`/medico/ordenes-prequirurgico/${id}`, {
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