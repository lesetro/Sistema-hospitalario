// ============================================
// VARIABLES GLOBALES
// ============================================
let pacienteSeleccionado = null;

// ============================================
// INTERNACIÓN
// ============================================
function abrirModalInternar(camaId, numHabitacion, numCama) {
    // Resetear modal
    document.getElementById('cama-id-internar').value = camaId;
    document.getElementById('info-cama-internar').innerHTML = `Habitación ${numHabitacion}, Cama ${numCama}`;
    document.getElementById('dni-paciente-internar').value = '';
    document.getElementById('info-paciente-internar').style.display = 'none';
    document.getElementById('seccion-datos-internacion').style.display = 'none';
    document.getElementById('paciente-id-internar').value = '';
    document.getElementById('tipo-internacion').value = '';
    document.getElementById('diagnostico-ingreso').value = '';
    document.getElementById('observaciones-internacion').value = '';
    
    // Abrir modal
    new bootstrap.Modal(document.getElementById('modalInternarPaciente')).show();
}

function buscarPacienteParaInternar() {
    const dni = document.getElementById('dni-paciente-internar').value.trim();
    
    if (!dni) {
        Swal.fire('Error', 'Ingrese un DNI', 'error');
        return;
    }
    
    fetch(`/medico/pacientes/buscar-por-dni/${dni}`)
        .then(response => {
            if (!response.ok) throw new Error('Paciente no encontrado');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                pacienteSeleccionado = data.paciente;
                document.getElementById('paciente-id-internar').value = data.paciente.id;
                
                // Mostrar información del paciente
                const infoDiv = document.getElementById('info-paciente-internar');
                infoDiv.innerHTML = `
                    <div class="alert alert-success">
                        <strong>Paciente encontrado:</strong><br>
                        ${data.paciente.usuario.nombre} ${data.paciente.usuario.apellido}<br>
                        <small>DNI: ${data.paciente.usuario.dni}</small>
                    </div>
                `;
                infoDiv.style.display = 'block';
                
                // Mostrar sección de datos de internación
                document.getElementById('seccion-datos-internacion').style.display = 'block';
            }
        })
        .catch(error => {
            Swal.fire('Error', error.message, 'error');
            document.getElementById('info-paciente-internar').innerHTML = `
                <div class="alert alert-danger">
                    Paciente no encontrado. <a href="/medico/pacientes/nuevo">¿Registrar nuevo paciente?</a>
                </div>
            `;
            document.getElementById('info-paciente-internar').style.display = 'block';
        });
}

function confirmarInternacion() {
    const camaId = document.getElementById('cama-id-internar').value;
    const pacienteId = document.getElementById('paciente-id-internar').value;
    const tipoInternacionId = document.getElementById('tipo-internacion').value;
    const diagnosticoIngreso = document.getElementById('diagnostico-ingreso').value;
    const observaciones = document.getElementById('observaciones-internacion').value;
    
    if (!pacienteId) {
        Swal.fire('Error', 'Debe buscar y seleccionar un paciente', 'error');
        return;
    }
    
    if (!tipoInternacionId || !diagnosticoIngreso) {
        Swal.fire('Error', 'Complete todos los campos requeridos', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Confirmar internación',
        text: '¿Está seguro de internar a este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, internar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/medico/internaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cama_id: camaId,
                    paciente_id: pacienteId,
                    tipo_internacion_id: tipoInternacionId,
                    diagnostico_ingreso: diagnosticoIngreso,
                    observaciones: observaciones
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Internado!',
                        text: 'El paciente ha sido internado exitosamente',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    throw new Error(data.message || 'Error al internar');
                }
            })
            .catch(error => {
                Swal.fire('Error', error.message, 'error');
            });
        }
    });
}

// ============================================
// DERIVACIÓN
// ============================================
function abrirModalDerivar(internacionId, nombrePaciente) {
    document.getElementById('internacion-id-derivar').value = internacionId;
    document.getElementById('paciente-nombre-derivar').innerHTML = nombrePaciente;
    document.getElementById('sector-destino').value = '';
    document.getElementById('motivo-derivacion').value = '';
    
    new bootstrap.Modal(document.getElementById('modalDerivarSector')).show();
}

function confirmarDerivacion() {
    const internacionId = document.getElementById('internacion-id-derivar').value;
    const sectorDestinoId = document.getElementById('sector-destino').value;
    const motivoDerivacion = document.getElementById('motivo-derivacion').value;
    
    if (!sectorDestinoId || !motivoDerivacion) {
        Swal.fire('Error', 'Complete todos los campos', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Confirmar derivación',
        text: '¿Está seguro de derivar a este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, derivar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/medico/internaciones/derivar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    internacion_id: internacionId,
                    sector_destino_id: sectorDestinoId,
                    motivo: motivoDerivacion
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Derivado!',
                        text: 'El paciente ha sido derivado exitosamente',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    throw new Error(data.message || 'Error al derivar');
                }
            })
            .catch(error => {
                Swal.fire('Error', error.message, 'error');
            });
        }
    });
}

// ============================================
// ALTA MÉDICA
// ============================================
function abrirModalAlta(internacionId, nombrePaciente) {
    document.getElementById('internacion-id-alta').value = internacionId;
    document.getElementById('paciente-nombre-alta').innerHTML = nombrePaciente;
    document.getElementById('diagnostico-egreso').value = '';
    document.getElementById('indicaciones-medicas').value = '';
    
    new bootstrap.Modal(document.getElementById('modalDarAlta')).show();
}

function confirmarAlta() {
    const internacionId = document.getElementById('internacion-id-alta').value;
    const diagnosticoEgreso = document.getElementById('diagnostico-egreso').value;
    const indicacionesMedicas = document.getElementById('indicaciones-medicas').value;
    
    if (!diagnosticoEgreso) {
        Swal.fire('Error', 'El diagnóstico de egreso es requerido', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Confirmar alta',
        text: '¿Está seguro de dar de alta a este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, dar de alta',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/medico/internaciones/alta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    internacion_id: internacionId,
                    diagnostico_egreso: diagnosticoEgreso,
                    indicaciones_medicas: indicacionesMedicas
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Alta dada!',
                        text: 'El paciente ha sido dado de alta exitosamente',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    throw new Error(data.message || 'Error al dar de alta');
                }
            })
            .catch(error => {
                Swal.fire('Error', error.message, 'error');
            });
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de servicio cargado');
});