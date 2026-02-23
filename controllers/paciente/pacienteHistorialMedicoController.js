const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Historial Médico del Paciente
 * Visualización del historial médico completo
 */

// GET /paciente/historial-medico - Historial completo
exports.getHistorialMedico = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 
    const { tipo_evento, desde, hasta, page = 1 } = req.query;
    const limit = 15;
    const offset = (page - 1) * limit;

    // Obtener paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'fecha_nacimiento', 'sexo']
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

    // Construir filtros
    const whereClause = { paciente_id: paciente.id };

    if (tipo_evento) {
      whereClause.tipo_evento = tipo_evento;
    }

    if (desde || hasta) {
      whereClause.fecha = {};
      if (desde) whereClause.fecha[Op.gte] = desde;
      if (hasta) whereClause.fecha[Op.lte] = hasta;
    }

    // Obtener historial médico
    const { count, rows: historial } = await db.HistorialMedico.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre', 'descripcion']
        }
      ],
      order: [['fecha', 'DESC']],
      limit,
      offset
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      consultas: await db.HistorialMedico.count({
        where: { paciente_id: paciente.id, tipo_evento: 'Consulta' }
      }),
      internaciones: await db.HistorialMedico.count({
        where: { paciente_id: paciente.id, tipo_evento: 'Internacion' }
      }),
      cirugias: await db.HistorialMedico.count({
        where: { paciente_id: paciente.id, tipo_evento: 'Cirugia' }
      }),
      estudios: await db.HistorialMedico.count({
        where: { paciente_id: paciente.id, tipo_evento: 'Estudio' }
      })
    };

    // Obtener evaluaciones médicas
    const evaluaciones = await db.EvaluacionMedica.findAll({
      where: { paciente_id: paciente.id },
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
          model: db.Diagnostico,
          as: 'diagnostico',
          attributes: ['nombre', 'codigo']
        },
        {
          model: db.Tratamiento,
          as: 'tratamiento',
          attributes: ['nombre', 'descripcion']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    // Obtener estudios solicitados
    const estudios = await db.EstudioSolicitado.findAll({
      where: { paciente_id: paciente.id },
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        },
        {
          model: db.TurnoEstudio,
          as: 'turno_estudio',
          attributes: ['fecha', 'hora', 'estado', 'resultado']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Calcular edad
    const fechaNacimiento = new Date(paciente.usuario.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/historial-medico', {
      title: 'Historial Médico',
      user: req.user,
      paciente: {
        ...paciente.toJSON(),
        edad
      },
      historial,
      evaluaciones,
      estudios,
      estadisticas,
      filtros: { tipo_evento, desde, hasta },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error al obtener historial médico:', error);
    next(error);
  }
};

// GET /paciente/historial-medico/timeline - Vista de línea de tiempo
exports.getTimeline = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 

    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    // Obtener todos los eventos para la línea de tiempo
    const eventos = [];

    // Historial médico
    const historial = await db.HistorialMedico.findAll({
      where: { paciente_id: paciente.id },
      attributes: ['id', 'descripcion', 'tipo_evento', 'fecha'],
      order: [['fecha', 'DESC']],
      limit: 50
    });

    historial.forEach(h => {
      eventos.push({
        fecha: h.fecha,
        tipo: h.tipo_evento,
        descripcion: h.descripcion,
        icono: getTipoEventoIcon(h.tipo_evento),
        color: getTipoEventoColor(h.tipo_evento)
      });
    });

    // Evaluaciones médicas
    const evaluaciones = await db.EvaluacionMedica.findAll({
      where: { paciente_id: paciente.id },
      include: [
        {
          model: db.Diagnostico,
          as: 'diagnostico',
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
      limit: 20
    });

    evaluaciones.forEach(e => {
      eventos.push({
        fecha: e.fecha,
        tipo: 'Evaluación Médica',
        descripcion: `Evaluación por Dr/a. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}${e.diagnostico ? ': ' + e.diagnostico.nombre : ''}`,
        icono: 'fa-stethoscope',
        color: 'primary'
      });
    });

    // Ordenar eventos por fecha
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.render('dashboard/paciente/historial-timeline', {
      title: 'Línea de Tiempo Médica',
      user: req.user,
      eventos
    });

  } catch (error) {
    console.error('Error al obtener timeline:', error);
    next(error);
  }
};

// Funciones auxiliares
function getTipoEventoIcon(tipo) {
  const icons = {
    'Consulta': 'fa-user-md',
    'Internacion': 'fa-bed',
    'Cirugia': 'fa-procedures',
    'Estudio': 'fa-x-ray',
    'Otro': 'fa-notes-medical'
  };
  return icons[tipo] || 'fa-file-medical';
}

function getTipoEventoColor(tipo) {
  const colors = {
    'Consulta': 'info',
    'Internacion': 'warning',
    'Cirugia': 'danger',
    'Estudio': 'primary',
    'Otro': 'secondary'
  };
  return colors[tipo] || 'secondary';
}

// GET /paciente/historial-medico/resumen - Resumen ejecutivo (AJAX)
exports.getResumen = async (req, res, next) => {
  try {
    const pacienteId = req.user.id; 

    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Últimas evaluaciones
    const ultimasEvaluaciones = await db.EvaluacionMedica.findAll({
      where: { paciente_id: paciente.id },
      include: [
        {
          model: db.Diagnostico,
          as: 'diagnostico',
          attributes: ['nombre', 'codigo']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 3,
      attributes: ['id', 'fecha', 'observaciones_diagnostico']
    });

    // Estudios pendientes
    const estudiosPendientes = await db.EstudioSolicitado.count({
      where: {
        paciente_id: paciente.id,
        estado: 'Pendiente'
      }
    });

    // Total de eventos
    const totalEventos = await db.HistorialMedico.count({
      where: { paciente_id: paciente.id }
    });

    res.json({
      success: true,
      resumen: {
        ultimasEvaluaciones,
        estudiosPendientes,
        totalEventos
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    next(error);
  }
};

module.exports = exports;
