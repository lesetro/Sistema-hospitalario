document.addEventListener('DOMContentLoaded', () => {
  // Validación de formularios
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
      }

      // Agregar estado de carga al botón
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        // Simular envío (reemplazar con llamada real al servidor)
        await new Promise(resolve => setTimeout(resolve, 1000));
        form.submit();
      } catch (error) {
        console.error('Error al enviar el formulario:', error);
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = 'Error al enviar el formulario. Por favor, intenta de nuevo.';
        form.prepend(alert);
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  });

  // Tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

  // Alternar login/logout
  const loginLink = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  // Reemplazar con verificación real de autenticación
  const isAuthenticated = false; // Mock
  if (isAuthenticated) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'block';
  }
});