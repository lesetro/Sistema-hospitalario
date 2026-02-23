// ============================================
// BÚSQUEDA DE INTERNACIONES ACTIVAS
// ============================================

let timeoutBusqueda;
const inputBusqueda = document.getElementById('buscar-internacion');
const resultadosDiv = document.getElementById('resultados-internacion');

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', function() {
    clearTimeout(timeoutBusqueda);
    const busqueda = this.value.trim();
    
    if (busqueda.length < 2) {
      resultadosDiv.style.display = 'none';
      return;
    }
    
    timeoutBusqueda = setTimeout(() => {
      buscarInternaciones(busqueda);
    }, 300);
  });
}

async function buscarInternaciones(busqueda) {
  try {
    const response = await fetch(`/medico/ordenes-internacion/api/internaciones/buscar?q=${encodeURIComponent(busqueda)}`);
    const data = await response.json();
    
    if (data.success && data.internaciones.length > 0) {
      mostrarResultados(data.internaciones);
    } else {
      resultadosDiv.innerHTML = '<div class="list-group-item text-muted">No se encontraron pacientes internados</div>';
      resultadosDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error al buscar internaciones:', error);
    resultadosDiv.innerHTML = '<div class="list-group-item text-danger">Error al buscar</div>';
    resultadosDiv.style.display = 'block';
  }
}

function mostrarResultados(internaciones) {
  resultadosDiv.innerHTML = '';
  
  internaciones.forEach(internacion => {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'list-group-item list-group-item-action';
    
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${internacion.paciente_nombre}</strong>
          <br>
          <small class="text-muted">DNI: ${internacion.paciente_dni}</small>
          <br>
          <small class="text-info">
            <i class="fas fa-map-marker-alt me-1"></i> ${internacion.ubicacion}
          </small>
        </div>
        <i class="fas fa-chevron-right"></i>
      </div>
    `;
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      seleccionarInternacion(internacion);
    });
    
    resultadosDiv.appendChild(item);
  });
  
  resultadosDiv.style.display = 'block';
}

function seleccionarInternacion(internacion) {
  // Guardar IDs
  document.getElementById('internacion_id').value = internacion.id;
  document.getElementById('paciente_id').value = internacion.paciente_id;
  
  // Mostrar información seleccionada
  inputBusqueda.value = `${internacion.paciente_nombre} - ${internacion.ubicacion}`;
  resultadosDiv.style.display = 'none';
  
  // Mostrar badge de confirmación
  const infoDiv = document.createElement('div');
  infoDiv.id = 'info-internacion-seleccionada';
  infoDiv.className = 'alert alert-success mt-2';
  infoDiv.innerHTML = `
    <i class="fas fa-check-circle me-2"></i>
    <strong>Paciente seleccionado:</strong> ${internacion.paciente_nombre}
    <br>
    <small>Ubicación: ${internacion.ubicacion}</small>
  `;
  
  // Remover si ya existe
  const existe = document.getElementById('info-internacion-seleccionada');
  if (existe) existe.remove();
  
  inputBusqueda.parentNode.appendChild(infoDiv);
}

// Cerrar resultados al hacer click fuera
document.addEventListener('click', function(event) {
  if (inputBusqueda && !inputBusqueda.contains(event.target) && !resultadosDiv.contains(event.target)) {
    resultadosDiv.style.display = 'none';
  }
});

// ============================================
// GUARDAR ORDEN
// ============================================

async function guardarOrden() {
  // Obtener datos del formulario
  const internacionId = document.getElementById('internacion_id').value;
  const pacienteId = document.getElementById('paciente_id').value;
  const tipoOrden = document.getElementById('tipo_orden').value;
  const descripcion = document.getElementById('descripcion').value;
  const prioridad = document.getElementById('prioridad').value;
  const indicaciones = document.getElementById('indicaciones_especificas').value;
  const frecuencia = document.getElementById('frecuencia').value;
  const requiereMonitoreo = document.getElementById('requiere_monitoreo_continuo').checked;
  const observaciones = document.getElementById('observaciones_adicionales').value;
  
  // Validaciones
  if (!internacionId) {
    alert('Debe seleccionar un paciente internado');
    return;
  }
  
  if (!tipoOrden) {
    alert('Debe seleccionar el tipo de orden');
    return;
  }
  
  if (!descripcion || descripcion.trim() === '') {
    alert('Debe ingresar la descripción de la orden');
    return;
  }
  
  if (!prioridad) {
    alert('Debe seleccionar la prioridad');
    return;
  }
  
  // Confirmación para órdenes urgentes
  if (prioridad === 'URGENTE') {
    const confirmado = confirm('¿Confirma que esta orden es URGENTE?\n\nLas órdenes urgentes tienen prioridad máxima y deben ejecutarse de inmediato.');
    if (!confirmado) {
      return;
    }
  }
  
  // Deshabilitar botón
  const btnGuardar = document.querySelector('button[onclick="guardarOrden()"]');
  const textoOriginal = btnGuardar.innerHTML;
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Guardando...';
  
  try {
    const data = {
      internacion_id: internacionId,
      paciente_id: pacienteId,
      tipo_orden: tipoOrden,
      descripcion: descripcion,
      indicaciones_especificas: indicaciones,
      frecuencia: frecuencia,
      prioridad: prioridad,
      requiere_monitoreo_continuo: requiereMonitoreo,
      observaciones_adicionales: observaciones
    };
    
    const response = await fetch('/medico/ordenes-internacion/crear', {
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
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = textoOriginal;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear la orden. Por favor intente nuevamente.');
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = textoOriginal;
  }
}

// ============================================
// AUTOCOMPLETAR SEGÚN TIPO DE ORDEN
// ============================================

const selectTipoOrden = document.getElementById('tipo_orden');
const textareaDescripcion = document.getElementById('descripcion');

if (selectTipoOrden && textareaDescripcion) {
  selectTipoOrden.addEventListener('change', function() {
    const tipo = this.value;
    
    const plantillas = {
      'Control de signos vitales': 'Control de signos vitales: presión arterial, frecuencia cardíaca, frecuencia respiratoria, temperatura corporal y saturación de oxígeno cada 4 horas.',
      'Administración de medicación': 'Administrar medicación según prescripción. Verificar dosis, vía de administración y horarios indicados.',
      'Curación': 'Realizar curación de herida con técnica estéril. Evaluar signos de infección, enrojecimiento, edema o secreción.',
      'Cambio de posición': 'Realizar cambios de posición del paciente cada 2 horas para prevenir úlceras por presión.',
      'Control de ingesta/egreso': 'Control estricto de balance hídrico: registrar ingesta oral, sueros administrados y diuresis cada 8 horas.',
      'Higiene del paciente': 'Realizar higiene corporal completa del paciente. Prestar especial atención a pliegues y zonas de riesgo.',
      'Toma de muestra': 'Toma de muestra de sangre/orina para laboratorio. Rotular correctamente y enviar a laboratorio.'
    };
    
    if (plantillas[tipo] && textareaDescripcion.value.trim() === '') {
      textareaDescripcion.value = plantillas[tipo];
    }
  });
}