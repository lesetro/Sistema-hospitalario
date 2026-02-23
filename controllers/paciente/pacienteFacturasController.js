const db = require('../../models');
const { Op } = require('sequelize');

/**
 * CONTROLADOR: Facturas del Paciente
 * Visualización y gestión de facturas médicas
 */

// GET /paciente/facturas - Lista de facturas
exports.getFacturas = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  
    const { estado, desde, hasta, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Obtener paciente
    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id'],
      include: [{
        model: db.ObraSocial,
        as: 'obraSocial',
        attributes: ['nombre']
      }]
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
      whereClause.fecha_emision = {};
      if (desde) whereClause.fecha_emision[Op.gte] = desde;
      if (hasta) whereClause.fecha_emision[Op.lte] = hasta;
    }

    // Obtener facturas
    const { count, rows: facturas } = await db.Factura.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.ObraSocial,
          as: 'obra_social',
          attributes: ['nombre']
        },
        {
          model: db.Admision,
          as: 'admision',
          attributes: ['id', 'fecha', 'estado'],
          include: [{
            model: db.MotivoAdmision,
            as: 'motivo',
            attributes: ['nombre']
          }]
        },
        {
          model: db.Pago,
          as: 'pagos',
          attributes: ['id', 'monto', 'fecha', 'metodo', 'estado']
        }
      ],
      order: [['fecha_emision', 'DESC']],
      limit,
      offset
    });

    // Calcular totales para cada factura
    facturas.forEach(factura => {
      const totalPagado = factura.pagos
        .filter(p => p.estado === 'Completado')
        .reduce((sum, p) => sum + parseFloat(p.monto), 0);
      factura.dataValues.totalPagado = totalPagado;
      factura.dataValues.saldo = parseFloat(factura.monto) - totalPagado;
    });

    // Calcular estadísticas
    const estadisticas = {
      total: count,
      pendientes: await db.Factura.count({
        where: { paciente_id: paciente.id, estado: 'Pendiente' }
      }),
      pagadas: await db.Factura.count({
        where: { paciente_id: paciente.id, estado: 'Pagada' }
      }),
      canceladas: await db.Factura.count({
        where: { paciente_id: paciente.id, estado: 'Cancelada' }
      })
    };

    // Calcular deuda total
    const facturasPendientes = await db.Factura.findAll({
      where: { paciente_id: paciente.id, estado: 'Pendiente' },
      attributes: ['monto']
    });
    const deudaTotal = facturasPendientes.reduce((sum, f) => sum + parseFloat(f.monto), 0);

    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/paciente/facturas', {
      title: 'Mis Facturas',
      user: req.user,
      facturas,
      estadisticas,
      deudaTotal,
      paciente,
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
    console.error('Error al obtener facturas:', error);
    next(error);
  }
};

// GET /paciente/facturas/:id - Detalle de factura
exports.getDetalleFactura = async (req, res, next) => {
  try {
    const pacienteId = req.user.id;  
    const facturaId = req.params.id;

    const paciente = await db.Paciente.findByPk(pacienteId, {  
      attributes: ['id'],
      include: [
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
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

    const factura = await db.Factura.findOne({
      where: {
        id: facturaId,
        paciente_id: paciente.id
      },
      include: [
        {
          model: db.ObraSocial,
          as: 'obra_social',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: db.Admision,
          as: 'admision',
          include: [
            {
              model: db.MotivoAdmision,
              as: 'motivo',
              attributes: ['nombre', 'descripcion']
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
          ]
        },
        {
          model: db.Pago,
          as: 'pagos',
          order: [['fecha', 'DESC']]
        }
      ]
    });

    if (!factura) {
      return res.status(404).render('error', {
        message: 'Factura no encontrada'
      });
    }

    // Calcular totales
    const totalPagado = factura.pagos
      .filter(p => p.estado === 'Completado')
      .reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const saldo = parseFloat(factura.monto) - totalPagado;

    res.render('dashboard/paciente/factura-detalle', {
      title: 'Detalle de Factura',
      user: req.user,
      factura,
      paciente,
      totalPagado,
      saldo
    });

  } catch (error) {
    console.error('Error al obtener detalle de factura:', error);
    next(error);
  }
};

// GET /paciente/facturas/pendientes - Facturas pendientes (AJAX)
exports.getFacturasPendientes = async (req, res, next) => {
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

    const facturas = await db.Factura.findAll({
      where: {
        paciente_id: paciente.id,
        estado: 'Pendiente'
      },
      attributes: ['id', 'monto', 'fecha_emision', 'descripcion', 'tipo_pago'],
      order: [['fecha_emision', 'DESC']]
    });

    const deudaTotal = facturas.reduce((sum, f) => sum + parseFloat(f.monto), 0);

    res.json({
      success: true,
      facturas,
      deudaTotal,
      total: facturas.length
    });

  } catch (error) {
    console.error('Error al obtener facturas pendientes:', error);
    next(error);
  }
};

module.exports = exports;
