
class InternacionManager {
  constructor() {
    this.data = null;
    this.filtros = {
      sector: '',
      estado: '',
      tipo: ''
    };
    this.intervalId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.cargarDatos();
    this.iniciarActualizacionAutomatica();
  }

  setupEventListeners() {
    // Botón refresh
    document.getElementById('btnRefresh').addEventListener('click', () => {
      this.cargarDatos(true);
    });

    // Botón nueva habitación
    document.getElementById('btnNuevaHabitacion').addEventListener('click', () => {
      this.mostrarModalNuevaHabitacion();
    });

    // Filtros
    document.getElementById('filtroSector').addEventListener('input', (e) => {
      this.filtros.sector = e.target.value.toLowerCase();
      this.aplicarFiltros();
    });

    document.getElementById('filtroEstado').addEventListener('change', (e) => {
      this.filtros.estado = e.target.value;
      this.aplicarFiltros();
    });

    document.getElementById('filtroTipo').addEventListener('change', (e) => {
      this.filtros.tipo = e.target.value;
      this.aplicarFiltros();
    });

    // Form nueva habitación
    document.getElementById('formNuevaHabitacion').addEventListener('submit', (e) => {
      e.preventDefault();
      this.crearHabitacion();
    });

    // Confirmación finalizar limpieza
    document.getElementById('btnConfirmarFinalizarLimpieza').addEventListener('click', () => {
      this.finalizarLimpieza();
    });
  }

  async cargarDatos(manual = false) {
    try {
      if (manual) {
        document.getElementById('btnRefresh').classList.add('actualizando');
      }

      this.mostrarLoading();

      const response = await fetch('/internacion/api/dashboard');
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }

      this.data = await response.json();
      this.renderizarDatos();
      this.ocultarLoading();

      if (manual) {
        this.mostrarNotificacion('Datos actualizados', 'success');
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.mostrarNotificacion('Error al cargar datos', 'error');
      this.ocultarLoading();
    } finally {
      if (manual) {
        document.getElementById('btnRefresh').classList.remove('actualizando');
      }
    }
  }

  renderizarDatos() {
    if (!this.data) return;

    this.renderizarEstadisticasGenerales();
    this.renderizarSectores();
    this.renderizarListaEspera();
  }

  renderizarEstadisticasGenerales() {
    const stats = this.data.estadisticasGenerales;
    
    document.getElementById('totalCamas').textContent = stats.totalCamas;
    document.getElementById('camasLibres').textContent = stats.camasLibres;
    document.getElementById('camasOcupadas').textContent = stats.camasOcupadas;
    document.getElementById('camasEnLimpieza').textContent = stats.camasEnLimpieza;
    document.getElementById('porcentajeOcupacion').textContent = `${stats.porcentajeOcupacion}%`;
    document.getElementById('totalSectores').textContent = stats.totalSectores;
  }

  renderizarSectores() {
    const container = document.getElementById('sectoresContainer');
    container.innerHTML = '';

    this.data.sectores.forEach(sector => {
      const sectorHtml = this.crearHtmlSector(sector);
      container.appendChild(sectorHtml);
    });
  }

  crearHtmlSector(sector) {
    const div = document.createElement('div');
    div.className = 'col-12 mb-4';
    div.dataset.sectorId = sector.id;
    div.dataset.sectorNombre = sector.nombre.toLowerCase();

    const ocupacionColor = this.getColorOcupacion(sector.estadisticas.porcentajeOcupacion);

    div.innerHTML = `
      <div class="card sector-card">
        <div class="sector-header" style="background: ${ocupacionColor};">
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">${sector.nombre}</h4>
            <div class="sector-stats">
              <div class="sector-stat">
                <div class="sector-stat-number">${sector.estadisticas.totalCamas}</div>
                <div class="sector-stat-label">Total</div>
              </div>
              <div class="sector-stat">
                <div class="sector-stat-number">${sector.estadisticas.camasLibres}</div>
                <div class="sector-stat-label">Libres</div>
              </div>
              <div class="sector-stat">
                <div class="sector-stat-number">${sector.estadisticas.camasOcupadas}</div>
                <div class="sector-stat-label">Ocupadas</div>
              </div>
              <div class="sector-stat">
                <div class="sector-stat-number">${sector.estadisticas.camasEnLimpieza}</div>
                <div class="sector-stat-label">Limpieza</div>
              </div>
              <div class="sector-stat">
                <div class="sector-stat-number">${sector.estadisticas.porcentajeOcupacion}%</div>
                <div class="sector-stat-label">Ocupación</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body">
          ${sector.habitaciones.length === 0 ? 
            `<div class="habitacion-sin-camas">
              <i class="bi bi-exclamation-triangle fs-2"></i>
              <p class="mb-0 mt-2">No hay habitaciones en este sector</p>
            </div>` :
            sector.habitaciones.map(habitacion => this.crearHtmlHabitacion(habitacion)).join('')
          }
        </div>
      </div>
    `;

    return div;
  }

  crearHtmlHabitacion(habitacion) {
    return `
      <div class="habitacion-row" data-habitacion-tipo="${habitacion.tipo}">
        <div class="habitacion-info">
          <span class="habitacion-numero">Habitación ${habitacion.numero}</span>
          <span class="habitacion-tipo">${habitacion.tipo}</span>
          <span class="habitacion-sexo">${habitacion.sexo_permitido}</span>
          <div class="habitacion-stats">
            <span><i class="bi bi-bed"></i> ${habitacion.estadisticas.totalCamas} camas</span>
            <span class="text-success"><i class="bi bi-check-circle"></i> ${habitacion.estadisticas.libres} libres</span>
            <span class="text-danger"><i class="bi bi-x-circle"></i> ${habitacion.estadisticas.ocupadas} ocupadas</span>
            ${habitacion.estadisticas.enLimpieza > 0 ? 
              `<span class="text-warning"><i class="bi bi-clock"></i> ${habitacion.estadisticas.enLimpieza} limpieza</span>` : ''
            }
          </div>
        </div>
        ${habitacion.camas.length === 0 ? 
          `<div class="alert alert-warning mt-2">
            <i class="bi bi-exclamation-triangle"></i> Esta habitación no tiene camas asignadas
            <button class="btn btn-sm btn-outline-primary ms-2" onclick="internacionManager.agregarCama(${habitacion.id})">
              <i class="bi bi-plus"></i> Agregar Cama
            </button>
          </div>` :
          `<div class="camas-grid">${habitacion.camas.map(cama => this.crearHtmlCama(cama)).join('')}</div>`
        }
      </div>
    `;
  }

  crearHtmlCama(cama) {
    const estadoClass = `cama-${cama.estado.toLowerCase()}`;
    let contenidoExtra = '';

    if (cama.estado === 'Ocupada' && cama.pacienteActual) {
      contenidoExtra = `
        <div class="cama-paciente">
          ${cama.pacienteActual.usuario.nombre} ${cama.pacienteActual.usuario.apellido}
          <br><small>DNI: ${cama.pacienteActual.usuario.dni}</small>
        </div>
      `;
    } else if (cama.estado === 'EnLimpieza') {
      contenidoExtra = `
        <div class="cama-tiempo">${cama.tiempoRestanteLimpieza}min</div>
        <button class="btn-finalizar" onclick="internacionManager.confirmarFinalizarLimpieza(${cama.id}, '${cama.numero}')" title="Finalizar limpieza">
          <i class="bi bi-check"></i>
        </button>
      `;
    }

    return `
      <div class="cama-card ${estadoClass}" data-cama-estado="${cama.estado}" onclick="internacionManager.mostrarDetalleCama(${cama.id})">
        <div class="cama-numero">Cama ${cama.numero}</div>
        <div class="cama-estado">${cama.estado}</div>
        ${contenidoExtra}
      </div>
    `;
  }

  renderizarListaEspera() {
    const container = document.getElementById('listaEsperaContent');
    const contador = document.getElementById('contadorEspera');
    
    contador.textContent = this.data.listasEspera.length;

    if (this.data.listasEspera.length === 0) {
      container.innerHTML = '<div class="p-3 text-center text-muted">No hay pacientes en espera</div>';
      return;
    }

    container.innerHTML = this.data.listasEspera.map(item => {
  // Convertir prioridad numérica a texto
  const prioridadTexto = item.prioridad === 1 ? 'ALTA' : item.prioridad === 2 ? 'MEDIA' : 'BAJA';
  const prioridadClass = item.prioridad === 1 ? 'alta' : item.prioridad === 2 ? 'media' : 'baja';
  
  return `
    <div class="list-group-item lista-espera-item prioridad-${prioridadClass}">
      <div class="paciente-info">Paciente ${item.paciente_id}</div>
      <div class="espera-tiempo">
        <i class="bi bi-clock"></i> ${this.calcularTiempoEspera(item.fecha_registro)}
      </div>
      <div class="mt-1">
        <span class="badge bg-${item.prioridad === 1 ? 'danger' : item.prioridad === 2 ? 'warning' : 'success'} text-white">
          ${prioridadTexto}
        </span>
        <small class="text-muted">${item.tipo}</small>
      </div>
    </div>
  `;
}).join('');
  }

  getColorOcupacion(porcentaje) {
    if (porcentaje >= 90) return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'; // Rojo
    if (porcentaje >= 70) return 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'; // Amarillo
    if (porcentaje >= 50) return 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)'; // Azul
    return 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'; // Verde
  }

  calcularTiempoEspera(fechaRegistro) {
    const ahora = new Date();
    const registro = new Date(fechaRegistro);
    const diferencia = ahora - registro;
    
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  aplicarFiltros() {
    const sectores = document.querySelectorAll('[data-sector-id]');
    
    sectores.forEach(sectorEl => {
      const nombreSector = sectorEl.dataset.sectorNombre;
      let mostrarSector = true;

      // Filtro por nombre de sector
      if (this.filtros.sector && !nombreSector.includes(this.filtros.sector)) {
        mostrarSector = false;
      }

      // Filtros por habitación
      const habitaciones = sectorEl.querySelectorAll('.habitacion-row');
      let habitacionesVisibles = 0;

      habitaciones.forEach(habitacionEl => {
        let mostrarHabitacion = true;

        // Filtro por tipo de habitación
        if (this.filtros.tipo && habitacionEl.dataset.habitacionTipo !== this.filtros.tipo) {
          mostrarHabitacion = false;
        }

        // Filtro por estado de camas
        if (this.filtros.estado) {
          const camas = habitacionEl.querySelectorAll(`[data-cama-estado="${this.filtros.estado}"]`);
          if (camas.length === 0) {
            mostrarHabitacion = false;
          }
        }

        habitacionEl.style.display = mostrarHabitacion ? 'block' : 'none';
        if (mostrarHabitacion) habitacionesVisibles++;
      });

      // Ocultar sector si no tiene habitaciones visibles
      if (habitacionesVisibles === 0) {
        mostrarSector = false;
      }

      sectorEl.style.display = mostrarSector ? 'block' : 'none';
    });
  }

  async confirmarFinalizarLimpieza(camaId, camaNumero) {
    document.getElementById('infoModalCama').textContent = `Cama ${camaNumero}`;
    document.getElementById('btnConfirmarFinalizarLimpieza').dataset.camaId = camaId;
    
    const modal = new bootstrap.Modal(document.getElementById('modalFinalizarLimpieza'));
    modal.show();
  }

  async finalizarLimpieza() {
    const camaId = document.getElementById('btnConfirmarFinalizarLimpieza').dataset.camaId;
    
    try {
      const response = await fetch(`/camas/${camaId}/finalizar-limpieza`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        this.mostrarNotificacion(data.message, 'success');
        this.cargarDatos(); // Recargar datos
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalFinalizarLimpieza'));
        modal.hide();
      } else {
        this.mostrarNotificacion(data.message || 'Error al finalizar limpieza', 'error');
      }

    } catch (error) {
      console.error('Error al finalizar limpieza:', error);
      this.mostrarNotificacion('Error de conexión', 'error');
    }
  }

  mostrarModalNuevaHabitacion() {
    // Cargar sectores en el select
    if (this.data && this.data.sectores) {
      const select = document.getElementById('sector_id');
      select.innerHTML = '<option value="">Seleccionar sector...</option>';
      
      this.data.sectores.forEach(sector => {
        select.innerHTML += `<option value="${sector.id}">${sector.nombre}</option>`;
      });
    }

    const modal = new bootstrap.Modal(document.getElementById('modalNuevaHabitacion'));
    modal.show();
  }

  async crearHabitacion() {
    const form = document.getElementById('formNuevaHabitacion');
    const formData = new FormData(form);
    
    const data = {
      sector_id: formData.get('sector_id'),
      numero: formData.get('numero'),
      tipo: formData.get('tipo'),
      sexo_permitido: formData.get('sexo_permitido'),
      tipo_de_servicio_id: formData.get('tipo_de_servicio_id'),
      tipo_internacion_id: 1, // Por defecto
      cantidad_camas: formData.get('cantidad_camas') || null
    };

    try {
      const response = await fetch('/internacion/api/habitacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.mostrarNotificacion(result.message, 'success');
        this.cargarDatos(); // Recargar datos
        
        // Cerrar modal y limpiar form
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaHabitacion'));
        modal.hide();
        form.reset();
      } else {
        this.mostrarNotificacion(result.message || 'Error al crear habitación', 'error');
      }

    } catch (error) {
      console.error('Error al crear habitación:', error);
      this.mostrarNotificacion('Error de conexión', 'error');
    }
  }

  mostrarDetalleCama(camaId) {
    // Implementar modal de detalle de cama
    console.log('Mostrar detalle de cama:', camaId);
  }

  agregarCama(habitacionId) {
    // Implementar modal para agregar cama
    console.log('Agregar cama a habitación:', habitacionId);
  }

  iniciarActualizacionAutomatica() {
    // Actualizar cada 30 segundos
    this.intervalId = setInterval(() => {
      this.cargarDatos();
    }, 30000);
  }

  // Gestión de Lista de Espera
  toggleListaEspera() {
    const cuerpo = document.getElementById('cuerpoListaEspera');
    const footer = document.getElementById('footerListaEspera');
    const icono = document.getElementById('iconoExpandir');
    
    if (cuerpo.style.display === 'none') {
      cuerpo.style.display = 'block';
      footer.style.display = 'block';
      icono.className = 'bi bi-chevron-down';
    } else {
      cuerpo.style.display = 'none';
      footer.style.display = 'none';
      icono.className = 'bi bi-chevron-up';
    }
  }

  mostrarModalGestionLista() {
    this.cargarTablaGestionLista();
    const modal = new bootstrap.Modal(document.getElementById('modalGestionLista'));
    modal.show();
  }

  cargarTablaGestionLista() {
    if (!this.data || !this.data.listasEspera) return;

    const tbody = document.getElementById('cuerpoTablaLista');
    tbody.innerHTML = '';

    this.data.listasEspera.forEach((item, index) => {
      const prioridadTexto = item.prioridad === 1 ? 'ALTA' : item.prioridad === 2 ? 'MEDIA' : 'BAJA';
      const prioridadClass = item.prioridad === 1 ? 'danger' : item.prioridad === 2 ? 'warning' : 'success';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.paciente.usuario.nombre} ${item.paciente.usuario.apellido}</td>
        <td>${item.paciente.usuario.dni}</td>
        <td><span class="badge bg-info">${item.tipo}</span></td>
        <td><span class="badge bg-${prioridadClass}">${prioridadTexto}</span></td>
        <td><span class="badge bg-secondary">${item.estado}</span></td>
        <td>${this.calcularTiempoEspera(item.fecha_registro)}</td>
        <td>${item.sector_id || 'N/A'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="internacionManager.editarPacienteLista(${item.id})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-success" onclick="internacionManager.asignarPaciente(${item.id})" title="Asignar">
              <i class="bi bi-check"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="internacionManager.eliminarPacienteLista(${item.id})" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  mostrarModalAgregarPaciente() {
    document.getElementById('tituloPacienteLista').textContent = 'Agregar Paciente a Lista';
    document.getElementById('formPacienteLista').reset();
    document.getElementById('infoPacienteEncontrado').style.display = 'none';
    
    // Cargar sectores
    if (this.data && this.data.sectores) {
      const selectSector = document.getElementById('sectorPacienteLista');
      selectSector.innerHTML = '<option value="">Seleccionar sector...</option>';
      this.data.sectores.forEach(sector => {
        selectSector.innerHTML += `<option value="${sector.id}">${sector.nombre}</option>`;
      });
    }

    const modal = new bootstrap.Modal(document.getElementById('modalPacienteLista'));
    modal.show();
  }

  async buscarPacientePorDNI() {
    const dni = document.getElementById('dniPacienteLista').value.trim();
    
    if (!dni || !/^\d{7,8}$/.test(dni)) {
      this.mostrarNotificacion('Ingrese un DNI válido (7 u 8 dígitos)', 'error');
      return;
    }

    try {
      const response = await fetch(`/admisiones/pacientes/buscar?dni=${dni}`);
      const data = await response.json();

      if (response.ok && data.paciente) {
        document.getElementById('nombrePacienteEncontrado').textContent = 
          `${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`;
        document.getElementById('infoPacienteEncontrado').style.display = 'block';
        document.getElementById('infoPacienteEncontrado').dataset.pacienteId = data.paciente.id;
      } else {
        document.getElementById('infoPacienteEncontrado').style.display = 'none';
        this.mostrarNotificacion('Paciente no encontrado', 'error');
      }
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      this.mostrarNotificacion('Error al buscar paciente', 'error');
    }
  }

  mostrarCamposEspecificos(tipo) {
    const sectorContainer = document.getElementById('sectorContainer');
    const estudiosContainer = document.getElementById('estudiosContainer');
    
    // Ocultar todos primero
    sectorContainer.style.display = 'none';
    estudiosContainer.style.display = 'none';
    
    // Mostrar según el tipo
    switch(tipo) {
      case 'INTERNACION':
        sectorContainer.style.display = 'block';
        break;
      case 'ESTUDIO':
        estudiosContainer.style.display = 'block';
        break;
    }
  }

  async agregarPacienteALista() {
    const pacienteInfo = document.getElementById('infoPacienteEncontrado');
    const pacienteId = pacienteInfo.dataset.pacienteId;
    
    if (!pacienteId) {
      this.mostrarNotificacion('Debe buscar y seleccionar un paciente', 'error');
      return;
    }

    const formData = new FormData(document.getElementById('formPacienteLista'));
    const data = {
      paciente_id: parseInt(pacienteId),
      tipo: formData.get('tipoListaPaciente'),
      prioridad: parseInt(formData.get('prioridadPaciente')),
      sector_id: formData.get('sectorPacienteLista') || null,
      tipo_estudio_id: formData.get('tipoEstudioPaciente') || null,
      observaciones: formData.get('observacionesPaciente') || null
    };

    try {
      const response = await fetch('/internacion/api/lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.mostrarNotificacion('Paciente agregado a lista de espera', 'success');
        this.cargarDatos(); // Recargar datos
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPacienteLista'));
        modal.hide();
      } else {
        this.mostrarNotificacion(result.message || 'Error al agregar paciente', 'error');
      }

    } catch (error) {
      console.error('Error al agregar paciente a lista:', error);
      this.mostrarNotificación('Error de conexión', 'error');
    }
  }

  async eliminarPacienteLista(listaId) {
    if (!confirm('¿Está seguro de eliminar este paciente de la lista de espera?')) {
      return;
    }

    try {
      const response = await fetch(`/internacion/api/lista-espera/${listaId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        this.mostrarNotificacion('Paciente eliminado de la lista', 'success');
        this.cargarDatos();
        this.cargarTablaGestionLista();
      } else {
        this.mostrarNotificacion(result.message || 'Error al eliminar', 'error');
      }

    } catch (error) {
      console.error('Error al eliminar:', error);
      this.mostrarNotificacion('Error de conexión', 'error');
    }
  }

  // Placeholder para futuras funciones
  editarPacienteLista(listaId) {
    console.log('Editar paciente lista:', listaId);
    // Implementar modal de edición
  }

  asignarPaciente(listaId) {
    console.log('Asignar paciente:', listaId);
    // Implementar lógica de asignación automática
  }

  mostrarLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
    document.getElementById('sectoresContainer').style.opacity = '0.5';
  }

  ocultarLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
    document.getElementById('sectoresContainer').style.opacity = '1';
  }

  mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear toast de Bootstrap
    const toastContainer = document.getElementById('toastContainer') || this.crearToastContainer();
    
    const toastId = 'toast_' + Date.now();
    const bgClass = tipo === 'success' ? 'bg-success' : tipo === 'error' ? 'bg-danger' : 'bg-info';
    
    const toastHtml = `
      <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
        <div class="toast-body">
          ${mensaje}
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Eliminar después de mostrar
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  crearToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
  }
}

// Inicializar cuando se carga la página
let internacionManager;
document.addEventListener('DOMContentLoaded', () => {
  internacionManager = new InternacionManager();
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
  if (internacionManager) {
    internacionManager.detenerActualizacionAutomatica();
  }
});
console.log('✅ internacion.js cargado correctamente');
console.log('✅ InternacionManager creado:', window.internacionManager);

// Exponer globalmente para debug
window.debugToggle = function() {
  const cuerpo = document.getElementById('cuerpoListaEspera');
  const footer = document.getElementById('footerListaEspera');
  console.log('Elementos:', { cuerpo, footer });
  
  if (cuerpo && footer) {
    cuerpo.style.display = cuerpo.style.display === 'none' ? 'block' : 'none';
    footer.style.display = footer.style.display === 'none' ? 'block' : 'none';
  }
};