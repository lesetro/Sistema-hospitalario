window.loginModule = {
    init() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        function showError(field, message) {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        function resetErrors() {
            ['username', 'password'].forEach(field => {
                const errorElement = document.getElementById(`${field}Error`);
                if (errorElement) errorElement.style.display = 'none';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetErrors();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                if (!username) showError('username', 'Usuario requerido');
                if (!password) showError('password', 'Contraseña requerida');
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Validando...';

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.errors) {
                        Object.entries(data.errors).forEach(([field, message]) => {
                            if (message) showError(field, message);
                        });
                    } else {
                        showError('username', data.message || 'Error en el servidor');
                    }
                    return; // ⚠️ Importante: salimos si hay error
                }
            
                // ✅ Login exitoso, ahora sí cargamos la página nueva
                if (data.redirect) {
                    console.log('✅ Login correcto, redirigiendo a:', data.redirect);
                    const pageResponse = await fetch(data.redirect);
                    const html = await pageResponse.text();
            
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
            
                    document.querySelector('main').innerHTML = tempDiv.querySelector('main')?.innerHTML || tempDiv.innerHTML;
                    console.log('Contenido cargado:', mainContent.slice(0, 100));
                    const script = document.createElement('script');
                    script.src = '/usuario/registrar.js';
                    script.defer = true;
                    document.body.appendChild(script);
            
                    window.history.pushState(null, '', data.redirect);
                }
            } catch (error) {
                showError('username', 'Error de conexión con el servidor');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Ingresar';
            }
        });
    }
};
