/**
 * Infraestructura Hospitalaria - Frontend JavaScript
 * Gestión de Sectores, Habitaciones y Camas
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Infraestructura.js cargado');
  
  // ============================================================================
  // VARIABLES GLOBALES
  // ============================================================================
  let elementoAEliminar = null;
  let tipoElementoAEliminar = null;
  let confirmarCallback = null;

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function mostrarAlerta(mensaje, tipo = 'success') {
    const alertaHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : (tipo === 'danger' ? 'exclamation-circle' : 'info-circle')} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    // Buscar o crear contenedor de alertas
    let container = document.querySelector('.alert-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'alert-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
      document.body.appendChild(container);
    }
    
    container.innerHTML = alertaHTML;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      const alert = container.querySelector('.alert');
      if (alert) {
        alert.classList.remove('show');
        setTimeout(() => container.innerHTML = '', 150);
      }
    }, 5000);
  }

  // ============================================================================
  // SECTORES
  // ============================================================================
  
  // Abrir modal para nuevo sector
  const btnNuevoSector = document.getElementById('btnNuevoSector');
  if (btnNuevoSector) {
    btnNuevoSector.addEventListener('click', () => {
      document.getElementById('sector_id').value = '';
      document.getElementById('sector_nombre').value = '';
      document.getElementById('sector_descripcion').value = '';
      document.getElementById('modalSectorTitle').innerHTML = '<i class="fas fa-hospital me-2"></i>Nuevo Sector';
      
      const modal = new bootstrap.Modal(document.getElementById('modalSector'));
      modal.show();
    });
  }

  // Editar sector
  document.querySelectorAll('.btn-editar-sector').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      
      try {
        const response = await fetch(`/configuracion/infraestructura/api/sector/${id}`);
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('sector_id').value = data.sector.id;
          document.getElementById('sector_nombre').value = data.sector.nombre;
          document.getElementById('sector_descripcion').value = data.sector.descripcion || '';
          document.getElementById('modalSectorTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Sector';
          
          const modal = new bootstrap.Modal(document.getElementById('modalSector'));
          modal.show();
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar el sector', 'danger');
      }
    });
  });

  // Guardar sector
  const btnGuardarSector = document.getElementById('btnGuardarSector');
  if (btnGuardarSector) {
    btnGuardarSector.addEventListener('click', async () => {
      const id = document.getElementById('sector_id').value;
      const nombre = document.getElementById('sector_nombre').value.trim();
      const descripcion = document.getElementById('sector_descripcion').value.trim();
      
      if (!nombre) {
        mostrarAlerta('El nombre es requerido', 'danger');
        return;
      }
      
      btnGuardarSector.disabled = true;
      btnGuardarSector.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const url = id 
          ? `/configuracion/infraestructura/api/sector/${id}` 
          : '/configuracion/infraestructura/api/sector';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, descripcion })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta(data.message, 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar el sector', 'danger');
      } finally {
        btnGuardarSector.disabled = false;
        btnGuardarSector.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
      }
    });
  }

  // Eliminar sector
  document.querySelectorAll('.btn-eliminar-sector').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const nombre = this.dataset.nombre;
      
      elementoAEliminar = id;
      tipoElementoAEliminar = 'sector';
      
      document.getElementById('confirmar-mensaje').innerHTML = `
        <p>¿Está seguro de eliminar el sector <strong>"${nombre}"</strong>?</p>
        <p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Esta acción eliminará también todas las habitaciones y camas del sector.</p>
      `;
      
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
      modal.show();
    });
  });

  // Click en fila de sector para navegar
  document.querySelectorAll('.sector-row').forEach(row => {
    row.addEventListener('click', function() {
      const id = this.dataset.id;
      window.location.href = `/configuracion/infraestructura/sector/${id}/habitaciones`;
    });
  });

  // ============================================================================
  // HABITACIONES
  // ============================================================================
  
  // Abrir modal para nueva habitación
  const btnNuevaHabitacion = document.getElementById('btnNuevaHabitacion');
  if (btnNuevaHabitacion) {
    btnNuevaHabitacion.addEventListener('click', () => {
      document.getElementById('habitacion_id').value = '';
      document.getElementById('habitacion_numero').value = '';
      document.getElementById('habitacion_tipo').value = 'Colectiva';
      document.getElementById('habitacion_sexo').value = 'Mixto';
      document.getElementById('habitacion_servicio').value = '';
      document.getElementById('modalHabitacionTitle').innerHTML = '<i class="fas fa-door-open me-2"></i>Nueva Habitación';
      
      const modal = new bootstrap.Modal(document.getElementById('modalHabitacion'));
      modal.show();
    });
  }

  // Editar habitación
  document.querySelectorAll('.btn-editar-habitacion').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      
      try {
        const response = await fetch(`/configuracion/infraestructura/api/habitacion/${id}`);
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('habitacion_id').value = data.habitacion.id;
          document.getElementById('habitacion_numero').value = data.habitacion.numero;
          document.getElementById('habitacion_tipo').value = data.habitacion.tipo;
          document.getElementById('habitacion_sexo').value = data.habitacion.sexo_permitido;
          document.getElementById('habitacion_servicio').value = data.habitacion.tipo_de_servicio_id;
          document.getElementById('modalHabitacionTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Habitación';
          
          const modal = new bootstrap.Modal(document.getElementById('modalHabitacion'));
          modal.show();
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar la habitación', 'danger');
      }
    });
  });

  // Guardar habitación
  const btnGuardarHabitacion = document.getElementById('btnGuardarHabitacion');
  if (btnGuardarHabitacion) {
    btnGuardarHabitacion.addEventListener('click', async () => {
      const id = document.getElementById('habitacion_id').value;
      const sector_id = document.getElementById('habitacion_sector_id').value;
      const numero = document.getElementById('habitacion_numero').value.trim();
      const tipo = document.getElementById('habitacion_tipo').value;
      const sexo_permitido = document.getElementById('habitacion_sexo').value;
      const tipo_de_servicio_id = document.getElementById('habitacion_servicio').value;
      
      if (!numero || !tipo_de_servicio_id) {
        mostrarAlerta('Complete todos los campos requeridos', 'danger');
        return;
      }
      
      btnGuardarHabitacion.disabled = true;
      btnGuardarHabitacion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const url = id 
          ? `/configuracion/infraestructura/api/habitacion/${id}` 
          : '/configuracion/infraestructura/api/habitacion';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sector_id, numero, tipo, sexo_permitido, tipo_de_servicio_id })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta(data.message, 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar la habitación', 'danger');
      } finally {
        btnGuardarHabitacion.disabled = false;
        btnGuardarHabitacion.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
      }
    });
  }

  // Eliminar habitación
  document.querySelectorAll('.btn-eliminar-habitacion').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const numero = this.dataset.numero;
      
      elementoAEliminar = id;
      tipoElementoAEliminar = 'habitacion';
      
      document.getElementById('confirmar-mensaje').innerHTML = `
        <p>¿Está seguro de eliminar la habitación <strong>"${numero}"</strong>?</p>
        <p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Esta acción eliminará también todas las camas de la habitación.</p>
      `;
      
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
      modal.show();
    });
  });

  // ============================================================================
  // CAMAS
  // ============================================================================
  
  // Abrir modal para nueva cama
  const btnNuevaCama = document.getElementById('btnNuevaCama');
  if (btnNuevaCama) {
    btnNuevaCama.addEventListener('click', () => {
      document.getElementById('cama_id').value = '';
      document.getElementById('cama_numero').value = '';
      document.getElementById('cama_estado').value = 'Libre';
      document.getElementById('modalCamaTitle').innerHTML = '<i class="fas fa-bed me-2"></i>Nueva Cama';
      
      const modal = new bootstrap.Modal(document.getElementById('modalCama'));
      modal.show();
    });
  }

  // Abrir modal para crear múltiples camas
  const btnCrearMultiples = document.getElementById('btnCrearMultiples');
  if (btnCrearMultiples) {
    btnCrearMultiples.addEventListener('click', () => {
      document.getElementById('cantidad_camas').value = '1';
      document.getElementById('prefijo_camas').value = typeof HABITACION_NUMERO !== 'undefined' ? `${HABITACION_NUMERO}-` : '';
      
      const modal = new bootstrap.Modal(document.getElementById('modalCamasMultiples'));
      modal.show();
    });
  }

  // Editar cama
  document.querySelectorAll('.btn-editar-cama').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      
      try {
        const response = await fetch(`/configuracion/infraestructura/api/cama/${id}`);
        const data = await response.json();
        
        if (data.success) {
          document.getElementById('cama_id').value = data.cama.id;
          document.getElementById('cama_numero').value = data.cama.numero;
          document.getElementById('cama_estado').value = data.cama.estado;
          document.getElementById('modalCamaTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Cama';
          
          const modal = new bootstrap.Modal(document.getElementById('modalCama'));
          modal.show();
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar la cama', 'danger');
      }
    });
  });

  // Guardar cama
  const btnGuardarCama = document.getElementById('btnGuardarCama');
  if (btnGuardarCama) {
    btnGuardarCama.addEventListener('click', async () => {
      const id = document.getElementById('cama_id').value;
      const habitacion_id = document.getElementById('cama_habitacion_id').value;
      const numero = document.getElementById('cama_numero').value.trim();
      const estado = document.getElementById('cama_estado').value;
      
      if (!numero) {
        mostrarAlerta('El número de cama es requerido', 'danger');
        return;
      }
      
      btnGuardarCama.disabled = true;
      btnGuardarCama.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
      
      try {
        const url = id 
          ? `/configuracion/infraestructura/api/cama/${id}` 
          : '/configuracion/infraestructura/api/cama';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitacion_id, numero, estado })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta(data.message, 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar la cama', 'danger');
      } finally {
        btnGuardarCama.disabled = false;
        btnGuardarCama.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
      }
    });
  }

  // Crear múltiples camas
  const btnCrearCamasMultiples = document.getElementById('btnCrearCamasMultiples');
  if (btnCrearCamasMultiples) {
    btnCrearCamasMultiples.addEventListener('click', async () => {
      const habitacion_id = document.getElementById('cama_habitacion_id').value;
      const cantidad = document.getElementById('cantidad_camas').value;
      const prefijo = document.getElementById('prefijo_camas').value.trim();
      
      if (!cantidad || cantidad < 1) {
        mostrarAlerta('Ingrese una cantidad válida', 'danger');
        return;
      }
      
      btnCrearCamasMultiples.disabled = true;
      btnCrearCamasMultiples.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
      
      try {
        const response = await fetch('/configuracion/infraestructura/api/camas/multiple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitacion_id, cantidad, prefijo })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta(data.message, 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al crear las camas', 'danger');
      } finally {
        btnCrearCamasMultiples.disabled = false;
        btnCrearCamasMultiples.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Crear Camas';
      }
    });
  }

  // Eliminar cama
  document.querySelectorAll('.btn-eliminar-cama').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const numero = this.dataset.numero;
      
      elementoAEliminar = id;
      tipoElementoAEliminar = 'cama';
      
      document.getElementById('confirmar-mensaje').innerHTML = `
        <p>¿Está seguro de eliminar la cama <strong>"${numero}"</strong>?</p>
      `;
      
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
      modal.show();
    });
  });

  // Marcar cama como libre
  document.querySelectorAll('.btn-marcar-libre').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      
      try {
        const response = await fetch(`/configuracion/infraestructura/api/cama/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'Libre' })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta('Cama marcada como libre', 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarAlerta(data.message, 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar la cama', 'danger');
      }
    });
  });

  // ============================================================================
  // CONFIRMAR ELIMINACIÓN (Genérico)
  // ============================================================================
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
      if (!elementoAEliminar || !tipoElementoAEliminar) return;
      
      btnConfirmarEliminar.disabled = true;
      btnConfirmarEliminar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Eliminando...';
      
      try {
        const response = await fetch(`/configuracion/infraestructura/api/${tipoElementoAEliminar}/${elementoAEliminar}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmar: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta(data.message, 'success');
          bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar')).hide();
          setTimeout(() => location.reload(), 1000);
        } else if (data.requiereConfirmacion) {
          // Mostrar mensaje de confirmación adicional
          document.getElementById('confirmar-mensaje').innerHTML = `
            <p class="text-danger"><strong>${data.message}</strong></p>
            <p>Esta acción no se puede deshacer.</p>
          `;
          btnConfirmarEliminar.disabled = false;
          btnConfirmarEliminar.innerHTML = '<i class="fas fa-trash me-2"></i>Sí, Eliminar Todo';
        } else {
          mostrarAlerta(data.message, 'danger');
          bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar')).hide();
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar', 'danger');
      } finally {
        if (!document.getElementById('confirmar-mensaje').innerHTML.includes('Eliminar Todo')) {
          btnConfirmarEliminar.disabled = false;
          btnConfirmarEliminar.innerHTML = '<i class="fas fa-trash me-2"></i>Sí, Eliminar';
        }
      }
    });
  }

  // Limpiar estado al cerrar modal de confirmación
  const modalConfirmarEliminar = document.getElementById('modalConfirmarEliminar');
  if (modalConfirmarEliminar) {
    modalConfirmarEliminar.addEventListener('hidden.bs.modal', () => {
      elementoAEliminar = null;
      tipoElementoAEliminar = null;
      const btn = document.getElementById('btnConfirmarEliminar');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash me-2"></i>Sí, Eliminar';
      }
    });
  }

});
