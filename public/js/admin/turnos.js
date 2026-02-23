// /public/js/admin/turnos.js - PARA LA VISTA PRINCIPAL (/turnos)

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ turnos.js inicializado - Vista principal');

  // ============================================================================
  // VARIABLES Y FUNCIONES AUXILIARES
  // ============================================================================
  function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('d-none');
  }

  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('d-none');
  }

  function mostrarMensaje(mensaje, tipo = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  // ============================================================================
  // CARGAR DASHBOARD PRINCIPAL
  // ============================================================================
  async function cargarDashboard() {
    try {
      showLoading();
      const response = await fetch('/turnos/api/dashboard');
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Actualizar estadísticas
      actualizarEstadisticas(data.estadisticas);
      
      hideLoading();
    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error);
      hideLoading();
      mostrarMensaje(`Error: ${error.message}`, 'danger');
    }
  }

  function actualizarEstadisticas(stats) {
    const elementos = {
      'turnos-total': stats.turnos?.total || 0,
      'turnos-pendientes': stats.turnos?.pendientes || 0,
      'listas-total': stats.listasEspera?.total || 0,
      'listas-pendientes': stats.listasEspera?.pendientes || 0
    };

    Object.keys(elementos).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = elementos[id];
    });
  }

  // ============================================================================
  // DETALLES DE PACIENTE (COMPARTIDO)
  // ============================================================================
  async function verDetallesPaciente(pacienteId) {
    try {
      const response = await fetch(`/turnos/api/paciente/${pacienteId}/detalles`);
      if (!response.ok) throw new Error('Error al cargar detalles');
      
      const data = await response.json();
      mostrarModalDetalles(data);
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al cargar detalles', 'danger');
    }
  }

  function mostrarModalDetalles(data) {
    // Llenar datos personales
    const elementos = {
      'detalle-nombre': `${data.paciente.nombre} ${data.paciente.apellido}`,
      'detalle-dni': data.paciente.dni,
      'detalle-sexo': formatearSexo(data.paciente.sexo),
      'detalle-email': data.paciente.email || '-',
      'detalle-telefono': data.paciente.telefono || '-',
      'detalle-obra-social': data.paciente.obraSocial || '-',
      'stat-admisiones': data.estadisticas?.totalAdmisiones || 0,
      'stat-turnos': data.estadisticas?.totalTurnos || 0,
      'stat-pendientes': data.estadisticas?.turnosPendientes || 0
    };

    Object.keys(elementos).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = elementos[id];
    });

    // Historial de admisiones
    const tbodyAdm = document.getElementById('historial-admisiones');
    if (tbodyAdm) {
      tbodyAdm.innerHTML = (data.admisiones || []).map(adm => `
        <tr>
          <td>${new Date(adm.fecha).toLocaleDateString('es-AR')}</td>
          <td>${adm.medico?.usuario?.nombre || '-'}</td>
          <td>${adm.sector?.nombre || '-'}</td>
          <td><span class="badge bg-warning">${adm.estado}</span></td>
        </tr>
      `).join('');
    }

    // Historial de turnos
    const tbodyTurnos = document.getElementById('historial-turnos');
    if (tbodyTurnos) {
      tbodyTurnos.innerHTML = (data.turnos || []).map(turno => `
        <tr>
          <td>${new Date(turno.fecha).toLocaleDateString('es-AR')}</td>
          <td>${turno.hora_inicio || '-'}</td>
          <td>${turno.medico?.usuario?.nombre || '-'}</td>
          <td><span class="badge bg-info">${turno.estado}</span></td>
        </tr>
      `).join('');
    }

    new bootstrap.Modal(document.getElementById('modalDetallesPaciente')).show();
  }

  function formatearSexo(sexo) {
    if (!sexo) return 'No especificado';
    const sexoStr = String(sexo).toUpperCase();
    const map = {
      'M': '♂ Masculino',
      'F': '♀ Femenino',
      'MASCULINO': '♂ Masculino',
      'FEMENINO': '♀ Femenino',
      'HOMBRE': '♂ Masculino',
      'MUJER': '♀ Femenino'
    };
    return map[sexoStr] || sexo;
  }
  async function cargarHorariosMedico(medicoId, fecha, tipoServicioId) {
  try {
    showLoading();
    const url = `/api/medico/${medicoId}/horarios?fecha=${fecha}&tipo_servicio_id=${tipoServicioId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    
    const data = await response.json();
    // Aquí renderizas los horarios en el DOM
    mostrarHorariosDisponibles(data.horarios || []);
    
  } catch (error) {
    console.error('Error horarios:', error);
    mostrarMensaje('No se pudieron cargar los horarios', 'danger');
  } finally {
    hideLoading();
  }
}


 document.getElementById('selectMedico').addEventListener('change', e => {
   const medicoId = e.target.value;
   const fecha = document.getElementById('inputFecha').value;
   const tipoServicio = document.getElementById('selectServicio').value;
   if (medicoId && fecha && tipoServicio) {
     cargarHorariosMedico(medicoId, fecha, tipoServicio);
   }
 });

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================
  
  // Botón Actualizar
  document.getElementById('btnActualizar')?.addEventListener('click', cargarDashboard);
  
  // Event delegation para detalles de paciente
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-ver-detalle-paciente')) {
      const btn = e.target.closest('.btn-ver-detalle-paciente');
      const pacienteId = btn.dataset.pacienteId;
      verDetallesPaciente(pacienteId);
    }
  });

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  cargarDashboard();
  
  console.log('✅ Vista principal de turnos lista');
});