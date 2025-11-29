
document.addEventListener('DOMContentLoaded', function() {
    initializeGlobalSearch();
    initializeAdmissionFilters();
    initializeNotifications();
    initializeRefreshButton();
});

// Búsqueda global
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
    const searchTerm = document.getElementById('globalSearch').value;
    const filter = document.getElementById('searchFilter').value;
    const resultsContainer = document.getElementById('searchResults');

    if (!searchTerm || searchTerm.length < 2) {
        showMessage('La búsqueda debe tener al menos 2 caracteres', 'warning');
        return;
    }

    try {
        showLoading('Buscando...');
        
        const response = await fetch(`/api/search/global?search=${encodeURIComponent(searchTerm)}&filter=${filter}`);
        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.resultados, searchTerm);
        } else {
            showMessage(data.message || 'Error en la búsqueda', 'error');
        }
    } catch (error) {
        console.error('Error en búsqueda global:', error);
        showMessage('Error al realizar la búsqueda', 'error');
    }
}

function displaySearchResults(resultados, searchTerm) {
    const container = document.getElementById('searchResults');
    let html = '<div class="card"><div class="card-body">';
    html += `<h6>Resultados para: "${searchTerm}"</h6>`;

    let hasResults = false;

    // Mostrar pacientes
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

    // Mostrar admisiones
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

    // Mostrar turnos
    if (resultados.turnos && resultados.turnos.length > 0) {
        hasResults = true;
        html += '<div class="mb-3"><strong>Turnos:</strong><ul class="list-unstyled">';
        resultados.turnos.forEach(turno => {
            html += `<li class="border-bottom py-1">
                <a href="/turnos/${turno.id}" class="text-decoration-none">
                    <i class="fas fa-calendar me-2"></i>
                    Turno - ${turno.paciente.usuario.nombre} ${turno.paciente.usuario.apellido}
                    <small class="text-muted">(${new Date(turno.fecha).toLocaleDateString()} ${turno.hora_inicio})</small>
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

// Filtros de admisiones
function initializeAdmissionFilters() {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const admissionSearch = document.getElementById('admissionSearch');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyAdmissionFilters);
    }

    if (admissionSearch) {
        let filterTimeout;
        admissionSearch.addEventListener('input', function() {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => {
                applyAdmissionFilters();
            }, 800);
        });
    }

    // Filtros de fecha y estado
    const filters = ['statusFilter', 'dateFrom', 'dateTo', 'typeFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', applyAdmissionFilters);
        }
    });
}

function applyAdmissionFilters() {
    const params = new URLSearchParams();
    
    const search = document.getElementById('admissionSearch')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    const type = document.getElementById('typeFilter')?.value;

    if (search) params.append('search', search);
    if (status) params.append('estado', status);
    if (dateFrom) params.append('fecha_desde', dateFrom);
    if (dateTo) params.append('fecha_hasta', dateTo);
    if (type) params.append('tipo', type);

    // Recargar la página con los filtros
    window.location.href = `/?${params.toString()}`;
}

// Notificaciones
function initializeNotifications() {
    // Auto-refresh de notificaciones cada 30 segundos
    setInterval(refreshNotifications, 30000);
}

async function refreshNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.success && data.notifications.length > 0) {
            updateNotificationDisplay(data.notifications);
        }
    } catch (error) {
        console.error('Error al actualizar notificaciones:', error);
    }
}

function updateNotificationDisplay(notifications) {
    // Actualizar contador de notificaciones
    const badge = document.querySelector('.notifications-section .badge');
    if (badge) {
        const unread = notifications.filter(n => !n.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline' : 'none';
    }
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

// Botón de actualizar
function initializeRefreshButton() {
    const refreshBtn = document.getElementById('refreshAdmissions');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }
}

// Funciones para admisiones
async function viewAdmission(admissionId) {
    try {
        showLoading('Cargando detalles...');
        
        const response = await fetch(`/api/admision/${admissionId}`);
        const data = await response.json();

        if (data.success) {
            displayAdmissionModal(data.admision);
        } else {
            showMessage(data.message || 'Error al cargar detalles', 'error');
        }
    } catch (error) {
        console.error('Error al ver admisión:', error);
        showMessage('Error al cargar los detalles de la admisión', 'error');
    }
}

function displayAdmissionModal(admision) {
    const modalBody = document.getElementById('admissionDetails');
    
    let html = `
        <div class="row">
            <div class="col-md-6">
                <h6>Datos del Paciente</h6>
                <p><strong>Nombre:</strong> ${admision.paciente.usuario.nombre} ${admision.paciente.usuario.apellido}</p>
                <p><strong>DNI:</strong> ${admision.paciente.usuario.dni}</p>
                <p><strong>Estado:</strong> <span class="badge bg-${admision.estado === 'Pendiente' ? 'warning' : admision.estado === 'Completada' ? 'success' : 'secondary'}">${admision.estado}</span></p>
            </div>
            <div class="col-md-6">
                <h6>Datos de la Admisión</h6>
                <p><strong>Fecha:</strong> ${new Date(admision.fecha).toLocaleDateString()}</p>
                <p><strong>Motivo:</strong> ${admision.motivo?.nombre || 'N/A'}</p>
                <p><strong>Forma de Ingreso:</strong> ${admision.forma_ingreso?.nombre || 'N/A'}</p>
            </div>
        </div>
    `;

    if (admision.medico) {
        html += `
            <div class="row mt-3">
                <div class="col-md-6">
                    <h6>Médico Asignado</h6>
                    <p><strong>Dr. ${admision.medico.usuario.nombre} ${admision.medico.usuario.apellido}</strong></p>
                </div>
                <div class="col-md-6">
                    <h6>Sector</h6>
                    <p>${admision.sector?.nombre || 'Sin asignar'}</p>
                </div>
            </div>
        `;
    }

    if (admision.turno) {
        html += `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Información del Turno</h6>
                    <p><strong>Fecha:</strong> ${new Date(admision.turno.fecha).toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> ${admision.turno.hora_inicio?.substring(0, 5)} - ${admision.turno.hora_fin?.substring(0, 5)}</p>
                    <p><strong>Tipo:</strong> ${admision.turno.tipoTurno?.nombre || 'N/A'}</p>
                </div>
            </div>
        `;
    }

    if (admision.internacion) {
        html += `
            <div class="row mt-3">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h6><i class="fas fa-bed me-2"></i>Paciente Internado</h6>
                        <p class="mb-0">Este paciente se encuentra actualmente internado.</p>
                    </div>
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = html;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('admissionModal'));
    modal.show();
}

function editAdmission(admissionId) {
    window.location.href = `/admisiones/editar/${admissionId}`;
}

async function completeAdmission(admissionId) {
    if (!confirm('¿Está seguro de marcar esta admisión como completada?')) {
        return;
    }

    try {
        const response = await fetch(`/admisiones/completar/${admissionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showMessage('Admisión marcada como completada', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showMessage(data.message || 'Error al completar admisión', 'error');
        }
    } catch (error) {
        console.error('Error al completar admisión:', error);
        showMessage('Error al completar la admisión', 'error');
    }
}

// Utilidades
function showLoading(message = 'Cargando...') {
    // Crear o mostrar indicador de carga
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
    
    // Auto-remover después de 10 segundos
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
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}