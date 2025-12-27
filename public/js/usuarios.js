document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();
  cargarRoles();

  // Eventos de filtros
  document.getElementById('busqueda')?.addEventListener('input', debounce(cargarUsuarios, 500));
  document.getElementById('filtro-estado')?.addEventListener('change', cargarUsuarios);
  document.getElementById('filtro-sexo')?.addEventListener('change', cargarUsuarios);
  document.getElementById('filtro-rol')?.addEventListener('change', cargarUsuarios);
  
  // Eventos de botones
  document.getElementById('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);
  document.getElementById('btnCrearUsuario')?.addEventListener('click', crearUsuario);
  document.getElementById('btnGuardarEdicion')?.addEventListener('click', guardarEdicion);
  document.getElementById('btnConfirmarBloquear')?.addEventListener('click', confirmarBloquear);
  document.getElementById('btnConfirmarReset')?.addEventListener('click', confirmarReset);
  
  // Validar contraseñas en tiempo real
  const nuevoPass = document.getElementById('nuevo-password');
  const nuevoPassConfirm = document.getElementById('nuevo-password-confirm');
  
  if (nuevoPass && nuevoPassConfirm) {
    [nuevoPass, nuevoPassConfirm].forEach(input => {
      input.addEventListener('input', validarPasswordNuevo);
    });
  }
  
  const resetPass = document.getElementById('reset-password');
  const resetPassConfirm = document.getElementById('reset-password-confirm');
  
  if (resetPass && resetPassConfirm) {
    [resetPass, resetPassConfirm].forEach(input => {
      input.addEventListener('input', validarPasswordReset);
    });
  }
});

// Variables globales
let paginaActual = 1;
let timeoutBusqueda = null;

// ============================================================================
// CARGAR DATOS
// ============================================================================
async function cargarUsuarios(page = 1) {
  try {
    mostrarLoading(true);
    paginaActual = page;
    
    const params = new URLSearchParams({
      page,
      limit: 10,
      busqueda: document.getElementById('busqueda')?.value || '',
      estado: document.getElementById('filtro-estado')?.value || '',
      sexo: document.getElementById('filtro-sexo')?.value || '',
      rol_principal_id: document.getElementById('filtro-rol')?.value || ''
    });

    const response = await fetch(`/usuarios/api/lista?${params}`);
    const data = await response.json();

    if (data.success) {
      renderizarUsuarios(data.usuarios);
      renderizarPaginacion(data.pagination);
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    mostrarAlerta('error', 'Error al cargar usuarios');
  } finally {
    mostrarLoading(false);
  }
}

async function cargarRoles() {
  try {
    const response = await fetch('/usuarios/api/roles');
    const data = await response.json();
    
    if (data.success) {
      // Puedes usar los roles si necesitas en el frontend
      window.roles = data.roles;
    }
  } catch (error) {
    console.error('Error al cargar roles:', error);
  }
}

// ============================================================================
// RENDERIZAR TABLA
// ============================================================================
function renderizarUsuarios(usuarios) {
  const tbody = document.getElementById('tabla-usuarios-body');
  
  if (!usuarios || usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-4">
          <i class="fas fa-users-slash fa-2x mb-3"></i>
          <p>No se encontraron usuarios</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = usuarios.map(usuario => {
    const fechaRegistro = new Date(usuario.created_at).toLocaleDateString('es-AR');
    
    let badgeEstado = '';
    switch(usuario.estado) {
      case 'Activo':
        badgeEstado = '<span class="badge bg-success">Activo</span>';
        break;
      case 'Inactivo':
        badgeEstado = '<span class="badge bg-secondary">Inactivo</span>';
        break;
      case 'Bloqueado':
        badgeEstado = '<span class="badge bg-danger">Bloqueado</span>';
        break;
      case 'Pendiente':
        badgeEstado = '<span class="badge bg-warning">Pendiente</span>';
        break;
    }
    
    let badgeRol = '';
    if (usuario.rol_especifico?.tipo) {
      switch(usuario.rol_especifico.tipo) {
        case 'Paciente':
          badgeRol = '<span class="badge bg-info me-1">Paciente</span>';
          break;
        case 'Médico':
          badgeRol = '<span class="badge bg-primary me-1">Médico</span>';
          break;
        case 'Enfermero':
          badgeRol = '<span class="badge bg-success me-1">Enfermero</span>';
          break;
        case 'Administrativo':
          badgeRol = '<span class="badge bg-secondary me-1">Administrativo</span>';
          break;
      }
    }

    return `
      <tr>
        <td>
          <strong>${usuario.dni}</strong>
          ${badgeRol}
        </td>
        <td>${usuario.nombreCompleto}</td>
        <td>${usuario.email}</td>
        <td>${usuario.telefono}</td>
        <td>${usuario.sexo}</td>
        <td>${usuario.rol_principal}</td>
        <td>${badgeEstado}</td>
        <td>${fechaRegistro}</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-info" onclick="verDetalles(${usuario.id})" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="editarUsuario(${usuario.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="bloquearUsuario(${usuario.id}, '${usuario.nombreCompleto}', '${usuario.estado}')" title="Bloquear/Desbloquear">
              <i class="fas ${usuario.estado === 'Bloqueado' ? 'fa-unlock' : 'fa-lock'}"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="resetPassword(${usuario.id}, '${usuario.nombreCompleto}')" title="Resetear contraseña">
              <i class="fas fa-key"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// DETALLES DEL USUARIO
// ============================================================================
window.verDetalles = async function(id) {
  try {

    mostrarLoading(true);
    
    const response = await fetch(`/usuarios/api/${id}/detalles`);
    const data = await response.json();

    if (data.success) {
      // Datos personales
      document.getElementById('detalle-nombre').textContent = data.usuario.nombreCompleto;
      document.getElementById('detalle-dni').textContent = data.usuario.dni;
      document.getElementById('detalle-sexo').textContent = data.usuario.sexo;
      document.getElementById('detalle-fecha-nacimiento').textContent = new Date(data.usuario.fecha_nacimiento).toLocaleDateString('es-AR');
      document.getElementById('detalle-email').textContent = data.usuario.email;
      document.getElementById('detalle-telefono').textContent = data.usuario.telefono || 'Sin teléfono';
      document.getElementById('detalle-edad').textContent = `${data.usuario.edad} años`;
      document.getElementById('detalle-rol-principal').textContent = data.usuario.rol_principal;
      document.getElementById('detalle-rol-secundario').textContent = data.usuario.rol_secundario;
      document.getElementById('detalle-estado').textContent = data.usuario.estado;
      document.getElementById('detalle-fecha-registro').textContent = new Date(data.usuario.created_at).toLocaleString('es-AR');
      document.getElementById('detalle-ultima-actualizacion').textContent = new Date(data.usuario.updated_at).toLocaleString('es-AR');

      // Información específica del rol
      renderizarInfoRolEspecifico(data.rol_especifico);
      
      // Estadísticas
      renderizarEstadisticas(data.estadisticas);
      
      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
      
      modal._element.addEventListener('hidden.bs.modal', () => {
        cargarUsuarios(paginaActual); 
      });
      modal.show();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    mostrarAlerta('error', 'Error al cargar detalles');
  } finally {
    mostrarLoading(false);
  }
};

function renderizarInfoRolEspecifico(rolEspecifico) {
  const container = document.getElementById('detalle-rol-especifico');
  
  if (!rolEspecifico || Object.keys(rolEspecifico).length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="card mb-3"><div class="card-header bg-light"><h6 class="mb-0"><i class="fas fa-briefcase me-2"></i>Información Específica del Rol</h6></div><div class="card-body">';
  
  if (rolEspecifico.matricula) {
    html += `<p><strong>Matrícula:</strong> ${rolEspecifico.matricula}</p>`;
  }
  
  if (rolEspecifico.especialidad) {
    html += `<p><strong>Especialidad:</strong> ${rolEspecifico.especialidad}</p>`;
  }
  
  if (rolEspecifico.nivel) {
    html += `<p><strong>Nivel:</strong> ${rolEspecifico.nivel}</p>`;
  }
  
  if (rolEspecifico.responsabilidad) {
    html += `<p><strong>Responsabilidad:</strong> ${rolEspecifico.responsabilidad}</p>`;
  }
  
  if (rolEspecifico.estado) {
    html += `<p><strong>Estado:</strong> ${rolEspecifico.estado}</p>`;
  }
  
  html += '</div></div>';
  container.innerHTML = html;
}

function renderizarEstadisticas(estadisticas) {
  const container = document.getElementById('detalle-estadisticas');
  
  if (!estadisticas || Object.keys(estadisticas).length === 0) {
    container.innerHTML = '';
    return;
  }

  const cards = [];
  
  if (estadisticas.totalNotificaciones !== undefined) {
    cards.push(`
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h4>${estadisticas.totalNotificaciones}</h4>
            <p class="mb-0">Notificaciones</p>
          </div>
        </div>
      </div>
    `);
  }
  
  if (estadisticas.totalReclamos !== undefined) {
    cards.push(`
      <div class="col-md-3">
        <div class="card bg-warning">
          <div class="card-body text-center">
            <h4>${estadisticas.totalReclamos}</h4>
            <p class="mb-0">Reclamos</p>
          </div>
        </div>
      </div>
    `);
  }
  
  if (estadisticas.totalTurnos !== undefined) {
    cards.push(`
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h4>${estadisticas.totalTurnos}</h4>
            <p class="mb-0">Turnos</p>
          </div>
        </div>
      </div>
    `);
  }
  
  if (estadisticas.totalAdmisiones !== undefined) {
    cards.push(`
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <h4>${estadisticas.totalAdmisiones}</h4>
            <p class="mb-0">Admisiones</p>
          </div>
        </div>
      </div>
    `);
  }
  
  container.innerHTML = cards.join('');
}

// ============================================================================
// CREAR USUARIO
// ============================================================================
async function crearUsuario() {
  const form = document.getElementById('formNuevoUsuario');
  
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const password = document.getElementById('nuevo-password').value;
  const passwordConfirm = document.getElementById('nuevo-password-confirm').value;
  
  if (password !== passwordConfirm) {
    mostrarAlerta('error', 'Las contraseñas no coinciden');
    return;
  }

  try {
    const datos = {
      dni: document.getElementById('nuevo-dni').value,
      nombre: document.getElementById('nuevo-nombre').value,
      apellido: document.getElementById('nuevo-apellido').value,
      email: document.getElementById('nuevo-email').value,
      password: password,
      rol_principal_id: document.getElementById('nuevo-rol-principal').value,
      rol_secundario_id: document.getElementById('nuevo-rol-secundario').value || null,
      telefono: document.getElementById('nuevo-telefono').value || null,
      fecha_nacimiento: document.getElementById('nuevo-fecha-nacimiento').value,
      sexo: document.getElementById('nuevo-sexo').value,
      estado: document.getElementById('nuevo-estado').value
    };

    const response = await fetch('/usuarios/api/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', `Usuario creado correctamente: ${data.usuario.nombreCompleto}`);
      bootstrap.Modal.getInstance(document.getElementById('modalNuevo')).hide();
      form.reset();
      form.classList.remove('was-validated');
      cargarUsuarios();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al crear usuario:', error);
    mostrarAlerta('error', 'Error al crear usuario');
  }
}

// ============================================================================
// EDITAR USUARIO
// ============================================================================
window.editarUsuario = async function(id) {
  try {
    mostrarLoading(true);
    
    const response = await fetch(`/usuarios/api/${id}/detalles`);
    const data = await response.json();

    if (data.success) {
      document.getElementById('editar-id').value = id;
      document.getElementById('editar-nombre').value = data.usuario.nombreCompleto;
      document.getElementById('editar-dni').value = data.usuario.dni;
      document.getElementById('editar-email').value = data.usuario.email;
      document.getElementById('editar-telefono').value = data.usuario.telefono || '';
      document.getElementById('editar-rol-secundario').value = data.usuario.rol_secundario_id || '';
      document.getElementById('editar-estado').value = data.usuario.estado;

      const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
      modal.show();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al cargar usuario para editar:', error);
    mostrarAlerta('error', 'Error al cargar usuario');
  } finally {
    mostrarLoading(false);
  }
};

async function guardarEdicion() {
  const form = document.getElementById('formEditarUsuario');
  
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  try {
    const id = document.getElementById('editar-id').value;
    const datos = {
      email: document.getElementById('editar-email').value,
      telefono: document.getElementById('editar-telefono').value || null,
      rol_secundario_id: document.getElementById('editar-rol-secundario').value || null,
      estado: document.getElementById('editar-estado').value
    };

    const response = await fetch(`/usuarios/api/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', 'Usuario actualizado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
      form.classList.remove('was-validated');
      cargarUsuarios();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    mostrarAlerta('error', 'Error al actualizar usuario');
  }
}

// ============================================================================
// BLOQUEAR/DESBLOQUEAR USUARIO
// ============================================================================
window.bloquearUsuario = function(id, nombre, estadoActual) {
  const esBloqueado = estadoActual === 'Bloqueado';
  
  document.getElementById('bloquear-id').value = id;
  document.getElementById('bloquear-nombre').value = nombre;
  document.getElementById('bloquear-accion-texto').textContent = 
    esBloqueado ? 'desbloqueará' : 'bloqueará';
  
  const modal = new bootstrap.Modal(document.getElementById('modalBloquear'));
  modal.show();
};

async function confirmarBloquear() {
  const id = document.getElementById('bloquear-id').value;
  const motivo = document.getElementById('bloquear-motivo').value;
  
  if (!motivo.trim()) {
    mostrarAlerta('warning', 'Debe ingresar un motivo');
    return;
  }

  try {
    const response = await fetch(`/usuarios/api/${id}/bloquear`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', data.message);
      bootstrap.Modal.getInstance(document.getElementById('modalBloquear')).hide();
      document.getElementById('bloquear-motivo').value = '';
      cargarUsuarios();
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    mostrarAlerta('error', 'Error al cambiar estado del usuario');
  }
}

// ============================================================================
// RESETEAR CONTRASEÑA
// ============================================================================
window.resetPassword = function(id, nombre) {
  document.getElementById('reset-id').value = id;
  document.getElementById('reset-nombre').value = nombre;
  document.getElementById('reset-nombre-texto').textContent = nombre;
  
  const modal = new bootstrap.Modal(document.getElementById('modalResetPassword'));
  modal.show();
};

async function confirmarReset() {
  const id = document.getElementById('reset-id').value;
  const password = document.getElementById('reset-password').value;
  const passwordConfirm = document.getElementById('reset-password-confirm').value;
  
  if (!password || !passwordConfirm) {
    mostrarAlerta('warning', 'Debe completar ambos campos de contraseña');
    return;
  }
  
  if (password !== passwordConfirm) {
    mostrarAlerta('error', 'Las contraseñas no coinciden');
    return;
  }

  try {
    const response = await fetch(`/usuarios/api/${id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nueva_password: password })
    });

    const data = await response.json();

    if (data.success) {
      mostrarAlerta('success', data.message);
      bootstrap.Modal.getInstance(document.getElementById('modalResetPassword')).hide();
      document.getElementById('reset-password').value = '';
      document.getElementById('reset-password-confirm').value = '';
    } else {
      mostrarAlerta('error', data.message);
    }
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    mostrarAlerta('error', 'Error al resetear contraseña');
  }
}

// ============================================================================
// PAGINACIÓN
// ============================================================================
function renderizarPaginacion(pagination) {
  const container = document.getElementById('paginacion');
  const { page, totalPages } = pagination;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination justify-content-center mb-0">';
  
  // Anterior
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${page - 1}">« Anterior</a></li>`;
  
  // Páginas
  const maxPages = 5;
  let startPage = Math.max(1, page - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  if (endPage - startPage + 1 < maxPages) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}">
      <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }

  // Siguiente
  html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${page + 1}">Siguiente »</a></li></ul>`;
  
  container.innerHTML = html;

  // Eventos
  container.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const newPage = parseInt(e.target.dataset.page);
      if (newPage && newPage !== page) {
        cargarUsuarios(newPage);
      }
    });
  });
}

// ============================================================================
// UTILIDADES
// ============================================================================
function limpiarFiltros() {
  document.getElementById('busqueda').value = '';
  document.getElementById('filtro-estado').value = '';
  document.getElementById('filtro-sexo').value = '';
  document.getElementById('filtro-rol').value = '';
  cargarUsuarios(1);
}

function validarPasswordNuevo() {
  const pass = document.getElementById('nuevo-password');
  const confirm = document.getElementById('nuevo-password-confirm');
  
  if (pass.value && confirm.value && pass.value !== confirm.value) {
    confirm.setCustomValidity('Las contraseñas no coinciden');
  } else {
    confirm.setCustomValidity('');
  }
}

function validarPasswordReset() {
  const pass = document.getElementById('reset-password');
  const confirm = document.getElementById('reset-password-confirm');
  
  if (pass.value && confirm.value && pass.value !== confirm.value) {
    confirm.setCustomValidity('Las contraseñas no coinciden');
  } else {
    confirm.setCustomValidity('');
  }
}

function mostrarLoading(mostrar) {
  const loading = document.getElementById('loading');
  const tablaBody = document.getElementById('tabla-usuarios-body');
  
  if (mostrar) {
    loading.classList.remove('d-none');
    if (tablaBody) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">
            <div class="spinner-border spinner-border-sm"></div>
            Cargando usuarios...
          </td>
        </tr>
      `;
    }
  } else {
    loading.classList.add('d-none');
  }
}

function mostrarAlerta(tipo, mensaje) {
  const container = document.getElementById('alerta-container');
  const clase = tipo === 'success' ? 'alert-success' : 
                tipo === 'error' ? 'alert-danger' : 'alert-warning';
  
  container.innerHTML = `
    <div class="alert ${clase} alert-dismissible fade show">
      <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'exclamation-triangle'} me-2"></i>
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  setTimeout(() => {
    const alert = container.querySelector('.alert');
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}