const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Historial de Pagos del Paciente
 */

// GET /paciente/pagos - Historial de pagos
exports.getPagos = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  // ✅ ID directo del paciente
    const { metodo, desde, hasta, page = 1 } = req.query;
    const limit = 15;
    const offset = (page - 1) * limit;

    const paciente = await db.Paciente.findByPk(pacienteId, {  // ✅ Buscar directo por PK
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).render('error', { message: 'Paciente no encontrado' });
    }

    const whereClause = { paciente_id: paciente.id };
    if (metodo) whereClause.metodo = metodo;
    if (desde || hasta) {
      whereClause.fecha = {};
      if (desde) whereClause.fecha[Op.gte] = desde;
      if (hasta) whereClause.fecha[Op.lte] = hasta;
    }

    const { count, rows: pagos } = await db.Pago.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.Factura, as: 'factura', attributes: ['id', 'monto', 'fecha_emision', 'descripcion'] },
        { model: db.ObraSocial, as: 'obra_social', attributes: ['nombre'] }
      ],
      order: [['fecha', 'DESC']],
      limit,
      offset
    });

    const estadisticas = {
      total: count,
      completados: await db.Pago.count({ where: { paciente_id: paciente.id, estado: 'Completado' } }),
      pendientes: await db.Pago.count({ where: { paciente_id: paciente.id, estado: 'Pendiente' } })
    };

    const totalPagado = await db.Pago.sum('monto', {
      where: { paciente_id: paciente.id, estado: 'Completado' }
    }) || 0;

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/pagos', {
      title: 'Historial de Pagos',
      user: req.user,
      pagos,
      estadisticas,
      totalPagado,
      filtros: { metodo, desde, hasta },
      paginacion: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    next(error);
  }
};

// GET /paciente/pagos/:id - Detalle de un pago específico
exports.getDetalleFactura = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const pacienteId = req.user.id;
    const facturaId = req.params.id;

    console.log('DEBUG - Paciente ID:', pacienteId);
    console.log('DEBUG - Factura ID:', facturaId);

    // Obtener la factura con TODAS las relaciones
    const factura = await db.Factura.findOne({
      where: {
        id: facturaId,
        paciente_id: pacienteId
      },
      include: [
        {
          model: db.Paciente,
          as: 'paciente',
          attributes: ['id'],
          include: [
            {
              model: db.Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'email']
            },
            {
              model: db.ObraSocial,
              as: 'obraSocial',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: db.Medico,
          as: 'medico',
          attributes: ['id'],
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
          model: db.EstudioSolicitado,
          as: 'estudio_solicitado',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: db.Pago,
          as: 'pagos',
          attributes: ['id', 'monto', 'fecha', 'metodo', 'estado', 'descripcion'],
          order: [['fecha', 'DESC']]
        }
      ],
      transaction
    });

    if (!factura) {
      console.log('ERROR - Factura no encontrada o no pertenece al paciente');
      await transaction.rollback();
      return res.status(404).render('error', { 
        message: 'Factura no encontrada',
        error: { status: 404 }
      });
    }

    console.log('DEBUG - Factura encontrada:', factura.id);

    // Calcular total pagado de pagos COMPLETADOS
    const totalPagado = await db.Pago.sum('monto', {
      where: {
        factura_id: factura.id,
        estado: 'Completado'
      },
      transaction
    }) || 0;

    console.log('DEBUG - Total pagado:', totalPagado);

    const saldoPendiente = factura.monto - totalPagado;

    // ✅ CORRECCIÓN: Actualizar estado si el saldo es cero o negativo
    if (saldoPendiente <= 0 && factura.estado !== 'Pagada') {
      await factura.update({ estado: 'Pagada' }, { transaction });
      console.log('✅ Estado de factura actualizado a Pagada (saldo <= 0)');
    }

    const porcentajePagado = factura.monto > 0 ? (totalPagado / factura.monto) * 100 : 0;

    // Obtener pagos asociados con más detalles
    const pagos = await db.Pago.findAll({
      where: { factura_id: factura.id },
      order: [['fecha', 'DESC']],
      include: [
        {
          model: db.ObraSocial,
          as: 'obra_social',
          attributes: ['nombre']
        }
      ],
      transaction
    });

    // Calcular detalles para mostrar mensajes contextuales
    const pagosCompletados = pagos.filter(p => p.estado === 'Completado');
    const pagosPaciente = pagosCompletados.filter(p => 
      p.metodo !== 'SISTEMA PUBLICO' && p.metodo !== 'Obra Social'
    );
    const pagosObraSocial = pagosCompletados.filter(p => p.metodo === 'Obra Social');
    const pagosSistemaPublico = pagosCompletados.filter(p => p.metodo === 'SISTEMA PUBLICO');
    
    // Determinar mensaje contextual según pagos
    let mensajeEstado = '';
    if (factura.estado === 'Pagada') {
      mensajeEstado = 'Factura completamente pagada';
    } else if (totalPagado > 0 && totalPagado < factura.monto) {
      if (pagosPaciente.length > 0 && pagosObraSocial.length === 0) {
        mensajeEstado = 'Has realizado pagos, pero falta el pago de la obra social';
      } else if (pagosObraSocial.length > 0 && pagosPaciente.length === 0) {
        mensajeEstado = 'La obra social ha realizado pagos, falta tu aporte';
      } else {
        mensajeEstado = 'Existen pagos parciales registrados';
      }
    } else if (factura.tipo_pago === 'SISTEMA PUBLICO') {
      mensajeEstado = 'Factura cubierta por el sistema público - No requiere pago';
    }

    // Preparar datos del usuario para la vista
    const userData = {
      ...req.user,
      obra_social: factura.paciente.obraSocial ? factura.paciente.obraSocial.nombre : null
    };

    await transaction.commit();

    res.render('dashboard/paciente/factura-detalle', {
      title: `Factura #${factura.id}`,
      user: userData,
      factura: factura,
      pagos: pagos || [],
      totalPagado: totalPagado,
      saldoPendiente: saldoPendiente,
      porcentajePagado: porcentajePagado,
      mensajeEstado: mensajeEstado,
      estadisticasPagos: {
        total: pagos.length,
        completados: pagosCompletados.length,
        paciente: pagosPaciente.length,
        obraSocial: pagosObraSocial.length,
        sistemaPublico: pagosSistemaPublico.length
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('ERROR en getDetalleFactura:', error);
    next(error);
  }
};

exports.getComprobantePago = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;
    const pagoId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {
      attributes: ['id']
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const pago = await db.Pago.findOne({
      where: {
        id: pagoId,
        paciente_id: paciente.id
      },
      include: [
        {
          model: db.Factura,
          as: 'factura',
          attributes: ['id', 'monto', 'fecha_emision', 'descripcion']
        },
        {
          model: db.Paciente,
          as: 'paciente',
          include: [{
            model: db.Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        }
      ]
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
   
    res.json({
      success: true,
      pago: {
        id: pago.id,
        fecha: pago.fecha,
        monto: pago.monto,
        metodo: pago.metodo,
        estado: pago.estado,
        paciente: pago.paciente.usuario,
        factura: pago.factura
      }
    });

  } catch (error) {
    console.error('Error al generar comprobante:', error);
    next(error);
  }
};

module.exports = exports;