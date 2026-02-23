const { Op } = require('sequelize');
const db = require('../../models'); 
const bcrypt = require('bcryptjs');

const {
  Usuario,
  Rol,
  Paciente,
  Medico,
  Enfermero,
  Administrativo,
  Notificacion,
  TurnoPersonal,
  Reclamo,
  Especialidad,
  Sector,
  ObraSocial,
  Turno,
  Admision
} = db;

/**
 * Vista principal de usuarios
 */
const getVistaUsuarios = async (req, res, next) => {
  try {
    const roles = await Rol.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/usuarios/usuarios', {
      title: 'Gestión de Usuarios',
      user: req.user, 
      roles
    });
  } catch (error) {
    console.error('Error al cargar vista de usuarios:', error);
    next(error);
  }
};

/**
 * Obtener lista de usuarios con paginación y filtros
 */
const getListaUsuarios = async (req, res, next) => {
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

    console.log('🔍 Buscando usuarios con filtros:', { page, limit, where });

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

    console.log(` Usuarios encontrados: ${count}`);

    // Obtener información de rol específico
    const usuariosConDetalle = await Promise.all(usuarios.map(async (usuario) => {
      let rolEspecifico = {};
      
      try {
        const rolNombre = usuario.rol_principal?.nombre?.toLowerCase() || '';

        switch(rolNombre) {
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
                model: Especialidad, 
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
      } catch (error) {
        console.error(`Error al obtener rol específico para usuario ${usuario.id}:`, error);
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
    console.error('❌ Error al obtener lista de usuarios:', error);
    console.error('Stack:', error.stack);
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
const getDetallesUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Buscando detalles del usuario ${id}`);

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
    
    const rolNombre = usuario.rol_principal?.nombre?.toLowerCase() || '';

    try {
      switch(rolNombre) {
        case 'paciente':
          const paciente = await Paciente.findOne({
            where: { usuario_id: id },
            include: [
              {
                model: ObraSocial, 
                as: 'obraSocial',
                attributes: ['nombre'],
                required: false
              }
            ]
          });
          if (paciente) {
            rolEspecifico = paciente.toJSON();
            
            // Estadísticas de paciente
            estadisticas = {
              totalTurnos: await Turno.count({ where: { paciente_id: paciente.id } }), // ✅ CORREGIDO
              totalAdmisiones: await Admision.count({ where: { paciente_id: paciente.id } }) // ✅ CORREGIDO
            };
          }
          break;
          
        case 'médico':
        case 'medico':
          const medico = await Medico.findOne({
            where: { usuario_id: id },
            include: [
              {
                model: Especialidad, 
                as: 'especialidad',
                attributes: ['nombre'],
                required: false
              },
              {
                model: Sector, 
                as: 'sector',
                attributes: ['nombre'],
                required: false
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
                model: Sector, 
                as: 'sector',
                attributes: ['nombre'],
                required: false
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
                model: Sector, 
                as: 'sector',
                attributes: ['nombre'],
                required: false
              },
              {
                model: TurnoPersonal, 
                as: 'turno',
                attributes: ['tipo', 'dias', 'hora_inicio', 'hora_fin'],
                required: false
              }
            ]
          });
          if (administrativo) {
            rolEspecifico = administrativo.toJSON();
          }
          break;
      }
    } catch (error) {
      console.error('Error al obtener rol específico:', error);
    }

    // Obtener estadísticas generales
    try {
      estadisticas = {
        ...estadisticas,
        totalNotificaciones: await Notificacion.count({
          where: { [Op.or]: [{ usuario_id: id }, { remitente_id: id }] }
        }),
        totalReclamos: await Reclamo.count({ where: { usuario_id: id } }),
        totalTurnosAsignados: await TurnoPersonal.count({ where: { usuario_id: id } })
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }

    console.log(` Detalles del usuario ${id} obtenidos`);

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
        rol_principal_id: usuario.rol_principal_id, 
        rol_principal_desc: usuario.rol_principal?.descripcion || '',
        rol_secundario: usuario.rol_secundario?.nombre || 'Sin rol secundario',
        rol_secundario_id: usuario.rol_secundario_id, 
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
    console.error('❌ Error al obtener detalles del usuario:', error);
    console.error('Stack:', error.stack);
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
const crearUsuario = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

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

    console.log('📝 Creando usuario:', { dni, nombre, apellido, email });

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
      const rolNombre = rol.nombre.toLowerCase();
      
      switch(rolNombre) {
        case 'paciente':
          await Paciente.create({
            usuario_id: usuario.id,
            fecha_ingreso: new Date(),
            estado: 'Activo'
          }, { transaction });
          break;
          
        case 'médico':
        case 'medico':
          // Se requiere matricula y especialidad, se asigna después
          console.log(' Usuario médico creado. Debe asignar matrícula y especialidad.');
          break;
          
        case 'enfermero':
          // Se requiere matricula y sector, se asigna después
          console.log(' Usuario enfermero creado. Debe asignar matrícula y sector.');
          break;
          
        case 'administrativo':
          // Se requiere sector, se asigna después
          console.log(' Usuario administrativo creado. Debe asignar sector.');
          break;
      }
    }

    await transaction.commit();

    console.log(` Usuario creado: ${usuario.id} - ${usuario.nombre} ${usuario.apellido}`);

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
    console.error('❌ Error al crear usuario:', error);
    console.error('Stack:', error.stack);
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
const actualizarUsuario = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      telefono,
      email,
      estado,
      rol_secundario_id
    } = req.body;

    console.log(` Actualizando usuario ${id}`);

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

    console.log(` Usuario ${id} actualizado`);

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar usuario:', error);
    console.error('Stack:', error.stack);
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
const bloquearUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    console.log(` Cambiando estado del usuario ${id}`);

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

    console.log(` Usuario ${id} ${nuevoEstado === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'}`);

    res.json({
      success: true,
      message: `Usuario ${nuevoEstado === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente`
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado del usuario:', error);
    console.error('Stack:', error.stack);
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
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nueva_password } = req.body;

    console.log(` Reseteando contraseña del usuario ${id}`);

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

    console.log(` Contraseña reseteada para usuario ${id}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña',
      error: error.message
    });
  }
};
/**
 * CASO ESPECIAL: Completar datos de paciente urgencia
 * Vincula datos reales a registro temporal
 */
const completarPacienteUrgencia = async (req, res, next) => {
  try {
    const { usuario_id_urgencia } = req.params;
    const { dni_real, nombre_real, apellido_real, fecha_nacimiento_real } = req.body;

    // 1. Buscar usuario urgencia (URGENCIA TEMPORAL-xxxx)
    const usuarioUrgencia = await Usuario.findByPk(usuario_id_urgencia);
    
    if (!usuarioUrgencia.nombre.includes('URGENCIA')) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario no es un registro de urgencia'
      });
    }

    // 2. Validar que el DNI real no exista
    const dniExistente = await Usuario.findOne({
      where: { 
        dni: dni_real, 
        id: { [Op.ne]: usuario_id_urgencia } 
      }
    });

    if (dniExistente) {
      return res.status(400).json({
        success: false,
        message: 'El DNI ya pertenece a otro paciente',
        nota: 'Se debe vincular este registro de urgencia al paciente existente'
      });
    }

    // 3. Actualizar SOLO una vez (validación: nombre aún tiene URGENCIA)
    await usuarioUrgencia.update({
      nombre: nombre_real,
      apellido: apellido_real,
      dni: dni_real,
      fecha_nacimiento: fecha_nacimiento_real,
      estado: 'Activo'
    });

    res.json({
      success: true,
      message: 'Registro de urgencia completado correctamente',
      usuario_actualizado: usuarioUrgencia.id
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al completar registro'
    });
  }
};
/**
 * Obtener roles para select
 */
const getRoles = async (req, res, next) => {
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
    console.error('❌ Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

// Helper para calcular edad
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0;
  
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
  completarPacienteUrgencia,
  getRoles
};