const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

exports.login = async (req, res) => {
  try {
    const { rol } = req.body;
    console.log('Rol seleccionado:', rol);

    switch(rol) {
      case 'Enfermero':
        return res.redirect('/dashboards/enfermero');
      case 'Paciente':
        return res.redirect('/dashboards/paciente');
      case 'Administrador':
      case 'AdministradorGeneral':
        return res.redirect('/dashboards/admin');
      case 'Medico':
        return res.redirect('/dashboards/medico');
      default:
        return res.redirect('/');
    }
  } catch (error) {
    res.status(500).render('error', {
      message: 'Error al procesar login',
      error: error.message
    });
  }
};
exports.register = async (req, res) => {
  try {
    const { dni, nombre, email, password, rol, hospital_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      dni,
      nombre,
      email,
      password: hashedPassword,
      rol,
      hospital_id
    });
    res.redirect('/auth/login');
  } catch (error) {
    res.status(400).render('auth/register', { error: error.message, title: 'Registrar Usuario' });
  }
};

exports.recuperarContrasena = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).render('auth/recuperarContrasena', { error: 'Usuario no encontrado', title: 'Recuperar Contraseña' });
    }
    usuario.password = await bcrypt.hash(newPassword, 10);
    await usuario.save();
    res.redirect('/auth/login');
  } catch (error) {
    res.status(500).render('auth/recuperarContrasena', { error: error.message, title: 'Recuperar Contraseña' });
  }
}; 