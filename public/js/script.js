document.addEventListener('DOMContentLoaded', () => {
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