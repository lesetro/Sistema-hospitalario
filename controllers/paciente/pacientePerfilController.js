const db = require('../../models');

/**
 * CONTROLADOR: Perfil del Paciente
 * Gestión del perfil y datos personales
 */

// GET /paciente/perfil - Ver perfil
exports.getPerfil = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente

    const paciente = await db.Paciente.findByPk(pacienteId, {
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: { exclude: ['password'] }
        },
        {
          model: db.ObraSocial,
          as: 'obraSocial',
          attributes: ['nombre']
        }
      ]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    // Calcular edad
    const fechaNacimiento = new Date(paciente.usuario.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    res.render('dashboard/paciente/perfil', {
      title: 'Mi Perfil',
      user: req.user,
      paciente,
      edad
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    next(error);
  }
};

// GET /paciente/datos-personales - Formulario de edición
exports.getDatosPersonales = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    res.render('dashboard/paciente/perfil-editar', {
      title: 'Editar Datos Personales',
      user: req.user,
      paciente
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    next(error);
  }
};

// POST /paciente/datos-personales - Actualizar datos
exports.postDatosPersonales = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const pacienteId = req.user.id;
    const { telefono, email } = req.body;

    // Validaciones
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    if (telefono && telefono.length < 7) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener al menos 7 dígitos'
      });
    }

    const paciente = await db.Paciente.findByPk(pacienteId, {
      include: [{
        model: db.Usuario,
        as: 'usuario'
      }],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Actualizar datos del usuario
    const datosActualizar = {};
    
    if (telefono !== undefined && telefono !== paciente.usuario.telefono) {
      datosActualizar.telefono = telefono.trim() || null;
    }
    
    if (email && email !== paciente.usuario.email) {
      // Verificar que el email no esté en uso
      const emailExiste = await db.Usuario.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id: { [db.Sequelize.Op.ne]: paciente.usuario_id }
        },
        transaction
      });

      if (emailExiste) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }

      datosActualizar.email = email.toLowerCase().trim();
    }

    if (Object.keys(datosActualizar).length > 0) {
      await paciente.usuario.update(datosActualizar, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Datos actualizados correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar datos:', error);
    next(error);
  }
};

module.exports = exports;
