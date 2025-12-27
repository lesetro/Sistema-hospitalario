document.addEventListener('DOMContentLoaded', function() {
    initializeGlobalSearch();
    initializeNotifications();
    loadInitialData();
});

// ============================================================================
// BÚSQUEDA GLOBAL
// ============================================================================

function initializeGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchBtn = document.getElementById('globalSearchBtn');
    const searchFilter = document.getElementById('searchFilter');

    if (searchBtn) {
        searchBtn.addEventListener('click', performGlobalSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });

        // Búsqueda en tiempo real con debounce
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2) {
                    performGlobalSearch();
                } else {
                    hideSearchResults();
                }
            }, 500);
        });
    }
}

async function performGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchFilter = document.getElementById('searchFilter');
    const resultsContainer = document.getElementById('searchResults');

    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    const filter = searchFilter ? searchFilter.value : 'all';

    if (!searchTerm || searchTerm.length < 2) {
        showMessage('La búsqueda debe tener al menos 2 caracteres', 'warning');
        return;
    }

    try {
        showLoading('Buscando...');
        
        const response = await fetch(`/api/search/global?search=${encodeURIComponent(searchTerm)}&filter=${filter}`);
        const data = await response.json();

        hideLoading();

        if (data.success) {
            displaySearchResults(data.resultados, searchTerm);
        } else {
            showMessage(data.message || 'Error en la búsqueda', 'error');
        }
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        hideLoading();
        showMessage('Error al realizar la búsqueda', 'error');
    }
}

function displaySearchResults(resultados, searchTerm) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    let html = '<div class="card"><div class="card-body">';
    html += `<h6 class="mb-3"><i class="fas fa-search me-2"></i>Resultados para: "<strong>${searchTerm}</strong>"</h6>`;

    let hasResults = false;

    // Mostrar pacientes
    if (resultados.pacientes && resultados.pacientes.length > 0) {
        hasResults = true;
        html += '<div class="mb-3">';
        html += '<h6 class="text-primary"><i class="fas fa-users me-2"></i>Pacientes:</h6>';
        html += '<ul class="list-unstyled">';
        resultados.pacientes.forEach(paciente => {
            if (paciente.usuario) {
                html += `<li class="border-bottom py-2">
                    <a href="/pacientes/${paciente.id}" class="text-decoration-none">
                        <i class="fas fa-user me-2 text-primary"></i>
                        <strong>${paciente.usuario.nombre} ${paciente.usuario.apellido}</strong>
                        <small class="text-muted ms-2">(DNI: ${paciente.usuario.dni})</small>
                    </a>
                </li>`;
            }
        });
        html += '</ul></div>';
    }

    // Mostrar admisiones
    if (resultados.admisiones && resultados.admisiones.length > 0) {
        hasResults = true;
        html += '<div class="mb-3">';
        html += '<h6 class="text-info"><i class="fas fa-clipboard-list me-2"></i>Admisiones:</h6>';
        html += '<ul class="list-unstyled">';
        resultados.admisiones.forEach(admision => {
            if (admision.paciente && admision.paciente.usuario) {
                html += `<li class="border-bottom py-2">
                    <a href="/admisiones/${admision.id}" class="text-decoration-none">
                        <i class="fas fa-clipboard-list me-2 text-info"></i>
                        Admisión - <strong>${admision.paciente.usuario.nombre} ${admision.paciente.usuario.apellido}</strong>
                        <small class="text-muted ms-2">(${new Date(admision.fecha).toLocaleDateString()})</small>
                    </a>
                </li>`;
            }
        });
        html += '</ul></div>';
    }

    // Mostrar turnos
    if (resultados.turnos && resultados.turnos.length > 0) {
        hasResults = true;
        html += '<div class="mb-3">';
        html += '<h6 class="text-warning"><i class="fas fa-calendar me-2"></i>Turnos:</h6>';
        html += '<ul class="list-unstyled">';
        resultados.turnos.forEach(turno => {
            if (turno.paciente && turno.paciente.usuario) {
                html += `<li class="border-bottom py-2">
                    <a href="/turnos/${turno.id}" class="text-decoration-none">
                        <i class="fas fa-calendar me-2 text-warning"></i>
                        Turno - <strong>${turno.paciente.usuario.nombre} ${turno.paciente.usuario.apellido}</strong>
                        <small class="text-muted ms-2">(${new Date(turno.fecha).toLocaleDateString()} ${turno.hora_inicio || ''})</small>
                    </a>
                </li>`;
            }
        });
        html += '</ul></div>';
    }

    if (!hasResults) {
        html += '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No se encontraron resultados.</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
    container.style.display = 'block';
}

function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================





async function refreshNotifications() {
    try {
        const response = await fetch('/api/notifications?unreadOnly=true');
        const data = await response.json();
        
        if (data.success) {
            updateNotificationBadge(data.unreadCount || 0);
            
            // Si hay nuevas notificaciones, mostrar toast
            if (data.unreadCount > 0 && data.notificaciones.length > 0) {
                const lastNotif = data.notificaciones[0];
                if (isNewNotification(lastNotif)) {
                    showNotificationToast(lastNotif);
                }
            }
        }
    } catch (error) {
        console.error('Error al actualizar notificaciones:', error);
    }
}

function updateNotificationBadge(count) {
    const badges = document.querySelectorAll('.notifications-section .badge, .notification-badge');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

function isNewNotification(notification) {
    // Verificar si la notificación es de los últimos 5 minutos
    const notifTime = new Date(notification.created_at);
    const now = new Date();
    const diffMinutes = (now - notifTime) / 1000 / 60;
    return diffMinutes < 5;
}

function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-primary text-white">
                <i class="fas fa-bell me-2"></i>
                <strong class="me-auto">Nueva Notificación</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${notification.mensaje}
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notification/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success) {
            // Ocultar la notificación
            const alertElement = event.target.closest('.alert');
            if (alertElement) {
                alertElement.style.display = 'none';
            }
            
           
        }
    } catch (error) {
        console.error('Error al marcar notificación:', error);
    }
}

// ============================================================================
// CARGA DE DATOS INICIALES
// ============================================================================

function loadInitialData() {
   
    
    // Inicializar tooltips de Bootstrap si existen
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// ============================================================================
// UTILIDADES
// ============================================================================

function showLoading(message = 'Cargando...') {
    // Remover loading existente
    hideLoading();

    const loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white p-3 rounded shadow';
    loader.style.zIndex = '9999';
    loader.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(loader);
    
    // Auto-remover después de 10 segundos por seguridad
    setTimeout(() => {
        hideLoading();
    }, 10000);
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.remove();
    }
}

function showMessage(message, type = 'info') {
    hideLoading();
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const iconClass = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';

    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed shadow-lg`;
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// ============================================================================
// FUNCIONES GLOBALES (para ser llamadas desde la vista)
// ============================================================================

// Hacer estas funciones disponibles globalmente
window.markNotificationAsRead = markNotificationAsRead;
window.showMessage = showMessage;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

console.log(' Dashboard admin JS cargado correctamente');