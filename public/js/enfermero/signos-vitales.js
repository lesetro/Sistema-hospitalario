// Signos Vitales - Lista de pacientes

// Actualizar lista
function actualizarLista() {
  location.reload();
}

// Ver últimos signos vitales
async function verUltimosSignos(pacienteId) {
  const modal = new bootstrap.Modal(document.getElementById('modalUltimosSignos'));
  modal.show();
  
  try {
    const response = await fetch(`/enfermero/signos-vitales/api/ultimos/${pacienteId}`);
    const data = await response.json();
    
    if (data.success) {
      mostrarSignos(data);
    } else {
      document.getElementById('contenido-signos').innerHTML = '<p class="text-center text-muted">No hay signos vitales registrados</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('contenido-signos').innerHTML = '<p class="text-center text-danger">Error al cargar los datos</p>';
  }
}

// Mostrar signos vitales en modal
function mostrarSignos(data) {
  const html = `
    <div class="row g-3">
      <div class="col-12">
        <p class="text-muted mb-3">
          <small><i class="fas fa-clock me-2"></i>${new Date(data.fecha).toLocaleString('es-AR')}</small><br>
          <small><i class="fas fa-user-nurse me-2"></i>${data.enfermero}</small>
        </p>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-heart fa-2x text-danger mb-2"></i>
            <h4>${data.signos.presion_arterial}</h4>
            <small class="text-muted">Presión Arterial</small>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-heartbeat fa-2x text-danger mb-2"></i>
            <h4>${data.signos.frecuencia_cardiaca} <small>lpm</small></h4>
            <small class="text-muted">Frecuencia Cardíaca</small>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-thermometer-half fa-2x text-warning mb-2"></i>
            <h4>${data.signos.temperatura} <small>°C</small></h4>
            <small class="text-muted">Temperatura</small>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-wind fa-2x text-info mb-2"></i>
            <h4>${data.signos.saturacion_oxigeno} <small>%</small></h4>
            <small class="text-muted">SpO2</small>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-lungs fa-2x text-primary mb-2"></i>
            <h4>${data.signos.frecuencia_respiratoria} <small>rpm</small></h4>
            <small class="text-muted">Frecuencia Respiratoria</small>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-face-frown fa-2x text-secondary mb-2"></i>
            <h4>${data.signos.dolor} <small>/10</small></h4>
            <small class="text-muted">Dolor</small>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contenido-signos').innerHTML = html;
}