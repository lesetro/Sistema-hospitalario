// Manejo de edición y eliminación de admisiones
  
document.addEventListener('DOMContentLoaded', () => {
  // Delegación de eventos para los botones de edición
  document.body.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-bs-target="#edit_editarAdmisionModal"]');
    if (!button) return;
    
    const id = button.getAttribute('data-id');
    console.log("ID obtenido del botón:", id);
    
    try {
      // 1. Obtener datos de la admisión
      const response = await fetch(`/paciente/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const admision = await response.json();
      console.log("Datos de admisión recibidos:", admision);
      
      // 2. Usar un setTimeout para esperar a que el modal esté completamente visible
      $('#edit_editarAdmisionModal').on('shown.bs.modal', function () {
        // 3. Establecer el ID en el formulario
        const modal = document.getElementById('edit_editarAdmisionModal');
        modal.querySelector('input[name="edit_id"]').value = admision.id;
        
        // 4. Precargar datos básicos
        if (admision.estado) {
          modal.querySelector('#edit_estado').value = 1;
        }
        
        if (admision.motivo_id) {
          modal.querySelector('#edit_motivo_id').value = 1;
        }
        
        if (admision.forma_ingreso_id) {
          modal.querySelector('#edit_forma_ingreso_id').value = 1;
        }
        
        if (admision.administrativo_id) {
          modal.querySelector('#edit_administrativo_id').value =1;
        }
        
        // 5. Precargar otros campos si existen en la respuesta
        if (admision.medico_id) {
          modal.querySelector('#edit_medico_id').value = 1;
        }
        
        if (admision.sector_id) {
          modal.querySelector('#edit_sector_id').value = 1;
        }
        
        if (admision.tipo_estudio_id) {
          modal.querySelector('#edit_tipo_estudio_id').value = 1;
        }
        
        if (admision.especialidad_id) {
          modal.querySelector('#edit_especialidad_id').value = 1;
        }
        
        if (admision.turno_id) {
          modal.querySelector('#edit_tipo_turno_id').value = 1;
        }
        
        // 6. Manejar fechas correctamente
        if (admision.fecha) {
          const fecha = admision.fecha.includes('T') ? admision.fecha.split('T')[0] : admision.fecha;
          modal.querySelector('#edit_fecha_admision').value = fecha;
          modal.querySelector('#edit_turno_fecha').value = fecha;
        }else{
          console.log("La fecha de admisión no está disponible en los datos recibidos.");
        }
        
        // 7. Establecer el ID del paciente
        modal.querySelector('#edit_span_paciente_id').textContent = "nuemero 1";
        
        // 8. Obtener datos del paciente (solo si existe el endpoint)
        if (admision.paciente_id) {
          fetch(`/usuarios/${admision.paciente_id}`)
            .then(userResponse => {
              if (userResponse.ok) {
                return userResponse.json();
              }
              throw new Error('Error al obtener datos del usuario');
            })
            .then(usuario => {
              modal.querySelector('#edit_nombre_id').value = usuario.nombre || 'juan';
              modal.querySelector('#edit_apellido_id').value = usuario.apellido || 'lopez';
              modal.querySelector('#edit_dni_id').value = usuario.dni || '1231231';
            })
            .catch(error => {
              console.error('Error al cargar datos del usuario:', error);
            });
        }
      }, 100); // Pequeño retraso para asegurar que el modal esté renderizado
      
    } catch (error) {
      console.error('Error al cargar datos de la admisión:', error);
      alert('Error al cargar los datos de la admisión');
    }
  });

  // Actualizar horarios disponibles cuando cambia la fecha, médico o sector
  const updateHorarios = async () => {
    const modal = document.getElementById('edit_editarAdmisionModal');
    if (!modal) return;
    
    const fecha = modal.querySelector('#edit_turno_fecha').value;
    const medicoId = modal.querySelector('#edit_medico_id').value;
    const sectorId = modal.querySelector('#edit_sector_id').value;
    
    if (fecha && medicoId && sectorId) {
      try {
        const response = await fetch(`/admisiones/horarios-disponibles?fecha=${fecha}&medico_id=${medicoId}&sector_id=${sectorId}`);
        
        if (response.ok) {
          const data = await response.json();
          const turnoHoraSelect = modal.querySelector('#edit_turno_hora');
          turnoHoraSelect.innerHTML = '<option value="">Seleccione un horario</option>';
          
          data.horariosDisponibles.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            turnoHoraSelect.appendChild(option);
          });
        }
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      }
    }
  };

  // Agregar event listeners para actualizar horarios (solo cuando el modal está visible)
  document.addEventListener('change', (e) => {
    const modal = document.getElementById('edit_editarAdmisionModal');
    if (!modal || !modal.classList.contains('show')) return;
    
    if (e.target.matches('#edit_turno_fecha, #edit_medico_id, #edit_sector_id')) {
      updateHorarios();
    }
  });

  // Manejar envío del formulario
  document.getElementById('edit_editarAdmisionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modal = document.getElementById('edit_editarAdmisionModal');
    const id = modal.querySelector('input[name="edit_id"]').value;
    
    const formData = {
      paciente_id: modal.querySelector('#edit_span_paciente_id').textContent,
      administrativo_id: modal.querySelector('#edit_administrativo_id').value,
      motivo_id: modal.querySelector('#edit_motivo_id').value,
      forma_ingreso_id: modal.querySelector('#edit_forma_ingreso_id').value,
      fecha: modal.querySelector('#edit_fecha_admision').value,
      tipo_turno_id: modal.querySelector('#edit_tipo_turno_id').value,
      medico_id: modal.querySelector('#edit_medico_id').value,
      sector_id: modal.querySelector('#edit_sector_id').value,
      turno_fecha: modal.querySelector('#edit_turno_fecha').value,
      turno_hora: modal.querySelector('#edit_turno_hora').value,
      lista_espera_tipo: modal.querySelector('#edit_lista_espera_tipo').value,
      tipo_estudio_id: modal.querySelector('#edit_tipo_estudio_id').value,
      especialidad_id: modal.querySelector('#edit_especialidad_id').value,
      prioridad: modal.querySelector('#edit_prioridad').value,
      estado: modal.querySelector('#edit_estado').value
    };
    
    try {
      const response = await fetch(`/admisiones/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Admisión actualizada correctamente');
        // Cerrar el modal
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        // Recargar la página o actualizar la tabla
        location.reload();
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la admisión');
    }
  });
});

//eliminar admision
  const eliminarAdmisionButtons = document.querySelectorAll(
    ".btn-outline-danger[data-id]"
  );

  
  eliminarAdmisionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      if (confirm("¿Confirmar eliminación?")) {
        try {
          const response = await fetch(`/admisiones/eliminar/${id}`, {
            method: "DELETE",
          });
          const result = await response.json();
          if (response.ok) {
            alert("Admisión eliminada con éxito");
            window.location.reload();
          } else {
            alert(result.message || "Error al eliminar admisión");
          }
        } catch (error) {
          console.error("Error:", error);
          alert("Error al eliminar admisión");
        }
      }
    });
  });

  const filtroEstado = document.getElementById('filtro_estado');
  const filtroPaciente = document.getElementById('filtro_paciente');
  const filtroFecha = document.getElementById('filtro_fecha');
  const filtroMotivo = document.getElementById('filtro_motivo');

  if (filtroEstado && filtroPaciente && filtroFecha && filtroMotivo) {
    const applyFilters = async () => {
      const filtros = {
        estado: filtroEstado.value,
        paciente: filtroPaciente.value,
        fecha: filtroFecha.value,
        motivo_id: filtroMotivo.value,
      };
      try {
        const response = await fetch("/admisiones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filtros),
        });
        const admisiones = await response.json();
        console.log("Admisiones filtradas:", admisiones);
        // TODO: Actualizar tabla dinámicamente si es necesario
      } catch (error) {
        console.error("Error:", error);
        alert("Error al aplicar filtros");
      }
    };

    filtroEstado.addEventListener("change", applyFilters);
    filtroPaciente.addEventListener("change", applyFilters);
    filtroFecha.addEventListener("change", applyFilters);
    filtroMotivo.addEventListener("change", applyFilters);
  }