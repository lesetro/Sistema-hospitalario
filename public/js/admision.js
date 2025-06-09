document.addEventListener("DOMContentLoaded", () => {
  // Función para obtener el último ID de paciente y generar DNI
  async function obtenerProximoDNI() {
    try {
      const response = await fetch("/pacientes/ultimo-id");
      const data = await response.json();
      if (response.ok && data.ultimoId !== undefined) {
        const nuevoId = data.ultimoId + 1;
        return nuevoId.toString().padStart(8, "0");
      } else {
        let ultimoId = parseInt(localStorage.getItem("ultimoIdPaciente")) || 0;
        ultimoId++;
        localStorage.setItem("ultimoIdPaciente", ultimoId);
        return ultimoId.toString().padStart(8, "0");
      }
    } catch (error) {
      console.error("Error al obtener último ID:", error);
      let ultimoId = parseInt(localStorage.getItem("ultimoIdPaciente")) || 0;
      ultimoId++;
      localStorage.setItem("ultimoIdPaciente", ultimoId);
      return ultimoId.toString().padStart(8, "0");
    }
  }

  // Manejo del botón de Urgencias
  const urgenciasBtn = document.getElementById("urgenciasBtn");
  if (urgenciasBtn) {
    urgenciasBtn.addEventListener("click", async () => {
      const confirmacion = confirm(
        "¿Estás seguro que quieres generar un paciente temporal para urgencias?"
      );
      if (!confirmacion) return;

      try {
        const response = await fetch("/admisiones/generar-temporal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Cuerpo vacío, ya que no se necesitan datos
        });

        const data = await response.json();
        if (response.ok) {
          alert(
            `Paciente temporal creado con éxito. DNI: ${data.paciente.dni}`
          );
          // Actualizar select de pacientes si es necesario
          const pacienteIdSelect = document.getElementById("paciente_id");
          if (pacienteIdSelect) {
            const option = document.createElement("option");
            option.value = data.paciente.id;
            option.textContent = `${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`;
            pacienteIdSelect.appendChild(option);
            pacienteIdSelect.value = data.paciente.id;
          }
          // Actualizar campo de búsqueda si es necesario
          const pacienteSearchInput =
            document.getElementById("paciente_search");
          if (pacienteSearchInput) {
            pacienteSearchInput.value = `${data.paciente.dni}`;
          }
        } else {
          alert(`Error al generar paciente temporal: ${data.message}`);
        }
      } catch (error) {
        console.error("Error al generar paciente temporal:", error);
        alert("Error de conexión");
      }
    });
  }

  // Manejo del formulario de Nuevo Paciente
  const formPaciente = document.getElementById("nuevoPacienteForm");
  if (formPaciente) {
    formPaciente.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validaciones en el frontend
      let hasErrors = false;
      const nombre = document.getElementById("nombre").value.trim();
      if (!nombre) {
        document.getElementById("nombreError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("nombreError").style.display = "none";
      }

      const apellido = document.getElementById("apellido").value.trim();
      if (!apellido) {
        document.getElementById("apellidoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("apellidoError").style.display = "none";
      }

      const dni = document.getElementById("dni").value.trim();
      if (!/^\d{7,8}$/.test(dni)) {
        document.getElementById("dniError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("dniError").style.display = "none";
      }

      const email = document.getElementById("email").value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("emailError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("emailError").style.display = "none";
      }

      const password = document.getElementById("password").value.trim();
      if (!password || password.length < 6) {
        document.getElementById("passwordError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("passwordError").style.display = "none";
      }

      const telefono = document.getElementById("telefono").value.trim();
      if (telefono && !/^\d{10,15}$/.test(telefono)) {
        document.getElementById("telefonoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("telefonoError").style.display = "none";
      }

      const administrativoId = document.getElementById(
        "administrativo_id_paciente"
      ).value;
      if (!administrativoId) {
        document.getElementById("administrativoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("administrativoError").style.display = "none";
      }

      const obraSocialId = document.getElementById("obra_social_id").value;
      if (obraSocialId && isNaN(obraSocialId)) {
        document.getElementById("obraSocialError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("obraSocialError").style.display = "none";
      }

      const fechaNacimiento = document.getElementById("fecha_nacimiento").value;
      if (!fechaNacimiento) {
        document.getElementById("fechaNacimientoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("fechaNacimientoError").style.display = "none";
      }

      const sexo = document.getElementById("sexo").value;
      if (!sexo) {
        document.getElementById("sexoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("sexoError").style.display = "none";
      }

      const fechaIngreso = document.getElementById("fecha_ingreso").value;
      if (!fechaIngreso) {
        document.getElementById("fechaIngresoError").style.display = "block";
        hasErrors = true;
      } else {
        document.getElementById("fechaIngresoError").style.display = "none";
      }
      const estado = document.getElementById("estado")?.value || "Activo";
      const observaciones =
        document.getElementById("observaciones")?.value.trim() || null;

      if (hasErrors) {
        alert("Por favor, corrige los errores en el formulario");
        return;
      }

      const submitBtn = formPaciente.querySelector('button[type="submit"]');
      submitBtn.classList.add("cargando");
      submitBtn.disabled = true;

      const pacienteData = {
        nombre,
        apellido,
        dni,
        email,
        password,
        telefono: telefono || null,
        administrativo_id: parseInt(administrativoId),
        obra_social_id: obraSocialId ? parseInt(obraSocialId) : null,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        fecha_ingreso: fechaIngreso,
        estado,
        observaciones,
      };
      console.log("Datos enviados:", pacienteData);

      try {
        const response = await fetch("/admisiones/nuevo-paciente", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pacienteData),
        });

        const data = await response.json();
        if (response.ok) {
          alert(
            `Paciente creado con éxito: ${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`
          );
          formPaciente.reset();
          const pacienteIdSelect = document.getElementById("paciente_id");
          if (pacienteIdSelect) {
            const option = document.createElement("option");
            option.value = data.paciente.id;
            option.textContent = `${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`;
            pacienteIdSelect.appendChild(option);
            pacienteIdSelect.value = data.paciente.id;
          }
          const pacienteSearchInput =
            document.getElementById("paciente_search");
          if (pacienteSearchInput) {
            pacienteSearchInput.value = `${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`;
          }
        } else {
          alert(data.message || "Error al crear paciente");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión");
      } finally {
        submitBtn.classList.remove("cargando");
        submitBtn.disabled = false;
      }
    });
  }

  // Manejo del formulario de Nueva Admisión
  const buscarPacienteBtn = document.getElementById("buscar_paciente");
  const pacienteSearch = document.getElementById("paciente_search");
  const pacienteIdInput = document.getElementById("paciente_id");
  const pacienteInfo = document.getElementById("paciente_info");
  const pacienteNombre = document.getElementById("paciente_nombre");

  if (buscarPacienteBtn) {
    buscarPacienteBtn.addEventListener("click", async () => {
      const dni = pacienteSearch.value.trim();
      
      if (!dni || !/^\d{7,8}$/.test(dni)) {
        pacienteInfo.style.display = "none";
        pacienteIdInput.value = "";
        buscarPacienteBtn.classList.remove(
          "btn-outline-success",
          "btn-outline-danger"
        );
        buscarPacienteBtn.classList.add("btn-outline-secondary");
        buscarPacienteBtn.textContent = "Buscar";
        alert("Por favor, ingrese un DNI válido (7 u 8 dígitos)");
        return;
      }

      try {
        const response = await fetch(
          `/admisiones/pacientes/buscar?dni=${dni}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();
        console.log("Datos recibidos:", data); 
        
        if (response.ok && data.paciente) {
          pacienteNombre.textContent = `Paciente encontrado: ${data.paciente.nombre} ${data.paciente.apellido} (DNI: ${data.paciente.dni})`;
          pacienteInfo.style.display = "block";
          pacienteIdInput.value = data.paciente.id;
          buscarPacienteBtn.classList.remove(
            "btn-outline-danger",
            "btn-outline-secondary"
          );
          buscarPacienteBtn.classList.add("btn-outline-success");
          buscarPacienteBtn.textContent = "Paciente encontrado";
        } else {
          pacienteInfo.style.display = "none";
          pacienteIdInput.value = "";
          buscarPacienteBtn.classList.remove(
            "btn-outline-success",
            "btn-outline-secondary"
          );
          buscarPacienteBtn.classList.add("btn-outline-danger");
          buscarPacienteBtn.textContent = "Paciente no encontrado";
          alert(data.message || "Paciente no encontrado");
        }
      } catch (error) {
        console.error("Error al buscar paciente:", error);
        pacienteInfo.style.display = "none";
        pacienteIdInput.value = "";
        buscarPacienteBtn.classList.remove(
          "btn-outline-success",
          "btn-outline-secondary"
        );
        buscarPacienteBtn.classList.add("btn-outline-danger");
        buscarPacienteBtn.textContent = "Error al buscar";
        alert("Error de conexión al buscar paciente");
      }
    });
  }
  const formAdmision = document.getElementById("nuevaAdmisionForm");
  const turno_fecha = document.getElementById("turno_fecha");
  const medicoSelect = document.getElementById("medico_id"); 
  const sectorSelect = document.getElementById("sector_id");
  const turnoHoraSelect = document.getElementById("turno_hora");
  // Actualizar horarios disponibles dinámicamente
  async function actualizarHorariosDisponibles() {
  const fecha = turno_fecha.value;
  const medicoId = medicoSelect?.value;
  const sectorId = sectorSelect?.value;
  
  if (!fecha || !medicoId || !sectorId) {
    turnoHoraSelect.innerHTML = '<option value="">Seleccione fecha, médico y sector</option>';
    return;
  }

  try {
    const response = await fetch(
      `/admisiones/horarios-disponibles?fecha=${fecha}&medico_id=${medicoId}&sector_id=${sectorId}`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener horarios');
    }
    
    const data = await response.json();
    
    // Asegúrate de que data.horariosDisponibles existe
    if (!data.horariosDisponibles) {
      throw new Error('Formato de respuesta inválido');
    }

    turnoHoraSelect.innerHTML = '<option value="">Seleccione un horario</option>';
    
    data.horariosDisponibles.forEach(hora => {
      const option = document.createElement('option');
      option.value = hora;
      option.textContent = hora;
      turnoHoraSelect.appendChild(option);
    });

  } catch (error) {
    console.error('Error:', error);
    turnoHoraSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
    alert('No se pudieron cargar los horarios. Intente nuevamente.');
  }
}
  // Escuchar cambios en fecha, médico y sector
  turno_fecha.addEventListener("change", actualizarHorariosDisponibles);
  medicoSelect.addEventListener("change", actualizarHorariosDisponibles);
  sectorSelect.addEventListener("change", actualizarHorariosDisponibles);

  // Manejo del envío del formulario

  formAdmision.addEventListener('submit', async (e) => {
  e.preventDefault();
 
  const tipoEstudioId = document.getElementById('tipo_estudio_id').value;
  const especialidadId = document.getElementById('especialidad_id').value;
  
 // Validaciones en el frontend
  let hasErrors = false;
  if (!pacienteIdInput.value) {
    document.getElementById('pacienteError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('pacienteError').style.display = 'none';
  }

  const administrativoId = document.getElementById('administrativo_id').value;
  if (!administrativoId) {
    document.getElementById('administrativoAdmisionError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('administrativoAdmisionError').style.display = 'none';
  }

  const motivoId = document.getElementById('motivo_id').value;
  if (!motivoId) {
    document.getElementById('motivoError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('motivoError').style.display = 'none';
  }

  const formaIngresoId = document.getElementById('forma_ingreso_id').value;
  if (!formaIngresoId) {
    document.getElementById('formaIngresoError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('formaIngresoError').style.display = 'none';
  }

  const fechaAdmision = document.getElementById('fecha_admision').value;
  if (!fechaAdmision) {
    document.getElementById('fechaAdmisionError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('fechaAdmisionError').style.display = 'none';
  }

  const tipoTurnoId = document.getElementById('tipo_turno_id').value;
  if (!tipoTurnoId) {
    document.getElementById('tipoTurnoError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('tipoTurnoError').style.display = 'none';
  }

  const medicoId = document.getElementById('medico_id').value; 
  if (!medicoId) {
    document.getElementById('medicoError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('medicoError').style.display = 'none';
  }

  const sectorId = document.getElementById('sector_id').value;
  if (!sectorId) {
    document.getElementById('sectorError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('sectorError').style.display = 'none';
  }

  const turnoFecha = document.getElementById('turno_fecha').value;
  if (!turnoFecha) {
    document.getElementById('turnoFechaError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('turnoFechaError').style.display = 'none';
  }

  const turnoHora = document.getElementById('turno_hora').value;
  if (!turnoHora) {
    document.getElementById('turnoHoraError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('turnoHoraError').style.display = 'none';
  }

  const listaEsperaTipo = document.getElementById('lista_espera_tipo').value;
  if (!listaEsperaTipo) {
    document.getElementById('listaEsperaError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('listaEsperaError').style.display = 'none';
  }

  const prioridad = document.getElementById('prioridad').value;
  if (!prioridad) {
    document.getElementById('prioridadError').style.display = 'block';
    hasErrors = true;
  } else {
    document.getElementById('prioridadError').style.display = 'none';
  }

  if (hasErrors) {
    alert('Por favor, corrige los errores en el formulario');
    return;
  }

  // Crear el objeto admisionData
 const admisionData = {
    paciente_id: parseInt(pacienteIdInput.value),
    administrativo_id: parseInt(administrativoId),
    motivo_id: parseInt(motivoId),
    forma_ingreso_id: parseInt(formaIngresoId),
    fecha: fechaAdmision,
    tipo_turno_id: parseInt(tipoTurnoId),
    medico_id: parseInt(medicoId),
    sector_id: parseInt(sectorId),
    turno_fecha: turnoFecha,
    turno_hora: turnoHora,
    lista_espera_tipo: listaEsperaTipo,
    tipo_estudio_id: tipoEstudioId ? parseInt(tipoEstudioId) : null,
    especialidad_id: especialidadId ? parseInt(especialidadId) : null,
    prioridad: parseInt(prioridad)
  };

  console.log('Datos enviados:', admisionData);

  const submitBtn = formAdmision.querySelector('button[type="submit"]');
  submitBtn.classList.add('cargando');
  submitBtn.disabled = true;

  //fech 
  try {
  const response = await fetch('/admisiones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admisionData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error en la respuesta del servidor');
  }
  
  const data = await response.json();
if (data.internacionId) {
      // Mostrar modal especial para internación
      mostrarModalInternacion({
        mensaje: data.message,
        direccion: data.direccionPaciente,
        internacionId: data.internacionId
      });
    } else {
      // admision
      alert(data.message || 'Admisión creada exitosamente');
    }
    
    resetearFormularioAdmision();
    
  } catch (error) {
    console.error('Error detallado:', error);
     alert('No hay camas disponibles en el sector seleccionado. Por favor, elija otro sector.');
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.classList.remove('cargando');
    submitBtn.disabled = false;
  }
});

// Función para mostrar modal de internación
function mostrarModalInternacion({ mensaje, direccion, internacionId }) {
  // Crear o mostrar un modal existente
  const modal = document.getElementById('modalInternacion') || crearModalInternacion();
  
  // Configurar contenido
  document.getElementById('modalInternacionTitulo').textContent = 'Internación Automática';
  document.getElementById('modalInternacionMensaje').textContent = mensaje;
  document.getElementById('modalInternacionDireccion').textContent = direccion;
  document.getElementById('modalInternacionId').textContent = `ID de Internación: ${internacionId}`;
  
  // Mostrar modal
  const respuestaInternacion = new bootstrap.Modal(modal);
  respuestaInternacion.show();
}

// Función para crear el modal
function crearModalInternacion() {
  const modalHTML = `
    <div class="modal fade" id="modalInternacion" tabindex="-1" aria-labelledby="modalInternacionLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="modalInternacionTitulo"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-success">
              <p id="modalInternacionMensaje"></p>
              <p><strong id="modalInternacionDireccion"></strong></p>
              <p id="modalInternacionId"></p>
            </div>
            <div class="text-center mt-3">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                Entendido
              </button>
              <button type="button" class="btn btn-outline-secondary ms-2" onclick="imprimirInternacion()">
                <i class="bi bi-printer-fill"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // modal al body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  return document.getElementById('modalInternacion');
}

// Función para imprimir 
window.imprimirInternacion = function() {
  const printContent = `
    <h3>Internación Registrada</h3>
    <p>${document.getElementById('modalInternacionMensaje').textContent}</p>
    <p><strong>${document.getElementById('modalInternacionDireccion').textContent}</strong></p>
    <p>${document.getElementById('modalInternacionId').textContent}</p>
    <p>Fecha: ${new Date().toLocaleString()}</p>
  `;
  
  const ventana = window.open('', '_blank');
  ventana.document.write(printContent);
  ventana.document.close();
  ventana.print();
};
function resetearFormularioAdmision() {
  const nuevaAdmisionForm = document.getElementById('nuevaAdmisionForm');
  if (nuevaAdmisionForm) nuevaAdmisionForm.reset();
  else console.error('Formulario no encontrado: nuevaAdmisionForm');

  const pacienteSearch = document.getElementById('pacienteSearch');
  if (pacienteSearch) pacienteSearch.value = '';
  else console.error('Elemento no encontrado: pacienteSearch');

  const pacienteInfo = document.getElementById('pacienteInfo');
  if (pacienteInfo) pacienteInfo.style.display = 'none';
  else console.error('Elemento no encontrado: pacienteInfo');

  const pacienteId = document.getElementById('paciente_id');
  if (pacienteId) pacienteId.value = '';
  else console.error('Elemento no encontrado: paciente_id');

  const buscarBtn = document.getElementById('buscarPacienteBtn');
  if (buscarBtn) {
    buscarBtn.classList.remove('btn-outline-success', 'btn-outline-danger');
    buscarBtn.classList.add('btn-outline-secondary');
    buscarBtn.textContent = 'Buscar';
  } else {
    console.error('Botón no encontrado: buscarPacienteBtn');
  }

  document.querySelectorAll('.error-message').forEach(el => {
    el.style.display = 'none';
  });
}

  // Manejo de edición y eliminación de admisiones
  const editarAdmisionButtons = document.querySelectorAll(
    '[data-bs-target="#editarAdmisionModal"]'
  );
  editarAdmisionButtons.forEach((button) => {
    
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
       console.log("ID obtenido del botón:", id); 
       console.log("ID obtenido del botón:", button);
      try {
        const response = await fetch(`/admisiones/${id}`);
        console.log("URL solicitada:", `/admisiones/${id}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
    
        const admision = await response.json();
        if (response.ok) {
          document.querySelector('#editarAdmisionForm input[name="id"]').value =
            admision.id;
          document.getElementById("edit_paciente_id").value =
            admision.paciente_id;
          document.getElementById("edit_administrativo_id").value =
            admision.administrativo_id;
          document.getElementById("edit_motivo_id").value = admision.motivo_id;
          document.getElementById("edit_forma_ingreso_id").value =
            admision.forma_ingreso_id;
          document.getElementById("edit_turno_id").value =
            admision.turno_id || "";
          document.getElementById("edit_fecha").value = admision.fecha
            ? admision.fecha.split("T")[0]
            : "";
          document.getElementById("edit_estado").value = admision.estado;
        } else {
          alert("Error al cargar datos de la admisión");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar datos de la admisión");
      }
    });
  });

  const editarAdmisionForm = document.getElementById("editarAdmisionForm");
  if (editarAdmisionForm) {
    editarAdmisionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(editarAdmisionForm);
      const data = Object.fromEntries(formData);
      try {
        const response = await fetch(`/admisiones/editar/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
          alert("Admisión actualizada con éxito");
          window.location.reload();
        } else {
          alert(result.message || "Error al actualizar admisión");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al actualizar admisión");
      }
    });
  }

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

  // Manejo de filtros
  const filtroEstado = document.getElementById("filtro_estado");
  const filtroPaciente = document.getElementById("filtro_paciente");
  const filtroFecha = document.getElementById("filtro_fecha");
  const filtroMotivo = document.getElementById("filtro_motivo");

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
});
