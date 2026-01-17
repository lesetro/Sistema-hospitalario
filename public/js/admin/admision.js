document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================================================
  // URGENCIAS
  // ============================================================================
  const urgenciasBtn = document.getElementById('urgenciasBtn');
  if (urgenciasBtn) {
    urgenciasBtn.addEventListener('click', async () => {
      const dni = prompt('Ingrese el DNI del paciente de urgencia (dejar vacío para generar temporal):');
      
      if (dni === null) return; // Canceló
      
      const dniToUse = dni.trim() || String(Date.now()).slice(-8).padStart(8, '0');
      
      try {
        const response = await fetch('/admisiones/api/urgencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: dniToUse })
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert(` ${data.mensaje}\nPaciente ID: ${data.pacienteId}\nAdmisión ID: ${data.admisionId}`);
          location.reload();
        } else {
          alert('❌ Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error al crear urgencia:', error);
        alert('❌ Error al procesar urgencia');
      }
    });
  }
  
  // ============================================================================
  // BUSCAR PACIENTE POR DNI
  // ============================================================================
  const btnBuscarPaciente = document.getElementById('buscar_paciente');
  const inputPacienteSearch = document.getElementById('paciente_search');
  
  if (btnBuscarPaciente && inputPacienteSearch) {
    btnBuscarPaciente.addEventListener('click', async () => {
      const dni = inputPacienteSearch.value.trim();
      
      if (!dni || dni.length < 7) {
        alert('❌ Ingrese un DNI válido (7-8 dígitos)');
        return;
      }
      
      btnBuscarPaciente.disabled = true;
      btnBuscarPaciente.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Buscando...';
      
      try {
        const response = await fetch(`/admisiones/api/buscar-paciente?dni=${dni}`);
        const data = await response.json();
        
        if (data.action === 'crear_paciente') {
          // No existe o es usuario sin registro de paciente
          abrirModalCrearPaciente(data.usuario || { dni });
          
        } else if (data.action === 'ver_historial') {
          // Tiene turnos/estudios activos
          abrirModalHistorial(data);
          
        } else if (data.action === 'crear_admision') {
          // Existe y puede crear admisión
          abrirModalCrearAdmision(data.paciente);
        }
        
      } catch (error) {
        console.error('Error al buscar paciente:', error);
        alert('❌ Error al buscar paciente');
      } finally {
        btnBuscarPaciente.disabled = false;
        btnBuscarPaciente.innerHTML = '<i class="fas fa-search me-2"></i>Buscar';
      }
    });
    
    // Enter en el input
    inputPacienteSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnBuscarPaciente.click();
      }
    });
  }
  
  // ============================================================================
  // MODAL: CREAR PACIENTE
  // ============================================================================
  function abrirModalCrearPaciente(datosUsuario = {}) {
    const modal = new bootstrap.Modal(document.getElementById('modalCrearPaciente'));
    
    // Prellenar datos si existen
    if (datosUsuario.dni) {
      document.getElementById('modal_dni').value = datosUsuario.dni;
      document.getElementById('modal_dni').readOnly = true;
    }
    if (datosUsuario.nombre) document.getElementById('modal_nombre').value = datosUsuario.nombre;
    if (datosUsuario.apellido) document.getElementById('modal_apellido').value = datosUsuario.apellido;
    if (datosUsuario.email) document.getElementById('modal_email').value = datosUsuario.email;
    if (datosUsuario.telefono) document.getElementById('modal_telefono').value = datosUsuario.telefono;
    if (datosUsuario.fecha_nacimiento) document.getElementById('modal_fecha_nacimiento').value = datosUsuario.fecha_nacimiento.split('T')[0];
    if (datosUsuario.sexo) document.getElementById('modal_sexo').value = datosUsuario.sexo;
    
    modal.show();
  }
  
  const btnGuardarPaciente = document.getElementById('btnGuardarPaciente');
  if (btnGuardarPaciente) {
    btnGuardarPaciente.addEventListener('click', async () => {
      const form = document.getElementById('formCrearPaciente');
      
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      btnGuardarPaciente.disabled = true;
      btnGuardarPaciente.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const response = await fetch('/admisiones/api/crear-paciente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('✅ ' + result.mensaje);
          bootstrap.Modal.getInstance(document.getElementById('modalCrearPaciente')).hide();
          
          // Abrir modal de admisión
          setTimeout(() => {
            abrirModalCrearAdmision(result.paciente);
          }, 500);
          
        } else {
          alert('❌ Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error al crear paciente:', error);
        alert('❌ Error al crear paciente');
      } finally {
        btnGuardarPaciente.disabled = false;
        btnGuardarPaciente.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Paciente';
      }
    });
  }
  
  // ============================================================================
  // MODAL: CREAR ADMISIÓN
  // ============================================================================
  function abrirModalCrearAdmision(paciente) {
  console.log('Datos del paciente recibidos:', paciente);
  
  const modalEl = document.getElementById('modalCrearAdmision');
  if (!modalEl) {
    console.error('Modal modalCrearAdmision no encontrado');
    alert('Error: No se encontró el formulario de admisión');
    return;
  }
  
  const modal = new bootstrap.Modal(modalEl);
  
  // Validar elementos antes de asignar
  const nombreEl = document.getElementById('nombre_paciente_admision');
  const pacienteIdEl = document.getElementById('admision_paciente_id');
  const usuarioIdEl = document.getElementById('admision_usuario_id');
  
  if (nombreEl) {
    nombreEl.textContent = `${paciente.nombre || 'N/A'} ${paciente.apellido || ''} (DNI: ${paciente.dni || 'N/A'})`;
  }
  
  if (pacienteIdEl) {
    pacienteIdEl.value = paciente.id || '';
  }
  
  if (usuarioIdEl) {
    usuarioIdEl.value = paciente.usuario_id || '';
  }
  
  // Fecha actual
  const fechaEl = document.getElementById('admision_fecha');
  if (fechaEl) {
    fechaEl.valueAsDate = new Date();
  }
  
  modal.show();
}
  
  // ============================================================================
  // TIPO DE TURNO - MOSTRAR/OCULTAR CAMPOS
  // ============================================================================
  const tipoTurnoSelect = document.getElementById('admision_tipo_turno_id');
  if (tipoTurnoSelect) {
    tipoTurnoSelect.addEventListener('change', function() {
      const option = this.options[this.selectedIndex];
      const requiereEstudio = option.dataset.requiereEstudio === 'true';
      const requiereEspecialidad = option.dataset.requiereEspecialidad === 'true';
      
      // Mostrar/ocultar campos
      document.getElementById('campo_estudio').style.display = requiereEstudio ? 'block' : 'none';
      document.getElementById('campo_especialidad').style.display = requiereEspecialidad ? 'block' : 'none';
      document.getElementById('campo_sector').style.display = 'block';
      
      // Reset médico
      document.getElementById('admision_medico_id').innerHTML = '<option value="">Seleccione especialidad o sector</option>';
      document.getElementById('admision_medico_id').disabled = true;
    });
  }
  
  // ============================================================================
  // FILTRAR MÉDICOS POR ESPECIALIDAD
  // ============================================================================
  const especialidadSelect = document.getElementById('admision_especialidad_id');
  if (especialidadSelect) {
    especialidadSelect.addEventListener('change', async function() {
      const especialidadId = this.value;
      
      if (!especialidadId) {
        document.getElementById('admision_medico_id').innerHTML = '<option value="">Seleccione especialidad primero</option>';
        document.getElementById('admision_medico_id').disabled = true;
        return;
      }
      
      try {
        const response = await fetch(`/admisiones/api/medicos-por-especialidad?especialidad_id=${especialidadId}`);
        const data = await response.json();
        
        const medicoSelect = document.getElementById('admision_medico_id');
        medicoSelect.innerHTML = '<option value="">Seleccione médico...</option>';
        
        data.medicos.forEach(medico => {
          const option = document.createElement('option');
          option.value = medico.id;
          option.textContent = `Dr/a. ${medico.usuario.nombre} ${medico.usuario.apellido}`;
          option.dataset.sectorId = medico.sector.id;
          option.dataset.sectorNombre = medico.sector.nombre;
          medicoSelect.appendChild(option);
        });
        
        medicoSelect.disabled = false;
        
      } catch (error) {
        console.error('Error al cargar médicos:', error);
        alert('❌ Error al cargar médicos');
      }
    });
  }
  
  // ============================================================================
  // FILTRAR MÉDICOS POR SECTOR
  // ============================================================================
  const sectorSelect = document.getElementById('admision_sector_id');
  if (sectorSelect) {
    sectorSelect.addEventListener('change', async function() {
      const sectorId = this.value;
      
      if (!sectorId) {
        document.getElementById('admision_medico_id').innerHTML = '<option value="">Seleccione sector primero</option>';
        document.getElementById('admision_medico_id').disabled = true;
        return;
      }
      
      try {
        const response = await fetch(`/admisiones/api/medicos-por-sector?sector_id=${sectorId}`);
        const data = await response.json();
        
        const medicoSelect = document.getElementById('admision_medico_id');
        medicoSelect.innerHTML = '<option value="">Seleccione médico...</option>';
        
        data.medicos.forEach(medico => {
          const option = document.createElement('option');
          option.value = medico.id;
          option.textContent = `Dr/a. ${medico.usuario.nombre} ${medico.usuario.apellido} (${medico.especialidad.nombre})`;
          medicoSelect.appendChild(option);
        });
        
        medicoSelect.disabled = false;
        
      } catch (error) {
        console.error('Error al cargar médicos:', error);
        alert('❌ Error al cargar médicos');
      }
    });
  }
  
  // ============================================================================
  // AL SELECCIONAR MÉDICO - PRECARGAR SECTOR Y HABILITAR HORARIOS
  // ============================================================================
  const medicoSelect = document.getElementById('admision_medico_id');
  if (medicoSelect) {
    medicoSelect.addEventListener('change', function() {
      const option = this.options[this.selectedIndex];
      
      if (option.dataset.sectorId) {
        document.getElementById('admision_sector_id').value = option.dataset.sectorId;
      }
      
      // Habilitar botón de cargar horarios
      const btnCargarHorarios = document.getElementById('btnCargarHorarios');
      const turnoFecha = document.getElementById('admision_turno_fecha').value;
      
      if (this.value && turnoFecha) {
        btnCargarHorarios.disabled = false;
      }
      
      // Mostrar info del médico
      if (this.value) {
        const info = `Sector: ${option.dataset.sectorNombre || document.getElementById('admision_sector_id').options[document.getElementById('admision_sector_id').selectedIndex].text}`;
        document.getElementById('info_medico_seleccionado').textContent = info;
      } else {
        document.getElementById('info_medico_seleccionado').textContent = '';
      }
    });
  }
  
  // ============================================================================
  // CARGAR HORARIOS DISPONIBLES
  // ============================================================================
  const btnCargarHorarios = document.getElementById('btnCargarHorarios');
  const turnoFechaInput = document.getElementById('admision_turno_fecha');
  
  if (turnoFechaInput) {
    turnoFechaInput.addEventListener('change', function() {
      const medicoId = document.getElementById('admision_medico_id').value;
      if (medicoId && this.value) {
        btnCargarHorarios.disabled = false;
      }
    });
  }
  
  if (btnCargarHorarios) {
    btnCargarHorarios.addEventListener('click', async function() {
      const medicoId = document.getElementById('admision_medico_id').value;
      const fecha = document.getElementById('admision_turno_fecha').value;
      
      if (!medicoId || !fecha) {
        alert('❌ Seleccione médico y fecha primero');
        return;
      }
      
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cargando...';
      
      try {
        const response = await fetch(`/admisiones/api/horarios-disponibles?medico_id=${medicoId}&fecha=${fecha}`);
        const data = await response.json();
        
        const turnoHoraSelect = document.getElementById('admision_turno_hora');
        turnoHoraSelect.innerHTML = '<option value="">Seleccione horario...</option>';
        
        if (data.horariosDisponibles.length === 0) {
          turnoHoraSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
          alert(' No hay horarios disponibles para esta fecha');
        } else {
          data.horariosDisponibles.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            turnoHoraSelect.appendChild(option);
          });
          
          turnoHoraSelect.disabled = false;
          alert(`✅ ${data.total} horarios disponibles cargados`);
        }
        
      } catch (error) {
        console.error('Error al cargar horarios:', error);
        alert('❌ Error al cargar horarios');
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Cargar Horarios';
      }
    });
  }
  
  // ============================================================================
  // GUARDAR ADMISIÓN
  // ============================================================================
  const btnGuardarAdmision = document.getElementById('btnGuardarAdmision');
  if (btnGuardarAdmision) {
    btnGuardarAdmision.addEventListener('click', async () => {
      const form = document.getElementById('formCrearAdmision');
      
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        alert('❌ Complete todos los campos obligatorios (*)');
        return;
      }
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      btnGuardarAdmision.disabled = true;
      btnGuardarAdmision.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const response = await fetch('/admisiones/api/crear-admision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('✅ ' + result.mensaje);
          bootstrap.Modal.getInstance(document.getElementById('modalCrearAdmision')).hide();
          location.reload();
        } else {
          alert('❌ Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error al crear admisión:', error);
        alert('❌ Error al crear admisión');
      } finally {
        btnGuardarAdmision.disabled = false;
        btnGuardarAdmision.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Admisión';
      }
    });
  }
  
  // ============================================================================
  // MODAL: HISTORIAL DEL PACIENTE
  // ============================================================================
  function abrirModalHistorial(data) {
    const modal = new bootstrap.Modal(document.getElementById('modalHistorialPaciente'));
    const contenido = document.getElementById('contenido_historial');
    
    const paciente = data.paciente;
    const historial = data.historial;
    
    let html = `
      <div class="row mb-4">
        <div class="col-md-12">
          <div class="alert alert-info">
            <h4><i class="fas fa-user me-2"></i>${paciente.nombre} ${paciente.apellido}</h4>
            <p class="mb-0"><strong>DNI:</strong> ${paciente.dni} | <strong>Obra Social:</strong> ${paciente.obra_social ? paciente.obra_social.nombre : 'Sin obra social'}</p>
          </div>
        </div>
      </div>
    `;
    
    // Turnos activos
    if (historial.tiene_turnos) {
      html += `
        <div class="card mb-3">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Turnos Activos</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Médico</th>
                    <th>Sector</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
      `;
      
      historial.turnos_activos.forEach(turno => {
        html += `
          <tr>
            <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
            <td>${turno.hora_inicio}</td>
            <td>Dr/a. ${turno.medico.usuario.nombre} ${turno.medico.usuario.apellido}</td>
            <td>${turno.sector.nombre}</td>
            <td><span class="badge bg-${turno.estado === 'CONFIRMADO' ? 'success' : 'warning'}">${turno.estado}</span></td>
          </tr>
        `;
      });
      
      html += `
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }
    
    // Estudios activos
    if (historial.tiene_estudios) {
      html += `
        <div class="card mb-3">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0"><i class="fas fa-microscope me-2"></i>Estudios Pendientes</h5>
          </div>
          <div class="card-body">
            <ul class="list-group">
      `;
      
      historial.estudios_activos.forEach(estudio => {
        html += `
          <li class="list-group-item">
            <strong>${estudio.tipo_estudio.nombre}</strong> 
            <span class="badge bg-${estudio.urgencia === 'Alta' ? 'danger' : 'secondary'}">${estudio.urgencia}</span>
            ${estudio.evaluacion_medica ? `<br><small class="text-muted">Solicitado por: Dr/a. ${estudio.evaluacion_medica.medico.usuario.nombre}</small>` : ''}
          </li>
        `;
      });
      
      html += `
            </ul>
          </div>
        </div>
      `;
    }
    
     // Última evaluación
    if (historial.ultima_evaluacion) {
      const evaluacion = historial.ultima_evaluacion;
      html += `
        <div class="card mb-3">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="fas fa-stethoscope me-2"></i>Última Evaluación Médica</h5>
          </div>
          <div class="card-body">
            <p><strong>Fecha:</strong> ${new Date(evaluacion.fecha).toLocaleDateString('es-AR')}</p>
            <p><strong>Médico:</strong> Dr/a. ${evaluacion.medico.usuario.nombre} ${evaluacion.medico.usuario.apellido}</p>
            ${evaluacion.observaciones_diagnostico ? `<p><strong>Observaciones:</strong> ${evaluacion.observaciones_diagnostico}</p>` : ''}
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="row mt-4">
        <div class="col-md-12">
          <button class="btn btn-primary w-100" onclick="location.href='/admisiones/lista?paciente_dni=${paciente.dni}'">
            <i class="fas fa-list me-2"></i>Ver Todas las Admisiones
          </button>
        </div>
      </div>
    `;
    
    contenido.innerHTML = html;
    modal.show();
  }
  
  // Hacer disponible globalmente para el modal
  window.abrirModalHistorial = abrirModalHistorial;
});