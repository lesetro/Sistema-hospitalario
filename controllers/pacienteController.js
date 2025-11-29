// controllers/pacientesController.js
const SearchPaginationService = require('../services/searchPaginationService');
const { Paciente, Usuario } = require('../models');

// Configurar servicio para pacientes
const pacienteSearchService = new SearchPaginationService(
  Paciente,
  ['$usuario.dni$', '$usuario.nombre$', '$usuario.apellido$'], // Campos de búsqueda
  [{ model: Usuario, as: 'usuario', attributes: ['dni', 'nombre', 'apellido'] }] // Includes
);

const getPacientes = async (req, res) => {
  try {
    const result = await pacienteSearchService.search(req.query);
    
    res.render('dashboard/admin/pacientes', {
      title: 'Pacientes',
      pacientes: result.data,
      pagination: result.pagination,
      searchTerm: req.query.search || ''
    });
  } catch (error) {
    console.error('Error en getPacientes:', error);
    res.status(500).json({ message: 'Error al obtener pacientes', error: error.message });
  }
};