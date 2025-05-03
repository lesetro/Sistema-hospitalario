
document.addEventListener('DOMContentLoaded', () => {
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

                // Solo extrae el contenido del main si es necesario
                const contenido = tempDiv.querySelector('main')?.innerHTML || tempDiv.innerHTML;

                document.querySelector('main').innerHTML = contenido;
                window.history.pushState(null, '', href);
            } catch (err) {
                console.error('Error al cargar contenido:', err);
            }
        }
    });

    // Soporte para navegación con botones del navegador
    window.addEventListener('popstate', () => {
        location.reload(); // simple recarga en navegación hacia atrás
    });
});