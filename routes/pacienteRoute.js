// routes/pacientes.js
const express = require('express');
const router = express.Router();
const { Paciente, Usuario, ObraSocial, Administrativo } = require('../models');
const bcrypt = require('bcrypt');

// GET - Buscar paciente por DNI
router.get('/buscar', async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni) {
      return res.status(400).json({ message: 'DNI es requerido' });
    }
    
    const paciente = await Paciente.findOne({ 
      where: { dni },
      include: [
        {
          model: ObraSocial,
          as: 'obraSocial',
          required: false
        }
      ]
    });
    
    if (paciente) {
      res.json({ 
        success: true,
        paciente: {
          id: paciente.id,
          nombre: paciente.nombre,
          dni: paciente.dni,
          obra_social: paciente.obraSocial ? paciente.obraSocial.nombre : 'Sin obra social'
        }
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

// POST - Crear nuevo paciente
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      telefono,
      administrativo_id,
      obra_social_id,
      fecha_nacimiento,
      sexo,
      fecha_ingreso,
      estado,
      observaciones
    } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !sexo || !fecha_ingreso || !administrativo_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios faltantes: nombre, apellido, DNI, email, contraseña, fecha de nacimiento, sexo, fecha de ingreso y administrativo son requeridos'
      });
    }

    // Validar formato DNI
    if (!/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI debe tener 7 u 8 dígitos'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar teléfono si se proporciona
    if (telefono && !/^\d{10,15}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono debe tener entre 10 y 15 dígitos'
      });
    }

    // Verificar si el DNI ya existe
    const existingPaciente = await Paciente.findOne({ where: { dni } });
    if (existingPaciente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un paciente con este DNI'
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await Usuario.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Verificar que existe el administrativo
    const administrativo = await Administrativo.findByPk(administrativo_id);
    if (!administrativo) {
      return res.status(400).json({
        success: false,
        message: 'Administrativo no encontrado'
      });
    }

    // Verificar que existe la obra social si se proporciona
    if (obra_social_id) {
      const obraSocial = await ObraSocial.findByPk(obra_social_id);
      if (!obraSocial) {
        return res.status(400).json({
          success: false,
          message: 'Obra social no encontrada'
        });
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario primero
    const usuario = await Usuario.create({
      email,
      password: hashedPassword,
      rol: 'paciente',
      nombre: `${nombre} ${apellido}`,
      telefono: telefono || null,
      estado: 'activo'
    });

    // Crear paciente
    const paciente = await Paciente.create({
      dni,
      nombre: `${nombre} ${apellido}`,
      usuario_id: usuario.id,
      administrativo_id,
      obra_social_id: obra_social_id || null,
      fecha_nacimiento,
      sexo,
      fecha_ingreso,
      fecha_egreso: null,
      estado: estado || 'Activo',
      observaciones: observaciones || null
    });

    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        dni: paciente.dni,
        estado: paciente.estado
      }
    });

  } catch (error) {
    console.error('Error al crear paciente:', error);
    
    // Si es error de validación de Sequelize
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: error.errors ? error.errors[0].message : error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear paciente'
    });
  }
});

// GET - Obtener todos los pacientes
router.get('/', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      include: [
        {
          model: ObraSocial,
          as: 'obraSocial',
          required: false
        },
        {
          model: Administrativo,
          as: 'administrativo',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      pacientes
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes'
    });
  }
});

// GET - Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: ObraSocial,
          as: 'obraSocial',
          required: false
        },
        {
          model: Administrativo,
          as: 'administrativo',
          required: false
        },
        {
          model: Usuario,
          as: 'usuario',
          required: false
        }
      ]
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      paciente
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener paciente'
    });
  }
});

module.exports = router;