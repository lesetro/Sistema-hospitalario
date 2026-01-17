document.addEventListener('DOMContentLoaded', () => {
  console.log(' Iniciando internacion.js...');
  
  // ============================================================================
  // CARGAR RESUMEN DE DISPONIBILIDAD AL INICIO
  // ============================================================================
  const resumenDiv = document.getElementById('resumen_disponibilidad');
  if (resumenDiv) {
    cargarResumenDisponibilidad();
  }

  async function cargarResumenDisponibilidad() {
    try {
      const response = await fetch('/internacion/api/disponibilidad-resumen');
      const data = await response.json();

      if (!data.success || !data.sectores || data.sectores.length === 0) {
        resumenDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>No hay datos de disponibilidad</div>';
        return;
      }

      let htmlResumen = '<div class="row">';
      
      data.sectores.forEach(sector => {
        const total = sector.estadisticas.total || 0;
        const libres = sector.estadisticas.libres || 0;
        const porcentaje = total > 0 ? Math.round((libres / total) * 100) : 0;
        const colorClase = porcentaje > 50 ? 'success' : porcentaje > 20 ? 'warning' : 'danger';
        
        htmlResumen += `
          <div class="col-md-3 mb-3">
            <div class="card border-${colorClase}">
              <div class="card-header bg-${colorClase} text-white">
                <strong>${sector.nombre}</strong>
              </div>
              <div class="card-body text-center">
                <h2 class="text-${colorClase}">${libres}</h2>
                <p class="mb-0">Camas Disponibles</p>
                <small class="text-muted">Total: ${total}</small>
                <div class="progress mt-2" style="height: 10px;">
                  <div class="progress-bar bg-${colorClase}" style="width: ${porcentaje}%"></div>
                </div>
                <small>${porcentaje}% disponible</small>
              </div>
              <div class="card-footer text-center">
                <a href="/internacion/disponibilidad?sector_id=${sector.id}" class="btn btn-sm btn-primary">
                  <i class="fas fa-eye me-1"></i> Ver Detalle
                </a>
              </div>
            </div>
          </div>
        `;
      });
      
      htmlResumen += '</div>';
      resumenDiv.innerHTML = htmlResumen;
      
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      resumenDiv.innerHTML = '<div class="alert alert-danger"><i class="fas fa-times-circle me-2"></i>Error al cargar disponibilidad</div>';
    }
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
        const response = await fetch(`/internacion/api/buscar-paciente?dni=${dni}`);
        
        //  Verificar si la respuesta es OK antes de parsear
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error del servidor' }));
          console.error('Error del servidor:', errorData);
          alert(`❌ ${errorData.message || 'Error al buscar paciente'}`);
          return;
        }
        
        const data = await response.json();
        console.log(' Respuesta del servidor:', data);
        
        //  CASO 1: Paciente ya está internado
        if (data.internado === true) {
          const internacion = data.internacion || {};
          alert(
            ` PACIENTE YA INTERNADO\n\n` +
            `${data.message}\n\n` +
            ` Ubicación:\n` +
            `   Sector: ${internacion.sector || 'N/A'}\n` +
            `   Habitación: ${internacion.habitacion || 'N/A'}\n` +
            `   Cama: ${internacion.cama || 'N/A'}\n\n` +
            ` Fecha de ingreso: ${internacion.fecha_inicio ? new Date(internacion.fecha_inicio).toLocaleDateString('es-AR') : 'N/A'}`
          );
          return;
        }
        
        //  CASO 2: Paciente existe y NO está internado
        if (data.existe === true && data.internado === false) {
          abrirModalCrearInternacion(data);
          return;
        }
        
        //  CASO 3: Paciente NO existe
        if (data.existe === false) {
          alert('❌ No se encontró un paciente con ese DNI');
          return;
        }
        
        //  CASO 4: Cualquier otro error
        alert('❌ ' + (data.message || 'Error al buscar paciente'));
        
      } catch (error) {
        console.error('❌ Error completo:', error);
        alert(`❌ Error de conexión: ${error.message}`);
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
  // MODAL: CREAR INTERNACIÓN
  // ============================================================================
  function abrirModalCrearInternacion(data) {
    const modal = new bootstrap.Modal(document.getElementById('modalCrearInternacion'));
    const paciente = data.paciente;
    
    console.log(' Abriendo modal con datos:', data);
    
    // Mostrar info del paciente
    const nombrePacienteEl = document.getElementById('nombre_paciente_internacion');
    if (nombrePacienteEl) {
      nombrePacienteEl.textContent = 
        `${paciente.nombre} ${paciente.apellido} (DNI: ${paciente.dni}) - Sexo: ${paciente.sexo}`;
    }
    
    const pacienteIdInput = document.getElementById('internacion_paciente_id');
    if (pacienteIdInput) {
      pacienteIdInput.value = paciente.id;
    }
    
    // Mostrar alerta si está en lista de espera
    if (data.lista_espera) {
      const alertLE = document.getElementById('alert_lista_espera');
      const textoLE = document.getElementById('texto_lista_espera');
      
      if (alertLE && textoLE) {
        const dias = Math.floor((new Date() - new Date(data.lista_espera.fecha_registro)) / (1000 * 60 * 60 * 24));
        textoLE.textContent = 
          `Este paciente está en lista de espera desde hace ${dias} días (Prioridad: ${data.lista_espera.prioridad})`;
        alertLE.style.display = 'block';
      }
    }
    
    // Precargar evaluación médica si existe
    if (data.evaluacion_medica) {
      const select = document.getElementById('internacion_evaluacion_medica_id');
      if (select) {
        select.innerHTML = ''; // Limpiar opciones previas
        const option = document.createElement('option');
        option.value = data.evaluacion_medica.id;
        option.textContent = `${new Date(data.evaluacion_medica.fecha).toLocaleDateString('es-AR')} - Dr/a. ${data.evaluacion_medica.medico.usuario.nombre}`;
        option.selected = true;
        select.appendChild(option);
      }
    }
    
    modal.show();
  }
  
  // ============================================================================
  // VER DISPONIBILIDAD DE SECTOR
  // ============================================================================
  const btnVerDisponibilidad = document.getElementById('btnVerDisponibilidad');
  const sectorSelect = document.getElementById('internacion_sector_id');
  
  if (sectorSelect) {
    sectorSelect.addEventListener('change', function() {
      if (btnVerDisponibilidad) {
        btnVerDisponibilidad.disabled = !this.value;
      }
      
      // Reset habitación y cama
      const habSelect = document.getElementById('internacion_habitacion_id');
      const camaSelect = document.getElementById('internacion_cama_id');
      
      if (habSelect) {
        habSelect.innerHTML = '<option value="">Seleccione sector primero</option>';
        habSelect.disabled = true;
      }
      
      if (camaSelect) {
        camaSelect.innerHTML = '<option value="">Seleccione habitación primero</option>';
        camaSelect.disabled = true;
      }
    });
  }
  
  if (btnVerDisponibilidad && sectorSelect) {
    btnVerDisponibilidad.addEventListener('click', async function() {
      const sectorId = sectorSelect.value;
      
      if (!sectorId) {
        alert(' Seleccione un sector primero');
        return;
      }
      
      // Obtener sexo del paciente
      const nombrePacienteEl = document.getElementById('nombre_paciente_internacion');
      let sexo = null;
      
      if (nombrePacienteEl) {
        const nombrePaciente = nombrePacienteEl.textContent;
        const sexoMatch = nombrePaciente.match(/Sexo: (\w+)/);
        sexo = sexoMatch ? sexoMatch[1] : null;
      }
      
      const modal = new bootstrap.Modal(document.getElementById('modalDisponibilidad'));
      const sectorNombre = sectorSelect.options[sectorSelect.selectedIndex].text;
      
      const sectorNombreEl = document.getElementById('sector_nombre_modal');
      if (sectorNombreEl) {
        sectorNombreEl.textContent = sectorNombre;
      }
      
      modal.show();
      
      const contenidoDiv = document.getElementById('contenido_disponibilidad');
      if (contenidoDiv) {
        contenidoDiv.innerHTML = `
          <div class="text-center">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">Cargando disponibilidad...</p>
          </div>
        `;
      }
      
      try {
        const url = `/internacion/api/disponibilidad-habitaciones?sector_id=${sectorId}${sexo ? `&sexo_paciente=${sexo}` : ''}`;
        console.log(' Consultando disponibilidad:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(' Disponibilidad recibida:', data);
        
        if (data.disponibilidad.length === 0) {
          if (contenidoDiv) {
            contenidoDiv.innerHTML = `
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No hay habitaciones disponibles en este sector
              </div>
            `;
          }
          return;
        }
        
        let html = '<div class="row">';
        
        data.disponibilidad.forEach(hab => {
          const disponible = hab.camas_libres > 0 && hab.compatible;
          const colorClase = disponible ? 'success' : 'danger';
          
          html += `
            <div class="col-md-4 mb-3">
              <div class="card border-${colorClase}">
                <div class="card-header bg-${colorClase} text-white d-flex justify-content-between align-items-center">
                  <strong>Habitación ${hab.numero}</strong>
                  ${disponible ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                </div>
                <div class="card-body">
                  <p><strong>Tipo:</strong> ${hab.tipo}</p>
                  <p><strong>Sexo Permitido:</strong> ${hab.sexo_permitido}</p>
                  <p><strong>Servicio:</strong> ${hab.tipo_servicio || 'N/A'}</p>
                  <hr>
                  <p><strong>Camas Libres:</strong> ${hab.camas_libres}/${hab.total_camas}</p>
                  <p><strong>Ocupadas:</strong> ${hab.camas_ocupadas}</p>
                  <p><strong>En Limpieza:</strong> ${hab.camas_limpieza}</p>
                  <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-success" style="width: ${(hab.camas_libres/hab.total_camas)*100}%"></div>
                    <div class="progress-bar bg-danger" style="width: ${(hab.camas_ocupadas/hab.total_camas)*100}%"></div>
                    <div class="progress-bar bg-warning" style="width: ${(hab.camas_limpieza/hab.total_camas)*100}%"></div>
                  </div>
                  <small class="d-block mt-2">Ocupación: ${hab.porcentaje_ocupacion}%</small>
                  ${!hab.compatible ? '<p class="text-danger mt-2 mb-0"><i class="fas fa-exclamation-triangle me-1"></i>Incompatible con sexo del paciente</p>' : ''}
                </div>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
        
        if (contenidoDiv) {
          contenidoDiv.innerHTML = html;
        }
        
        // Cargar habitaciones en el select
        cargarHabitacionesDisponibles(sectorId, sexo);
        
      } catch (error) {
        console.error('❌ Error al cargar disponibilidad:', error);
        if (contenidoDiv) {
          contenidoDiv.innerHTML = `
            <div class="alert alert-danger">
              <i class="fas fa-times-circle me-2"></i>
              Error al cargar disponibilidad: ${error.message}
            </div>
          `;
        }
      }
    });
  }
  
  // ============================================================================
  // CARGAR HABITACIONES DISPONIBLES EN SELECT
  // ============================================================================
  async function cargarHabitacionesDisponibles(sectorId, sexo) {
    try {
      const url = `/internacion/api/disponibilidad-habitaciones?sector_id=${sectorId}${sexo ? `&sexo_paciente=${sexo}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const habSelect = document.getElementById('internacion_habitacion_id');
      if (!habSelect) {
        console.warn(' Elemento internacion_habitacion_id no encontrado');
        return;
      }
      
      habSelect.innerHTML = '<option value="">Seleccione...</option>';
      
      // Solo mostrar habitaciones compatibles con camas libres
      const habDisponibles = data.disponibilidad.filter(h => h.compatible && h.camas_libres > 0);
      
      if (habDisponibles.length === 0) {
        habSelect.innerHTML = '<option value="">Sin habitaciones disponibles</option>';
        habSelect.disabled = true;
        console.log(' No hay habitaciones disponibles. Paciente irá a lista de espera.');
        return;
      }
      
      habDisponibles.forEach(hab => {
        const option = document.createElement('option');
        option.value = hab.id;
        option.textContent = `Hab. ${hab.numero} (${hab.camas_libres} libres - ${hab.tipo})`;
        habSelect.appendChild(option);
      });
      
      habSelect.disabled = false;
      console.log(`✅ ${habDisponibles.length} habitación(es) cargada(s)`);
      
    } catch (error) {
      console.error('❌ Error al cargar habitaciones:', error);
    }
  }
  
  // ============================================================================
  // CARGAR CAMAS AL SELECCIONAR HABITACIÓN
  // ============================================================================
  const habitacionSelect = document.getElementById('internacion_habitacion_id');
  if (habitacionSelect) {
    habitacionSelect.addEventListener('change', async function() {
      const habId = this.value;
      
      const camaSelect = document.getElementById('internacion_cama_id');
      if (!camaSelect) {
        console.warn(' Elemento internacion_cama_id no encontrado');
        return;
      }
      
      if (!habId) {
        camaSelect.innerHTML = '<option value="">Seleccione habitación primero</option>';
        camaSelect.disabled = true;
        return;
      }
      
      // Obtener sexo del paciente
      const nombrePacienteEl = document.getElementById('nombre_paciente_internacion');
      let sexo = null;
      
      if (nombrePacienteEl) {
        const nombrePaciente = nombrePacienteEl.textContent;
        const sexoMatch = nombrePaciente.match(/Sexo: (\w+)/);
        sexo = sexoMatch ? sexoMatch[1] : null;
      }
      
      try {
        const url = `/internacion/api/camas-disponibles?habitacion_id=${habId}${sexo ? `&sexo_paciente=${sexo}` : ''}`;
        console.log(' Consultando camas:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(' Camas recibidas:', data);
        
        camaSelect.innerHTML = '<option value="">Seleccione...</option>';
        
        if (data.camas.length === 0) {
          camaSelect.innerHTML = '<option value="">Sin camas disponibles</option>';
          camaSelect.disabled = true;
          return;
        }
        
        data.camas.forEach(cama => {
          const option = document.createElement('option');
          option.value = cama.id;
          option.textContent = `Cama ${cama.numero}`;
          camaSelect.appendChild(option);
        });
        
        camaSelect.disabled = false;
        console.log(`✅ ${data.camas.length} cama(s) cargada(s)`);
        
      } catch (error) {
        console.error('❌ Error al cargar camas:', error);
        alert('❌ Error al cargar camas disponibles');
      }
    });
  }
  
  // ============================================================================
  // GUARDAR INTERNACIÓN
  // ============================================================================
  const btnGuardarInternacion = document.getElementById('btnGuardarInternacion');
  if (btnGuardarInternacion) {
    btnGuardarInternacion.addEventListener('click', async () => {
      const form = document.getElementById('formCrearInternacion');
      if (!form) {
        console.error('❌ Formulario formCrearInternacion no encontrado');
        return;
      }
      
      // Validar solo campos obligatorios (no cama/habitación)
      const medicoId = document.getElementById('internacion_medico_id')?.value;
      const tipoId = document.getElementById('internacion_tipo_internacion_id')?.value;
      const prioridad = document.getElementById('internacion_prioridad')?.value;
      const sectorId = document.getElementById('internacion_sector_id')?.value;
      const pacienteId = document.getElementById('internacion_paciente_id')?.value;
      
      if (!medicoId || !tipoId || !prioridad || !sectorId || !pacienteId) {
        alert('❌ Complete los campos obligatorios: Médico, Tipo de Internación, Prioridad, Sector');
        form.classList.add('was-validated');
        return;
      }
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Convertir booleanos
      data.es_prequirurgica = data.es_prequirurgica === 'true';
      
      console.log(' Enviando datos:', data);
      
      btnGuardarInternacion.disabled = true;
      btnGuardarInternacion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const response = await fetch('/internacion/api/crear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        console.log(' Respuesta:', result);
        
        if (result.success) {
          if (result.asignacion_inmediata) {
            alert('✅ ' + result.message);
          } else {
            alert(' ' + result.message + `\nPrioridad: ${result.prioridad}`);
          }
          
          const modalEl = document.getElementById('modalCrearInternacion');
          if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
          }
          
          location.reload();
        } else {
          alert('❌ Error: ' + result.message);
        }
      } catch (error) {
        console.error('❌ Error al crear internación:', error);
        alert('❌ Error al crear internación: ' + error.message);
      } finally {
        btnGuardarInternacion.disabled = false;
        btnGuardarInternacion.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Internación';
      }
    });
  }
  
  console.log(' internacion.js cargado completamente');
});