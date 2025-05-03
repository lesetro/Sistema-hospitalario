document.addEventListener('DOMContentLoaded', () => {
    // Configuración de rutas
    const rutas = {
        '/usuario/inicio': {
            js: '/usuario/inicio.js',
            css: '/css/inicio.css'
        },
        '/usuario/usuario': {
            js: '/usuario/usuario.js',
            css: '/css/usuario.css'
        },
        '/usuario/registrar': {
            js: '/usuario/registrar.js',
            css: '/css/registrar.css'
        },
        '/': {
            js: '/index/index.js',
            css: '/css/index.css'
        }
    };

    // Elementos cargados para evitar duplicados
    const recursosCargados = {
        js: new Set(),
        css: new Set()
    };

    // Cargar un recurso CSS
    function cargarCSS(href) {
        if (!recursosCargados.css.has(href)) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = reject;
                document.head.appendChild(link);
                recursosCargados.css.add(href);
            });
        }
        return Promise.resolve();
    }

    // Cargar un recurso JS
    function cargarJS(src) {
        if (!recursosCargados.js.has(src)) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
                recursosCargados.js.add(src);
            });
        }
        return Promise.resolve();
    }

    // Limpiar el contenido del main
    function limpiarContenido() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = '';
        }
    }

    // Cargar una página completa
    async function cargarPagina(ruta) {
        try {
            // Verificar si la ruta existe en la configuración
            if (!rutas[ruta]) {
                console.error(`Ruta no configurada: ${ruta}`);
                return;
            }

            // Limpiar contenido actual
            limpiarContenido();

            // Cargar el HTML
            const response = await fetch(ruta);
            if (!response.ok) throw new Error('Error al cargar la página');
            
            const html = await response.text();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Insertar el contenido en el main
            const main = document.querySelector('main');
            const contenido = tempDiv.querySelector('main')?.innerHTML || tempDiv.innerHTML;
            main.innerHTML = contenido;

            // Cargar recursos CSS y JS en paralelo
            await Promise.all([
                rutas[ruta].css ? cargarCSS(rutas[ruta].css) : Promise.resolve(),
                rutas[ruta].js ? cargarJS(rutas[ruta].js) : Promise.resolve()
            ]);

            // Actualizar el historial
            window.history.pushState({ ruta }, '', ruta);

            console.log(`Página cargada: ${ruta}`);
        } catch (err) {
            console.error('Error al cargar la página:', err);
            // Puedes cargar una página de error aquí si lo deseas
        }
    }

    // Manejador de clics para enlaces SPA
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-spa]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            cargarPagina(href);
        }
    });

    // Manejador para el botón de retroceso/avance
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.ruta) {
            cargarPagina(e.state.ruta);
        } else {
            cargarPagina(location.pathname);
        }
    });

    // Cargar la página inicial
    const rutaInicial = location.pathname;
    cargarPagina(rutaInicial);
});