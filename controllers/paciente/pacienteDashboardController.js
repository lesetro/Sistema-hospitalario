const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Dashboard Principal del Paciente
 * Muestra un resumen completo de la información del paciente
 */

// GET /paciente - Dashboard principal
exports.getDashboard = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente

    // Obtener datos del paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  //  Buscar directo por PK
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'email', 'dni', 'telefono', 'fecha_nacimiento', 'sexo']
        },
        {
          model: db.ObraSocial,
          as: 'obraSocial',
          attributes: ['nombre', 'descripcion']
        }
      ]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'No se encontró el perfil de paciente',
        error: { status: 404 }
      });
    }

    // Obtener próximos turnos (confirmados y pendientes)
    const proximosTurnos = await db.Turno.findAll({
      where: {
        paciente_id: paciente.id,
        estado: ['CONFIRMADO', 'PENDIENTE'],
        fecha: {
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: db.Medico,
          as: 'medico',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }, {
            model: db.Especialidad,
            as: 'especialidad',
            attributes: ['nombre']
          }]
        },
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['nombre']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: 5
    });

    // Obtener listas de espera activas
    const listasEspera = await db.ListaEspera.findAll({
      where: {
        paciente_id: paciente.id,
        estado: ['PENDIENTE', 'ASIGNADO']
      },
      include: [
        {
          model: db.TipoTurno,
          as: 'tipo_turno',
          attributes: ['nombre']
        },
        {
          model: db.Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        },
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre']
        }
      ],
      order: [['prioridad', 'ASC'], ['fecha_registro', 'ASC']],
      limit: 5
    });

    // Obtener facturas pendientes
    const facturasPendientes = await db.Factura.findAll({
      where: {
        paciente_id: paciente.id,
        estado: 'Pendiente'
      },
      order: [['fecha_emision', 'DESC']],
      limit: 5
    });

    // Calcular total de deuda
    const totalDeuda = facturasPendientes.reduce((sum, factura) => {
      return sum + parseFloat(factura.monto);
    }, 0);

    // Obtener notificaciones no leídas
    const notificaciones = await db.Notificacion.findAll({
      where: {
        usuario_id: req.user.usuario_id,  //  Para notificaciones usamos usuario_id
        leida: false
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Obtener última admisión
    const ultimaAdmision = await db.Admision.findOne({
      where: {
        paciente_id: paciente.id
      },
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
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // Obtener internación activa
    const internacionActiva = await db.Internacion.findOne({
      where: {
        paciente_id: paciente.id,
        fecha_alta: null
      },
      include: [
        {
          model: db.Cama,
          as: 'cama',
          include: [{
            model: db.Habitacion,
            as: 'habitacion',
            attributes: ['numero', 'tipo']
          }]
        },
        {
          model: db.Medico,
          as: 'medico',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: db.TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre']
        }
      ]
    });

    // Obtener estudios pendientes
    const estudiosPendientes = await db.EstudioSolicitado.findAll({
      where: {
        paciente_id: paciente.id,
        estado: 'Pendiente'
      },
      include: [
        {
          model: db.TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria']
        }
      ],
      order: [['urgencia', 'DESC'], ['created_at', 'DESC']],
      limit: 5
    });

    // Estadísticas generales
    const estadisticas = {
      totalTurnos: await db.Turno.count({
        where: { paciente_id: paciente.id }
      }),
      turnosCompletados: await db.Turno.count({
        where: { paciente_id: paciente.id, estado: 'COMPLETADO' }
      }),
      totalAdmisiones: await db.Admision.count({
        where: { paciente_id: paciente.id }
      }),
      totalFacturas: await db.Factura.count({
        where: { paciente_id: paciente.id }
      }),
      facturasPagadas: await db.Factura.count({
        where: { paciente_id: paciente.id, estado: 'Pagada' }
      })
    };

    // Calcular edad
    const fechaNacimiento = new Date(paciente.usuario.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    res.render('dashboard/paciente/dashboard', {
      title: 'Mi Portal',
      user: {
        ...paciente.usuario.dataValues,
        obra_social: paciente.obraSocial ? paciente.obraSocial.nombre : 'Sin Obra Social',
        edad
      },
      paciente,
      proximosTurnos,
      listasEspera,
      facturasPendientes,
      totalDeuda,
      notificaciones,
      ultimaAdmision,
      internacionActiva,
      estudiosPendientes,
      estadisticas,
      contadores: {
        turnos: proximosTurnos.length,
        facturas: facturasPendientes.length,
        notificaciones: notificaciones.length,
        estudios: estudiosPendientes.length,
        listaEspera: listasEspera.length
      }
    });

  } catch (error) {
    console.error('Error en dashboard del paciente:', error);
    next(error);
  }
};

// GET /paciente/resumen-rapido - Resumen rápido para AJAX
exports.getResumenRapido = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  //  ID directo del paciente

    const paciente = await db.Paciente.findByPk(pacienteId, {  //  Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Contadores para badges
    const contadores = {
      turnosProximos: await db.Turno.count({
        where: {
          paciente_id: paciente.id,
          estado: ['CONFIRMADO', 'PENDIENTE'],
          fecha: { [Op.gte]: new Date() }
        }
      }),
      facturasPendientes: await db.Factura.count({
        where: {
          paciente_id: paciente.id,
          estado: 'Pendiente'
        }
      }),
      notificacionesNoLeidas: await db.Notificacion.count({
        where: {
          usuario_id: req.user.usuario_id, //  Para notificaciones usamos usuario_id,
          leida: false
        }
      }),
      listaEsperaActiva: await db.ListaEspera.count({
        where: {
          paciente_id: paciente.id,
          estado: ['PENDIENTE', 'ASIGNADO']
        }
      }),
      estudiosPendientes: await db.EstudioSolicitado.count({
        where: {
          paciente_id: paciente.id,
          estado: 'Pendiente'
        }
      })
    };

    res.json({
      success: true,
      contadores
    });

  } catch (error) {
    console.error('Error al obtener resumen rápido:', error);
    next(error);
  }
};

module.exports = exports;