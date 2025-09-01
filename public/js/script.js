document.addEventListener('DOMContentLoaded', () => {
  // Variables globales
let tiempoEsperaBusqueda; // Para el debounce

// Función principal de búsqueda
function busquedaGlobal(valorBusqueda) {
  // Limpiar el temporizador anterior para evitar múltiples peticiones
  clearTimeout(tiempoEsperaBusqueda);
  
  const contenedorResultados = document.getElementById('resultado-busqueda');
  
  // Si no existe el contenedor de resultados, salir
  if (!contenedorResultados) return;

  // Ocultar resultados si la búsqueda está vacía o es muy corta
  if (valorBusqueda.length < 2) {
    contenedorResultados.style.display = 'none';
    return;
  }

  // Mostrar mensaje de carga mientras se buscan resultados
  contenedorResultados.innerHTML = '<div class="dropdown-item text-muted">Buscando usuarios...</div>';
  contenedorResultados.style.display = 'block';

  // Configurar temporizador para esperar antes de hacer la petición (debounce)
  tiempoEsperaBusqueda = setTimeout(async () => {
    try {
      // Hacer petición al servidor
      const respuesta = await fetch(`/api/usuarios?busqueda=${encodeURIComponent(valorBusqueda)}`);
      
      // Verificar si la respuesta es correcta
      if (!respuesta.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      // Convertir respuesta a JSON
      const usuariosEncontrados = await respuesta.json();
      
      // Mostrar los resultados
      mostrarResultadosBusqueda(usuariosEncontrados);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      mostrarErrorBusqueda('Ocurrió un error al realizar la búsqueda');
    }
  }, 300); // Esperar 300ms después de la última tecla
}

// Función para mostrar los resultados de la búsqueda
function mostrarResultadosBusqueda(usuarios) {
  const contenedorResultados = document.getElementById('resultado-busqueda');
  
  // Si no hay contenedor, salir
  if (!contenedorResultados) return;

  // Si no hay resultados, mostrar mensaje
  if (usuarios.length === 0) {
    contenedorResultados.innerHTML = '<div class="dropdown-item">No se encontraron usuarios</div>';
    return;
  }

  // Limpiar resultados anteriores
  contenedorResultados.innerHTML = '';

  // Crear elementos para cada usuario encontrado
  usuarios.forEach(usuario => {
    const elementoUsuario = document.createElement('a');
    elementoUsuario.href = '#'; // Podrías usar una URL real como `/usuarios/${usuario.id}`
    elementoUsuario.className = 'dropdown-item d-flex justify-content-between align-items-center';
    
    // HTML para mostrar la información del usuario
    elementoUsuario.innerHTML = `
      <div>
        <strong>${usuario.nombre}</strong>
        <div class="text-muted small">DNI: ${usuario.dni}</div>
        <div class="text-muted small">Rol: ${usuario.rol}</div>
      </div>
      <i class="fas fa-chevron-right"></i>
    `;
    
    // Evento al hacer clic en un usuario
    elementoUsuario.addEventListener('click', (evento) => {
      evento.preventDefault();
      seleccionarUsuario(usuario.id);
    });

    contenedorResultados.appendChild(elementoUsuario);
  });
}

// Función para mostrar errores
function mostrarErrorBusqueda(mensaje) {
  const contenedorResultados = document.getElementById('resultado-busqueda');
  if (contenedorResultados) {
    contenedorResultados.innerHTML = `<div class="dropdown-item text-danger">${mensaje}</div>`;
  }
}

// Función al seleccionar un usuario
function seleccionarUsuario(idUsuario) {
  console.log('Usuario seleccionado:', idUsuario);
  // Aquí puedes:
  // 1. Redirigir a la página del usuario
  // 2. Mostrar un modal con su información
  // 3. Cargar sus datos en un formulario
  
  // Ejemplo básico:
  // window.location.href = `/usuarios/${idUsuario}`;
  
  // Ocultar resultados después de seleccionar
  const contenedorResultados = document.getElementById('resultado-busqueda');
  if (contenedorResultados) {
    contenedorResultados.style.display = 'none';
  }
}

// Cerrar resultados al hacer clic fuera del buscador
document.addEventListener('click', (evento) => {
  if (!evento.target.closest('.search-bar')) {
    const contenedorResultados = document.getElementById('resultado-busqueda');
    if (contenedorResultados) {
      contenedorResultados.style.display = 'none';
    }
  }
});

  // Validación genérica para formularios (excepto admisiones)
  const forms = document.querySelectorAll('form:not(#nuevoPacienteForm, #nuevaAdmisionForm, #editarAdmisionForm)');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        form.submit();
      } catch (error) {
        console.error('Error al enviar el formulario:', error);
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = 'Error al enviar el formulario. Por favor, intenta de nuevo.';
        form.prepend(alert);
      } finally {
        if (submitBtn) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
      }
    });
  });

  // Tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

  // Alternar login/logout
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  const isAuthenticated = false; // Cambiar según lógica de autenticación
  if (isAuthenticated && loginLink && logoutLink) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'block';
  }

  // Toggle sidebar
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('show');
    }
  }

  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleSidebar);
  }

  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (
      window.innerWidth <= 768 &&
      sidebar &&
      sidebar.classList.contains('show') &&
      !sidebar.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      sidebar.classList.remove('show');
    }
  });
});