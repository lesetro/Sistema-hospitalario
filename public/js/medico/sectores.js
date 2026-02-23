
// ============================================================================
// MODAL: INTERNAR PACIENTE
// ============================================================================

let camaSeleccionadaId = null;

function abrirModalInternar(camaId, habitacionNumero, camaNumero) {
  camaSeleccionadaId = camaId;
  document.getElementById('cama-id-internar').value = camaId;
  document.getElementById('info-cama-internar').textContent = `Habitación ${habitacionNumero}, Cama ${camaNumero}`;
  
  // Limpiar formulario
  document.getElementById('dni-paciente-internar').value = '';
  document.getElementById('info-paciente-internar').style.display = 'none';
  document.getElementById('seccion-datos-internacion').style.display = 'none';
  document.getElementById('paciente-id-internar').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalInternarPaciente'));
  modal.show();
}

// Buscar paciente por DNI
async function buscarPacienteParaInternar() {
  const dni = document.getElementById('dni-paciente-internar').value.trim();
  
  if (!dni || dni.length < 6) {
    alert('Ingrese un DNI válido (mínimo 6 dígitos)');
    return;
  }
  
  try {
    const response = await fetch(`/api/pacientes/buscar?dni=${dni}`);
    const result = await response.json();
    
    if (result.success && result.paciente) {
      mostrarDatosPaciente(result.paciente);
      document.getElementById('paciente-id-internar').value = result.paciente.id;
      document.getElementById('seccion-datos-internacion').style.display = 'block';
    } else {
      alert('Paciente no encontrado');
      limpiarDatosPaciente();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar paciente');
  }
}

function mostrarDatosPaciente(paciente) {
  const infoDiv = document.getElementById('info-paciente-internar');
  infoDiv.innerHTML = `
    <div class="alert alert-info">
      <strong>${paciente.nombre} ${paciente.apellido}</strong><br>
      DNI: ${paciente.dni}<br>
      Obra Social: ${paciente.obra_social || 'Sin obra social'}
    </div>
  `;
  infoDiv.style.display = 'block';
}

function limpiarDatosPaciente() {
  document.getElementById('info-paciente-internar').style.display = 'none';
  document.getElementById('info-paciente-internar').innerHTML = '';
  document.getElementById('paciente-id-internar').value = '';
  document.getElementById('seccion-datos-internacion').style.display = 'none';
}

// Confirmar internación
async function confirmarInternacion() {
  const pacienteId = document.getElementById('paciente-id-internar').value;
  const camaId = document.getElementById('cama-id-internar').value;
  const tipoInternacionId = document.getElementById('tipo-internacion').value;
  const diagnostico = document.getElementById('diagnostico-ingreso').value.trim();
  const observaciones = document.getElementById('observaciones-internacion').value.trim();
  
  // Validaciones
  if (!pacienteId) {
    alert('Debe buscar y seleccionar un paciente');
    return;
  }
  
  if (!tipoInternacionId) {
    alert('Debe seleccionar un tipo de internación');
    return;
  }
  
  if (!diagnostico) {
    alert('Debe ingresar el diagnóstico de ingreso');
    return;
  }
  
  const datos = {
    paciente_id: pacienteId,
    cama_id: camaId,
    tipo_internacion_id: tipoInternacionId,
    diagnostico_ingreso: diagnostico,
    observaciones: observaciones
  };
  
  try {
    const response = await fetch('/medico/sectores/internar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.data.redirect;
    } else {
      alert(result.message || 'Error al internar paciente');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión al internar paciente');
  }
}

// ============================================================================
// MODAL: DERIVAR A OTRO SECTOR
// ============================================================================

let internacionParaDerivar = null;

function abrirModalDerivar(internacionId, pacienteNombre) {
  internacionParaDerivar = internacionId;
  document.getElementById('internacion-id-derivar').value = internacionId;
  document.getElementById('paciente-nombre-derivar').textContent = pacienteNombre;
  
  // Limpiar campos
  document.getElementById('sector-destino').value = '';
  document.getElementById('motivo-derivacion').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalDerivarSector'));
  modal.show();
}

async function confirmarDerivacion() {
  const internacionId = document.getElementById('internacion-id-derivar').value;
  const sectorDestinoId = document.getElementById('sector-destino').value;
  const motivoDerivacion = document.getElementById('motivo-derivacion').value.trim();
  
  // Validaciones
  if (!sectorDestinoId) {
    alert('Debe seleccionar un sector destino');
    return;
  }
  
  if (!motivoDerivacion) {
    alert('Debe ingresar el motivo de la derivación');
    return;
  }
  
  if (!confirm('¿Está seguro de derivar este paciente? Se liberará la cama actual.')) {
    return;
  }
  
  const datos = {
    sector_destino_id: sectorDestinoId,
    motivo: motivoDerivacion
  };
  
  try {
    const response = await fetch(`/medico/sectores/internacion/${internacionId}/derivar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.data.redirect;
    } else {
      alert(result.message || 'Error al derivar paciente');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión al derivar paciente');
  }
}

// ============================================================================
// MODAL: DAR DE ALTA
// ============================================================================

let internacionParaAlta = null;

function abrirModalAlta(internacionId, pacienteNombre) {
  internacionParaAlta = internacionId;
  document.getElementById('internacion-id-alta').value = internacionId;
  document.getElementById('paciente-nombre-alta').textContent = pacienteNombre;
  
  // Limpiar campos
  document.getElementById('diagnostico-egreso').value = '';
  document.getElementById('indicaciones-medicas').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalDarAlta'));
  modal.show();
}

async function confirmarAlta() {
  const internacionId = document.getElementById('internacion-id-alta').value;
  const diagnosticoEgreso = document.getElementById('diagnostico-egreso').value.trim();
  const indicacionesMedicas = document.getElementById('indicaciones-medicas').value.trim();
  
  // Validaciones
  if (!diagnosticoEgreso) {
    alert('Debe ingresar el diagnóstico de egreso');
    return;
  }
  
  if (!confirm('¿Está seguro de dar de alta a este paciente?')) {
    return;
  }
  
  const datos = {
    diagnostico_egreso: diagnosticoEgreso,
    indicaciones: indicacionesMedicas
  };
  
  try {
    const response = await fetch(`/medico/sectores/internacion/${internacionId}/alta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.data.redirect;
    } else {
      alert(result.message || 'Error al dar de alta');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión al dar de alta');
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

// Enter en campo DNI
document.getElementById('dni-paciente-internar')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPacienteParaInternar();
  }
});

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Módulo de sectores cargado');
  
  // Tooltip de Bootstrap
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(el => new bootstrap.Tooltip(el));
});