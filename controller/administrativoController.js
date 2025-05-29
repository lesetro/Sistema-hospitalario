// controllers/pacienteController.js
const { Paciente, Administrativo, Turno, Estudio } = require('../models');

exports.crearPacienteNoUsuario = async (req, res) => {
  try {
    const { dni, nombre } = req.body;
    const administrativoId = req.user.administrativo.id; // Asumiendo que req.user contiene el Usuario autenticado y su Administrativo

    const paciente = await Paciente.create({
      dni,
      nombre,
      administrativo_id: administrativoId,
      usuario_id: null, // No está asociado a un Usuario
    });

    res.redirect('/pacientes'); // Redirige a la lista de pacientes
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).send('Error en el servidor');
  }
};

exports.getAllPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      include: [
        { model: Administrativo, as: 'administrativo', include: [{ model: Usuario, as: 'usuario' }] },
        { model: Usuario, as: 'usuario' },
      ],
    });
    const pacientesJSON = pacientes.map(p => p.get({ plain: true }));
    res.render('pacientes', { pacientes: pacientesJSON });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).send('Error en el servidor');
  }
};

exports.sacarTurnoParaPaciente = async (req, res) => {
  try {
    const { pacienteId, medicoId, fecha } = req.body;
    const administrativoId = req.user.administrativo.id;

    // Verificar que el paciente pertenece al administrativo
    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente || (paciente.administrativo_id !== administrativoId && paciente.usuario_id)) {
      return res.status(403).send('No tienes permiso para gestionar este paciente');
    }

    await Turno.create({
      paciente_id: pacienteId,
      medico_id: medicoId,
      fecha,
    });

    res.redirect(`/pacientes/${pacienteId}`);
  } catch (error) {
    console.error('Error al sacar turno:', error);
    res.status(500).send('Error en el servidor');
  }
};

exports.verEstudiosPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const administrativoId = req.user.administrativo.id;

    // Verificar permisos
    const paciente = await Paciente.findByPk(pacienteId, {
      include: [{ model: Estudio, as: 'estudios' }],
    });
    if (!paciente || (paciente.administrativo_id !== administrativoId && paciente.usuario_id)) {
      return res.status(403).send('No tienes permiso para ver este paciente');
    }

    res.render('pacienteEstudios', { paciente: paciente.get({ plain: true }) });
  } catch (error) {
    console.error('Error al ver estudios:', error);
    res.status(500).send('Error en el servidor');
  }
};