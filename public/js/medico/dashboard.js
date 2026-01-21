// ========================================
// DASHBOARD.JS - CARGADOR DE DATOS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Página cargada - Iniciando cargas de datos');
  
  cargarEstadisticas();
  cargarTurnosProximos();
  cargarPacientesRecientes();
  cargarInternaciones();
  cargarActividadReciente();
  
  // Actualizar cada 5 minutos
  setInterval(() => {
    console.log('🔄 Actualizando datos automáticamente...');
    cargarEstadisticas();
    cargarTurnosProximos();
  }, 5 * 60 * 1000);
});

// ========================================
// CARGAR ESTADÍSTICAS
// ========================================
async function cargarEstadisticas() {
  try {
    const url = '/medico/api/estadisticas';
    console.log('📊 Cargando estadísticas desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos estadísticas:', data);
    
    if (data.success) {
      console.log('✅ Actualizando elementos HTML...');
      
      // Actualizar cada elemento
      const turnosHoy = document.getElementById('stat-turnos-hoy');
      const turnosPendientes = document.getElementById('stat-turnos-pendientes');
      const pacientesMes = document.getElementById('stat-pacientes-mes');
      const internaciones = document.getElementById('stat-internaciones');
      
      if (turnosHoy) {
        turnosHoy.textContent = data.data.turnosHoy || 0;
        console.log('✅ Turnos hoy actualizado:', data.data.turnosHoy);
      }
      
      if (turnosPendientes) {
        turnosPendientes.textContent = data.data.turnosPendientes || 0;
        console.log('✅ Turnos pendientes actualizado:', data.data.turnosPendientes);
      }
      
      if (pacientesMes) {
        pacientesMes.textContent = data.data.pacientesAtendidosMes || 0;
        console.log('✅ Pacientes mes actualizado:', data.data.pacientesAtendidosMes);
      }
      
      if (internaciones) {
        internaciones.textContent = data.data.internacionesActivas || 0;
        console.log('✅ Internaciones actualizado:', data.data.internacionesActivas);
      }
    } else {
      console.warn('⚠️ Respuesta success falsa');
    }
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error.message, error);
  }
}

// ========================================
// CARGAR TURNOS PRÓXIMOS
// ========================================
async function cargarTurnosProximos() {
  try {
    const url = '/medico/api/turnos-proximos?limite=5';
    console.log('📅 Cargando turnos desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos turnos:', data);
    
    const loadingDiv = document.getElementById('loading-turnos');
    const listaDiv = document.getElementById('lista-turnos-proximos');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (listaDiv) listaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Turnos encontrados:', data.data.length);
      
      const html = data.data.map(turno => {
        const fecha = new Date(turno.fecha);
        const estadoClass = {
          'CONFIRMADO': 'success',
          'PENDIENTE': 'warning',
          'COMPLETADO': 'info',
          'CANCELADO': 'danger'
        }[turno.estado] || 'secondary';
        
        return `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1">
                  <i class="fas fa-user-circle me-2"></i>
                  ${turno.paciente?.usuario?.nombre || 'N/A'} ${turno.paciente?.usuario?.apellido || ''}
                </h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-calendar me-2"></i>
                  ${fecha.toLocaleDateString('es-AR')} - ${turno.hora_inicio || 'N/A'}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fas fa-id-card me-2"></i>
                  DNI: ${turno.paciente?.usuario?.dni || 'N/A'}
                </p>
              </div>
              <div class="text-end">
                <span class="badge bg-${estadoClass}">${turno.estado || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      if (listaDiv) {
        listaDiv.innerHTML = `<div class="list-group list-group-flush">${html}</div>`;
      }
    } else {
      console.warn('⚠️ Sin turnos o respuesta vacía');
      if (listaDiv) {
        listaDiv.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-calendar-times fa-3x mb-3"></i>
            <p>No hay turnos próximos</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar turnos:', error.message);
    const loadingDiv = document.getElementById('loading-turnos');
    if (loadingDiv) {
      loadingDiv.innerHTML = `<div class="alert alert-danger">Error al cargar turnos</div>`;
    }
  }
}

// ========================================
// CARGAR PACIENTES RECIENTES
// ========================================
async function cargarPacientesRecientes() {
  try {
    const url = '/medico/api/pacientes-recientes?limite=5';
    console.log('👥 Cargando pacientes desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos pacientes:', data);
    
    const loadingDiv = document.getElementById('loading-pacientes');
    const listaDiv = document.getElementById('lista-pacientes-recientes');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (listaDiv) listaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Pacientes encontrados:', data.data.length);
      
      const html = data.data.map(evaluacion => {
        const fecha = new Date(evaluacion.fecha);
        
        return `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1">
                  <i class="fas fa-user-injured me-2"></i>
                  ${evaluacion.paciente?.usuario?.nombre || 'N/A'} ${evaluacion.paciente?.usuario?.apellido || ''}
                </h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-calendar me-2"></i>
                  ${fecha.toLocaleDateString('es-AR')}
                </p>
                ${evaluacion.observaciones_diagnostico ? `
                  <p class="mb-0 text-muted small">
                    <i class="fas fa-notes-medical me-2"></i>
                    ${evaluacion.observaciones_diagnostico.substring(0, 50)}...
                  </p>
                ` : ''}
              </div>
              <div class="text-end">
                <a href="/medico/evaluaciones?paciente_id=${evaluacion.paciente_id}" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-eye"></i>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      if (listaDiv) {
        listaDiv.innerHTML = `<div class="list-group list-group-flush">${html}</div>`;
      }
    } else {
      console.warn('⚠️ Sin pacientes o respuesta vacía');
      if (listaDiv) {
        listaDiv.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-user-slash fa-3x mb-3"></i>
            <p>No hay pacientes recientes</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar pacientes:', error.message);
    const loadingDiv = document.getElementById('loading-pacientes');
    if (loadingDiv) {
      loadingDiv.innerHTML = `<div class="alert alert-danger">Error al cargar pacientes</div>`;
    }
  }
}

// ========================================
// CARGAR INTERNACIONES
// ========================================
async function cargarInternaciones() {
  try {
    const url = '/medico/api/internaciones-en-curso';
    console.log('🛏️ Cargando internaciones desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos internaciones:', data);
    
    const loadingDiv = document.getElementById('loading-internaciones');
    const listaDiv = document.getElementById('lista-internaciones');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (listaDiv) listaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Internaciones encontradas:', data.data.length);
      
      const tbody = document.getElementById('tbody-internaciones');
      if (tbody) {
        tbody.innerHTML = data.data.map(int => {
          const fechaInicio = new Date(int.fecha_inicio);
          const diasInternado = Math.floor((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
          
          const estadoClass = {
            'Estable': 'success',
            'Grave': 'warning',
            'Critico': 'danger',
            'Sin_Evaluar': 'secondary'
          }[int.estado_paciente] || 'secondary';
          
          return `
            <tr>
              <td>
                <strong>${int.paciente?.usuario?.nombre || 'N/A'} ${int.paciente?.usuario?.apellido || ''}</strong>
                <br>
                <small class="text-muted">DNI: ${int.paciente?.usuario?.dni || 'N/A'}</small>
              </td>
              <td>
                ${int.cama?.habitacion?.numero || 'N/A'}
                <br>
                <small class="text-muted">Cama ${int.cama?.numero || 'N/A'}</small>
              </td>
              <td>
                <span class="badge bg-${estadoClass}">
                  ${(int.estado_paciente || 'N/A').replace('_', ' ')}
                </span>
              </td>
              <td>
                ${fechaInicio.toLocaleDateString('es-AR')}
                <br>
                <small class="text-muted">${diasInternado} días</small>
              </td>
              <td>
                <a href="/medico/internaciones?id=${int.id}" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-eye"></i>
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }
    } else {
      console.warn('⚠️ Sin internaciones o respuesta vacía');
      if (listaDiv) {
        listaDiv.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-bed fa-3x mb-3"></i>
            <p>No hay internaciones activas</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar internaciones:', error.message);
    const loadingDiv = document.getElementById('loading-internaciones');
    if (loadingDiv) {
      loadingDiv.innerHTML = `<div class="alert alert-danger">Error al cargar internaciones</div>`;
    }
  }
}

// ========================================
// CARGAR ACTIVIDAD RECIENTE
// ========================================
async function cargarActividadReciente() {
  try {
    const url = '/medico/api/actividad-reciente?limite=10';
    console.log('⚡ Cargando actividad desde:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Datos actividad:', data);
    
    const loadingDiv = document.getElementById('loading-actividad');
    const listaDiv = document.getElementById('lista-actividad');
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (listaDiv) listaDiv.classList.remove('d-none');
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ Actividades encontradas:', data.data.length);
      
      const html = data.data.map(act => {
        const fecha = new Date(act.fecha);
        const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
        
        return `
          <div class="timeline-item">
            <div class="timeline-marker bg-primary"></div>
            <div class="timeline-content">
              <h6 class="mb-1">${act.descripcion || 'N/A'}</h6>
              <p class="text-muted small mb-0">
                <i class="fas fa-clock me-1"></i>
                ${tiempoTranscurrido}
              </p>
            </div>
          </div>
        `;
      }).join('');
      
      if (listaDiv) {
        listaDiv.innerHTML = `<div class="timeline">${html}</div>`;
      }
    } else {
      console.warn('⚠️ Sin actividades o respuesta vacía');
      if (listaDiv) {
        listaDiv.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-history fa-3x mb-3"></i>
            <p>No hay actividad reciente</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar actividad:', error.message);
    const loadingDiv = document.getElementById('loading-actividad');
    if (loadingDiv) {
      loadingDiv.innerHTML = `<div class="alert alert-danger">Error al cargar actividad</div>`;
    }
  }
}

// ========================================
// CALCULAR TIEMPO TRANSCURRIDO
// ========================================
function calcularTiempoTranscurrido(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  
  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  } else if (horas < 24) {
    return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
  } else {
    return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
  }
}