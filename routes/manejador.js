// Maneja clicks en enlaces SPA
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-spa]');
    if (link) {
        e.preventDefault();
        const viewName = link.getAttribute('href').replace('.html', '');
        loadView(viewName);
        
        // Actualiza la URL sin recargar
        history.pushState({ view: viewName }, '', link.href);
    }
});

// Maneja el botón atrás/adelante
window.addEventListener('popstate', (e) => {
    if (e.state?.view) {
        loadView(e.state.view);
    } else {
        loadView('inicio');
    }
});