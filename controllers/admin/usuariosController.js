const { Op } = require('sequelize');
const { 
  Usuario, 
  Rol, 
  Paciente, 
  Medico, 
  Enfermero, 
  Administrativo, 
  Notificacion,
  TurnoPersonal,
  Reclamo
} = require('../../models');
const bcrypt = require('bcryptjs');

/**
 * Vista principal de usuarios
 */
const getVistaUsuarios = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/usuarios/usuarios', {
      title: 'Gestión de Usuarios',
      roles
    });
  } catch (error) {
    console.error('Error al cargar vista de usuarios:', error);
    res.status(500).render('error', {
      message: 'Error al cargar la página de usuarios'
    });
  }
};

/**
 * Obtener lista de usuarios con paginación y filtros
 */
const getListaUsuarios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      estado = '',
      rol_principal_id = '',
      sexo = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = {};

    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni: { [Op.like]: `%${busqueda}%` } },
        { email: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    if (rol_principal_id) {
      where.rol_principal_id = rol_principal_id;
    }

    if (sexo) {
      where.sexo = sexo;
    }

    // Consultar usuarios
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where,
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre']
        },
        {
          model: Rol,
          as: 'rol_secundario',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    // Obtener información de rol específico
    const usuariosConDetalle = await Promise.all(usuarios.map(async (usuario) => {
      let rolEspecifico = {};
      
      switch(usuario.rol_principal.nombre.toLowerCase()) {
        case 'paciente':
          const paciente = await Paciente.findOne({
            where: { usuario_id: usuario.id },
            attributes: ['id', 'estado', 'fecha_ingreso']
          });
          if (paciente) {
            rolEspecifico = {
              tipo: 'Paciente',
              matricula: null,
              estado: paciente.estado,
              fecha_asignacion: paciente.fecha_ingreso
            };
          }
          break;
          
        case 'médico':
        case 'medico':
          const medico = await Medico.findOne({
            where: { usuario_id: usuario.id },
            attributes: ['id', 'matricula'],
            include: [{
              model: require('../models').Especialidad,
              as: 'especialidad',
              attributes: ['nombre']
            }]
          });
          if (medico) {
            rolEspecifico = {
              tipo: 'Médico',
              matricula: medico.matricula,
              especialidad: medico.especialidad?.nombre || 'Sin especialidad'
            };
          }
          break;
          
        case 'enfermero':
          const enfermero = await Enfermero.findOne({
            where: { usuario_id: usuario.id },
            attributes: ['id', 'matricula', 'nivel', 'estado']
          });
          if (enfermero) {
            rolEspecifico = {
              tipo: 'Enfermero',
              matricula: enfermero.matricula,
              nivel: enfermero.nivel,
              estado: enfermero.estado
            };
          }
          break;
          
        case 'administrativo':
          const administrativo = await Administrativo.findOne({
            where: { usuario_id: usuario.id },
            attributes: ['id', 'responsabilidad', 'estado']
          });
          if (administrativo) {
            rolEspecifico = {
              tipo: 'Administrativo',
              responsabilidad: administrativo.responsabilidad,
              estado: administrativo.estado
            };
          }
          break;
      }

      return {
        id: usuario.id,
        dni: usuario.dni,
        nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || 'Sin teléfono',
        fecha_nacimiento: usuario.fecha_nacimiento,
        sexo: usuario.sexo,
        rol_principal: usuario.rol_principal?.nombre || 'Sin rol',
        rol_principal_id: usuario.rol_principal_id,
        rol_secundario: usuario.rol_secundario?.nombre || 'Sin rol secundario',
        estado: usuario.estado,
        created_at: usuario.created_at,
        ultimo_login: usuario.updated_at,
        rol_especifico: rolEspecifico
      };
    }));

    res.json({
      success: true,
      usuarios: usuariosConDetalle,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener detalles completos de un usuario
 */
const getDetallesUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Rol,
          as: 'rol_secundario',
          attributes: ['id', 'nombre', 'descripcion'],
          required: false
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener información específica según rol
    let rolEspecifico = {};
    let estadisticas = {};
    
    switch(usuario.rol_principal.nombre.toLowerCase()) {
      case 'paciente':
        const paciente = await Paciente.findOne({
          where: { usuario_id: id },
          include: [
            {
              model: require('../models').ObraSocial,
              as: 'obraSocial',
              attributes: ['nombre']
            }
          ]
        });
        if (paciente) {
          rolEspecifico = paciente.toJSON();
          
          // Estadísticas de paciente
          const Turno = require('../models').Turno;
          const Admision = require('../models').Admision;
          
          estadisticas = {
            totalTurnos: await Turno.count({ where: { paciente_id: paciente.id } }),
            totalAdmisiones: await Admision.count({ where: { paciente_id: paciente.id } })
          };
        }
        break;
        
      case 'médico':
      case 'medico':
        const medico = await Medico.findOne({
          where: { usuario_id: id },
          include: [
            {
              model: require('../models').Especialidad,
              as: 'especialidad',
              attributes: ['nombre']
            },
            {
              model: require('../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            }
          ]
        });
        if (medico) {
          rolEspecifico = medico.toJSON();
        }
        break;
        
      case 'enfermero':
        const enfermero = await Enfermero.findOne({
          where: { usuario_id: id },
          include: [
            {
              model: require('../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            }
          ]
        });
        if (enfermero) {
          rolEspecifico = enfermero.toJSON();
        }
        break;
        
      case 'administrativo':
        const administrativo = await Administrativo.findOne({
          where: { usuario_id: id },
          include: [
            {
              model: require('../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            },
            {
              model: require('../models').TurnoPersonal,
              as: 'turno',
              attributes: ['tipo', 'dias', 'hora_inicio', 'hora_fin']
            }
          ]
        });
        if (administrativo) {
          rolEspecifico = administrativo.toJSON();
        }
        break;
    }

    // Obtener estadísticas generales
    estadisticas = {
      ...estadisticas,
      totalNotificaciones: await Notificacion.count({
        where: { [Op.or]: [{ usuario_id: id }, { remitente_id: id }] }
      }),
      totalReclamos: await Reclamo.count({ where: { usuario_id: id } }),
      totalTurnosAsignados: await TurnoPersonal.count({ where: { usuario_id: id } })
    };

    res.json({
      success: true,
      usuario: {
        id: usuario.id,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
        email: usuario.email,
        telefono: usuario.telefono,
        fecha_nacimiento: usuario.fecha_nacimiento,
        sexo: usuario.sexo,
        rol_principal: usuario.rol_principal?.nombre || 'Sin rol',
        rol_principal_desc: usuario.rol_principal?.descripcion || '',
        rol_secundario: usuario.rol_secundario?.nombre || 'Sin rol secundario',
        rol_secundario_desc: usuario.rol_secundario?.descripcion || '',
        estado: usuario.estado,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
        edad: calcularEdad(usuario.fecha_nacimiento)
      },
      rol_especifico: rolEspecifico,
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del usuario',
      error: error.message
    });
  }
};

/**
 * Crear nuevo usuario
 */
const crearUsuario = async (req, res) => {
  const transaction = await require('../database/db').sequelize.transaction();

  try {
    const {
      dni,
      nombre,
      apellido,
      email,
      password,
      rol_principal_id,
      rol_secundario_id,
      telefono,
      fecha_nacimiento,
      sexo,
      estado = 'Activo'
    } = req.body;

    // Validar que el DNI no exista
    const dniExistente = await Usuario.findOne({
      where: { dni },
      transaction
    });

    if (dniExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El DNI ya está registrado'
      });
    }

    // Validar que el email no exista
    const emailExistente = await Usuario.findOne({
      where: { email },
      transaction
    });

    if (emailExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await Usuario.create({
      dni,
      nombre,
      apellido,
      email,
      password: hashedPassword,
      rol_principal_id,
      rol_secundario_id: rol_secundario_id || null,
      telefono: telefono || null,
      fecha_nacimiento,
      sexo,
      estado
    }, { transaction });

    // Crear registro específico según rol principal
    const rol = await Rol.findByPk(rol_principal_id, { transaction });
    
    if (rol) {
      switch(rol.nombre.toLowerCase()) {
        case 'paciente':
          await require('../models').Paciente.create({
            usuario_id: usuario.id,
            fecha_ingreso: new Date(),
            estado: 'Activo'
          }, { transaction });
          break;
          
        case 'médico':
        case 'medico':
          // Se requiere matricula y especialidad, se asigna después
          break;
          
        case 'enfermero':
          // Se requiere matricula y sector, se asigna después
          break;
          
        case 'administrativo':
          // Se requiere sector, se asigna después
          break;
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Usuario creado correctamente',
      usuario: {
        id: usuario.id,
        nombreCompleto: `${usuario.nombre} ${usuario.apellido}`
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * Actualizar datos de un usuario
 */
const actualizarUsuario = async (req, res) => {
  const transaction = await require('../database/db').sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      telefono,
      email,
      estado,
      rol_secundario_id
    } = req.body;

    const usuario = await Usuario.findByPk(id, { transaction });

    if (!usuario) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar email único si cambia
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({
        where: { email, id: { [Op.ne]: id } },
        transaction
      });

      if (emailExistente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado por otro usuario'
        });
      }
    }

    // Actualizar usuario
    await usuario.update({
      telefono: telefono || usuario.telefono,
      email: email || usuario.email,
      estado: estado || usuario.estado,
      rol_secundario_id: rol_secundario_id !== undefined ? rol_secundario_id : usuario.rol_secundario_id
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * Bloquear/Desbloquear usuario
 */
const bloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const nuevoEstado = usuario.estado === 'Bloqueado' ? 'Activo' : 'Bloqueado';
    
    await usuario.update({
      estado: nuevoEstado
    });

    res.json({
      success: true,
      message: `Usuario ${nuevoEstado === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente`
    });

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

/**
 * Resetear contraseña de usuario
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva_password } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(nueva_password, 10);

    await usuario.update({
      password: hashedPassword
    });

    res.json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });

  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña',
      error: error.message
    });
  }
};

/**
 * Obtener roles para select
 */
const getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles'
    });
  }
};

// Helper para calcular edad
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

module.exports = {
  getVistaUsuarios,
  getListaUsuarios,
  getDetallesUsuario,
  crearUsuario,
  actualizarUsuario,
  bloquearUsuario,
  resetPassword,
  getRoles
};