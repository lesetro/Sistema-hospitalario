document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const mensaje = document.getElementById('mensaje');
  
    // Ejemplo de validación (ficticia)
    if (usuario === 'admin' && contrasena === '1234') {
      mensaje.textContent = 'Ingreso exitoso 🎉';
      mensaje.style.color = 'green';
      // Redireccionar o continuar
    } else {
      mensaje.textContent = 'Usuario o contraseña incorrectos ❌';
      mensaje.style.color = 'red';
    }
  });
  