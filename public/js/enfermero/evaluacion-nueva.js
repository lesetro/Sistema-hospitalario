// nueva-evaluacion.js - Solo para formulario de nueva evaluación

// Buscar paciente
async function buscarPaciente() {
  const dni = document.getElementById('input-dni').value.trim();
  
  if (!dni || dni.length < 7) {
    alert('Ingrese un DNI válido (mínimo 7 dígitos)');
    return;
  }

  try {
    const response = await fetch(`/enfermero/triaje/api/buscar-paciente?dni=${dni}`);
    const data = await response.json();
    
    if (data.encontrado) {
      mostrarInfoPaciente(data.paciente);
      document.getElementById('form-evaluacion').style.display = 'block';
    } else {
      alert('Paciente no encontrado. Debe estar registrado en el sistema.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar paciente');
  }
}

// Mostrar info del paciente
function mostrarInfoPaciente(paciente) {
  document.getElementById('info-paciente').style.display = 'block';
  document.getElementById('paciente-id').value = paciente.id;
  document.getElementById('paciente-nombre').textContent = `${paciente.nombre} ${paciente.apellido}`;
  document.getElementById('paciente-dni').textContent = paciente.dni;
  document.getElementById('paciente-sexo').textContent = paciente.sexo;
  
  const edad = calcularEdad(paciente.fecha_nacimiento);
  document.getElementById('paciente-edad').textContent = `${edad} años`;
}

// Calcular edad
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

// Mostrar campos según tipo de evaluación
function mostrarCamposTipo() {
  const tipo = document.getElementById('tipo-evaluacion').value;
  document.getElementById('seccion-signos').style.display = 'block';
}

// Mostrar/ocultar sección de turno
function mostrarSecciones() {
  const tipoEgreso = document.querySelector('select[name="tipo_egreso"]').value;
  const seccionTurno = document.getElementById('seccion-turno');
  
  if (tipoEgreso === 'DERIVACION_MEDICO') {
    if (seccionTurno) seccionTurno.style.display = 'block';
    cargarMedicosUrgencias();
  } else {
    if (seccionTurno) seccionTurno.style.display = 'none';
  }
}

// Cargar médicos del sector Urgencias
async function cargarMedicosUrgencias() {
  const selectMedico = document.getElementById('select-medico');
  const mensaje = document.getElementById('mensaje-horarios');
  
  if (!selectMedico) return;
  
  try {
    if (mensaje) {
      mensaje.style.display = 'block';
      mensaje.className = 'alert alert-info';
      mensaje.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cargando médicos...';
    }
    
    const response = await fetch('/enfermero/evaluaciones/api/medicos/urgencias');
    const data = await response.json();
    
    if (data.success) {
      selectMedico.innerHTML = `
        <option value="">Seleccione un médico...</option>
        ${data.data.map(medico => `
          <option value="${medico.id}">
            ${medico.nombre_completo} - ${medico.especialidad}
          </option>
        `).join('')}
      `;
      
      if (mensaje) mensaje.style.display = 'none';
    } else {
      if (mensaje) {
        mensaje.className = 'alert alert-danger';
        mensaje.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${data.message}`;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    if (mensaje) {
      mensaje.className = 'alert alert-danger';
      mensaje.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Error al cargar médicos';
    }
  }
}

// Cuando se selecciona un médico
document.getElementById('select-medico')?.addEventListener('change', async function() {
  const medicoId = this.value;
  const fechaInput = document.getElementById('fecha-turno');
  const seccionHorarios = document.getElementById('seccion-horarios');
  
  if (!medicoId) {
    if (seccionHorarios) seccionHorarios.style.display = 'none';
    return;
  }
  
  // Si no hay fecha, pedirla
  if (!fechaInput.value) {
    fechaInput.focus();
    return;
  }
  
  await cargarHorariosDisponibles(medicoId, fechaInput.value);
});

// Cuando cambia la fecha
document.getElementById('fecha-turno')?.addEventListener('change', async function() {
  const medicoId = document.getElementById('select-medico')?.value;
  const fecha = this.value;
  
  if (!medicoId) {
    alert('Primero seleccione un médico');
    return;
  }
  
  await cargarHorariosDisponibles(medicoId, fecha);
});

// Cargar horarios disponibles
async function cargarHorariosDisponibles(medicoId, fecha) {
  const listaHorarios = document.getElementById('lista-horarios');
  const seccionHorarios = document.getElementById('seccion-horarios');
  const mensaje = document.getElementById('mensaje-horarios');
  
  try {
    if (mensaje) {
      mensaje.style.display = 'block';
      mensaje.className = 'alert alert-info';
      mensaje.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Buscando horarios disponibles...`;
    }
    
    const response = await fetch(`/enfermero/evaluaciones/api/medicos/${medicoId}/horarios?fecha=${fecha}`);
    const data = await response.json();
    
    if (data.success && data.horarios && data.horarios.length > 0) {
      if (listaHorarios) {
        listaHorarios.innerHTML = `
          <div class="col-12 mb-2">
            <small class="text-muted">
              <i class="fas fa-info-circle me-1"></i>
              ${data.horarios.length} horarios disponibles
            </small>
          </div>
          ${data.horarios.map((hora, index) => `
            <div class="col-md-3 col-sm-4 col-6">
              <div class="form-check">
                <input class="form-check-input" type="radio" 
                       name="hora_inicio"  
                       id="hora-${index}" 
                       value="${hora}"
                       required>
                <label class="form-check-label btn btn-outline-primary w-100 text-center" 
                       for="hora-${index}">
                  ${hora}
                </label>
              </div>
            </div>
          `).join('')}
        `;
      }
      
      if (seccionHorarios) seccionHorarios.style.display = 'block';
      if (mensaje) mensaje.style.display = 'none';
    } else {
      if (listaHorarios) listaHorarios.innerHTML = '';
      if (seccionHorarios) seccionHorarios.style.display = 'none';
      
      if (mensaje) {
        mensaje.className = 'alert alert-warning';
        mensaje.innerHTML = `
          <i class="fas fa-calendar-times me-2"></i>
          No hay horarios disponibles para esta fecha.
          ${data.message ? `<br><small>${data.message}</small>` : ''}
        `;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    if (mensaje) {
      mensaje.className = 'alert alert-danger';
      mensaje.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Error al cargar horarios';
    }
  }
}

// Enter en DNI
document.getElementById('input-dni')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPaciente();
  }
});

// Enviar formulario de nueva evaluación
document.getElementById('form-evaluacion')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Validar que se haya seleccionado paciente
  const pacienteId = document.getElementById('paciente-id').value;
  if (!pacienteId) {
    alert('Primero busque y seleccione un paciente');
    return;
  }
  
  const formData = new FormData(this);
  const tipoEgreso = formData.get('tipo_egreso');
  
  // Validaciones específicas para derivación a médico
  if (tipoEgreso === 'DERIVACION_MEDICO') {
    const medicoId = document.getElementById('select-medico')?.value;
    const fecha = document.getElementById('fecha-turno')?.value;
    const horaTurno = document.querySelector('input[name="hora_inicio"]:checked')?.value;
    
    if (!medicoId || !fecha || !horaTurno) {
      alert('Para derivar a médico debe completar: médico, fecha y horario');
      return;
    }
    
    // Agregar datos del turno al formData
    formData.append('medico_id', medicoId);
    formData.append('fecha_turno', fecha);
    formData.append('hora_inicio', horaTurno);
  }
  
  // Convertir FormData a objeto
  const data = Object.fromEntries(formData.entries());
  
  try {
    const response = await fetch('/enfermero/evaluaciones/nueva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.data?.redirect || '/enfermero/evaluaciones';
    } else {
      alert(result.message || 'Error al registrar evaluación');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión. Intente nuevamente.');
  }
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Si hay DNI en la URL, buscarlo automáticamente
  const urlParams = new URLSearchParams(window.location.search);
  const dniParam = urlParams.get('dni');
  
  if (dniParam) {
    document.getElementById('input-dni').value = dniParam;
    buscarPaciente();
  }
});