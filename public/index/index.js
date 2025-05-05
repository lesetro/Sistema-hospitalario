// En tu archivo principal (index.js o similar)
document.body.addEventListener('click', async (e) => {
    const link = e.target.closest('a[data-spa]');
    if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');

        try {
            const response = await fetch(href);
            const html = await response.text();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            
            document.querySelector('main').innerHTML = tempDiv.querySelector('main')?.innerHTML || tempDiv.innerHTML;

            // cargo el script de login.js
            const script = document.createElement('script');
            script.src = '/usuario/login.js';
            script.defer = true;
            script.onload = () => {
                // Solo cuando el script haya sido cargado
                if (typeof window.loginModule?.init === 'function') {
                    window.loginModule.init();
                }
            };
            document.body.appendChild(script);

            // También setup del toggle
            setupRegisterToggle();

            window.history.pushState(null, '', href);
        } catch (err) {
            console.error('Error al cargar contenido:', err);
        }
    }
});

// Función para configurar el toggle de registro
function setupRegisterToggle() {
    const showRegisterLink = document.getElementById('showRegister');
    const registerOptions = document.getElementById('registerOptions');
    
    if (showRegisterLink && registerOptions) {
        // Configuración inicial
        registerOptions.style.display = 'none';
        registerOptions.style.transition = 'all 0.3s ease';
        
        // Remover listener antiguo si existe
        showRegisterLink.removeEventListener('click', handleRegisterClick);
        
        // Agregar nuevo listener
        showRegisterLink.addEventListener('click', handleRegisterClick);
    }
}

// Función manejadora del click
function handleRegisterClick(e) {
    e.preventDefault();
    const registerOptions = document.getElementById('registerOptions');
    
    if (registerOptions) {
        if (registerOptions.style.display === 'block') {
            registerOptions.style.opacity = '0';
            setTimeout(() => {
                registerOptions.style.display = 'none';
            }, 300);
        } else {
            registerOptions.style.display = 'block';
            setTimeout(() => {
                registerOptions.style.opacity = '1';
            }, 10);
        }
    }
}
