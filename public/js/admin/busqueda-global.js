/**
 * BÚSQUEDA GLOBAL - Sistema Hospitalario
 * Archivo: /public/js/busqueda-global.js
 * 
 * Funciona con: GET /api/search/global?search=termino
 */

let tiempoEsperaBusqueda;

/**
 * Ejecuta la búsqueda global con debounce
 */
function busquedaGlobal(valorBusqueda) {
  clearTimeout(tiempoEsperaBusqueda);
  
  const contenedorResultados = document.getElementById('searchResults');
  
  if (!contenedorResultados) {
    console.error('❌ Contenedor searchResults no encontrado');
    return;
  }

  // Ocultar si es muy corto (menos de 3 caracteres)
  if (valorBusqueda.length < 3) {
    contenedorResultados.style.display = 'none';
    contenedorResultados.innerHTML = '';
    return;
  }

  // Mostrar indicador de carga
  contenedorResultados.innerHTML = `
    <div class="card shadow-sm">
      <div class="card-body text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        <span class="text-muted">Buscando "${valorBusqueda}"...</span>
      </div>
    </div>
  `;
  contenedorResultados.style.display = 'block';

  // Debounce de 400ms para no saturar el servidor
  tiempoEsperaBusqueda = setTimeout(async () => {
    try {
      const filtro = document.getElementById('searchFilter')?.value || 'all';
      
      const respuesta = await fetch(`/api/search/global?search=${encodeURIComponent(valorBusqueda)}&filter=${filtro}`);
      
      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }
      
      const data = await respuesta.json();
      
      if (data.success) {
        mostrarResultadosBusqueda(data.resultados, valorBusqueda);
      } else {
        mostrarErrorBusqueda(data.message || 'No se encontraron resultados');
      }
      
    } catch (error) {
      console.error('❌ Error en búsqueda global:', error);
      mostrarErrorBusqueda('Error al conectar con el servidor');
    }
  }, 400);
}

/**
 * Muestra los resultados de búsqueda en el contenedor
 */
function mostrarResultadosBusqueda(resultados, termino) {
  const contenedor = document.getElementById('searchResults');
  if (!contenedor) return;

  // Si no hay resultados
  if (!resultados || resultados.length === 0) {
    contenedor.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body text-center py-4">
          <i class="fas fa-search fa-2x text-muted mb-3"></i>
          <p class="text-muted mb-0">No se encontraron resultados para "<strong>${termino}</strong>"</p>
        </div>
      </div>
    `;
    return;
  }

  // Agrupar resultados por tipo
  const pacientes = resultados.filter(r => r.tipo === 'paciente');
  const medicos = resultados.filter(r => r.tipo === 'medico');
  const enfermeros = resultados.filter(r => r.tipo === 'enfermero');
  const administrativos = resultados.filter(r => r.tipo === 'administrativo');
  const otros = resultados.filter(r => !['paciente', 'medico', 'enfermero', 'administrativo'].includes(r.tipo));

  let html = `
    <div class="card shadow-sm">
      <div class="card-header bg-light py-2">
        <div class="d-flex justify-content-between align-items-center">
          <span>
            <i class="fas fa-search me-2"></i>
            <strong>${resultados.length}</strong> resultado(s) para "<strong>${termino}</strong>"
          </span>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="cerrarResultados()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="card-body p-0" style="max-height: 400px; overflow-y: auto;">
  `;

  // Sección: Pacientes
  if (pacientes.length > 0) {
    html += `
      <div class="border-bottom">
        <div class="px-3 py-2 bg-primary bg-opacity-10">
          <strong><i class="fas fa-user-injured me-2 text-primary"></i>Pacientes (${pacientes.length})</strong>
        </div>
        <div class="list-group list-group-flush">
    `;
    
    pacientes.forEach(p => {
      html += `
        <a href="/pacientes?dni=${p.dni}" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-user text-primary me-2"></i>
              <strong>${p.nombre}</strong>
              <br>
              <small class="text-muted">
                <i class="fas fa-id-card me-1"></i>DNI: ${p.dni} 
                ${p.email ? `| <i class="fas fa-envelope me-1"></i>${p.email}` : ''}
              </small>
            </div>
            <div>
              <span class="badge bg-primary">Paciente</span>
              <i class="fas fa-chevron-right text-muted ms-2"></i>
            </div>
          </div>
        </a>
      `;
    });
    
    html += `</div></div>`;
  }

  // Sección: Médicos
  if (medicos.length > 0) {
    html += `
      <div class="border-bottom">
        <div class="px-3 py-2 bg-success bg-opacity-10">
          <strong><i class="fas fa-user-md me-2 text-success"></i>Médicos (${medicos.length})</strong>
        </div>
        <div class="list-group list-group-flush">
    `;
    
    medicos.forEach(m => {
      html += `
        <a href="/personal?tipo=medico&id=${m.tipo_id}" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-user-md text-success me-2"></i>
              <strong>Dr/a. ${m.nombre}</strong>
              <br>
              <small class="text-muted">
                <i class="fas fa-id-card me-1"></i>DNI: ${m.dni}
              </small>
            </div>
            <div>
              <span class="badge bg-success">Médico</span>
              <i class="fas fa-chevron-right text-muted ms-2"></i>
            </div>
          </div>
        </a>
      `;
    });
    
    html += `</div></div>`;
  }

  // Sección: Enfermeros
  if (enfermeros.length > 0) {
    html += `
      <div class="border-bottom">
        <div class="px-3 py-2 bg-info bg-opacity-10">
          <strong><i class="fas fa-user-nurse me-2 text-info"></i>Enfermeros (${enfermeros.length})</strong>
        </div>
        <div class="list-group list-group-flush">
    `;
    
    enfermeros.forEach(e => {
      html += `
        <a href="/personal?tipo=enfermero&id=${e.tipo_id}" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-user-nurse text-info me-2"></i>
              <strong>${e.nombre}</strong>
              <br>
              <small class="text-muted">
                <i class="fas fa-id-card me-1"></i>DNI: ${e.dni}
              </small>
            </div>
            <div>
              <span class="badge bg-info">Enfermero</span>
              <i class="fas fa-chevron-right text-muted ms-2"></i>
            </div>
          </div>
        </a>
      `;
    });
    
    html += `</div></div>`;
  }

  // Sección: Administrativos
  if (administrativos.length > 0) {
    html += `
      <div class="border-bottom">
        <div class="px-3 py-2 bg-warning bg-opacity-10">
          <strong><i class="fas fa-user-tie me-2 text-warning"></i>Administrativos (${administrativos.length})</strong>
        </div>
        <div class="list-group list-group-flush">
    `;
    
    administrativos.forEach(a => {
      html += `
        <a href="/personal?tipo=administrativo&id=${a.tipo_id}" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-user-tie text-warning me-2"></i>
              <strong>${a.nombre}</strong>
              <br>
              <small class="text-muted">
                <i class="fas fa-id-card me-1"></i>DNI: ${a.dni}
              </small>
            </div>
            <div>
              <span class="badge bg-warning text-dark">Admin</span>
              <i class="fas fa-chevron-right text-muted ms-2"></i>
            </div>
          </div>
        </a>
      `;
    });
    
    html += `</div></div>`;
  }

  // Sección: Otros usuarios
  if (otros.length > 0) {
    html += `
      <div>
        <div class="px-3 py-2 bg-secondary bg-opacity-10">
          <strong><i class="fas fa-users me-2 text-secondary"></i>Otros (${otros.length})</strong>
        </div>
        <div class="list-group list-group-flush">
    `;
    
    otros.forEach(o => {
      html += `
        <a href="/usuarios?search=${o.dni}" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-user text-secondary me-2"></i>
              <strong>${o.nombre}</strong>
              <br>
              <small class="text-muted">
                <i class="fas fa-id-card me-1"></i>DNI: ${o.dni} | Rol: ${o.rol}
              </small>
            </div>
            <div>
              <span class="badge bg-secondary">${o.rol}</span>
              <i class="fas fa-chevron-right text-muted ms-2"></i>
            </div>
          </div>
        </a>
      `;
    });
    
    html += `</div></div>`;
  }

  html += `
      </div>
    </div>
  `;

  contenedor.innerHTML = html;
}

/**
 * Muestra un mensaje de error en el contenedor
 */
function mostrarErrorBusqueda(mensaje) {
  const contenedor = document.getElementById('searchResults');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="card shadow-sm border-danger">
        <div class="card-body text-center py-3">
          <i class="fas fa-exclamation-triangle text-danger me-2"></i>
          <span class="text-danger">${mensaje}</span>
        </div>
      </div>
    `;
  }
}

/**
 * Cierra el panel de resultados
 */
function cerrarResultados() {
  const contenedor = document.getElementById('searchResults');
  if (contenedor) {
    contenedor.style.display = 'none';
    contenedor.innerHTML = '';
  }
  
  const input = document.getElementById('globalSearch');
  if (input) {
    input.value = '';
    input.focus();
  }
}

// ========================================
//  INICIALIZACIÓN AL CARGAR EL DOM
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Búsqueda global inicializada');

  const searchInput = document.getElementById('globalSearch');
  const searchBtn = document.getElementById('globalSearchBtn');
  const searchFilter = document.getElementById('searchFilter');

  // Evento: escribir en el input (búsqueda en tiempo real)
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      busquedaGlobal(this.value.trim());
    });

    // Evento: presionar Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        busquedaGlobal(this.value.trim());
      }
    });

    // Evento: presionar Escape para cerrar
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        cerrarResultados();
      }
    });
  }

  // Evento: click en botón buscar
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      const valor = document.getElementById('globalSearch')?.value || '';
      busquedaGlobal(valor.trim());
    });
  }

  // Evento: cambiar filtro
  if (searchFilter) {
    searchFilter.addEventListener('change', function() {
      const valor = document.getElementById('globalSearch')?.value || '';
      if (valor.trim().length >= 3) {
        busquedaGlobal(valor.trim());
      }
    });
  }

  // Evento: click fuera del área de búsqueda para cerrar
  document.addEventListener('click', function(e) {
    const searchSection = document.querySelector('.search-section');
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchSection && resultsContainer && !searchSection.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
});

// Exportar funciones para uso global
window.busquedaGlobal = busquedaGlobal;
window.cerrarResultados = cerrarResultados;

console.log('📄 busqueda-global.js cargado');