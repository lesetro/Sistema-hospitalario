// ============================================================================
// BÚSQUEDA GLOBAL (para usar en layout.pug)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const globalSearchInput = document.getElementById('globalSearch');
  const globalSearchBtn = document.getElementById('globalSearchBtn');
  const searchFilter = document.getElementById('searchFilter');
  const searchResults = document.getElementById('searchResults');

  if (!globalSearchInput || !globalSearchBtn) {
    console.log('Elementos de búsqueda global no encontrados');
    return;
  }

  // Búsqueda al hacer clic
  globalSearchBtn.addEventListener('click', realizarBusquedaGlobal);

  // Búsqueda al presionar Enter
  globalSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      realizarBusquedaGlobal();
    }
  });

  async function realizarBusquedaGlobal() {
    const searchTerm = globalSearchInput.value.trim();
    const tipo = searchFilter.value;

    if (searchTerm.length < 3) {
      mostrarMensaje('Por favor ingrese al menos 3 caracteres', 'warning');
      return;
    }

    // Mostrar loading
    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <span class="ms-2">Buscando...</span>
      </div>
    `;

    try {
      const response = await fetch(`/internaciones/api/busqueda-global?q=${encodeURIComponent(searchTerm)}&tipo=${tipo}&limit=10`);
      const data = await response.json();

      if (!data.success) {
        mostrarMensaje(data.message, 'danger');
        return;
      }

      mostrarResultados(data);

    } catch (error) {
      console.error('Error en búsqueda global:', error);
      mostrarMensaje('Error al realizar la búsqueda', 'danger');
    }
  }

  function mostrarResultados(data) {
    if (data.total_resultados === 0) {
      searchResults.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i>
          No se encontraron resultados para "${data.termino_busqueda}"
        </div>
      `;
      return;
    }

    let html = `
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h6 class="mb-0">
            <i class="fas fa-search me-2"></i>
            Resultados de búsqueda: "${data.termino_busqueda}" (${data.total_resultados} encontrado${data.total_resultados !== 1 ? 's' : ''})
          </h6>
        </div>
        <div class="card-body p-0">
    `;

    // PACIENTES
    if (data.resultados.pacientes && data.resultados.pacientes.length > 0) {
      html += `
        <div class="p-3 border-bottom">
          <h6 class="text-primary mb-3">
            <i class="fas fa-user-injured me-2"></i>
            Pacientes (${data.resultados.pacientes.length})
          </h6>
          <div class="list-group">
      `;
      
      data.resultados.pacientes.forEach(p => {
        html += `
          <a href="/pacientes/${p.id}" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <div>
                <h6 class="mb-1">${p.nombre_completo}</h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-id-card me-1"></i> DNI: ${p.dni} | 
                  <i class="fas fa-venus-mars me-1"></i> ${p.sexo} | 
                  <i class="fas fa-medkit me-1"></i> ${p.obra_social}
                </p>
              </div>
              <span class="badge bg-primary align-self-center">Paciente</span>
            </div>
          </a>
        `;
      });
      
      html += `</div></div>`;
    }

    // MÉDICOS
    if (data.resultados.medicos && data.resultados.medicos.length > 0) {
      html += `
        <div class="p-3 border-bottom">
          <h6 class="text-success mb-3">
            <i class="fas fa-user-md me-2"></i>
            Médicos (${data.resultados.medicos.length})
          </h6>
          <div class="list-group">
      `;
      
      data.resultados.medicos.forEach(m => {
        html += `
          <a href="/personal/medicos/${m.id}" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <div>
                <h6 class="mb-1">${m.nombre_completo}</h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-id-card me-1"></i> DNI: ${m.dni} | 
                  <i class="fas fa-certificate me-1"></i> Mat: ${m.matricula} | 
                  <i class="fas fa-stethoscope me-1"></i> ${m.especialidad}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fas fa-hospital me-1"></i> ${m.sector}
                </p>
              </div>
              <span class="badge bg-success align-self-center">Médico</span>
            </div>
          </a>
        `;
      });
      
      html += `</div></div>`;
    }

    // ENFERMEROS
    if (data.resultados.enfermeros && data.resultados.enfermeros.length > 0) {
      html += `
        <div class="p-3 border-bottom">
          <h6 class="text-info mb-3">
            <i class="fas fa-user-nurse me-2"></i>
            Enfermeros (${data.resultados.enfermeros.length})
          </h6>
          <div class="list-group">
      `;
      
      data.resultados.enfermeros.forEach(e => {
        html += `
          <a href="/personal/enfermeros/${e.id}" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <div>
                <h6 class="mb-1">${e.nombre_completo}</h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-id-card me-1"></i> DNI: ${e.dni} | 
                  <i class="fas fa-certificate me-1"></i> Mat: ${e.matricula} | 
                  <i class="fas fa-level-up-alt me-1"></i> ${e.nivel}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fas fa-hospital me-1"></i> ${e.sector} | 
                  <span class="badge bg-${e.estado === 'Activo' ? 'success' : 'secondary'}">${e.estado}</span>
                </p>
              </div>
              <span class="badge bg-info align-self-center">Enfermero</span>
            </div>
          </a>
        `;
      });
      
      html += `</div></div>`;
    }

    // ADMINISTRATIVOS
    if (data.resultados.administrativos && data.resultados.administrativos.length > 0) {
      html += `
        <div class="p-3">
          <h6 class="text-warning mb-3">
            <i class="fas fa-user-tie me-2"></i>
            Administrativos (${data.resultados.administrativos.length})
          </h6>
          <div class="list-group">
      `;
      
      data.resultados.administrativos.forEach(a => {
        html += `
          <a href="/personal/administrativos/${a.id}" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <div>
                <h6 class="mb-1">${a.nombre_completo}</h6>
                <p class="mb-1 text-muted small">
                  <i class="fas fa-id-card me-1"></i> DNI: ${a.dni} | 
                  <i class="fas fa-briefcase me-1"></i> ${a.responsabilidad}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fas fa-hospital me-1"></i> ${a.sector} | 
                  <span class="badge bg-${a.estado === 'Activo' ? 'success' : 'secondary'}">${a.estado}</span>
                </p>
              </div>
              <span class="badge bg-warning align-self-center">Administrativo</span>
            </div>
          </a>
        `;
      });
      
      html += `</div></div>`;
    }

    html += `
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('searchResults').style.display='none'">
            <i class="fas fa-times me-1"></i> Cerrar resultados
          </button>
        </div>
      </div>
    `;

    searchResults.innerHTML = html;
  }

  function mostrarMensaje(mensaje, tipo) {
    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div class="alert alert-${tipo} mb-0">
        <i class="fas fa-${tipo === 'warning' ? 'exclamation-triangle' : 'times-circle'} me-2"></i>
        ${mensaje}
      </div>
    `;
  }
});