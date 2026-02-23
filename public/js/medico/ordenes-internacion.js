// ============================================
// ABRIR MODAL PARA CREAR ORDEN
// ============================================

function abrirModalCrearOrden(internacionId, pacienteId, pacienteNombre, ubicacion) {
  // Establecer valores en el formulario
  document.getElementById('internacion_id_modal').value = internacionId;
  document.getElementById('paciente_id_modal').value = pacienteId;
  document.getElementById('paciente-nombre-modal').textContent = pacienteNombre;
  document.getElementById('paciente-ubicacion-modal').textContent = ubicacion;
  document.getElementById('info-paciente-modal').style.display = 'block';
  
  // Limpiar formulario
  document.getElementById('form-crear-orden-internacion').reset();
  document.getElementById('internacion_id_modal').value = internacionId;
  document.getElementById('paciente_id_modal').value = pacienteId;
  
  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById('modalCrearOrdenInternacion'));
  modal.show();
}

// ============================================
// GUARDAR ORDEN DE INTERNACIÓN
// ============================================

async function guardarOrdenInternacion() {
  const form = document.getElementById('form-crear-orden-internacion');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Validación básica
  if (!data.tipo_orden) {
    alert('Por favor seleccione el tipo de orden');
    return;
  }
  
  if (!data.descripcion || data.descripcion.trim() === '') {
    alert('Por favor ingrese la descripción de la orden');
    return;
  }
  
  if (!data.prioridad) {
    alert('Por favor seleccione la prioridad');
    return;
  }
  
  // Confirmación para órdenes urgentes
  if (data.prioridad === 'URGENTE') {
    const confirmado = confirm('¿Confirma que esta orden es URGENTE?\n\nLas órdenes urgentes tienen prioridad máxima.');
    if (!confirmado) {
      return;
    }
  }
  
  // Deshabilitar botón
  const btnGuardar = document.querySelector('#modalCrearOrdenInternacion button[onclick="guardarOrdenInternacion()"]');
  const textoOriginal = btnGuardar.innerHTML;
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Guardando...';
  
  try {
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
      
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearOrdenInternacion'));
      modal.hide();
      
      // Recargar página
      window.location.reload();
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
// VER ÓRDENES DE UN PACIENTE (Modal)
// ============================================

async function verOrdenesPaciente(pacienteId, pacienteNombre) {
  try {
    const response = await fetch(`/medico/ordenes-internacion/api/paciente/${pacienteId}/ordenes`);
    const result = await response.json();
    
    if (result.success) {
      mostrarModalOrdenes(pacienteNombre, result.ordenes);
    } else {
      alert(result.message || 'No se pudieron cargar las órdenes');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar las órdenes del paciente');
  }
}

function mostrarModalOrdenes(pacienteNombre, ordenes) {
  let contenidoHTML = `
    <div class="modal fade" id="modalVerOrdenes" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="fas fa-clipboard-list me-2"></i>
              Órdenes de ${pacienteNombre}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
  `;
  
  if (ordenes.length === 0) {
    contenidoHTML += `
      <div class="text-center text-muted py-4">
        <i class="fas fa-inbox fa-3x mb-3"></i>
        <p>No hay órdenes pendientes para este paciente</p>
      </div>
    `;
  } else {
    ordenes.forEach(orden => {
      const badgeColor = orden.prioridad === 'URGENTE' ? 'danger' : orden.prioridad === 'ALTA' ? 'warning' : 'secondary';
      contenidoHTML += `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="mb-0">${orden.observaciones.substring(0, 100)}...</h6>
              <span class="badge bg-${badgeColor}">${orden.prioridad}</span>
            </div>
            <small class="text-muted">
              <i class="fas fa-user-md me-1"></i> ${orden.medico}
              <br>
              <i class="fas fa-calendar me-1"></i> ${new Date(orden.fecha).toLocaleString('es-AR')}
            </small>
            <div class="mt-2">
              <a href="/medico/ordenes-internacion/${orden.id}" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-eye me-1"></i> Ver detalle
              </a>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  contenidoHTML += `
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i> Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remover modal anterior si existe
  const modalAnterior = document.getElementById('modalVerOrdenes');
  if (modalAnterior) {
    modalAnterior.remove();
  }
  
  // Agregar nuevo modal al DOM
  document.body.insertAdjacentHTML('beforeend', contenidoHTML);
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalVerOrdenes'));
  modal.show();
  
  // Limpiar modal al cerrar
  document.getElementById('modalVerOrdenes').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}

// ============================================
// CANCELAR ORDEN
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
    const response = await fetch(`/medico/ordenes-internacion/${id}`, {
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
// AUTOCOMPLETAR TIPO DE ORDEN
// ============================================

const selectTipoOrden = document.getElementById('tipo_orden');
const textareaDescripcion = document.getElementById('descripcion_internacion');

if (selectTipoOrden && textareaDescripcion) {
  selectTipoOrden.addEventListener('change', function() {
    const tipo = this.value;
    
    const plantillas = {
      'Control de signos vitales': 'Control de signos vitales: presión arterial, frecuencia cardíaca, frecuencia respiratoria, temperatura corporal y saturación de oxígeno.',
      'Administración de medicación': 'Administrar medicación según prescripción médica. Verificar dosis, vía de administración y horarios.',
      'Curación': 'Realizar curación de herida quirúrgica/traumática con técnica estéril. Evaluar signos de infección.',
      'Cambio de posición': 'Realizar cambios de posición del paciente para prevenir úlceras por presión. Frecuencia según necesidad.',
      'Control de ingesta/egreso': 'Control estricto de balance hídrico: registrar ingesta oral, sueros administrados y diuresis.',
      'Higiene del paciente': 'Realizar higiene corporal completa del paciente. Prestar especial atención a pliegues y zonas de riesgo.',
      'Toma de muestra': 'Toma de muestra de sangre/orina para laboratorio. Rotular correctamente y enviar a laboratorio.'
    };
    
    if (plantillas[tipo]) {
      textareaDescripcion.value = plantillas[tipo];
    }
  });
}

// ============================================
// VALIDACIÓN DE FRECUENCIA
// ============================================

const inputFrecuencia = document.getElementById('frecuencia_internacion');
if (inputFrecuencia) {
  inputFrecuencia.addEventListener('blur', function() {
    const valor = this.value.toLowerCase().trim();
    
    // Sugerencias de frecuencia válidas
    const frecuenciasValidas = ['c/2hs', 'c/4hs', 'c/6hs', 'c/8hs', 'c/12hs', 'c/24hs', '1 vez al día', '2 veces al día', '3 veces al día'];
    
    if (valor && !frecuenciasValidas.some(f => valor.includes(f))) {
      const sugerencia = confirm('La frecuencia ingresada no sigue el formato estándar.\n\nFormatos válidos: c/2hs, c/4hs, c/6hs, c/8hs, c/12hs, c/24hs\n\n¿Desea ver sugerencias?');
      
      if (sugerencia) {
        alert('FRECUENCIAS ESTÁNDAR:\n\n' + frecuenciasValidas.join('\n'));
      }
    }
  });
}