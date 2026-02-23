const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Estudios del Paciente
 * Visualización de estudios médicos solicitados y realizados
 */

// GET /paciente/estudios - Lista de estudios
exports.getEstudios = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const { estado, categoria, urgencia, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Construir filtros
    const whereClause = { paciente_id: pacienteId };

    if (estado) {
      whereClause.estado = estado;
    }

    if (urgencia) {
      whereClause.urgencia = urgencia;
    }

    // Construir include para tipo_estudio
    const tipoEstudioWhere = {};
    if (categoria) {
      tipoEstudioWhere.categoria = categoria;
    }

    // Obtener estudios
    const { count, rows: estudios } = await db.EstudioSolicitado.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno'],
          where: Object.keys(tipoEstudioWhere).length > 0 ? tipoEstudioWhere : undefined
        },
        {
          model: db.EvaluacionMedica,
          as: 'evaluacion_medica',
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
          model: db.TurnoEstudio,
          as: 'turno_estudio',
          attributes: ['id', 'fecha', 'hora', 'estado', 'resultado']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      pendientes: await db.EstudioSolicitado.count({
        where: { paciente_id: pacienteId, estado: 'Pendiente' }
      }),
      realizados: await db.EstudioSolicitado.count({
        where: { paciente_id: pacienteId, estado: 'Realizado' }
      }),
      cancelados: await db.EstudioSolicitado.count({
        where: { paciente_id: pacienteId, estado: 'Cancelado' }
      }),
      urgentes: await db.EstudioSolicitado.count({
        where: { 
          paciente_id: pacienteId, 
          urgencia: 'Alta',
          estado: 'Pendiente'
        }
      })
    };

    // Estadísticas por categoría (opcional - comentado por si causa error)
    let porCategoria = [];
    try {
      // Obtener estudios agrupados por categoría
      const estudiosConCategoria = await db.EstudioSolicitado.findAll({
        where: { paciente_id: pacienteId },
        include: [{
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['categoria']
        }],
        attributes: ['id']
      });

      // Agrupar manualmente por categoría
      const categorias = {};
      estudiosConCategoria.forEach(estudio => {
        const cat = estudio.tipo_estudio?.categoria || 'Sin categoría';
        categorias[cat] = (categorias[cat] || 0) + 1;
      });

      porCategoria = Object.keys(categorias).map(cat => ({
        categoria: cat,
        total: categorias[cat]
      }));
    } catch (error) {
      console.log('⚠️ No se pudieron calcular estadísticas por categoría:', error.message);
      porCategoria = [];
    }

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/estudios', { 
      title: 'Mis Estudios',
      user: req.user,
      estudios,
      estadisticas,
      porCategoria,
      filtros: { estado, categoria, urgencia },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener estudios:', error);
    next(error);
  }
};

// GET /paciente/estudios/:id - Detalle de estudio
exports.getDetalleEstudio = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const estudioId = req.params.id;

    const estudio = await db.EstudioSolicitado.findOne({
      where: {
        id: estudioId,
        paciente_id: pacienteId
      },
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: db.EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [
            {
              model: db.Medico,
              as: 'medico',
              include: [
                {
                  model: db.Usuario,
                  as: 'usuario',
                  attributes: ['nombre', 'apellido', 'telefono']
                },
                {
                  model: db.Especialidad,
                  as: 'especialidad',
                  attributes: ['nombre']
                }
              ]
            },
            {
              model: db.Diagnostico,
              as: 'diagnostico',
              attributes: ['nombre', 'codigo']
            }
          ]
        },
        {
          model: db.TurnoEstudio,
          as: 'turno_estudio',
          include: [{
            model: db.ListaEspera,
            as: 'lista_espera',
            attributes: ['id', 'estado', 'prioridad']
          }]
        }
      ]
    });

    if (!estudio) {
      return res.status(404).render('error', {
        message: 'Estudio no encontrado'
      });
    }

    res.render('dashboard/paciente/estudio-detalle', {
      title: 'Detalle del Estudio',
      user: req.user,
      estudio
    });

  } catch (error) {
    console.error('Error al obtener detalle del estudio:', error);
    next(error);
  }
};

// GET /paciente/estudios/pendientes - Estudios pendientes (AJAX)
exports.getEstudiosPendientes = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente

    const estudios = await db.EstudioSolicitado.findAll({
      where: {
        paciente_id: pacienteId,
        estado: 'Pendiente'
      },
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        },
        {
          model: db.TurnoEstudio,
          as: 'turno_estudio',
          attributes: ['fecha', 'hora', 'estado']
        }
      ],
      order: [['urgencia', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      estudios,
      total: estudios.length
    });

  } catch (error) {
    console.error('Error al obtener estudios pendientes:', error);
    next(error);
  }
};

module.exports = exports;