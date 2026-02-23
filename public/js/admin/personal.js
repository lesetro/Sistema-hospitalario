document.addEventListener('DOMContentLoaded', () => {
  let paginaActual = 1;

  cargarEstadisticas();
  cargarPersonal();
  document.getElementById('btnNuevoPersonal')?.addEventListener('click', abrirModalCrear);

  // ============================================================================
  // FUNCIÓN AUXILIAR: Normalizar tipo de personal para URLs
  // ============================================================================
  function normalizarTipo(tipo) {
    const tipos = {
      'Médico': 'medico',
      'Enfermero': 'enfermero',
      'Administrativo': 'administrativo'
    };
    return tipos[tipo] || tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================
  async function cargarEstadisticas() {
    try {
      const response = await fetch('/personal/api/estadisticas');
      const data = await response.json();

      if (data.success) {
        document.getElementById('total-medicos').textContent = data.resumen.total_medicos;
        document.getElementById('total-enfermeros').textContent = data.resumen.total_enfermeros;
        document.getElementById('total-administrativos').textContent = data.resumen.total_administrativos;
        document.getElementById('sin-asignar').textContent = 
          data.resumen.medicos_sin_sector + data.resumen.enfermeros_sin_sector;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  // ============================================================================
  // BUSCAR PERSONAL
  // ============================================================================
  async function cargarPersonal(page = 1) {
    try {
      showLoading();

      const busqueda = document.getElementById('busqueda')?.value || '';
      const tipoPersonal = document.getElementById('filtro-tipo')?.value || '';
      const sector = document.getElementById('filtro-sector')?.value || '';
      const sinAsignar = document.getElementById('filtro-sin-asignar')?.checked || false;

      const params = new URLSearchParams({
        page, limit: 10, busqueda, tipo_personal: tipoPersonal, sector_id: sector, sin_asignar: sinAsignar
      });

      const response = await fetch(`/personal/api/buscar?${params}`);
      const data = await response.json();

      if (data.success) {
        renderizarTablaPersonal(data.personal);
        renderizarPaginacion(data.pagination);
        paginaActual = page;
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Error al cargar personal:', error);
      mostrarAlerta('error', 'Error al cargar personal');
    }
  }

  function renderizarTablaPersonal(personal) {
  const tbody = document.getElementById('tabla-personal-body');

  if (personal.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay personal registrado</td></tr>';
    return;
  }

  tbody.innerHTML = personal.map(p => {
    const tipoNormalizado = normalizarTipo(p.tipo);
    
    return `
      <tr>
        <td><span class="badge bg-primary">${p.tipo}</span></td>
        <td>${p.nombre}<br><small class="text-muted">DNI: ${p.dni}</small></td>
        <td>${p.email || 'N/A'}</td>
        <td>${p.sector}</td>
        <td><small>${p.detalle}</small></td>
        <td><span class="badge bg-${p.estado === 'Activo' ? 'success' : 'secondary'}">${p.estado}</span></td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info btn-ver" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-primary btn-editar" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            ${!p.sector_id ? `
              <button class="btn btn-warning btn-asignar-sector" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Asignar sector">
                <i class="fas fa-map-marker-alt"></i>
              </button>
            ` : ''}
            <button class="btn btn-success btn-turno" data-usuario="${p.usuario_id}" title="Gestionar turno">
              <i class="fas fa-clock"></i>
            </button>
            ${p.estado === 'Activo' ? `
              <button class="btn btn-danger btn-baja" data-tipo="${tipoNormalizado}" data-id="${p.id}" title="Dar de baja">
                <i class="fas fa-user-times"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  agregarEventos();
}

  function agregarEventos() {
  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', function() {
      verDetalles(this.dataset.tipo, this.dataset.id);
    });
  });

  // NUEVO: Evento para botón de editar
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', function() {
      abrirModalEditar(this.dataset.tipo, this.dataset.id);
    });
  });

  document.querySelectorAll('.btn-asignar-sector').forEach(btn => {
    btn.addEventListener('click', function() {
      abrirModalAsignarSector(this.dataset.tipo, this.dataset.id);
    });
  });

  document.querySelectorAll('.btn-turno').forEach(btn => {
    btn.addEventListener('click', function() {
      abrirModalTurno(this.dataset.usuario);
    });
  });

  document.querySelectorAll('.btn-baja').forEach(btn => {
    btn.addEventListener('click', function() {
      confirmarBaja(this.dataset.tipo, this.dataset.id);
    });
  });
}

// ============================================================================
// CREAR NUEVO PERSONAL
// ============================================================================

// Función para abrir modal de creación
function abrirModalCrear() {
  // Resetear formulario
  document.getElementById('form-crear').reset();
  
  // Mostrar todos los campos específicos ocultos
  document.querySelectorAll('.campo-crear-medico, .campo-crear-enfermero, .campo-crear-administrativo').forEach(el => {
    el.classList.add('d-none');
  });
  
  // Mostrar campos generales
  document.getElementById('campos-generales').classList.remove('d-none');
  
  // Cargar datos para formulario (sectores, especialidades)
  cargarDatosCreacion();
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalCrear'));
  modal.show();
}

// Cargar sectores y especialidades para el formulario
async function cargarDatosCreacion() {
  try {
    showLoading();
    
    const response = await fetch('/personal/api/crear/datos');
    const data = await response.json();
    
    if (data.success) {
      // Llenar sector
      const selectSector = document.getElementById('crear-sector');
      if (data.datosFormulario.sectores && selectSector) {
        selectSector.innerHTML = '<option value="">Sin sector</option>' + 
          data.datosFormulario.sectores.map(s => 
            `<option value="${s.id}">${s.nombre}</option>`
          ).join('');
      }
      
      // Llenar especialidades
      const selectEspecialidad = document.getElementById('crear-especialidad');
      if (data.datosFormulario.especialidades && selectEspecialidad) {
        selectEspecialidad.innerHTML = '<option value="">Sin especialidad</option>' + 
          data.datosFormulario.especialidades.map(e => 
            `<option value="${e.id}">${e.nombre}</option>`
          ).join('');
      }
    }
  } catch (error) {
    console.error('Error al cargar datos de creación:', error);
    mostrarAlerta('error', 'Error al cargar datos del formulario');
  } finally {
    hideLoading();
  }
}

// Cambiar campos según tipo seleccionado
document.getElementById('crear-tipo')?.addEventListener('change', function() {
  const tipo = this.value;
  
  // Ocultar todos los campos específicos
  document.querySelectorAll('.campo-crear-medico, .campo-crear-enfermero, .campo-crear-administrativo').forEach(el => {
    el.classList.add('d-none');
  });
  
  // Mostrar campos según tipo
  if (tipo) {
    document.getElementById(`campos-crear-${tipo}`).classList.remove('d-none');
  }
});

// Crear nuevo personal
document.getElementById('btnCrearPersonal')?.addEventListener('click', async function() {
  const tipo = document.getElementById('crear-tipo').value;
  
  if (!tipo) {
    mostrarAlerta('warning', 'Seleccione el tipo de personal');
    return;
  }
  
  // Validar campos básicos
  const nombre = document.getElementById('crear-nombre').value.trim();
  const apellido = document.getElementById('crear-apellido').value.trim();
  const dni = document.getElementById('crear-dni').value.trim();
  const email = document.getElementById('crear-email').value.trim();
  const fechaNacimiento = document.getElementById('crear-fecha-nacimiento').value;
  const genero = document.getElementById('crear-genero').value;
  
  if (!nombre || !apellido || !dni || !email || !fechaNacimiento || !genero) {
    mostrarAlerta('warning', 'Todos los campos con * son obligatorios');
    return;
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarAlerta('warning', 'Ingrese un email válido');
    return;
  }
  
  // Construir objeto de datos
  const datos = {
    tipo,
    nombre,
    apellido,
    dni,
    email,
    telefono: document.getElementById('crear-telefono').value.trim(),
    fecha_nacimiento: fechaNacimiento,
    genero: genero,
    estado: document.getElementById('crear-estado').value || 'Activo',
    sector_id: document.getElementById('crear-sector').value || null,
    fecha_ingreso: document.getElementById('crear-fecha-ingreso').value || new Date().toISOString().split('T')[0],
    password: document.getElementById('crear-password').value || 'Hospital123'
  };
  
  // Agregar datos específicos según tipo
  if (tipo === 'medico') {
    const matricula = document.getElementById('crear-matricula-medico').value.trim();
    if (!matricula) {
      mostrarAlerta('warning', 'La matrícula es obligatoria para médicos');
      return;
    }
    datos.matricula = matricula;
    datos.especialidad_id = document.getElementById('crear-especialidad').value || null;
  }
  
  if (tipo === 'enfermero') {
    const matricula = document.getElementById('crear-matricula-enfermero').value.trim();
    if (!matricula) {
      mostrarAlerta('warning', 'La matrícula es obligatoria para enfermeros');
      return;
    }
    datos.matricula = matricula;
    datos.nivel = document.getElementById('crear-nivel').value || 'Auxiliar';
  }
  
  if (tipo === 'administrativo') {
    datos.responsabilidad = document.getElementById('crear-responsabilidad').value.trim() || 'Administrativo';
  }
  
  try {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
    
    const response = await fetch('/personal/api/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    const data = await response.json();
    
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('modalCrear')).hide();
      mostrarAlerta('success', 'Personal creado correctamente');
      cargarPersonal(1); // Recargar la tabla
      cargarEstadisticas(); // Actualizar estadísticas
    } else {
      // Mostrar error detallado
      let mensajeError = data.message || 'Error al crear personal';
      if (data.detalles) {
        mensajeError += ': ' + data.detalles.map(d => d.campo).join(', ');
      }
      mostrarAlerta('error', mensajeError);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al crear personal');
  } finally {
    this.disabled = false;
    this.innerHTML = '<i class="fas fa-user-plus me-2"></i>Crear Personal';
  }
});


// ============================================================================
// EDITAR EMPLEADO
// ============================================================================

// Abrir modal de edición
function abrirModalEditar(tipo, id) {
  console.log('Abriendo modal de edición para:', tipo, id);
  cargarDatosEdicion(tipo, id);
}

// Cargar datos para el formulario de edición
async function cargarDatosEdicion(tipo, id) {
  try {
    showLoading();
    
    const response = await fetch(`/personal/api/${tipo}/${id}/editar`);
    const data = await response.json();

    if (data.success) {
      mostrarFormularioEdicion(data.empleado, data.datosFormulario, tipo);
    } else {
      mostrarAlerta('error', data.message || 'Error al cargar datos de edición');
    }
  } catch (error) {
    console.error('Error al cargar datos de edición:', error);
    mostrarAlerta('error', 'Error al cargar datos para editar');
  } finally {
    hideLoading();
  }
}

// Mostrar formulario de edición
function mostrarFormularioEdicion(empleado, datosFormulario, tipo) {
  // Configurar título
  document.getElementById('editar-tipo').value = tipo;
  document.getElementById('editar-id').value = empleado.id;
  document.getElementById('editar-titulo').innerHTML = `<i class="fas fa-user-edit me-2"></i>Editar ${empleado.usuario.nombre} ${empleado.usuario.apellido}`;
  
  // Ocultar todos los campos específicos primero
  document.querySelectorAll('.campo-medico, .campo-enfermero, .campo-administrativo').forEach(el => {
    el.classList.add('d-none');
  });
  
  // Mostrar campos según el tipo
  document.querySelectorAll(`.campo-${tipo}`).forEach(el => {
    el.classList.remove('d-none');
  });
  
  // Llenar datos del usuario (SOLO CAMPOS QUE EXISTEN)
  const usuario = empleado.usuario;
  document.getElementById('editar-nombre').value = usuario.nombre || '';
  document.getElementById('editar-apellido').value = usuario.apellido || '';
  document.getElementById('editar-dni').value = usuario.dni || '';
  document.getElementById('editar-email').value = usuario.email || '';
  document.getElementById('editar-telefono').value = usuario.telefono || '';
  document.getElementById('editar-estado').value = usuario.estado || 'Activo';
  
  // Llenar sector
  const selectSector = document.getElementById('editar-sector');
  if (datosFormulario.sectores && selectSector) {
    selectSector.innerHTML = '<option value="">Sin sector</option>' + 
      datosFormulario.sectores.map(s => 
        `<option value="${s.id}" ${empleado.sector_id === s.id ? 'selected' : ''}>${s.nombre}</option>`
      ).join('');
  }
  
  // Llenar campos específicos según tipo
  if (tipo === 'medico') {
    document.getElementById('editar-matricula-medico').value = empleado.matricula || '';
    document.getElementById('editar-fecha-ingreso-medico').value = empleado.fecha_ingreso?.split('T')[0] || '';
    document.getElementById('editar-fecha-egreso-medico').value = empleado.fecha_egreso?.split('T')[0] || '';
    
    // Especialidades
    const selectEspecialidad = document.getElementById('editar-especialidad');
    if (datosFormulario.especialidades && selectEspecialidad) {
      selectEspecialidad.innerHTML = '<option value="">Sin especialidad</option>' + 
        datosFormulario.especialidades.map(e => 
          `<option value="${e.id}" ${empleado.especialidad_id === e.id ? 'selected' : ''}>${e.nombre}</option>`
        ).join('');
    }
  }
  
  if (tipo === 'enfermero') {
    document.getElementById('editar-matricula-enfermero').value = empleado.matricula || '';
    document.getElementById('editar-nivel').value = empleado.nivel || '';
    document.getElementById('editar-fecha-ingreso-enfermero').value = empleado.fecha_ingreso?.split('T')[0] || '';
    document.getElementById('editar-fecha-egreso-enfermero').value = empleado.fecha_egreso?.split('T')[0] || '';
  }
  
  if (tipo === 'administrativo') {
    document.getElementById('editar-responsabilidad').value = empleado.responsabilidad || '';
    document.getElementById('editar-fecha-ingreso-administrativo').value = empleado.fecha_ingreso?.split('T')[0] || '';
    document.getElementById('editar-fecha-egreso-administrativo').value = empleado.fecha_egreso?.split('T')[0] || '';
  }
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
  modal.show();
}

// Guardar cambios del empleado
document.getElementById('btnGuardarEdicion')?.addEventListener('click', async function() {
  const tipo = document.getElementById('editar-tipo').value;
  const id = document.getElementById('editar-id').value;
  
  // Validar campos básicos
  const nombre = document.getElementById('editar-nombre').value.trim();
  const apellido = document.getElementById('editar-apellido').value.trim();
  const dni = document.getElementById('editar-dni').value.trim();
  
  if (!nombre || !apellido || !dni) {
    mostrarAlerta('warning', 'Nombre, apellido y DNI son obligatorios');
    return;
  }
  
  // Construir objeto de datos (SOLO CAMPOS QUE EXISTEN)
  const datos = {
    nombre,
    apellido,
    dni,
    email: document.getElementById('editar-email').value.trim(),
    telefono: document.getElementById('editar-telefono').value.trim(),
    estado: document.getElementById('editar-estado').value,
    sector_id: document.getElementById('editar-sector').value || null
  };
  
  // Agregar datos específicos según tipo
  if (tipo === 'medico') {
    datos.matricula = document.getElementById('editar-matricula-medico').value.trim();
    datos.especialidad_id = document.getElementById('editar-especialidad').value || null;
    datos.fecha_ingreso = document.getElementById('editar-fecha-ingreso-medico').value;
    datos.fecha_egreso = document.getElementById('editar-fecha-egreso-medico').value || null;
  }
  
  if (tipo === 'enfermero') {
    datos.matricula = document.getElementById('editar-matricula-enfermero').value.trim();
    datos.nivel = document.getElementById('editar-nivel').value;
    datos.fecha_ingreso = document.getElementById('editar-fecha-ingreso-enfermero').value;
    datos.fecha_egreso = document.getElementById('editar-fecha-egreso-enfermero').value || null;
  }
  
  if (tipo === 'administrativo') {
    datos.responsabilidad = document.getElementById('editar-responsabilidad').value.trim();
    datos.fecha_ingreso = document.getElementById('editar-fecha-ingreso-administrativo').value;
    datos.fecha_egreso = document.getElementById('editar-fecha-egreso-administrativo').value || null;
  }
  
  try {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    
    const response = await fetch(`/personal/api/${tipo}/${id}/editar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    const data = await response.json();
    
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      mostrarAlerta('success', 'Empleado actualizado correctamente');
      cargarPersonal(paginaActual);
      cargarEstadisticas();
    } else {
      mostrarAlerta('error', data.message || 'Error al actualizar empleado');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta('error', 'Error al actualizar empleado');
  } finally {
    this.disabled = false;
    this.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
  }
});
  // ============================================================================
  // VER DETALLES
  // ============================================================================
  async function verDetalles(tipo, id) {
    try {
      console.log(`Fetching: /personal/api/${tipo}/${id}/detalles`);
      const response = await fetch(`/personal/api/${tipo}/${id}/detalles`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        mostrarModalDetalles(data.empleado);
      } else {
        mostrarAlerta('error', data.message || 'Error al cargar detalles');
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      mostrarAlerta('error', 'Error al cargar detalles del empleado');
    }
  }

  function mostrarModalDetalles(empleado) {
    console.log('Mostrando modal con empleado:', empleado);
    
    document.getElementById('detalle-nombre').textContent = `${empleado.usuario.nombre} ${empleado.usuario.apellido}`;
    document.getElementById('detalle-dni').textContent = empleado.usuario.dni;
    document.getElementById('detalle-email').textContent = empleado.usuario.email || 'N/A';
    document.getElementById('detalle-sector').textContent = empleado.sector?.nombre || 'Sin asignar';
    
    // Estado del usuario
    const estadoUsuario = empleado.usuario.estado || empleado.estado || 'Desconocido';
    document.getElementById('detalle-estado').innerHTML = 
      `<span class="badge bg-${estadoUsuario === 'Activo' ? 'success' : 'secondary'}">${estadoUsuario}</span>`;

    // Información adicional según tipo
    let infoAdicional = '';
    if (empleado.matricula) {
      infoAdicional += `<p><strong>Matrícula:</strong> ${empleado.matricula}</p>`;
    }
    if (empleado.especialidad) {
      infoAdicional += `<p><strong>Especialidad:</strong> ${empleado.especialidad.nombre}</p>`;
    }
    if (empleado.nivel) {
      infoAdicional += `<p><strong>Nivel:</strong> ${empleado.nivel}</p>`;
    }
    if (empleado.responsabilidad) {
      infoAdicional += `<p><strong>Responsabilidad:</strong> ${empleado.responsabilidad}</p>`;
    }
    if (empleado.fecha_ingreso) {
      infoAdicional += `<p><strong>Fecha Ingreso:</strong> ${new Date(empleado.fecha_ingreso).toLocaleDateString('es-AR')}</p>`;
    }

    const infoDiv = document.getElementById('detalle-info-adicional');
    if (infoDiv) {
      infoDiv.innerHTML = infoAdicional || '<p class="text-muted">Sin información adicional</p>';
    }

    // Turnos
    const turnosDiv = document.getElementById('detalle-turnos');
    if (empleado.turnos && empleado.turnos.length > 0) {
      turnosDiv.innerHTML = empleado.turnos.map(t => `
        <div class="alert alert-info mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong><i class="fas fa-clock me-2"></i>${t.tipo}</strong><br>
              <small>
                 <strong>Días:</strong> ${t.dias}<br>
                 <strong>Horario:</strong> ${t.hora_inicio.substring(0, 5)} - ${t.hora_fin.substring(0, 5)}<br>
                 <strong>Sector:</strong> ${t.sector?.nombre || 'N/A'}
              </small>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      turnosDiv.innerHTML = '<div class="alert alert-warning"> Sin turnos asignados</div>';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
  }

  // ============================================================================
  // ASIGNAR SECTOR
  // ============================================================================
  function abrirModalAsignarSector(tipo, id) {
    document.getElementById('asignar-tipo').value = tipo;
    document.getElementById('asignar-id').value = id;
    const modal = new bootstrap.Modal(document.getElementById('modalAsignarSector'));
    modal.show();
  }

  document.getElementById('btnConfirmarAsignar')?.addEventListener('click', async function() {
    const tipo = document.getElementById('asignar-tipo').value;
    const id = document.getElementById('asignar-id').value;
    const sectorId = document.getElementById('asignar-sector-select').value;

    if (!sectorId) {
      mostrarAlerta('warning', 'Seleccione un sector');
      return;
    }

    try {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Asignando...';
      
      const response = await fetch(`/personal/api/${tipo}/${id}/asignar-sector`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector_id: sectorId })
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalAsignarSector')).hide();
        mostrarAlerta('success', 'Sector asignado correctamente');
        cargarPersonal(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al asignar sector');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-check me-2"></i>Asignar';
    }
  });

  // ============================================================================
  // GESTIONAR TURNO
  // ============================================================================
  function abrirModalTurno(usuarioId) {
    document.getElementById('turno-usuario-id').value = usuarioId;
    document.getElementById('form-turno').reset();
    const modal = new bootstrap.Modal(document.getElementById('modalTurno'));
    modal.show();
  }

  document.getElementById('btnGuardarTurno')?.addEventListener('click', async function() {
    const formData = {
      usuario_id: document.getElementById('turno-usuario-id').value,
      tipo: document.getElementById('turno-tipo').value,
      dias: document.getElementById('turno-dias').value,
      hora_inicio: document.getElementById('turno-hora-inicio').value,
      hora_fin: document.getElementById('turno-hora-fin').value,
      sector_id: document.getElementById('turno-sector').value
    };

    if (!formData.tipo || !formData.dias || !formData.hora_inicio || !formData.hora_fin) {
      mostrarAlerta('warning', 'Complete todos los campos obligatorios');
      return;
    }

    try {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      const response = await fetch('/personal/api/turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalTurno')).hide();
        mostrarAlerta('success', 'Turno guardado correctamente');
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al guardar turno');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
  });

  // ============================================================================
  // BAJA EMPLEADO
  // ============================================================================
  async function confirmarBaja(tipo, id) {
    if (!confirm('¿Está seguro de dar de baja a este empleado?')) return;

    const motivo = prompt('Ingrese el motivo de la baja:');
    if (!motivo || !motivo.trim()) {
      mostrarAlerta('warning', 'Debe ingresar un motivo');
      return;
    }

    try {
      showLoading();
      
      const response = await fetch(`/personal/api/${tipo}/${id}/baja`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo.trim() })
      });

      const data = await response.json();

      if (data.success) {
        mostrarAlerta('success', 'Empleado dado de baja correctamente');
        cargarPersonal(paginaActual);
        cargarEstadisticas();
      } else {
        mostrarAlerta('error', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al dar de baja al empleado');
    } finally {
      hideLoading();
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function renderizarPaginacion(pagination) {
    const container = document.getElementById('paginacion');
    const { page, totalPages } = pagination;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination justify-content-end mb-0">';
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>`;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    if (totalPages > 5) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li></ul>`;
    
    container.innerHTML = html;

    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.dataset.page);
        if (newPage && newPage !== page && newPage >= 1 && newPage <= totalPages) {
          cargarPersonal(newPage);
        }
      });
    });
  }

  function showLoading() {
    document.getElementById('loading')?.classList.remove('d-none');
  }

  function hideLoading() {
    document.getElementById('loading')?.classList.add('d-none');
  }

  function mostrarAlerta(tipo, mensaje) {
    const container = document.getElementById('alerta-container');
    const clase = tipo === 'success' ? 'alert-success' : tipo === 'error' ? 'alert-danger' : 'alert-warning';
    const icono = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle';
    
    container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
      <i class="fas fa-${icono} me-2"></i>${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    
    setTimeout(() => container.innerHTML = '', 5000);
  }

  // ============================================================================
  // EVENTOS DE FILTROS
  // ============================================================================
  
  // Búsqueda con debounce
  let timeoutBusqueda;
  document.getElementById('busqueda')?.addEventListener('input', function() {
    if (this.value.length >= 3 || this.value.length === 0) {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(() => cargarPersonal(1), 500);
    }
  });

  document.getElementById('filtro-tipo')?.addEventListener('change', () => cargarPersonal(1));
  document.getElementById('filtro-sector')?.addEventListener('change', () => cargarPersonal(1));
  document.getElementById('filtro-sin-asignar')?.addEventListener('change', () => cargarPersonal(1));
});