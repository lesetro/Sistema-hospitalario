const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Recetas y Certificados del Paciente
 * Visualización de recetas médicas y certificados
 */

// GET /paciente/recetas - Lista de recetas y certificados
exports.getRecetas = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const { tipo, desde, hasta, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Construir filtros
    const whereClause = { paciente_id: pacienteId };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (desde || hasta) {
      whereClause.fecha = {};
      if (desde) whereClause.fecha[Op.gte] = desde;
      if (hasta) whereClause.fecha[Op.lte] = hasta;
    }

    // Obtener recetas y certificados
    const { count, rows: documentos } = await db.RecetaCertificado.findAndCountAll({
      where: whereClause,
      include: [
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
          model: db.EvaluacionMedica,
          as: 'evaluacionMedica',
          attributes: ['id', 'fecha'],
          include: [{
            model: db.Diagnostico,
            as: 'diagnostico',
            attributes: ['nombre', 'codigo']
          }]
        }
      ],
      order: [['fecha', 'DESC']],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      recetas: await db.RecetaCertificado.count({
        where: { paciente_id: pacienteId, tipo: 'Receta Medica' }
      }),
      certificados: await db.RecetaCertificado.count({
        where: { paciente_id: pacienteId, tipo: 'Certificado' }
      }),
      recientes: await db.RecetaCertificado.count({
        where: {
          paciente_id: pacienteId,
          fecha: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
          }
        }
      })
    };

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/recetas', { 
      title: 'Recetas y Certificados',
      user: req.user,
      documentos,
      estadisticas,
      filtros: { tipo, desde, hasta },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener recetas:', error);
    next(error);
  }
};

// GET /paciente/recetas/:id - Detalle de receta/certificado
exports.getDetalleReceta = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const documentoId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      include: [{
        model: db.Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento']
      }]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const documento = await db.RecetaCertificado.findOne({
      where: {
        id: documentoId,
        paciente_id: pacienteId
      },
      include: [
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
          model: db.EvaluacionMedica,
          as: 'evaluacionMedica',
          include: [
            {
              model: db.Diagnostico,
              as: 'diagnostico',
              attributes: ['nombre', 'codigo', 'descripcion']
            },
            {
              model: db.Tratamiento,
              as: 'tratamiento',
              attributes: ['nombre', 'descripcion']
            }
          ]
        }
      ]
    });

    if (!documento) {
      return res.status(404).render('error', {
        message: 'Documento no encontrado'
      });
    }

    // Calcular edad del paciente
    const fechaNacimiento = new Date(paciente.usuario.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    res.render('dashboard/paciente/receta-detalle', {  
      title: documento.tipo === 'Receta Medica' ? 'Detalle de Receta' : 'Detalle de Certificado',
      user: req.user,
      documento,
      paciente: {
        ...paciente.toJSON(),
        edad
      }
    });

  } catch (error) {
    console.error('Error al obtener detalle:', error);
    next(error);
  }
};

// GET /paciente/recetas/api/recientes - Recetas recientes (AJAX)
exports.getRecetasRecientes = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente
    const { limit = 5 } = req.query;

    const documentos = await db.RecetaCertificado.findAll({
      where: { paciente_id: pacienteId },
      include: [{
        model: db.Medico,
        as: 'medico',
        include: [{
          model: db.Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      documentos,
      total: documentos.length
    });

  } catch (error) {
    console.error('Error al obtener recetas recientes:', error);
    next(error);
  }
};

module.exports = exports;
