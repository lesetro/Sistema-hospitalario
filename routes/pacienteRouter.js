const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { Medico, Usuario } = require('../models');

router.get('/', pacienteController.getAllPacientes);
router.get('/new', (req, res) => res.render('pacienteForm', { title: 'Nuevo Paciente' }));
router.post('/', pacienteController.crearPacienteNoUsuario);
router.get('/:pacienteId/turno', async (req, res) => {
  const medicos = await Medico.findAll({ include: [{ model: Usuario, as: 'usuario' }] });
  res.render('pacienteTurnoForm', {
    pacienteId: req.params.pacienteId,
    medicos: medicos.map(m => m.get({ plain: true })),
  });
});
router.post('/:pacienteId/turno', pacienteController.sacarTurnoParaPaciente);
router.get('/:pacienteId/estudios', pacienteController.verEstudiosPaciente);

module.exports = router;