// Mis Turnos

// Ver turnos de un día específico
async function verTurnosDia(fecha) {
  try {
    const response = await fetch(`/enfermero/mis-turnos/api/turnos-dia?fecha=${fecha}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarTurnosDia(data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Mostrar turnos del día en modal
function mostrarTurnosDia(data) {
  let html = `
    <h5>${data.dia}</h5>
    <p class="text-muted">${data.fecha}</p>
  `;
  
  if (data.turnos.length > 0) {
    html += '<div class="list-group">';
    data.turnos.forEach(turno => {
      html += `
        <div class="list-group-item">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-1">${turno.tipo}</h6>
              <p class="mb-1">${turno.hora_inicio.substring(0,5)} - ${turno.hora_fin.substring(0,5)}</p>
              <small class="text-muted">${turno.sector}</small>
            </div>
            <a href="/enfermero/mis-turnos/${turno.id}" class="btn btn-sm btn-primary">
              <i class="fas fa-eye"></i>
            </a>
          </div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<p class="text-muted">No tiene turnos asignados para este día</p>';
  }
  
  // Mostrar en modal (si existe)
  console.log('Turnos del día:', data);
}

// Ver semana completa
async function verSemanaCompleta() {
  try {
    const response = await fetch('/enfermero/mis-turnos/api/turnos-semana');
    const data = await response.json();
    
    if (data.success) {
      console.log('Semana completa:', data.semana);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Marcar día actual en el calendario
document.addEventListener('DOMContentLoaded', function() {
  // El día actual ya está marcado con la clase table-primary en el backend
  console.log('Calendario de turnos cargado');
});

// Imprimir calendario
function imprimirCalendario() {
  window.print();
}

// Estilos de impresión (agregar al head si es necesario)
const estilosImpresion = `
  @media print {
    .btn, .navbar, .sidebar {
      display: none !important;
    }
    #calendario-turnos {
      page-break-inside: avoid;
    }
  }
`;