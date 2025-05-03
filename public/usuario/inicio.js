
// Aquí iría el JavaScript para funcionalidades dinámicas
document.addEventListener('DOMContentLoaded', function() {
    // Ejemplo: Actualizar datos en tiempo real
    setInterval(updateStats, 30000);
    
    function updateStats() {
        // Simular actualización de datos
        console.log("Actualizando datos del sistema...");
        // Aquí iría la llamada a la API real
    }
    
    // Menu activo
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});