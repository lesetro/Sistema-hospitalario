const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Admisiones del Paciente
 * Visualización de admisiones y atenciones recibidas
 */

// GET /paciente/admisiones - Lista de admisiones
exports.getAdmisiones = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente
    const { estado, desde, hasta, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Obtener paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  //  Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    // Construir filtros
    const whereClause = { paciente_id: paciente.id };

    if (estado) {
      whereClause.estado = estado;
    }

    if (desde || hasta) {
      whereClause.fecha = {};
      if (desde) whereClause.fecha[Op.gte] = desde;
      if (hasta) whereClause.fecha[Op.lte] = hasta;
    }

    // Obtener admisiones
    const { count, rows: admisiones } = await db.Admision.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.MotivoAdmision,
          as: 'motivo',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.FormaIngreso,
          as: 'forma_ingreso',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            },
            {
              model: db.Especialidad,
              as: 'especialidad',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        },
        {
          model: db.MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre']
        },
        {
          model: db.Turno,
          as: 'turno',
          attributes: ['id', 'fecha', 'hora_inicio', 'estado']
        },
        {
          model: db.Internacion,
          as: 'internacion',
          attributes: ['id', 'fecha_inicio', 'fecha_alta', 'estado_paciente']
        },
        {
          model: db.AltaMedica,
          as: 'alta_medica',
          attributes: ['id', 'fecha_alta', 'tipo_alta', 'estado_paciente']
        }
      ],
      order: [['fecha', 'DESC']],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      pendientes: await db.Admision.count({
        where: { paciente_id: paciente.id, estado: 'Pendiente' }
      }),
      completadas: await db.Admision.count({
        where: { paciente_id: paciente.id, estado: 'Completada' }
      }),
      canceladas: await db.Admision.count({
        where: { paciente_id: paciente.id, estado: 'Cancelada' }
      }),
      conInternacion: await db.Admision.count({
        where: { paciente_id: paciente.id },
        include: [{
          model: db.Internacion,
          as: 'internacion',
          required: true
        }]
      })
    };

    // Última admisión
    const ultimaAdmision = admisiones.length > 0 ? admisiones[0] : null;

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/admisiones', {
      title: 'Mis Admisiones',
      user: req.user,
      admisiones,
      estadisticas,
      ultimaAdmision,
      filtros: { estado, desde, hasta },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener admisiones:', error);
    next(error);
  }
};

// GET /paciente/admisiones/:id - Detalle de admisión
exports.getDetalleAdmision = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente
    const admisionId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {  //  Buscar directo por PK
      attributes: ['id'],
      include: [
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

    const admision = await db.Admision.findOne({
      where: {
        id: admisionId,
        paciente_id: paciente.id
      },
      include: [
        {
          model: db.MotivoAdmision,
          as: 'motivo',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.FormaIngreso,
          as: 'forma_ingreso',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'telefono', 'email']
            },
            {
              model: db.Especialidad,
              as: 'especialidad',
              attributes: ['nombre', 'descripcion']
            }
          ]
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: db.MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Turno,
          as: 'turno',
          attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'estado']
        },
        {
          model: db.Internacion,
          as: 'internacion',
          include: [
            {
              model: db.Cama,
              as: 'cama',
              attributes: ['numero'],
              include: [{
                model: db.Habitacion,
                as: 'habitacion',
                attributes: ['numero', 'tipo']
              }]
            },
            {
              model: db.TipoInternacion,
              as: 'tipoInternacion',
              attributes: ['nombre', 'descripcion']
            },
            {
              model: db.Habitacion,
              as: 'habitacion',
              attributes: ['numero', 'tipo'],
              include: [{
                model: db.Sector,
                as: 'sector',
                attributes: ['nombre']
              }]
            }
          ]
        },
        {
          model: db.AltaMedica,
          as: 'alta_medica',
          include: [{
            model: db.Medico,
            as: 'medico',
            include: [{
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          }]
        },
        {
          model: db.Administrativo,
          as: 'administrativo',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: db.Factura,
          as: 'facturas',
          attributes: ['id', 'monto', 'estado', 'fecha_emision', 'tipo_pago']
        },
        {
          model: db.HistorialMedico,
          as: 'historiales',
          attributes: ['id', 'descripcion', 'tipo_evento', 'fecha'],
          order: [['fecha', 'DESC']],
          limit: 5
        }
      ]
    });

    if (!admision) {
      return res.status(404).render('error', {
        message: 'Admisión no encontrada'
      });
    }

    // Calcular duración
    let duracion = null;
    if (admision.internacion) {
      const inicio = new Date(admision.internacion.fecha_inicio);
      const fin = admision.internacion.fecha_alta ? new Date(admision.internacion.fecha_alta) : new Date();
      duracion = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
    }

    res.render('dashboard/paciente/admision-detalle', {
      title: 'Detalle de Admisión',
      user: req.user,
      admision,
      paciente,
      duracion
    });

  } catch (error) {
    console.error('Error al obtener detalle de admisión:', error);
    next(error);
  }
};

// GET /paciente/admisiones/recientes - Admisiones recientes (AJAX)
exports.getAdmisionesRecientes = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente
    const { limit = 5 } = req.query;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const admisiones = await db.Admision.findAll({
      where: { paciente_id: paciente.id },
      include: [
        {
          model: db.MotivoAdmision,
          as: 'motivo',
          attributes: ['nombre']
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre']
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      admisiones
    });

  } catch (error) {
    console.error('Error al obtener admisiones recientes:', error);
    next(error);
  }
};

module.exports = exports;
