
const { Op } = require('sequelize');
const db = require('../../database/db');
const {
  Reclamo,
  SolicitudDerivacion,
  Usuario,
  Paciente,
  Sector,
  Medico,
  Especialidad,
  Habitacion,
  Cama
} = require('../../models');

/**
 * Vista principal
 */
const getVistaReclamosDerivaciones = async (req, res) => {
  try {
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/admin/reclamo-derivacion/gestion-reclamos', {
      title: 'Gestión de Reclamos y Derivaciones',
      sectores
    });
  } catch (error) {
    console.error('Error al cargar vista:', error);
    res.status(500).render('error', { message: 'Error al cargar la página' });
  }
};

// ============================================================================
// RECLAMOS
// ============================================================================

/**
 * Obtener lista de reclamos con filtros
 */
const getListaReclamos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado = '',
      fecha_desde = '',
      fecha_hasta = '',
      busqueda = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereReclamo = {};
    const whereUsuario = {};

    if (estado) whereReclamo.estado = estado;

    if (fecha_desde && fecha_hasta) {
      whereReclamo.fecha = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    }

    if (busqueda) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const { count, rows: reclamos } = await Reclamo.findAndCountAll({
      where: whereReclamo,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: Object.keys(whereUsuario).length ? whereUsuario : undefined,
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['fecha', 'DESC']],
      distinct: true
    });

    const reclamosFormateados = reclamos.map(r => ({
      id: r.id,
      usuario: `${r.usuario.nombre} ${r.usuario.apellido}`,
      dni: r.usuario.dni,
      email: r.usuario.email,
      telefono: r.usuario.telefono,
      texto: r.texto,
      fecha: r.fecha,
      estado: r.estado,
      created_at: r.created_at
    }));

    res.json({
      success: true,
      reclamos: reclamosFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener reclamos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reclamos',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de reclamos
 */
const getEstadisticasReclamos = async (req, res) => {
  try {
    const [total, pendientes, resueltos, hoy] = await Promise.all([
      Reclamo.count(),
      Reclamo.count({ where: { estado: 'Pendiente' } }),
      Reclamo.count({ where: { estado: 'Resuelto' } }),
      Reclamo.count({
        where: {
          fecha: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total,
        pendientes,
        resueltos,
        hoy
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de un reclamo
 */
const cambiarEstadoReclamo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['Pendiente', 'Resuelto'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const reclamo = await Reclamo.findByPk(id);

    if (!reclamo) {
      return res.status(404).json({
        success: false,
        message: 'Reclamo no encontrado'
      });
    }

    await reclamo.update({ estado });

    res.json({
      success: true,
      message: `Reclamo marcado como ${estado}`
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del reclamo',
      error: error.message
    });
  }
};

// ============================================================================
// DERIVACIONES
// ============================================================================

/**
 * Obtener lista de derivaciones con filtros
 */
const getListaDerivaciones = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado = '',
      tipo = '',
      sector_origen = '',
      fecha_desde = '',
      fecha_hasta = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereDerivacion = {};

    if (estado) whereDerivacion.estado = estado;
    if (tipo) whereDerivacion.tipo = tipo;
    if (sector_origen) whereDerivacion.origen_id = sector_origen;

    if (fecha_desde && fecha_hasta) {
      whereDerivacion.fecha = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    }

    const { count, rows: derivaciones } = await SolicitudDerivacion.findAndCountAll({
      where: whereDerivacion,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni']
            }
          ]
        },
        {
          model: Sector,
          as: 'origen',
          attributes: ['nombre']
        },
        {
          model: Sector,
          as: 'destino',
          attributes: ['nombre'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['fecha', 'DESC']],
      distinct: true
    });

    const derivacionesFormateadas = derivaciones.map(d => ({
      id: d.id,
      paciente: `${d.paciente.usuario.nombre} ${d.paciente.usuario.apellido}`,
      dni: d.paciente.usuario.dni,
      paciente_id: d.paciente_id,
      origen: d.origen.nombre,
      origen_id: d.origen_id,
      destino: d.destino?.nombre || 'Hospital externo',
      destino_id: d.destino_id,
      tipo: d.tipo,
      estado: d.estado,
      fecha: d.fecha,
      motivo: d.motivo,
      responsable_id: d.responsable_id
    }));

    res.json({
      success: true,
      derivaciones: derivacionesFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener derivaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener derivaciones',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de derivaciones
 */
const getEstadisticasDerivaciones = async (req, res) => {
  try {
    const [total, pendientes, aprobadas, rechazadas, internas, externas] = await Promise.all([
      SolicitudDerivacion.count(),
      SolicitudDerivacion.count({ where: { estado: 'Pendiente' } }),
      SolicitudDerivacion.count({ where: { estado: 'Aprobada' } }),
      SolicitudDerivacion.count({ where: { estado: 'Rechazada' } }),
      SolicitudDerivacion.count({ where: { tipo: 'Interna' } }),
      SolicitudDerivacion.count({ where: { tipo: 'Externa' } })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total,
        pendientes,
        aprobadas,
        rechazadas,
        internas,
        externas
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de una derivación (con disponibilidad de recursos)
 */
const getDetallesDerivacion = async (req, res) => {
  try {
    const { id } = req.params;

    const derivacion = await SolicitudDerivacion.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
            }
          ]
        },
        { model: Sector, as: 'origen', attributes: ['id', 'nombre'] },
        { model: Sector, as: 'destino', attributes: ['id', 'nombre'], required: false }
      ]
    });

    if (!derivacion) {
      return res.status(404).json({
        success: false,
        message: 'Derivación no encontrada'
      });
    }

    let recursos = null;

    // Si es interna y está pendiente, verificar recursos disponibles
    if (derivacion.tipo === 'Interna' && derivacion.estado === 'Pendiente' && derivacion.destino_id) {
      const [camasDisponibles, medicosDisponibles] = await Promise.all([
        Cama.count({
          where: { estado: 'Libre' },
          include: [
            {
              model: Habitacion,
              as: 'habitacion',
              where: { sector_id: derivacion.destino_id }
            }
          ]
        }),
        Medico.count({
          where: { sector_id: derivacion.destino_id },
          include: [
            {
              model: Usuario,
              as: 'usuario',
              where: { estado: 'Activo' }
            }
          ]
        })
      ]);

      recursos = {
        camas_disponibles: camasDisponibles,
        medicos_disponibles: medicosDisponibles,
        puede_derivar: camasDisponibles > 0 && medicosDisponibles > 0
      };
    }

    res.json({
      success: true,
      derivacion: {
        ...derivacion.toJSON(),
        recursos
      }
    });

  } catch (error) {
    console.error('Error al obtener detalles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles',
      error: error.message
    });
  }
};

/**
 * Editar derivación
 */
const editarDerivacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { tipo, destino_id, motivo, estado } = req.body;

    const derivacion = await SolicitudDerivacion.findByPk(id, { transaction });

    if (!derivacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Derivación no encontrada'
      });
    }

    // Validaciones
    if (tipo === 'Interna' && !destino_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Las derivaciones internas requieren un sector de destino'
      });
    }

    if (tipo === 'Interna' && derivacion.origen_id === destino_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El sector de origen y destino no pueden ser iguales'
      });
    }

    // Si cambia a Externa, limpiar destino_id
    const datosActualizacion = {
      tipo,
      motivo,
      estado: estado || derivacion.estado
    };

    if (tipo === 'Externa') {
      datosActualizacion.destino_id = null;
    } else {
      datosActualizacion.destino_id = destino_id;
    }

    await derivacion.update(datosActualizacion, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Derivación actualizada correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al editar derivación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar derivación',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de derivación
 */
const cambiarEstadoDerivacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { estado, motivo_rechazo } = req.body;

    if (!['Pendiente', 'Aprobada', 'Rechazada'].includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const derivacion = await SolicitudDerivacion.findByPk(id, { transaction });

    if (!derivacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Derivación no encontrada'
      });
    }

    const datosActualizacion = { estado };

    if (estado === 'Rechazada' && motivo_rechazo) {
      datosActualizacion.motivo = `${derivacion.motivo}\n\n[RECHAZADA] ${new Date().toLocaleDateString()}: ${motivo_rechazo}`;
    }

    await derivacion.update(datosActualizacion, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Derivación ${estado.toLowerCase()} correctamente`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

module.exports = {
  getVistaReclamosDerivaciones,
  getListaReclamos,
  getEstadisticasReclamos,
  cambiarEstadoReclamo,
  getListaDerivaciones,
  getEstadisticasDerivaciones,
  getDetallesDerivacion,
  editarDerivacion,
  cambiarEstadoDerivacion
};