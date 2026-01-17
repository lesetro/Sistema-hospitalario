// Función para obtener el token almacenado
function getToken() {
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') || 
           getCookie('token');
}

// Función para guardar el token
function saveToken(token, remember = false) {
    if (remember) {
        localStorage.setItem('token', token);
    } else {
        sessionStorage.setItem('token', token);
    }
    
    document.cookie = `token=${token}; path=/; max-age=${remember ? 86400 * 30 : 86400}; SameSite=Lax`;
}

// Función para eliminar el token
function removeToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Helper para obtener cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Interceptor global para todas las peticiones fetch
const originalFetch = window.fetch;

window.fetch = async function(...args) {
    try {
        const [url, options = {}] = args;
        
        // Agregar token automáticamente a todas las peticiones
        const token = getToken();
        if (token) {
            options.headers = options.headers || {};
            if (!options.headers['Authorization']) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await originalFetch(url, options);
        
        // Solo manejamos errores 401 desde RUTAS PROTEGIDAS
        // NO desde /auth/ (eso lo maneja auth-handle.js)
        if (response.status === 401 && !url.includes('/auth/')) {
            try {
                const data = await response.clone().json();
                handleAuthenticationError(data);
            } catch (e) {
                handleAuthenticationError({
                    message: 'Sesión expirada',
                    redirectTo: '/auth/login',
                    reason: 'token_expired'
                });
            }
            return Promise.reject(new Error('Authentication required'));
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

// Función para manejar errores de autenticación (SOLO para sesiones expiradas)
function handleAuthenticationError(errorData) {
    console.log('❌ Error de autenticación detectado:', errorData);
    
    // Limpiar todo el almacenamiento de autenticación
    clearAllAuthData();
    
    // Mostrar mensaje al usuario
    const message = errorData.message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    showMessage(message, 'warning');
    
    // Preparar URL de redirección
    const redirectUrl = errorData.redirectTo || '/auth/login';
    const params = new URLSearchParams();
    
    if (errorData.reason) {
        params.append('reason', errorData.reason);
    }
    
    // Redirigir después de un breve retraso
    setTimeout(() => {
        const fullUrl = params.toString() ? 
            `${redirectUrl}?${params.toString()}` : 
            redirectUrl;
        window.location.href = fullUrl;
    }, 2000);
}

// Función para limpiar todos los datos de autenticación
function clearAllAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_data');
    localStorage.removeItem('refresh_token');
    
    sessionStorage.clear();
    
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
}

// Verificar autenticación al cargar la página
async function checkAuthentication() {
    const token = getToken();
    
    if (!token) {
        return;
    }
    
    const protectedRoutes = ['/admin', '/medico', '/enfermero', '/paciente'];
    const currentPath = window.location.pathname;
    
    const isProtectedRoute = protectedRoutes.some(route => 
        currentPath.startsWith(route)
    );
    
    if (!isProtectedRoute) {
        return;
    }
    
    try {
        const response = await originalFetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            const errorData = await response.json();
            handleAuthenticationError(errorData);
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
    }
}

// Función de logout
async function logout() {
    try {
        const token = getToken();
        
        if (token) {
            await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(err => console.log('Error en logout:', err));
        }
        
        clearAllAuthData();
        showMessage('Sesión cerrada correctamente', 'success');
        
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1000);
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        clearAllAuthData();
        window.location.href = '/auth/login';
    }
}

// Agregar evento a todos los enlaces de logout
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    const logoutLinks = document.querySelectorAll('a[href="/auth/logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    initializeGlobalSearch();
    initializeNotifications();
    initializeRefreshButton();
});

// ========================================
// 🔍 BÚSQUEDA GLOBAL
// ========================================

function initializeGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchBtn = document.getElementById('globalSearchBtn');
    const searchFilter = document.getElementById('searchFilter');
    const searchResults = document.getElementById('searchResults');

    if (searchBtn) {
        searchBtn.addEventListener('click', performGlobalSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });

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
    const searchTerm = document.getElementById('globalSearch').value;
    const filter = document.getElementById('searchFilter').value;

    if (!searchTerm || searchTerm.length < 2) {
        showMessage('La búsqueda debe tener al menos 2 caracteres', 'warning');
        return;
    }

    try {
        showLoading('Buscando...');
        
        const response = await fetch(`/api/search/global?search=${encodeURIComponent(searchTerm)}&filter=${filter}`);
        
        if (response.status === 401) {
            return;
        }
        
        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.resultados, searchTerm);
        } else {
            showMessage(data.message || 'Error en la búsqueda', 'error');
        }
    } catch (error) {
        if (error.message === 'Authentication required') {
            return;
        }
        
        console.error('Error en búsqueda global:', error);
        showMessage('Error al realizar la búsqueda', 'error');
    } finally {
        hideLoading();
    }
}

function displaySearchResults(resultados, searchTerm) {
    const container = document.getElementById('searchResults');
    let html = '<div class="card"><div class="card-body">';
    html += `<h6>Resultados para: "${searchTerm}"</h6>`;

    let hasResults = false;

    if (resultados.pacientes && resultados.pacientes.length > 0) {
        hasResults = true;
        html += '<div class="mb-3"><strong>Pacientes:</strong><ul class="list-unstyled">';
        resultados.pacientes.forEach(paciente => {
            html += `<li class="border-bottom py-1">
                <a href="/pacientes/${paciente.id}" class="text-decoration-none">
                    <i class="fas fa-user me-2"></i>
                    ${paciente.usuario.nombre} ${paciente.usuario.apellido} 
                    <small class="text-muted">(DNI: ${paciente.usuario.dni})</small>
                </a>
            </li>`;
        });
        html += '</ul></div>';
    }

    if (resultados.admisiones && resultados.admisiones.length > 0) {
        hasResults = true;
        html += '<div class="mb-3"><strong>Admisiones:</strong><ul class="list-unstyled">';
        resultados.admisiones.forEach(admision => {
            html += `<li class="border-bottom py-1">
                <a href="#" onclick="viewAdmission(${admision.id})" class="text-decoration-none">
                    <i class="fas fa-clipboard-list me-2"></i>
                    Admisión - ${admision.paciente.usuario.nombre} ${admision.paciente.usuario.apellido}
                    <small class="text-muted">(${new Date(admision.fecha).toLocaleDateString()})</small>
                </a>
            </li>`;
        });
        html += '</ul></div>';
    }

    if (!hasResults) {
        html += '<p class="text-muted">No se encontraron resultados.</p>';
    }

    html += '</div></div>';
    container.innerHTML = html;
    container.style.display = 'block';
}

function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
    }
}

// ========================================
//  NOTIFICACIONES
// ========================================

function initializeNotifications() {
    setInterval(refreshNotifications, 30000);
}

async function refreshNotifications() {
    try {
        const response = await fetch('/api/notifications');
        
        if (response.status === 401) {
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.notifications.length > 0) {
            updateNotificationDisplay(data.notifications);
        }
    } catch (error) {
        if (error.message === 'Authentication required') {
            return;
        }
        console.error('Error al actualizar notificaciones:', error);
    }
}

function updateNotificationDisplay(notifications) {
    const badge = document.querySelector('.notifications-section .badge');
    if (badge) {
        const unread = notifications.filter(n => !n.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline' : 'none';
    }
}

// ========================================
// UTILIDADES UI
// ========================================

function initializeRefreshButton() {
    const refreshBtn = document.getElementById('refreshAdmissions');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }
}

function showLoading(message = 'Cargando...') {
    const existing = document.getElementById('loadingIndicator');
    if (existing) {
        existing.remove();
    }

    const loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white p-3 rounded';
    loader.style.zIndex = '9999';
    loader.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(loader);
    
    setTimeout(() => {
        if (document.getElementById('loadingIndicator')) {
            loader.remove();
        }
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

    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}