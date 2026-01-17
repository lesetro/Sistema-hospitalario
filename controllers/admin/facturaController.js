const { Op } = require('sequelize');
const db = require('../../database/db');
const {
  Factura,
  Pago,
  Paciente,
  Usuario,
  ObraSocial,
  Admision,
  Internacion,
  Medico,
  Sector,
  TipoEstudio,
  EstudioSolicitado,
  Habitacion,
  Cama,
  TipoDeServicio,
  Especialidad,
  Notificacion
} = require('../../models');

/**
 * Vista principal de facturación
 */
const getVistaFacturas = async (req, res) => {
  try {
    const obrasSociales = await ObraSocial.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    const pacientes = await Paciente.findAll({
      where: { estado: 'Activo' },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni']
        }
      ],
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    res.render('dashboard/admin/factura/facturas', {
      title: 'Gestión de Facturación y Pagos',
      obrasSociales,
      pacientes
    });
  } catch (error) {
    console.error('Error al cargar vista de facturas:', error);
    res.status(500).render('error', {
      message: 'Error al cargar la página de facturación'
    });
  }
};

/**
 * Obtener lista de facturas con paginación y filtros
 */
const getListaFacturas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      estado = '',
      tipo_pago = '',
      fecha_desde = '',
      fecha_hasta = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const whereFactura = {};
    const whereUsuario = {};

    if (estado) {
      whereFactura.estado = estado;
    }

    if (tipo_pago) {
      whereFactura.tipo_pago = tipo_pago;
    }

    if (fecha_desde && fecha_hasta) {
      whereFactura.fecha_emision = {
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

    // Consultar facturas
    const { count, rows: facturas } = await Factura.findAndCountAll({
      where: whereFactura,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              where: Object.keys(whereUsuario).length ? whereUsuario : undefined,
              attributes: ['nombre', 'apellido', 'dni']
            }
          ]
        },
        {
          model: ObraSocial,
          as: 'obra_social',
          attributes: ['nombre'],
          required: false
        },
        {
          model: Admision,
          as: 'admision',
          include: [
            {
              model: Medico,
              as: 'medico',
              include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
              ]
            },
            { model: Sector, as: 'sector', attributes: ['nombre'] }
          ],
          required: false
        },
        {
          model: Pago,
          as: 'pagos',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['fecha_emision', 'DESC']],
      distinct: true
    });

    // Formatear datos
    const facturasFormateadas = facturas.map(f => {
      const totalPagado = f.pagos.reduce((sum, p) => {
        return p.estado === 'Completado' ? sum + parseFloat(p.monto) : sum;
      }, 0);

      return {
        id: f.id,
        paciente: `${f.paciente.usuario.nombre} ${f.paciente.usuario.apellido}`,
        dni: f.paciente.usuario.dni,
        paciente_id: f.paciente_id,
        monto: parseFloat(f.monto),
        obra_social: f.obra_social?.nombre || 'Sin obra social',
        tipo_pago: f.tipo_pago,
        estado: f.estado,
        fecha_emision: f.fecha_emision,
        descripcion: f.descripcion,
        admision: f.admision,
        totalPagado: totalPagado.toFixed(2),
        saldo: (parseFloat(f.monto) - totalPagado).toFixed(2),
        cantidadPagos: f.pagos.length
      };
    });

    res.json({
      success: true,
      facturas: facturasFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de facturas',
      error: error.message
    });
  }
};

/**
 * Calcular monto de factura según servicios
 */
const calcularMontoFactura = async (req, res) => {
  try {
    const {
      admision_id,
      internacion_id,
      incluir_estudios = false,
      incluir_medicamentos = false
    } = req.body;

    let montoTotal = 0;
    const detalles = [];

    // 1. CONSULTA MÉDICA BASE
    if (admision_id) {
      const admision = await Admision.findByPk(admision_id, {
        include: [
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Especialidad, as: 'especialidad' }]
          },
          { model: Sector, as: 'sector' }
        ]
      });

      if (admision) {
        const especialidad = admision.medico?.especialidad?.nombre || 'General';
        let montoConsulta = 5000; // Base

        // Ajustar según especialidad
        const especialidadesCaras = ['Cardiología', 'Neurología', 'Cirugía'];
        if (especialidadesCaras.includes(especialidad)) {
          montoConsulta = 8000;
        }

        montoTotal += montoConsulta;
        detalles.push({
          concepto: `Consulta ${especialidad}`,
          monto: montoConsulta
        });
      }
    }

    // 2. INTERNACIÓN
    if (internacion_id) {
      const internacion = await Internacion.findByPk(internacion_id, {
        include: [
          {
            model: Habitacion,
            as: 'habitacion',
            include: [
              { model: TipoDeServicio, as: 'tipoServicio' }
            ]
          },
          {
            model: Cama,
            as: 'cama'
          }
        ]
      });

      if (internacion) {
        // Calcular días de internación
        const fechaInicio = new Date(internacion.fecha_inicio);
        const fechaFin = internacion.fecha_alta ? new Date(internacion.fecha_alta) : new Date();
        const dias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));

        // Costo por día según tipo de servicio
        const tipoServicio = internacion.habitacion?.tipoServicio?.nombre || 'General';
        let costoPorDia = 10000; // Base

        if (tipoServicio.includes('UTI') || tipoServicio.includes('UCI')) {
          costoPorDia = 50000;
        } else if (tipoServicio.includes('Terapia')) {
          costoPorDia = 30000;
        }

        const montoInternacion = costoPorDia * dias;
        montoTotal += montoInternacion;
        
        detalles.push({
          concepto: `Internación ${tipoServicio} (${dias} día${dias > 1 ? 's' : ''})`,
          monto: montoInternacion
        });
      }
    }

    // 3. ESTUDIOS SOLICITADOS
    if (incluir_estudios && admision_id) {
      const estudios = await EstudioSolicitado.findAll({
        include: [
          {
            model: require('../models').EvaluacionMedica,
            as: 'evaluacion_medica',
            where: { paciente_id: req.body.paciente_id },
            required: false
          },
          {
            model: TipoEstudio,
            as: 'tipo_estudio'
          }
        ]
      });

      estudios.forEach(estudio => {
        const tipoEstudio = estudio.tipo_estudio?.nombre || 'Estudio';
        let costoEstudio = 3000; // Base

        // Ajustar según tipo
        if (estudio.tipo_estudio?.categoria === 'Imagenología') {
          costoEstudio = 8000;
        } else if (estudio.tipo_estudio?.categoria === 'Laboratorio') {
          costoEstudio = 2000;
        }

        montoTotal += costoEstudio;
        detalles.push({
          concepto: `Estudio: ${tipoEstudio}`,
          monto: costoEstudio
        });
      });
    }

    // 4. MEDICAMENTOS (si aplica)
    if (incluir_medicamentos) {
      const montoMedicamentos = 5000; // Estimado
      montoTotal += montoMedicamentos;
      detalles.push({
        concepto: 'Medicamentos y suministros',
        monto: montoMedicamentos
      });
    }

    res.json({
      success: true,
      montoTotal: montoTotal.toFixed(2),
      detalles
    });

  } catch (error) {
    console.error('Error al calcular monto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular monto de factura',
      error: error.message
    });
  }
};

/**
 * Crear nueva factura
 */
const crearFactura = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      paciente_id,
      monto,
      descripcion,
      admision_id,
      obra_social_id,
      porcentaje_obra_social = 0,
      tipo_pago_manual
    } = req.body;

    console.log('📝 Creando factura para paciente:', paciente_id);

    // Validar paciente
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{ model: ObraSocial, as: 'obraSocial' }],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const montoTotal = parseFloat(monto);
    let facturasPrincipal = null;
    let facturaHospital = null;

    // CASO 1: CON OBRA SOCIAL
    if (obra_social_id && porcentaje_obra_social > 0) {
      const montoObraSocial = (montoTotal * porcentaje_obra_social) / 100;
      const montoHospital = montoTotal - montoObraSocial;

      console.log(` Monto total: $${montoTotal}`);
      console.log(` Obra Social (${porcentaje_obra_social}%): $${montoObraSocial}`);
      console.log(` Hospital: $${montoHospital}`);

      // Crear factura principal (Obra Social)
      facturasPrincipal = await Factura.create({
        paciente_id,
        monto: montoObraSocial,
        obra_social_id,
        descripcion: `${descripcion}\n[Cobertura: ${porcentaje_obra_social}% Obra Social]`,
        fecha_emision: new Date(),
        estado: 'Pendiente',
        admision_id: admision_id || null,
        tipo_pago: 'Obra Social'
      }, { transaction });

      // Crear factura al hospital por el remanente
      if (montoHospital > 0) {
        facturaHospital = await Factura.create({
          paciente_id,
          monto: montoHospital,
          obra_social_id: null,
          descripcion: `${descripcion}\n[Remanente hospital público - ${100 - porcentaje_obra_social}%]`,
          fecha_emision: new Date(),
          estado: 'Pagada', // Automáticamente pagada por el sistema
          admision_id: admision_id || null,
          tipo_pago: 'SISTEMA PUBLICO'
        }, { transaction });

        console.log(` Factura hospital #${facturaHospital.id} creada automáticamente`);
      }

    } 
    // CASO 2: SIN OBRA SOCIAL (100% Hospital Público)
    else {
      facturasPrincipal = await Factura.create({
        paciente_id,
        monto: montoTotal,
        obra_social_id: null,
        descripcion: `${descripcion}\n[Atención sistema público - 100%]`,
        fecha_emision: new Date(),
        estado: 'Pagada',
        admision_id: admision_id || null,
        tipo_pago: 'SISTEMA PUBLICO'
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Factura creada correctamente',
      factura: facturasPrincipal,
      facturaHospital: facturaHospital || null
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de una factura
 */
const getDetallesFactura = async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await Factura.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'email', 'telefono']
            },
            {
              model: ObraSocial,
              as: 'obraSocial',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: ObraSocial,
          as: 'obra_social',
          attributes: ['nombre', 'descripcion']
        },
        {
          model: Admision,
          as: 'admision',
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
          ]
        },
        {
          model: Pago,
          as: 'pagos',
          include: [
            {
              model: ObraSocial,
              as: 'obra_social',
              attributes: ['nombre']
            }
          ],
          order: [['fecha', 'DESC']]
        }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Calcular totales
    const totalPagado = factura.pagos.reduce((sum, p) => {
      return p.estado === 'Completado' ? sum + parseFloat(p.monto) : sum;
    }, 0);

    const saldo = parseFloat(factura.monto) - totalPagado;

    res.json({
      success: true,
      factura: {
        ...factura.toJSON(),
        totalPagado: totalPagado.toFixed(2),
        saldo: saldo.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error al obtener detalles de factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles',
      error: error.message
    });
  }
};

/**
 * Registrar pago de factura
 */
const registrarPago = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { monto, metodo, obra_social_id } = req.body;

    const factura = await Factura.findByPk(id, {
      include: [{ model: Paciente, as: 'paciente' }],
      transaction
    });

    if (!factura) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    if (factura.estado === 'Pagada') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La factura ya está pagada completamente'
      });
    }

    // Calcular saldo actual
    const pagosAnteriores = await Pago.findAll({
      where: { factura_id: id, estado: 'Completado' },
      transaction
    });

    const totalPagado = pagosAnteriores.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const saldo = parseFloat(factura.monto) - totalPagado;

    if (parseFloat(monto) > saldo) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `El monto excede el saldo pendiente ($${saldo.toFixed(2)})`
      });
    }

    // Crear pago
    const pago = await Pago.create({
      paciente_id: factura.paciente_id,
      factura_id: id,
      obra_social_id: obra_social_id || factura.obra_social_id,
      monto: parseFloat(monto),
      fecha: new Date(),
      metodo,
      estado: 'Completado'
    }, { transaction });

    // Verificar si la factura está completamente pagada
    const nuevoTotalPagado = totalPagado + parseFloat(monto);
    if (nuevoTotalPagado >= parseFloat(factura.monto)) {
      await factura.update({ estado: 'Pagada' }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      pago
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  }
};

/**
 * Anular factura (baja lógica)
 */
const anularFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const factura = await Factura.findByPk(id, {
      include: [{ model: Pago, as: 'pagos' }]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    // Verificar que no tenga pagos completados
    const pagosCompletados = factura.pagos.filter(p => p.estado === 'Completado');
    if (pagosCompletados.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede anular una factura con pagos completados'
      });
    }

    await factura.update({
      estado: 'Cancelada',
      descripcion: `${factura.descripcion}\n\n[ANULADA] ${new Date().toLocaleDateString()}: ${motivo}`
    });

    res.json({
      success: true,
      message: 'Factura anulada correctamente'
    });

  } catch (error) {
    console.error('Error al anular factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al anular factura',
      error: error.message
    });
  }
};

/**
 * Obtener admisiones de un paciente para facturar
 */
const getAdmisionesPaciente = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const admisiones = await Admision.findAll({
      where: {
        paciente_id,
        estado: 'Completada'
      },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        {
          model: Sector,
          as: 'sector',
          attributes: ['nombre']
        },
        {
          model: Factura,
          as: 'facturas',
          required: false
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const admisionesSinFacturar = admisiones.filter(a => !a.facturas || a.facturas.length === 0);

    res.json({
      success: true,
      admisiones: admisionesSinFacturar
    });

  } catch (error) {
    console.error('Error al obtener admisiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener admisiones del paciente',
      error: error.message
    });
  }
};

module.exports = {
  getVistaFacturas,
  getListaFacturas,
  calcularMontoFactura,
  crearFactura,
  getDetallesFactura,
  registrarPago,
  anularFactura,
  getAdmisionesPaciente
};