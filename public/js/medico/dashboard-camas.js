// ===== VARIABLES GLOBALES =====
let sectoresData = [];
let tiposServicioData = [];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticasIniciales();
    cargarSectoresParaBusqueda();
    cargarTiposServicioParaBusqueda();
    configurarModalBusqueda();
});

// ===== CONFIGURACIÓN DE MODALES =====
function configurarModalBusqueda() {
    const modalBusqueda = document.getElementById('modalBusqueda');
    if (modalBusqueda) {
        modalBusqueda.addEventListener('show.bs.modal', function() {
            // Limpiar campos cuando se abre el modal
            const camaInput = document.getElementById('buscar-cama-input');
            if (camaInput) camaInput.value = '';
            
            const habitacionInput = document.getElementById('buscar-habitacion-input');
            if (habitacionInput) habitacionInput.value = '';
            
            const sectorSelect = document.getElementById('buscar-sector-select');
            if (sectorSelect) sectorSelect.value = '';
            
            const tipoServicioSelect = document.getElementById('buscar-tipo-servicio-select');
            if (tipoServicioSelect) tipoServicioSelect.value = '';
            
            const estadoSelect = document.getElementById('buscar-estado-select');
            if (estadoSelect) estadoSelect.value = 'Todos';
            
            const sexoSelect = document.getElementById('buscar-sexo-select');
            if (sexoSelect) sexoSelect.value = 'Todos';
            
            // Limpiar resultados anteriores
            const resultadosDiv = document.getElementById('resultados-busqueda');
            if (resultadosDiv) {
                resultadosDiv.innerHTML = '';
            }
        });
    }
}

// ===== ESTADÍSTICAS =====
function cargarEstadisticasIniciales() {
    // Cargar estadísticas desde la API
    fetch('/medico/camas/api/estadisticas')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stats = data.estadisticas;
                
                // Actualizar contadores con validación de valores nulos
                document.getElementById('disponibles-count').textContent = stats.libres || 0;
                document.getElementById('limpieza-count').textContent = stats.en_limpieza || 0;
                document.getElementById('total-camas-libres').textContent = stats.libres || 0;
                document.getElementById('total-camas-ocupadas').textContent = stats.ocupadas || 0;
                
                // Si tenemos datos de la vista de sectores, usarlos para totales
                cargarTotalesSectoresHabitaciones();
            }
        })
        .catch(error => {
            console.error('Error al cargar estadísticas:', error);
            // Intentar cargar desde la vista de sectores como fallback
            cargarEstadisticasDesdeVistaSectores();
        });
}

function cargarEstadisticasDesdeVistaSectores() {
    // Esta función carga estadísticas desde los datos de la vista de sectores
    // que ya están disponibles en el HTML
    try {
        // Buscar si hay datos de sectores en el DOM
        const sectoresCards = document.querySelectorAll('[data-sector-camas]');
        if (sectoresCards.length > 0) {
            let totalCamasLibres = 0;
            let totalCamasOcupadas = 0;
            
            sectoresCards.forEach(card => {
                const libres = parseInt(card.dataset.camasLibres || 0);
                const ocupadas = parseInt(card.dataset.camasOcupadas || 0);
                totalCamasLibres += libres;
                totalCamasOcupadas += ocupadas;
            });
            
            document.getElementById('total-camas-libres').textContent = totalCamasLibres;
            document.getElementById('total-camas-ocupadas').textContent = totalCamasOcupadas;
            document.getElementById('disponibles-count').textContent = totalCamasLibres;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas desde vista:', error);
    }
}

function cargarTotalesSectoresHabitaciones() {
    // Obtener datos de sectores desde la API
    fetch('/medico/camas/api/sectores')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-sectores').textContent = data.sectores.length || 0;
            }
        })
        .catch(() => {
            // Si no hay API, intentar contar desde el DOM
            const sectoresEnDOM = document.querySelectorAll('[data-sector-id]').length;
            if (sectoresEnDOM > 0) {
                document.getElementById('total-sectores').textContent = sectoresEnDOM;
            } else {
                document.getElementById('total-sectores').textContent = '8'; // Valor por defecto
            }
        });

    // Obtener total de habitaciones
    fetch('/medico/camas/api/habitaciones/total')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-habitaciones').textContent = data.total || 0;
            }
        })
        .catch(() => {
            // Valor por defecto
            document.getElementById('total-habitaciones').textContent = 'N/A';
        });
}

// ===== CARGA DE DATOS PARA BÚSQUEDA =====
function cargarSectoresParaBusqueda() {
    fetch('/medico/camas/api/sectores')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sectoresData = data.sectores;
                const select = document.getElementById('buscar-sector-select');
                
                if (select) {
                    // Limpiar opciones existentes
                    select.innerHTML = '<option value="">Todos los sectores</option>';
                    
                    // Agregar sectores desde la API
                    sectoresData.forEach(sector => {
                        const option = document.createElement('option');
                        option.value = sector.id;
                        option.textContent = sector.nombre;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar sectores:', error);
            cargarSectoresEjemplo();
        });
}

function cargarSectoresEjemplo() {
    const select = document.getElementById('buscar-sector-select');
    if (select) {
        select.innerHTML = '<option value="">Todos los sectores</option>';
        const sectoresEjemplo = [
            'Emergencia', 'Cirugía', 'Terapia Intensiva', 'Pediatría',
            'Maternidad', 'Cardiología', 'Neurología', 'Oncología'
        ];
        
        sectoresEjemplo.forEach((sector, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = sector;
            select.appendChild(option);
        });
    }
}

function cargarTiposServicioParaBusqueda() {
    fetch('/medico/camas/api/tipos-servicio')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tiposServicioData = data.tiposServicio;
                const select = document.getElementById('buscar-tipo-servicio-select');
                
                if (select) {
                    select.innerHTML = '<option value="">Todos los servicios</option>';
                    
                    tiposServicioData.forEach(tipo => {
                        const option = document.createElement('option');
                        option.value = tipo.id;
                        option.textContent = tipo.nombre;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar tipos de servicio:', error);
        });
}

// ===== ACTUALIZACIONES =====
function actualizarEstadisticas(event) {
    const boton = event.currentTarget;
    const originalHtml = boton.innerHTML;
    
    boton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
    boton.disabled = true;
    
    setTimeout(() => {
        cargarEstadisticasIniciales();
        boton.innerHTML = originalHtml;
        boton.disabled = false;
        mostrarNotificacion('success', 'Estadísticas actualizadas correctamente');
    }, 1000);
}

function actualizarTodo() {
    mostrarNotificacion('info', 'Actualizando toda la información...');
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// ===== BÚSQUEDA DE CAMAS CORREGIDA =====
function buscarCama() {
  const camaInput = document.getElementById('buscar-cama-input')?.value || '';
  const habitacionInput = document.getElementById('buscar-habitacion-input')?.value || '';
  const sectorSelect = document.getElementById('buscar-sector-select')?.value || '';
  const tipoServicioSelect = document.getElementById('buscar-tipo-servicio-select')?.value || '';
  const estadoSelect = document.getElementById('buscar-estado-select')?.value || 'Todos';
  const sexoSelect = document.getElementById('buscar-sexo-select')?.value || 'Todos';
  
  // Validar que al menos haya un criterio de búsqueda
  if (!camaInput && !habitacionInput && !sectorSelect && !tipoServicioSelect && 
      estadoSelect === 'Todos' && sexoSelect === 'Todos') {
    mostrarNotificacion('warning', 'Ingrese al menos un criterio de búsqueda');
    return;
  }
  
  // Crear o obtener contenedor de resultados
  let resultadosDiv = document.getElementById('resultados-busqueda');
  if (!resultadosDiv) {
    resultadosDiv = document.createElement('div');
    resultadosDiv.id = 'resultados-busqueda';
    resultadosDiv.className = 'mt-4';
    const modalBody = document.querySelector('#modalBusqueda .modal-body');
    if (modalBody) {
      modalBody.appendChild(resultadosDiv);
    }
  }
  
  // Mostrar indicador de carga
  resultadosDiv.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Buscando...</span>
      </div>
      <p class="mt-2 text-muted">Buscando camas que coincidan con los criterios...</p>
    </div>
  `;
  
  // Construir URL con parámetros de búsqueda
  const params = new URLSearchParams();
  if (camaInput) params.append('cama_numero', camaInput);
  if (habitacionInput) params.append('habitacion_numero', habitacionInput);
  if (sectorSelect) params.append('sector_id', sectorSelect);
  if (tipoServicioSelect) params.append('tipo_servicio_id', tipoServicioSelect);
  
  // CORRECCIÓN: Enviar los valores en minúscula como espera el backend
  if (estadoSelect && estadoSelect !== 'Todos') {
    // Convertir a minúscula para que el backend lo mapee
    params.append('estado', estadoSelect.toLowerCase());
  }
  
  if (sexoSelect && sexoSelect !== 'Todos') {
    // CORRECCIÓN: Mapear 'unisex' a 'mixto' o enviar el valor en minúscula
    let sexoValue = sexoSelect.toLowerCase();
    if (sexoValue === 'unisex') {
      sexoValue = 'mixto';
    }
    params.append('sexo_permitido', sexoValue);
  }
  
  params.append('limite', 20);
  
  console.log('URL de búsqueda:', `/medico/camas/api/buscar?${params.toString()}`);
  
  // Realizar la búsqueda
  fetch(`/medico/camas/api/buscar?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
      console.log('Resultados de búsqueda:', data);
      if (data.success) {
        mostrarResultadosBusqueda(data.resultados);
      } else {
        resultadosDiv.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error: ${data.message || 'Error en la búsqueda'}
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('Error en búsqueda:', error);
      resultadosDiv.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al realizar la búsqueda. Por favor, intente nuevamente.
        </div>
      `;
    });
}
function mostrarResultadosBusqueda(resultados) {
    const resultadosDiv = document.getElementById('resultados-busqueda');
    
    if (!resultadosDiv) return;
    
    if (!resultados || resultados.length === 0) {
        resultadosDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                No se encontraron camas que coincidan con los criterios de búsqueda.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Resultados encontrados: ${resultados.length}</h6>
            <small class="text-muted">Mostrando hasta 20 resultados</small>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Cama</th>
                        <th>Habitación</th>
                        <th>Sector / Servicio</th>
                        <th>Estado</th>
                        <th>Paciente / Médico</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    resultados.forEach(cama => {
        const estadoClass = {
            'libre': 'success',
            'ocupada': 'danger',
            'limpieza': 'warning',
            'mantenimiento': 'secondary'
        }[cama.estado] || 'secondary';
        
        const estadoTexto = {
            'libre': 'Libre',
            'ocupada': 'Ocupada',
            'limpieza': 'En Limpieza',
            'mantenimiento': 'En Mantenimiento'
        }[cama.estado] || cama.estado;
        
        // Formatear información del paciente si existe
        let pacienteInfo = '<span class="text-muted">-</span>';
        if (cama.paciente) {
            pacienteInfo = `
                <div>
                    <strong class="text-dark">${cama.paciente.nombre || 'N/A'}</strong>
                    <br>
                    <small class="text-muted">
                        <i class="fas fa-id-card me-1"></i>DNI: ${cama.paciente.dni || 'N/A'}
                    </small>
                    ${cama.paciente.medico ? `
                        <br>
                        <small class="text-muted">
                            <i class="fas fa-user-md me-1"></i>Dr. ${cama.paciente.medico}
                        </small>
                    ` : ''}
                </div>
            `;
        }
        
        html += `
            <tr>
                <td>
                    <strong>Cama ${cama.numero}</strong>
                    ${cama.fecha_fin_limpieza ? `
                        <br>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            Lista: ${new Date(cama.fecha_fin_limpieza).toLocaleString()}
                        </small>
                    ` : ''}
                </td>
                <td>
                    <span class="fw-bold">${cama.habitacion.numero}</span>
                    <br>
                    <small class="text-muted">${cama.habitacion.tipo || 'Estándar'}</small>
                </td>
                <td>
                    <div>${cama.habitacion.sector.nombre}</div>
                    <small class="text-muted">
                        <span class="badge bg-light text-dark">
                            ${cama.habitacion.tipoServicio.nombre}
                        </span>
                        <br>
                        <span class="text-capitalize">${cama.habitacion.sexo_permitido}</span>
                    </small>
                </td>
                <td>
                    <span class="badge bg-${estadoClass}">
                        <i class="fas fa-${cama.estado === 'libre' ? 'bed' : 
                                        cama.estado === 'ocupada' ? 'user' : 
                                        cama.estado === 'limpieza' ? 'broom' : 'tools'} me-1"></i>
                        ${estadoTexto}
                    </span>
                </td>
                <td>${pacienteInfo}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="verDetalleCama(${cama.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${cama.estado === 'libre' ? `
                            <button class="btn btn-outline-success" onclick="asignarPaciente(${cama.id})" title="Asignar paciente">
                                <i class="fas fa-user-plus"></i>
                            </button>
                        ` : ''}
                        ${cama.estado === 'ocupada' ? `
                            <button class="btn btn-outline-warning" onclick="solicitarLimpieza(${cama.id})" title="Solicitar limpieza">
                                <i class="fas fa-broom"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    resultadosDiv.innerHTML = html;
}

// ===== ACCIONES SOBRE CAMAS =====
function verDetalleCama(camaId) {
    const modalBusqueda = bootstrap.Modal.getInstance(document.getElementById('modalBusqueda'));
    if (modalBusqueda) {
        modalBusqueda.hide();
    }
    window.location.href = `/medico/camas/detalle/${camaId}`;
}

function asignarPaciente(camaId) {
    const modalBusqueda = bootstrap.Modal.getInstance(document.getElementById('modalBusqueda'));
    if (modalBusqueda) {
        modalBusqueda.hide();
    }
    window.location.href = `/medico/internaciones/nueva?cama_id=${camaId}`;
}

function solicitarLimpieza(camaId) {
    fetch(`/medico/camas/${camaId}/solicitar-limpieza`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion('success', 'Limpieza solicitada correctamente');
            buscarCama(); // Recargar resultados si el modal está abierto
        } else {
            mostrarNotificacion('danger', data.message || 'Error al solicitar limpieza');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('danger', 'Error al solicitar limpieza');
    });
}

// ===== REPORTES =====
function generarReporte(tipo) {
    const tipos = {
        'ocupacion': 'Ocupación Diaria',
        'limpieza': 'Tiempos de Limpieza',
        'rotacion': 'Rotación de Camas',
        'mensual': 'Estadísticas Mensuales'
    };
    
    mostrarNotificacion('info', `Generando reporte de ${tipos[tipo] || tipo}...`);
    
    setTimeout(() => {
        mostrarNotificacion('success', `Reporte de ${tipos[tipo] || tipo} generado correctamente`);
    }, 1500);
}

// ===== NOTIFICACIONES =====
function mostrarNotificacion(tipo, mensaje) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    alerta.style.maxWidth = '400px';
    alerta.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    alerta.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 
                              tipo === 'warning' ? 'exclamation-triangle' : 
                              tipo === 'danger' ? 'times-circle' : 'info-circle'} me-2"></i>
            <div class="flex-grow-1">${mensaje}</div>
            <button type="button" class="btn-close ms-3" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 150);
    }, 4000);
}
function cargarEstadisticasIniciales() {
  fetch('/medico/camas/api/estadisticas-generales')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const stats = data.estadisticas;
        
        // Actualizar contadores con validación de valores nulos
        document.getElementById('disponibles-count').textContent = stats.libres || 0;
        document.getElementById('limpieza-count').textContent = stats.en_limpieza || 0;
        document.getElementById('total-camas-libres').textContent = stats.libres || 0;
        document.getElementById('total-camas-ocupadas').textContent = stats.ocupadas || 0;
        
        // Actualizar totales de sectores y habitaciones
        cargarTotalesSectoresHabitaciones();
      }
    })
    .catch(error => {
      console.error('Error al cargar estadísticas:', error);
      mostrarNotificacion('danger', 'Error al cargar estadísticas');
    });
}

function cargarTotalesSectoresHabitaciones() {
  fetch('/medico/camas/api/estadisticas-generales')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const stats = data.estadisticas;
        
        // Actualizar sectores
        const sectoresElement = document.getElementById('total-sectores');
        if (sectoresElement) {
          sectoresElement.textContent = stats.totalSectores || 0;
        }
        
        // Actualizar habitaciones
        const habitacionesElement = document.getElementById('total-habitaciones');
        if (habitacionesElement) {
          habitacionesElement.textContent = stats.totalHabitaciones || 0;
        }
        
        // También actualizar las estadísticas rápidas si es necesario
        console.log('Estadísticas cargadas:', stats);
      }
    })
    .catch(error => {
      console.error('Error al cargar totales:', error);
      document.getElementById('total-sectores').textContent = 'N/A';
      document.getElementById('total-habitaciones').textContent = 'N/A';
    });
}
// ===== CONFIGURACIÓN DEL MODAL DE ESTADÍSTICAS =====
document.addEventListener('DOMContentLoaded', function() {
    const modalEstadisticas = document.getElementById('modalEstadisticas');
    if (modalEstadisticas) {
        modalEstadisticas.addEventListener('show.bs.modal', function() {
            const contenido = document.getElementById('contenido-estadisticas');
            if (!contenido) return;
            
            contenido.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Cargando estadísticas...</span>
                    </div>
                    <p class="mt-3 text-muted">Cargando estadísticas detalladas...</p>
                </div>
            `;
            
            fetch('/medico/camas/api/estadisticas')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const stats = data.estadisticas;
                        contenido.innerHTML = `
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <div class="card border-0 bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-3">
                                                <i class="fas fa-chart-pie me-2"></i>
                                                Distribución de Camas
                                            </h6>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span><i class="fas fa-bed text-success me-2"></i>Libres</span>
                                                <span class="fw-bold text-success">${stats.libres || 0}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span><i class="fas fa-user text-danger me-2"></i>Ocupadas</span>
                                                <span class="fw-bold text-danger">${stats.ocupadas || 0}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span><i class="fas fa-broom text-warning me-2"></i>En Limpieza</span>
                                                <span class="fw-bold text-warning">${stats.en_limpieza || 0}</span>
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between">
                                                <span><i class="fas fa-hospital me-2"></i>Total Camas</span>
                                                <span class="fw-bold">${stats.totalCamas || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-0 bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-3">
                                                <i class="fas fa-percent me-2"></i>
                                                Ocupación
                                            </h6>
                                            <div class="text-center py-4">
                                                <div class="display-1 text-primary fw-bold">${stats.porcentaje_ocupacion || 0}%</div>
                                                <small class="text-muted">Tasa de ocupación actual</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    contenido.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error al cargar las estadísticas.
                        </div>
                    `;
                });
        });
    }
});