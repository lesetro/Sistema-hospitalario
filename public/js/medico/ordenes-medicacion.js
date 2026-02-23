// ============================================
// BÚSQUEDA DE PACIENTES (VERSIÓN MEJORADA)
// ============================================

let timeoutBusqueda;
const inputBusqueda = document.getElementById('buscar-paciente');
const resultadosDiv = document.getElementById('resultados-paciente');
const evaluacionesContainer = document.getElementById('evaluaciones-container');
const alergiasContainer = document.getElementById('alergias-container');
const alergiasTexto = document.getElementById('alergias-texto');
const selectEvaluaciones = document.getElementById('evaluacion_medica_id');

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

// Buscar pacientes usando el endpoint específico para medicación
async function buscarPacientes(busqueda) {
  try {
    const response = await fetch(`/medico/ordenes-medicacion/api/buscar-paciente?q=${encodeURIComponent(busqueda)}`);
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

// Mostrar resultados con indicador de evaluaciones y alergias
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
      '<span class="badge bg-secondary ms-2">Sin eval.</span>';
    
    // Mostrar si tiene alergias
    const tieneAlergias = paciente.alergias_texto && paciente.alergias_texto.trim() !== '';
    const iconoAlergias = tieneAlergias ? 
      '<i class="fas fa-exclamation-triangle text-danger ms-2" title="Tiene alergias registradas"></i>' : 
      '';
    
    // Calcular edad si está disponible
    const edadTexto = paciente.edad ? ` | ${paciente.edad} años` : '';
    
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${paciente.nombre_completo}</strong> ${badgeEvaluaciones} ${iconoAlergias}
          <br>
          <small class="text-muted">DNI: ${paciente.dni} | ${paciente.obra_social}${edadTexto}</small>
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

// Cargar evaluaciones en el select
function cargarEvaluacionesEnSelect(evaluaciones) {
  // Limpiar select
  selectEvaluaciones.innerHTML = '<option value="">-- Sin evaluación asociada --</option>';
  
  if (evaluaciones && evaluaciones.length > 0) {
    evaluaciones.forEach(evalu => {
      const option = document.createElement('option');
      option.value = evalu.id;
      option.textContent = evalu.display || `Evaluación del ${evalu.fecha_formateada}`;
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

// Mostrar alerta de alergias
function mostrarAlertaAlergias(alergiasTexto) {
  if (alergiasTexto && alergiasTexto.trim() !== '') {
    alert(`¡ATENCIÓN - ALERGIAS DEL PACIENTE!\n\n${alergiasTexto}\n\nVerifique que los medicamentos prescritos no contengan estos componentes.`);
  }
}

function seleccionarPaciente(paciente) {
  // Guardar ID del paciente
  document.getElementById('paciente_id').value = paciente.id;
  document.getElementById('buscar-paciente').value = `${paciente.nombre_completo} - DNI: ${paciente.dni}`;
  resultadosDiv.style.display = 'none';
  
  // Cargar evaluaciones en el select
  if (paciente.evaluaciones && paciente.evaluaciones.length > 0) {
    cargarEvaluacionesEnSelect(paciente.evaluaciones);
    
    // Seleccionar la primera evaluación por defecto si existe
    if (paciente.evaluaciones.length > 0) {
      selectEvaluaciones.value = paciente.evaluaciones[0].id;
    }
  } else {
    cargarEvaluacionesEnSelect([]);
  }
  
  // Mostrar alerta de alergias
  if (paciente.alergias_texto && paciente.alergias_texto.trim() !== '') {
    mostrarAlertaAlergias(paciente.alergias_texto);
  } else {
    // Opcionalmente mostrar que no tiene alergias
    console.log('Paciente sin alergias registradas');
  }
  
  // También mostrar en el contenedor de alergias si existe
  if (alergiasContainer && alergiasTexto) {
    if (paciente.alergias_texto && paciente.alergias_texto.trim() !== '') {
      alergiasTexto.textContent = paciente.alergias_texto;
      alergiasContainer.style.display = 'block';
    } else {
      alergiasContainer.style.display = 'none';
    }
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

const formCrear = document.getElementById('form-crear-medicacion');
if (formCrear) {
  formCrear.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Procesar checkbox de monitoreo
    data.requiere_monitoreo = document.getElementById('requiere_monitoreo').checked ? 'true' : 'false';
    
    // Validación básica
    if (!data.paciente_id) {
      alert('Por favor seleccione un paciente');
      return;
    }
    
    if (!data.medicamentos) {
      alert('Por favor ingrese los medicamentos a administrar');
      return;
    }
    
    // Validación de medicamentos urgentes
    if (data.prioridad === 'URGENTE') {
      const confirmado = confirm('¿Confirma que esta medicación es URGENTE?\n\nLas órdenes urgentes tienen prioridad máxima y deben ser administradas de inmediato.');
      if (!confirmado) {
        return;
      }
    }
    
    // Validación de monitoreo
    if (data.requiere_monitoreo === 'true') {
      alert('IMPORTANTE: Se requiere monitoreo estricto de signos vitales.\n\nEl enfermero deberá controlar signos vitales antes y después de cada administración.');
    }
    
    // Deshabilitar botón de envío
    const btnSubmit = this.querySelector('button[type="submit"]');
    const textoBtnOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creando...';
    
    try {
      const response = await fetch('/medico/ordenes-medicacion/crear', {
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
      alert('Error al crear la receta. Por favor intente nuevamente.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = textoBtnOriginal;
    }
  });
}

// ============================================
// PLANTILLAS RÁPIDAS DE MEDICACIÓN
// ============================================

const btnPlantillas = document.getElementById('btn-plantillas');
if (btnPlantillas) {
  btnPlantillas.addEventListener('click', function() {
    mostrarPlantillas();
  });
}

function mostrarPlantillas() {
  const plantillas = [
    {
      nombre: 'Antibiótico estándar',
      contenido: 'Ampicilina 1g IV c/8hs por 7 días'
    },
    {
      nombre: 'Analgesia postoperatoria',
      contenido: 'Tramadol 100mg IV c/8hs\nParacetamol 1g IV c/8hs'
    },
    {
      nombre: 'Protección gástrica',
      contenido: 'Omeprazol 40mg IV c/12hs'
    },
    {
      nombre: 'Anticoagulación profiláctica',
      contenido: 'Enoxaparina 40mg SC c/24hs'
    }
  ];
  
  let mensaje = 'PLANTILLAS DISPONIBLES:\n\n';
  plantillas.forEach((p, i) => {
    mensaje += `${i + 1}. ${p.nombre}\n`;
  });
  mensaje += '\nIngrese el número de la plantilla a usar (0 para cancelar):';
  
  const seleccion = prompt(mensaje);
  
  if (seleccion && !isNaN(seleccion)) {
    const index = parseInt(seleccion) - 1;
    if (index >= 0 && index < plantillas.length) {
      document.getElementById('medicamentos').value = plantillas[index].contenido;
    } else if (parseInt(seleccion) !== 0) {
      alert('Número de plantilla no válido');
    }
  }
}

// ============================================
// CANCELAR RECETA
// ============================================

function cancelarReceta(id) {
  if (confirm('¿Está seguro de cancelar esta receta?\n\nEsta acción no se puede deshacer.')) {
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
    const response = await fetch(`/medico/ordenes-medicacion/${id}`, {
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
    alert('Error al cancelar la receta');
  }
}

// ============================================
// VALIDACIÓN DE VÍA DE ADMINISTRACIÓN
// ============================================

const selectVia = document.getElementById('via_administracion');
if (selectVia) {
  selectVia.addEventListener('change', function() {
    const medicamentosTextarea = document.getElementById('medicamentos');
    const via = this.value;
    
    if (via && medicamentosTextarea && medicamentosTextarea.value.trim() === '') {
      // Sugerencia según la vía
      const sugerencias = {
        'Intravenosa (IV)': 'Ejemplo: Ampicilina 1g IV c/8hs',
        'Oral (VO)': 'Ejemplo: Amoxicilina 500mg VO c/8hs',
        'Intramuscular (IM)': 'Ejemplo: Diclofenac 75mg IM c/12hs',
        'Subcutánea (SC)': 'Ejemplo: Enoxaparina 40mg SC c/24hs'
      };
      
      if (sugerencias[via]) {
        medicamentosTextarea.placeholder = sugerencias[via];
      }
    }
  });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Script de órdenes de medicación cargado');
  
  // Si hay un paciente preseleccionado en el servidor, mostrar sus datos
  const pacienteId = document.getElementById('paciente_id')?.value;
  if (pacienteId && window.pacienteData) {
    // Esto se puede implementar si el servidor pasa datos del paciente
    console.log('Paciente preseleccionado:', pacienteId);
  }
});