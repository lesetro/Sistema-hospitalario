// ========================================
//  BÚSQUEDA GLOBAL - VERSIÓN DOMINANTE
// ========================================

// Agregar al inicio de tu script.js
console.log('🎯 SCRIPT.JS CORREGIDO CARGADO - ' + new Date().toISOString());

// ========================================
//  DESACTIVAR SCRIPT CONFLICTIVO
// ========================================

// Sobrescribir la función conflictiva
window.realizarBusquedaGlobal = function() {
  console.log('⚠️  Script conflictivo DESACTIVADO - Usando script.js');
  return false;
};

// Sobrescribir mostrarMensaje también
window.mostrarMensaje = function() {
  console.log('⚠️  mostrarMensaje conflictivo DESACTIVADO');
  return false;
};

// ========================================
//  BÚSQUEDA GLOBAL - NUESTRA VERSIÓN
// ========================================

let tiempoEsperaBusqueda;
let busquedaEnProgreso = false;

function realizarBusqueda(valorBusqueda) {
  if (busquedaEnProgreso) {
    console.log('⏸️  Búsqueda ya en progreso');
    return;
  }
  
  clearTimeout(tiempoEsperaBusqueda);
  
  const contenedorResultados = document.getElementById('searchResults');
  
  if (!contenedorResultados) {
    console.log('❌ No hay contenedor searchResults');
    return;
  }

  const filtro = document.getElementById('searchFilter')?.value || 'all';
  
  if (valorBusqueda.length < 2) {
    console.log('⏸️  Menos de 2 caracteres');
    contenedorResultados.style.display = 'none';
    contenedorResultados.innerHTML = '';
    return;
  }

  console.log('🚀 Búsqueda MANUAL iniciada para:', valorBusqueda);
  busquedaEnProgreso = true;

  // Mostrar carga
  contenedorResultados.innerHTML = `
    <div class="card">
      <div class="card-body text-center">
        <div class="spinner-border spinner-border-sm me-2"></div>
        <span class="text-muted">Buscando "<strong>${valorBusqueda}</strong>"...</span>
      </div>
    </div>
  `;
  contenedorResultados.style.display = 'block';

  tiempoEsperaBusqueda = setTimeout(async () => {
    try {
      const url = `/api/search/global?search=${encodeURIComponent(valorBusqueda)}&filter=${filtro}`;
      console.log('🌐 Fetch a endpoint correcto:', url);
      
      const respuesta = await fetch(url);
      console.log('📥 Status:', respuesta.status);
      
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      
      const data = await respuesta.json();
      console.log('📊 Respuesta:', data);
      
      busquedaEnProgreso = false;
      
      if (data.success && data.resultados && Array.isArray(data.resultados) && data.resultados.length > 0) {
        console.log('✅ Mostrando', data.resultados.length, 'resultados');
        mostrarResultadosBusqueda(data.resultados, valorBusqueda);
      } else {
        console.log('❌ Sin resultados');
        mostrarSinResultados(valorBusqueda);
      }
    } catch (error) {
      console.error('Error:', error);
      busquedaEnProgreso = false;
      mostrarErrorBusqueda('Error al realizar la búsqueda');
    }
  }, 300);
}

function mostrarResultadosBusqueda(resultados, termino) {
  const contenedor = document.getElementById('searchResults');
  if (!contenedor) return;

  let html = '<div class="card"><div class="card-body">';
  html += `<div class="d-flex justify-content-between align-items-center mb-3">
    <h6 class="mb-0"><i class="fas fa-check-circle text-success me-2"></i>${resultados.length} resultado(s) para "<strong>${termino}</strong>"</h6>
    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('searchResults').style.display='none'"><i class="fas fa-times"></i></button>
  </div>`;

  resultados.forEach(r => {
    const nombre = r.nombre || 'Sin nombre';
    const dni = r.dni || 'N/A';
    const tipo = r.tipo || 'usuario';
    const id = r.tipo_id || r.id || '';

    let url = '#';
    let badgeClass = 'bg-secondary';
    
    switch(tipo) {
      case 'paciente':
        url = `/pacientes/${id}`;
        badgeClass = 'bg-primary';
        break;
      case 'medico':
        url = `/personal/medicos/${id}`;
        badgeClass = 'bg-success';
        break;
      case 'enfermero':
        url = `/personal/enfermeros/${id}`;
        badgeClass = 'bg-info';
        break;
      case 'administrativo':
        url = `/personal/administrativos/${id}`;
        badgeClass = 'bg-warning text-dark';
        break;
      default:
        url = `/usuarios/${r.id}`;
    }

    html += `
      <div class="border-bottom py-2 mb-2">
        <a href="${url}" class="text-decoration-none text-dark">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${nombre}</strong>
              <br>
              <small class="text-muted">DNI: ${dni}</small>
              ${r.email ? `<br><small class="text-muted">Email: ${r.email}</small>` : ''}
              ${r.rol ? `<br><small class="text-muted">Rol: ${r.rol}</small>` : ''}
            </div>
            <span class="badge ${badgeClass}">${tipo}</span>
          </div>
        </a>
      </div>
    `;
  });

  html += '</div></div>';
  contenedor.innerHTML = html;
}

function mostrarSinResultados(termino) {
  const contenedor = document.getElementById('searchResults');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="card">
        <div class="card-body text-center py-4">
          <i class="fas fa-search fa-2x text-muted mb-3 d-block"></i>
          <p class="text-muted mb-0">No se encontraron resultados para "<strong>${termino}</strong>"</p>
          <small class="text-muted">Pruebe con otros términos o elimine filtros</small>
        </div>
      </div>
    `;
  }
}

function mostrarErrorBusqueda(mensaje) {
  const contenedor = document.getElementById('searchResults');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="card">
        <div class="card-body text-center py-3">
          <i class="fas fa-exclamation-triangle text-danger me-2"></i>
          <span class="text-danger">${mensaje}</span>
        </div>
      </div>
    `;
  }
}

// ========================================
//  INICIALIZACIÓN - CON CONTROL DE CONFLICTOS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOMContentLoaded - Script.js DOMINANTE');
  
  // Desactivar cualquier otro listener conflictivo
  const eventosConflictivos = ['input', 'keypress', 'click'];
  
  eventosConflictivos.forEach(evento => {
    const input = document.getElementById('globalSearch');
    const btn = document.getElementById('globalSearchBtn');
    
    if (input) {
      const nuevoInput = input.cloneNode(true);
      input.parentNode.replaceChild(nuevoInput, input);
    }
    
    if (btn) {
      const nuevoBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(nuevoBtn, btn);
    }
  });
  
  // Nuestra configuración limpia
  const searchInput = document.getElementById('globalSearch');
  const searchBtn = document.getElementById('globalSearchBtn');
  const searchFilter = document.getElementById('searchFilter');
  
  console.log(`🔍 Reconfigurando: Input: ${!!searchInput}, Botón: ${!!searchBtn}`);
  
  if (searchInput) {
    // Input: ABSOLUTAMENTE NADA al escribir
    searchInput.addEventListener('input', function() {
      const valor = this.value.trim();
      console.log('⌨️  Input (NO ACTION):', valor);
      
      if (valor.length === 0) {
        const contenedor = document.getElementById('searchResults');
        if (contenedor) {
          contenedor.style.display = 'none';
          contenedor.innerHTML = '';
        }
      }
    });
    
    // Enter: Nuestra búsqueda
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log('↵ Enter (nuestra búsqueda)');
        realizarBusqueda(this.value);
      }
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      console.log('🔘 Botón (nuestra búsqueda)');
      const valor = document.getElementById('globalSearch')?.value || '';
      realizarBusqueda(valor);
    });
  }
  
  if (searchFilter) {
    searchFilter.addEventListener('change', function() {
      console.log('🔄 Filtro cambiado:', this.value);
      const valor = document.getElementById('globalSearch')?.value || '';
      if (valor.length >= 2) {
        realizarBusqueda(valor);
      }
    });
  }
  
  console.log('🎯 Búsqueda global CONFIGURADA (script.js)');
});

