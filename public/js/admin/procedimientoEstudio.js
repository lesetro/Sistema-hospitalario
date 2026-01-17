document.addEventListener('DOMContentLoaded', () => {
  let pacienteActual = null;
  let seccionActual = 'estudios';

  // Buscar paciente
  document.getElementById('btnBuscarPaciente')?.addEventListener('click', buscarPaciente);
  document.getElementById('dni-busqueda')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarPaciente();
  });

  async function buscarPaciente() {
    const dni = document.getElementById('dni-busqueda').value.trim();
    
    if (!dni) {
      mostrarAlerta('warning', 'Ingrese un DNI');
      return;
    }

    try {
      showLoading();
      const response = await fetch(`/procedimientos-estudios/api/buscar-paciente?dni=${dni}`);
      const data = await response.json();

      if (data.success) {
        pacienteActual = data.paciente;
        mostrarDatosPaciente(data.paciente, data.resumen);
        document.getElementById('seccion-datos').classList.remove('d-none');
        cargarSeccion('estudios');
      } else {
        mostrarAlerta('error', data.message);
        document.getElementById('seccion-datos').classList.add('d-none');
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      mostrarAlerta('error', 'Error al buscar paciente');
    }
  }

  function mostrarDatosPaciente(paciente, resumen) {
    document.getElementById('paciente-nombre').textContent = `${paciente.nombre} ${paciente.apellido}`;
    document.getElementById('paciente-dni').textContent = paciente.dni;
    document.getElementById('paciente-email').textContent = paciente.email || 'No registrado';
    document.getElementById('paciente-telefono').textContent = paciente.telefono || 'No registrado';
    document.getElementById('paciente-estado').innerHTML = 
      `<span class="badge bg-${paciente.estado === 'Activo' ? 'success' : 'secondary'}">${paciente.estado}</span>`;

    // Estadísticas
    document.getElementById('total-estudios').textContent = resumen.estudios;
    document.getElementById('total-evaluaciones').textContent = resumen.evaluaciones;
    document.getElementById('total-procedimientos').textContent = 
      resumen.procedimientosPreQuirurgicos + resumen.procedimientosEnfermeria;
    document.getElementById('total-intervenciones').textContent = resumen.intervenciones;
  }

  // Tabs de navegación
  document.querySelectorAll('.btn-seccion').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-seccion').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      cargarSeccion(this.dataset.seccion);
    });
  });

  async function cargarSeccion(seccion) {
    if (!pacienteActual) return;

    seccionActual = seccion;
    const contenedor = document.getElementById('contenido-seccion');
    
    showLoading();

    try {
      let data;
      
      switch(seccion) {
        case 'estudios':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/estudios`).then(r => r.json());
          renderizarEstudios(data.estudios);
          break;
        
        case 'evaluaciones':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/evaluaciones`).then(r => r.json());
          renderizarEvaluaciones(data.evaluaciones);
          break;
        
        case 'procedimientos-pre':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/procedimientos-prequirurgicos`).then(r => r.json());
          renderizarProcedimientosPreQ(data.procedimientos);
          break;
        
        case 'procedimientos-enf':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/procedimientos-enfermeria`).then(r => r.json());
          renderizarProcedimientosEnf(data.procedimientos);
          break;
        
        case 'intervenciones':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/intervenciones`).then(r => r.json());
          renderizarIntervenciones(data.intervenciones);
          break;
        
        case 'timeline':
          data = await fetch(`/procedimientos-estudios/api/paciente/${pacienteActual.id}/timeline`).then(r => r.json());
          renderizarTimeline(data.timeline);
          break;
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al cargar datos');
    }

    hideLoading();
  }

  function renderizarEstudios(estudios) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (estudios.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay estudios registrados</div>';
      return;
    }

    contenedor.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Médico</th>
              <th>Estado</th>
              <th>Urgencia</th>
              <th>Fecha Solicitud</th>
              <th>Turno</th>
            </tr>
          </thead>
          <tbody>
            ${estudios.map(e => `
              <tr>
                <td>${e.tipo_estudio}</td>
                <td><span class="badge bg-info">${e.categoria}</span></td>
                <td>${e.medico}<br><small class="text-muted">${e.especialidad}</small></td>
                <td><span class="badge bg-${getEstadoBadge(e.estado)}">${e.estado}</span></td>
                <td><span class="badge bg-${e.urgencia === 'Alta' ? 'danger' : 'secondary'}">${e.urgencia}</span></td>
                <td>${new Date(e.fecha_solicitud).toLocaleDateString('es-AR')}</td>
                <td>${e.turno ? 
                  `${new Date(e.turno.fecha).toLocaleDateString()} ${e.turno.hora}<br>
                   <span class="badge bg-${getEstadoBadge(e.turno.estado)}">${e.turno.estado}</span>` 
                  : 'Sin turno'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderizarEvaluaciones(evaluaciones) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (evaluaciones.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay evaluaciones registradas</div>';
      return;
    }

    contenedor.innerHTML = evaluaciones.map(e => `
      <div class="card mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h6><i class="fas fa-user-md text-primary"></i> ${e.medico}</h6>
              <small class="text-muted">${e.especialidad}</small>
              <p class="mb-1"><strong>Fecha:</strong> ${new Date(e.fecha).toLocaleDateString('es-AR')}</p>
            </div>
            <div class="col-md-6">
              ${e.diagnostico ? `
                <div class="alert alert-info mb-2">
                  <strong>Diagnóstico:</strong> ${e.diagnostico.nombre}<br>
                  <small>Código: ${e.diagnostico.codigo} | Tipo: ${e.diagnostico.tipo}</small>
                </div>
              ` : '<p class="text-muted">Sin diagnóstico registrado</p>'}
              ${e.tratamiento ? `<p><strong>Tratamiento:</strong> ${e.tratamiento}</p>` : ''}
            </div>
          </div>
          ${e.observaciones ? `
            <div class="mt-2">
              <strong>Observaciones:</strong>
              <p class="text-muted">${e.observaciones}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderizarProcedimientosPreQ(procedimientos) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (procedimientos.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay procedimientos pre-quirúrgicos registrados</div>';
      return;
    }

    contenedor.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Médico</th>
              <th>Enfermero</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${procedimientos.map(p => `
              <tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.descripcion || 'Sin descripción'}</td>
                <td><span class="badge bg-${p.estado === 'Completado' ? 'success' : 'warning'}">${p.estado}</span></td>
                <td>${p.medico}</td>
                <td>${p.enfermero}</td>
                <td>${new Date(p.fecha_creacion).toLocaleDateString('es-AR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderizarProcedimientosEnf(procedimientos) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (procedimientos.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay procedimientos de enfermería registrados</div>';
      return;
    }

    contenedor.innerHTML = procedimientos.map(p => `
      <div class="card mb-2">
        <div class="card-body">
          <h6><i class="fas fa-procedures text-success"></i> ${p.nombre}</h6>
          <p class="mb-1">${p.descripcion || 'Sin descripción'}</p>
          <small class="text-muted">
            Duración: ${p.duracion_estimada || 'No especificada'} min | 
            Preparación: ${p.requiere_preparacion ? 'Sí' : 'No'} | 
            Médico: ${p.medico}
          </small>
          ${p.tratamiento !== 'No especificado' ? `<br><strong>Tratamiento:</strong> ${p.tratamiento}` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderizarIntervenciones(intervenciones) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (intervenciones.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay intervenciones quirúrgicas registradas</div>';
      return;
    }

    contenedor.innerHTML = intervenciones.map(i => `
      <div class="card mb-3 border-${i.resultado ? 'success' : 'warning'}">
        <div class="card-header bg-${i.resultado ? 'success' : 'warning'} text-white">
          <h6 class="mb-0"><i class="fas fa-hospital"></i> ${i.tipo_procedimiento}</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Médico:</strong> ${i.medico} (${i.especialidad})</p>
              <p><strong>Habitación:</strong> ${i.habitacion}</p>
              <p><strong>Inicio:</strong> ${new Date(i.fecha_inicio).toLocaleString('es-AR')}</p>
              ${i.fecha_fin ? `<p><strong>Fin:</strong> ${new Date(i.fecha_fin).toLocaleString('es-AR')}</p>` : '<p class="text-warning">En curso</p>'}
            </div>
            <div class="col-md-6">
              <p><strong>Duración:</strong> ${typeof i.duracion === 'number' ? i.duracion + ' min' : i.duracion}</p>
              ${i.resultado ? `<p><strong>Resultado:</strong> <span class="badge bg-info">${i.resultado}</span></p>` : ''}
              ${i.observaciones ? `<p><strong>Observaciones:</strong> ${i.observaciones}</p>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderizarTimeline(eventos) {
    const contenedor = document.getElementById('contenido-seccion');
    
    if (eventos.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-info">No hay eventos registrados</div>';
      return;
    }

    contenedor.innerHTML = `
      <div class="timeline">
        ${eventos.map(e => `
          <div class="timeline-item">
            <div class="timeline-marker bg-${e.color}">
              <i class="fas ${e.icono} text-white"></i>
            </div>
            <div class="timeline-content">
              <h6 class="text-${e.color}">${e.tipo}</h6>
              <p class="mb-1"><strong>${e.descripcion}</strong></p>
              <small class="text-muted">${e.detalles}</small>
              <div class="text-muted mt-1">
                <i class="fas fa-clock"></i> ${new Date(e.fecha).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getEstadoBadge(estado) {
    const colores = {
      'Pendiente': 'warning',
      'Realizado': 'success',
      'Completado': 'success',
      'Cancelado': 'danger'
    };
    return colores[estado] || 'secondary';
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
    container.innerHTML = `<div class="alert ${clase} alert-dismissible fade show">
      ${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }
});