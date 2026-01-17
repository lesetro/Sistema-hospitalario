const { Op } = require('sequelize');
const {
  Paciente,
  Usuario,
  Administrativo,
  ObraSocial,
  Admision,
  Turno,
  HistorialMedico,
  Internacion,
  AltaMedica,
  Factura,
  Medico,
  Sector,
  Especialidad
} = require('../../models');

/**
 * Vista principal de pacientes
 */
const getVistaPacientes = async (req, res) => {
  try {
    const obrasSociales = await ObraSocial.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/paciente/pacientes', {
      title: 'Gestión de Pacientes',
      obrasSociales
    });
  } catch (error) {
    console.error('Error al cargar vista de pacientes:', error);
    res.status(500).render('error', {
      message: 'Error al cargar la página de pacientes'
    });
  }
};

/**
 * Obtener lista de pacientes con paginación y filtros
 */
const getListaPacientes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      estado = '',
      obra_social_id = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const whereUsuario = {};
    const wherePaciente = {};

    if (busqueda) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni: { [Op.like]: `%${busqueda}%` } },
        { email: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (estado) {
      wherePaciente.estado = estado;
    }

    if (obra_social_id) {
      wherePaciente.obra_social_id = obra_social_id;
    }

    // Consultar pacientes
    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: wherePaciente,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: whereUsuario,
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'telefono', 'fecha_nacimiento', 'sexo']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Administrativo,
          as: 'administrativo',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }
          ],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    // Formatear datos
    const pacientesFormateados = pacientes.map(p => ({
      id: p.id,
      usuario_id: p.usuario_id,
      dni: p.usuario.dni,
      nombreCompleto: `${p.usuario.nombre} ${p.usuario.apellido}`,
      nombre: p.usuario.nombre,
      apellido: p.usuario.apellido,
      email: p.usuario.email,
      telefono: p.usuario.telefono || 'Sin teléfono',
      fecha_nacimiento: p.usuario.fecha_nacimiento,
      sexo: p.usuario.sexo,
      obra_social: p.obraSocial?.nombre || 'Sin obra social',
      obra_social_id: p.obra_social_id,
      estado: p.estado,
      fecha_ingreso: p.fecha_ingreso,
      fecha_egreso: p.fecha_egreso,
      observaciones: p.observaciones,
      cargado_por: p.administrativo ? `${p.administrativo.usuario.nombre} ${p.administrativo.usuario.apellido}` : 'Sistema'
    }));

    res.json({
      success: true,
      pacientes: pacientesFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de pacientes',
      error: error.message
    });
  }
};

/**
 * Obtener detalles completos de un paciente
 */
const getDetallesPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'telefono', 'fecha_nacimiento', 'sexo']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Administrativo,
          as: 'administrativo',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
          ]
        }
      ]
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Obtener admisiones
    const admisiones = await Admision.findAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        { model: Sector, as: 'sector', attributes: ['nombre'] }
      ],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    // Obtener turnos
    const turnos = await Turno.findAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
          ]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    // Obtener internaciones
    const internaciones = await Internacion.findAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
          ]
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: 5
    });

    // Obtener historial médico
    const historial = await HistorialMedico.findAll({
      where: { paciente_id: id },
      order: [['fecha', 'DESC']],
      limit: 10
    });

    // Obtener facturas
    const facturas = await Factura.findAll({
      where: { paciente_id: id },
      order: [['fecha_emision', 'DESC']],
      limit: 10
    });

    // Estadísticas
    const estadisticas = {
      totalAdmisiones: await Admision.count({ where: { paciente_id: id } }),
      totalTurnos: await Turno.count({ where: { paciente_id: id } }),
      turnosPendientes: await Turno.count({ where: { paciente_id: id, estado: 'PENDIENTE' } }),
      totalInternaciones: await Internacion.count({ where: { paciente_id: id } }),
      internacionActiva: await Internacion.count({ where: { paciente_id: id, fecha_alta: null } }),
      totalFacturas: await Factura.count({ where: { paciente_id: id } }),
      facturasPendientes: await Factura.count({ where: { paciente_id: id, estado: 'Pendiente' } })
    };

    res.json({
      success: true,
      paciente: {
        id: paciente.id,
        usuario_id: paciente.usuario_id,
        dni: paciente.usuario.dni,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        nombreCompleto: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        email: paciente.usuario.email,
        telefono: paciente.usuario.telefono,
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        sexo: paciente.usuario.sexo,
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        obra_social_id: paciente.obra_social_id,
        estado: paciente.estado,
        fecha_ingreso: paciente.fecha_ingreso,
        fecha_egreso: paciente.fecha_egreso,
        observaciones: paciente.observaciones,
        cargado_por: paciente.administrativo ? `${paciente.administrativo.usuario.nombre} ${paciente.administrativo.usuario.apellido}` : 'Sistema'
      },
      admisiones,
      turnos,
      internaciones,
      historial,
      facturas,
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener detalles del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del paciente',
      error: error.message
    });
  }
};

/**
 * Actualizar datos de un paciente
 */
const actualizarPaciente = async (req, res) => {
  const transaction = await require('../database/db').sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      telefono,
      email,
      obra_social_id,
      observaciones
    } = req.body;

    const paciente = await Paciente.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario' }],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Actualizar usuario
    await Usuario.update(
      {
        telefono: telefono || paciente.usuario.telefono,
        email: email || paciente.usuario.email
      },
      {
        where: { id: paciente.usuario_id },
        transaction
      }
    );

    // Actualizar paciente
    await paciente.update(
      {
        obra_social_id: obra_social_id || null,
        observaciones: observaciones || paciente.observaciones
      },
      { transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Paciente actualizado correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar paciente',
      error: error.message
    });
  }
};

/**
 * Baja lógica de un paciente
 */
const bajaPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const paciente = await Paciente.findByPk(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar que no tenga internación activa
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: id,
        fecha_alta: null
      }
    });

    if (internacionActiva) {
      return res.status(400).json({
        success: false,
        message: 'No se puede dar de baja a un paciente con internación activa'
      });
    }

    // Verificar que no tenga turnos pendientes
    const turnosPendientes = await Turno.count({
      where: {
        paciente_id: id,
        estado: 'PENDIENTE'
      }
    });

    if (turnosPendientes > 0) {
      return res.status(400).json({
        success: false,
        message: `El paciente tiene ${turnosPendientes} turno(s) pendiente(s). Cancélelos primero.`
      });
    }

    // Dar de baja
    await paciente.update({
      estado: 'Inactivo',
      fecha_egreso: new Date(),
      observaciones: `${paciente.observaciones || ''}\n[BAJA] ${new Date().toLocaleDateString()}: ${motivo || 'Sin motivo especificado'}`
    });

    res.json({
      success: true,
      message: 'Paciente dado de baja correctamente'
    });

  } catch (error) {
    console.error('Error al dar de baja paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al dar de baja al paciente',
      error: error.message
    });
  }
};

/**
 * Reactivar un paciente
 */
const reactivarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findByPk(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    if (paciente.estado === 'Activo') {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya está activo'
      });
    }

    await paciente.update({
      estado: 'Activo',
      observaciones: `${paciente.observaciones || ''}\n[REACTIVACIÓN] ${new Date().toLocaleDateString()}`
    });

    res.json({
      success: true,
      message: 'Paciente reactivado correctamente'
    });

  } catch (error) {
    console.error('Error al reactivar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reactivar al paciente',
      error: error.message
    });
  }
};

module.exports = {
  getVistaPacientes,
  getListaPacientes,
  getDetallesPaciente,
  actualizarPaciente,
  bajaPaciente,
  reactivarPaciente
};