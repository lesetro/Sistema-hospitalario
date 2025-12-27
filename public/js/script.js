let tiempoEsperaBusqueda;

function busquedaGlobal(valorBusqueda) {
  clearTimeout(tiempoEsperaBusqueda);
  
  const contenedorResultados = document.getElementById('searchResults');
  
  if (!contenedorResultados) return;

  // Ocultar si es muy corto
  if (valorBusqueda.length < 2) {
    contenedorResultados.style.display = 'none';
    contenedorResultados.innerHTML = '';
    return;
  }

  // Mostrar carga
  contenedorResultados.innerHTML = `
    <div class="card">
      <div class="card-body text-center">
        <div class="spinner-border spinner-border-sm me-2"></div>
        Buscando...
      </div>
    </div>
  `;
  contenedorResultados.style.display = 'block';

  // Debounce
  tiempoEsperaBusqueda = setTimeout(async () => {
    try {
      const filtro = document.getElementById('searchFilter')?.value || 'all';
      const respuesta = await fetch(`/api/search/global?search=${encodeURIComponent(valorBusqueda)}&filter=${filtro}`);
      
      if (!respuesta.ok) {
        throw new Error('Error en la búsqueda');
      }
      
      const data = await respuesta.json();
      
      if (data.success) {
        mostrarResultadosBusqueda(data.resultados, valorBusqueda);
      } else {
        mostrarErrorBusqueda(data.message || 'Error al buscar');
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      mostrarErrorBusqueda('Error al realizar la búsqueda');
    }
  }, 500);
}

function mostrarResultadosBusqueda(resultados, termino) {
  const contenedor = document.getElementById('searchResults');
  if (!contenedor) return;

  let html = '<div class="card"><div class="card-body">';
  html += `<h6 class="mb-3">Resultados para: <strong>"${termino}"</strong></h6>`;

  let tieneResultados = false;

  // Pacientes
  if (resultados.pacientes && resultados.pacientes.length > 0) {
    tieneResultados = true;
    html += '<div class="mb-3"><strong><i class="fas fa-user me-2"></i>Pacientes:</strong><ul class="list-unstyled mt-2">';
    resultados.pacientes.forEach(p => {
      html += `
        <li class="border-bottom py-2">
          <a href="/pacientes?dni=${p.usuario.dni}" class="text-decoration-none">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>${p.usuario.nombre} ${p.usuario.apellido}</strong>
                <br><small class="text-muted">DNI: ${p.usuario.dni}</small>
              </div>
              <i class="fas fa-chevron-right text-muted"></i>
            </div>
          </a>
        </li>
      `;
    });
    html += '</ul></div>';
  }

  // Admisiones
  if (resultados.admisiones && resultados.admisiones.length > 0) {
    tieneResultados = true;
    html += '<div class="mb-3"><strong><i class="fas fa-clipboard-list me-2"></i>Admisiones:</strong><ul class="list-unstyled mt-2">';
    resultados.admisiones.forEach(a => {
      html += `
        <li class="border-bottom py-2">
          <a href="/admisiones" class="text-decoration-none">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Admisión #${a.id}</strong> - ${a.paciente.usuario.nombre} ${a.paciente.usuario.apellido}
                <br><small class="text-muted">${new Date(a.fecha).toLocaleDateString('es-AR')}</small>
              </div>
              <i class="fas fa-chevron-right text-muted"></i>
            </div>
          </a>
        </li>
      `;
    });
    html += '</ul></div>';
  }

  // Turnos
  if (resultados.turnos && resultados.turnos.length > 0) {
    tieneResultados = true;
    html += '<div class="mb-3"><strong><i class="fas fa-calendar-alt me-2"></i>Turnos:</strong><ul class="list-unstyled mt-2">';
    resultados.turnos.forEach(t => {
      html += `
        <li class="border-bottom py-2">
          <a href="/turnos" class="text-decoration-none">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Turno</strong> - ${t.paciente.usuario.nombre} ${t.paciente.usuario.apellido}
                <br><small class="text-muted">${new Date(t.fecha).toLocaleDateString('es-AR')}</small>
              </div>
              <i class="fas fa-chevron-right text-muted"></i>
            </div>
          </a>
        </li>
      `;
    });
    html += '</ul></div>';
  }

  if (!tieneResultados) {
    html += '<p class="text-muted mb-0"><i class="fas fa-info-circle me-2"></i>No se encontraron resultados</p>';
  }

  html += '</div></div>';
  contenedor.innerHTML = html;
}

function mostrarErrorBusqueda(mensaje) {
  const contenedor = document.getElementById('searchResults');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="alert alert-danger mb-0">
            <i class="fas fa-exclamation-triangle me-2"></i>${mensaje}
          </div>
        </div>
      </div>
    `;
  }
}

// ========================================
//  CONTADOR DE MENSAJES EN HEADER
// ========================================

async function cargarContadorGlobal() {
  try {
    const response = await fetch('/comunicacion/api/contador');
    const data = await response.json();

    if (data.success) {
      const badge = document.getElementById('header-contador-mensajes');
      if (badge) {
        badge.textContent = data.contador;
        badge.style.display = data.contador > 0 ? 'inline' : 'none';
      }
    }
  } catch (error) {
    // Silencioso - no mostrar error si falla
    console.log('No se pudo cargar el contador de mensajes');
  }
}

// ========================================
//  FUNCIONES GLOBALES (window scope)
// ========================================

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
};

// ========================================
//  INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log(' Script.js cargado correctamente');

  // ============================================================================
  // BÚSQUEDA GLOBAL - Conectar eventos
  // ============================================================================
  const searchInput = document.getElementById('globalSearch');
  const searchBtn = document.getElementById('globalSearchBtn');
  const searchFilter = document.getElementById('searchFilter');

  if (searchInput) {
    // Búsqueda al escribir (con debounce)
    searchInput.addEventListener('input', function() {
      busquedaGlobal(this.value);
    });

    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        busquedaGlobal(this.value);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      const valor = document.getElementById('globalSearch')?.value || '';
      busquedaGlobal(valor);
    });
  }

  if (searchFilter) {
    searchFilter.addEventListener('change', function() {
      const valor = document.getElementById('globalSearch')?.value || '';
      if (valor.length >= 2) {
        busquedaGlobal(valor);
      }
    });
  }

  // Cerrar resultados al hacer clic fuera
  document.addEventListener('click', function(e) {
    const searchSection = document.querySelector('.search-section');
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchSection && resultsContainer && 
        !searchSection.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });

  // ============================================================================
  // CONTADOR DE MENSAJES
  // ============================================================================
  cargarContadorGlobal();
  setInterval(cargarContadorGlobal, 60000); // Cada 60 segundos

  // ============================================================================
  // SIDEBAR MÓVIL
  // ============================================================================
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', window.toggleSidebar);
  }

  // Cerrar sidebar al hacer clic fuera (móvil)
  document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (window.innerWidth <= 768 && 
        sidebar && 
        sidebar.classList.contains('show') &&
        !sidebar.contains(e.target) &&
        toggleBtn && !toggleBtn.contains(e.target)) {
      sidebar.classList.remove('show');
    }
  });

  // ============================================================================
  // VALIDACIÓN GENÉRICA DE FORMULARIOS
  // ============================================================================
  const forms = document.querySelectorAll('form:not(#nuevoPacienteForm, #nuevaAdmisionForm, #editarAdmisionForm)');
  
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        submitBtn.disabled = true;

        // Permitir que el formulario se envíe normalmente
        // El servidor redirigirá después del procesamiento
      }
    });
  });

  // ============================================================================
  // TOOLTIPS
  // ============================================================================
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => {
    try {
      new bootstrap.Tooltip(tooltip);
    } catch (e) {
      console.log('Error inicializando tooltip:', e);
    }
  });

  // ============================================================================
  // AUTO-CERRAR ALERTAS
  // ============================================================================
  const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
  alerts.forEach(alert => {
    if (!alert.classList.contains('alert-permanent')) {
      setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }, 5000);
    }
  });

  console.log('✅ Todas las funcionalidades inicializadas');
});

// ========================================
//  UTILIDADES GLOBALES
// ========================================

window.showLoading = function(message = 'Cargando...') {
  const existing = document.getElementById('globalLoadingIndicator');
  if (existing) existing.remove();

  const loader = document.createElement('div');
  loader.id = 'globalLoadingIndicator';
  loader.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white p-3 rounded shadow';
  loader.style.zIndex = '9999';
  loader.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2"></div>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(loader);
};

window.hideLoading = function() {
  const loader = document.getElementById('globalLoadingIndicator');
  if (loader) loader.remove();
};

window.showMessage = function(message, type = 'info') {
  const alertClass = {
    'success': 'alert-success',
    'error': 'alert-danger',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';

  const alert = document.createElement('div');
  alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(alert);

  setTimeout(() => {
    if (alert.parentNode) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 10000);
};

console.log('📄 Script.js loaded');