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

        // ✅ CORREGIDO: NO búsqueda automática, solo limpiar resultados
        searchInput.addEventListener('input', function() {
            const valor = this.value.trim();
            
            // Si tiene menos de 2 caracteres, limpiar resultados
            if (valor.length < 2) {
                hideSearchResults();
            }
            // ✅ IMPORTANTE: NO hacer búsqueda automática
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

    // ✅ CORREGIDO: Validación de 2 caracteres (sin mostrar mensaje)
    if (!searchTerm || searchTerm.length < 2) {
        hideSearchResults();
        return;
    }

    console.log('🔍 Búsqueda MANUAL ejecutada:', searchTerm);

    try {
        showLoading('Buscando...');
        
        const response = await fetch(`/api/search/global?search=${encodeURIComponent(searchTerm)}&filter=${filter}`);
        const data = await response.json();

        hideLoading();

        if (data.success) {
            displaySearchResults(data.resultados, searchTerm);
        } else {
            // ✅ CORREGIDO: Mostrar mensaje solo si es error real
            showMessage(data.message || 'Error en la búsqueda', 'error');
        }
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        hideLoading();
        // ✅ NO mostrar mensaje automático de error
    }
}

function displaySearchResults(resultados, searchTerm) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    // ✅ CORREGIDO: Verificar estructura de resultados
    console.log('📊 Estructura de resultados:', resultados);

    // Si resultados es un array (nuevo formato)
    if (Array.isArray(resultados)) {
        if (resultados.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-body text-center py-4">
                        <i class="fas fa-search fa-2x text-muted mb-3 d-block"></i>
                        <p class="text-muted mb-0">No se encontraron resultados para "<strong>${searchTerm}</strong>"</p>
                    </div>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        // Mostrar resultados como array
        let html = '<div class="card"><div class="card-body">';
        html += `<h6 class="mb-3"><i class="fas fa-check-circle text-success me-2"></i>${resultados.length} resultado(s) para "<strong>${searchTerm}</strong>"</h6>`;

        resultados.forEach(r => {
            const nombre = r.nombre || 'Sin nombre';
            const dni = r.dni || 'N/A';
            const tipo = r.tipo || 'usuario';
            const id = r.tipo_id || r.id || '';

            let url = '#';
            let badgeClass = 'bg-secondary';
            
            switch(tipo) {
                case 'paciente':
                    url = `/pacientes/${id}`;
                    badgeClass = 'bg-primary';
                    break;
                case 'medico':
                    url = `/personal/medicos/${id}`;
                    badgeClass = 'bg-success';
                    break;
                case 'enfermero':
                    url = `/personal/enfermeros/${id}`;
                    badgeClass = 'bg-info';
                    break;
                case 'administrativo':
                    url = `/personal/administrativos/${id}`;
                    badgeClass = 'bg-warning text-dark';
                    break;
                default:
                    url = `/usuarios/${r.id}`;
            }

            html += `
                <div class="border-bottom py-2 mb-2">
                    <a href="${url}" class="text-decoration-none text-dark">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${nombre}</strong>
                                <br>
                                <small class="text-muted">DNI: ${dni}</small>
                                ${r.email ? `<br><small class="text-muted">Email: ${r.email}</small>` : ''}
                                ${r.rol ? `<br><small class="text-muted">Rol: ${r.rol}</small>` : ''}
                            </div>
                            <span class="badge ${badgeClass}">${tipo}</span>
                        </div>
                    </a>
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
        container.style.display = 'block';
        return;
    }

    // Si resultados es un objeto (formato antiguo - mantener compatibilidad)
    let html = '<div class="card"><div class="card-body">';
    html += `<h6 class="mb-3"><i class="fas fa-search me-2"></i>Resultados para: "<strong>${searchTerm}</strong>"</h6>`;

    let hasResults = false;

    // Mostrar pacientes (formato antiguo)
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