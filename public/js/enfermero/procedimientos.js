// Procedimientos de Enfermería - Lista

// Limpiar filtros
function limpiarFiltros() {
  const form = document.getElementById('form-filtros');
  form.querySelectorAll('input, select').forEach(input => {
    input.value = '';
  });
  form.submit();
}

// Ver procedimientos pendientes
async function verPendientes() {
  const modal = new bootstrap.Modal(document.getElementById('modalPendientes'));
  modal.show();
  
  try {
    const response = await fetch('/enfermero/procedimientos/api/pendientes');
    const data = await response.json();
    
    if (data.success) {
      mostrarPendientes(data.procedimientos);
    } else {
      document.getElementById('contenido-pendientes').innerHTML = '<p class="text-center text-muted">No hay procedimientos pendientes</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-pendientes').innerHTML = '<p class="text-center text-danger">Error al cargar datos</p>';
  }
}

// Mostrar procedimientos pendientes
function mostrarPendientes(procedimientos) {
  if (procedimientos.length === 0) {
    document.getElementById('contenido-pendientes').innerHTML = '<p class="text-center text-muted">No hay procedimientos pendientes</p>';
    return;
  }
  
  let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Paciente</th><th>Procedimiento</th><th>Duración</th><th>Acción</th></tr></thead><tbody>';
  
  procedimientos.forEach(proc => {
    html += `
      <tr>
        <td>
          <strong>${proc.paciente.nombre}</strong><br>
          <small class="text-muted">DNI: ${proc.paciente.dni}</small>
        </td>
        <td>
          <strong>${proc.nombre}</strong><br>
          <small class="text-muted">${proc.descripcion || ''}</small>
        </td>
        <td>
          ${proc.duracion_estimada ? `<span class="badge bg-info">${proc.duracion_estimada} min</span>` : 'N/A'}
        </td>
        <td>
          <a href="/enfermero/procedimientos/${proc.id}/ejecutar" class="btn btn-sm btn-success">
            <i class="fas fa-play me-1"></i> Ejecutar
          </a>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  document.getElementById('contenido-pendientes').innerHTML = html;
}

// Registrar complicación
function registrarComplicacion(procId) {
  document.getElementById('complicacion-proc-id').value = procId;
  const modal = new bootstrap.Modal(document.getElementById('modalComplicacion'));
  modal.show();
}

// Guardar complicación
async function guardarComplicacion() {
  const procId = document.getElementById('complicacion-proc-id').value;
  const datos = {
    tipo_complicacion: document.getElementById('tipo-complicacion').value,
    descripcion: document.getElementById('desc-complicacion').value,
    accion_tomada: document.getElementById('accion-tomada').value
  };
  
  if (!datos.tipo_complicacion || !datos.descripcion || !datos.accion_tomada) {
    alert('Complete todos los campos');
    return;
  }
  
  try {
    const response = await fetch(`/enfermero/procedimientos/${procId}/complicacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
      window.location.href = result.redirect;
    } else {
      alert(result.message || 'Error al registrar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la complicación');
  }
}