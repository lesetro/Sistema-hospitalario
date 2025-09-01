const { Paciente } = require('../models'); // Asegúrate de que la importación del modelo es correcta

const getPacientes = async (req, res) => {
  try {
    console.log('🟡 Obteniendo lista de pacientes...');
    
    // Incluir información del usuario si existe esa relación
    //const pacientes = await Paciente.findAll({
      //include: ['usuario'] 
    //});
    
    console.log(`✅ ${pacientes.length} pacientes encontrados`);
    
    res.render('dashboard/admin/pacientes', { 
      title: 'Gestión de Pacientes', 
      pacientes,
      user: req.user || null // Pasar información del usuario si está disponible
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la lista de pacientes',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Otros métodos del controlador si los necesitas
const createPaciente = async (req, res) => {
  // Lógica para crear paciente
};

const updatePaciente = async (req, res) => {
  // Lógica para actualizar paciente
};

const deletePaciente = async (req, res) => {
  // Lógica para eliminar paciente
};

module.exports = {
  getPacientes, // Exportar como getPacientes (plural)
  createPaciente,
  updatePaciente,
  deletePaciente
};