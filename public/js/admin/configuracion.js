$(document).ready(function() {
  // Manejo del formulario de creación
  $('form[id$="Form"]').on('submit', async function(e) {
    e.preventDefault();
    const form = $(this);
    const table = form.attr('action').split('/')[2]; // Ejemplo: 'especialidades'
    const data = Object.fromEntries(new FormData(this));
    try {
      const response = await fetch(`/config/${table}/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: data.nombre, descripcion: data.descripcion || null }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`${table} creado con éxito`);
        window.location.reload();
      } else {
        alert(result.message || `Error al crear ${table}`);
      }
    } catch (error) {
      console.error(`Error al crear ${table}:`, error);
      alert(`Error al crear ${table}`);
    }
  });

  // Manejo del formulario de edición
  $('[data-bs-target*="#editar"]').on('click', async function() {
    const id = $(this).attr('data-id');
    const table = $(this).attr('data-table'); // Ejemplo: 'especialidades'
    try {
      const response = await fetch(`/config/${table}/data/${id}`);
      const record = await response.json();
      if (response.ok) {
        $(`#editar${table}Form input[name="id"]`).val(record.id);
        $(`#edit_${table}_nombre`).val(record.nombre);
        $(`#edit_${table}_descripcion`).val(record.descripcion || '');
      }
    } catch (error) {
      console.error(`Error al cargar datos de ${table}:`, error);
      alert(`Error al cargar datos de ${table}`);
    }
  });

  $('form[id^="editar"][id$="Form"]').on('submit', async function(e) {
    e.preventDefault();
    const table = $(this).attr('id').replace('editar', '').replace('Form', '').toLowerCase();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    try {
      const response = await fetch(`/config/${table}/editar/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: data.nombre, descripcion: data.descripcion || null }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`${table} actualizado con éxito`);
        window.location.reload();
      } else {
        alert(result.message || `Error al actualizar ${table}`);
      }
    } catch (error) {
      console.error(`Error al actualizar ${table}:`, error);
      alert(`Error al actualizar ${table}`);
    }
  });

  // Manejo de eliminación
  $('.btn-outline-danger[data-id]').on('click', async function() {
    const id = $(this).attr('data-id');
    const table = $(this).attr('data-table');
    if (confirm(`¿Confirmar eliminación de ${table}?`)) {
      try {
        const response = await fetch(`/config/${table}/eliminar/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
          alert(`${table} eliminado con éxito`);
          window.location.reload();
        } else {
          alert(result.message || `Error al eliminar ${table}`);
        }
      } catch (error) {
        console.error(`Error al eliminar ${table}:`, error);
        alert(`Error al eliminar ${table}`);
      }
    }
  });
});