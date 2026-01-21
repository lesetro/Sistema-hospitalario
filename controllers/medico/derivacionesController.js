const { 
  SolicitudDerivacion,
  Paciente,
  Usuario,
  Medico,
  Sector,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderDerivaciones = async (req, res) => {
  try {
    console.log('🔍 renderDerivaciones - usuario_id:', req.user.usuario_id);
    
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: require('../../models').Especialidad, as: 'especialidad' },
            { model: Sector, as: 'sector' }
          ]
        }
      ]
    });

    if (!usuario || !usuario.medico) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando vista de derivaciones...');

    res.render('dashboard/medico/derivaciones', {
      title: 'Derivaciones',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre,
        sector: usuario.medico?.sector
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar derivaciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER DERIVACIONES
// ========================================
exports.obtenerDerivaciones = async (req, res) => {
  try {
    console.log('📋 obtenerDerivaciones - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { 
      pacienteId,
      tipo,
      estado,
      direccion,
      fechaDesde,
      fechaHasta,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Filtrar por dirección
    if (direccion === 'ENVIADAS') {
      whereClause.origen_id = medico.sector_id;
    } else if (direccion === 'RECIBIDAS') {
      whereClause.destino_id = medico.sector_id;
    } else {
      whereClause[Op.or] = [
        { origen_id: medico.sector_id },
        { destino_id: medico.sector_id }
      ];
    }

    if (pacienteId) {
      whereClause.paciente_id = pacienteId;
    }

    if (tipo && tipo !== 'TODOS') {
      whereClause.tipo = tipo;
    }

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fecha = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
    } else if (fechaDesde) {
      whereClause.fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha = { [Op.lte]: fechaHasta };
    }

    const { count, rows: derivaciones } = await SolicitudDerivacion.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'apellido', 'dni']
            }
          ]
        },
        {
          model: Sector,
          as: 'origen',
          attributes: ['id', 'nombre']
        },
        {
          model: Sector,
          as: 'destino',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Derivaciones obtenidas:', count);

    res.json({
      success: true,
      data: derivaciones,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener derivaciones:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER DERIVACIÓN POR ID
// ========================================
exports.obtenerDerivacionPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerDerivacionPorId - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const derivacion = await SolicitudDerivacion.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { origen_id: medico.sector_id },
          { destino_id: medico.sector_id }
        ]
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: { exclude: ['password'] }
            },
            {
              model: require('../../models').ObraSocial,
              as: 'obraSocial',
              attributes: ['id', 'nombre']
            }
          ]
        },
        {
          model: Sector,
          as: 'origen'
        },
        {
          model: Sector,
          as: 'destino'
        }
      ]
    });

    if (!derivacion) {
      console.error('❌ Derivación no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Derivación no encontrada' 
      });
    }

    console.log('✅ Derivación encontrada:', derivacion.id);

    res.json({
      success: true,
      data: derivacion
    });
  } catch (error) {
    console.error('❌ Error al obtener derivación:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR DERIVACIÓN
// ========================================
exports.crearDerivacion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearDerivacion - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const {
      paciente_id,
      destino_id,
      tipo,
      motivo
    } = req.body;

    // Validaciones
    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    const destino = await Sector.findByPk(destino_id, { transaction });
    if (!destino) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Sector destino no encontrado' 
      });
    }

    // No se puede derivar al mismo sector
    if (tipo === 'Interna' && medico.sector_id === destino_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'No se puede derivar al mismo sector' 
      });
    }

    // Crear derivación
    const derivacion = await SolicitudDerivacion.create({
      paciente_id,
      origen_id: medico.sector_id,
      destino_id,
      tipo,
      estado: 'Pendiente',
      fecha: new Date(),
      motivo,
      responsable_id: req.user.usuario_id
    }, { transaction });

    // Crear registro en historial médico
    await require('../../models').HistorialMedico.create({
      paciente_id,
      descripcion: `Derivación ${tipo} solicitada desde ${medico.sector?.nombre || 'N/A'} hacia ${destino.nombre}. Motivo: ${motivo || 'No especificado'}`,
      tipo_evento: 'Otro',
      fecha: new Date()
    }, { transaction });

    await transaction.commit();

    console.log('✅ Derivación creada:', derivacion.id);

    res.json({
      success: true,
      message: 'Derivación creada correctamente',
      data: derivacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear derivación:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear derivación' 
    });
  }
};

// ========================================
// ACTUALIZAR ESTADO DE DERIVACIÓN
// ========================================
exports.actualizarEstado = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 actualizarEstado - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      await transaction.rollback();
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { estado, motivo_rechazo } = req.body;

    const derivacion = await SolicitudDerivacion.findOne({
      where: {
        id: req.params.id,
        destino_id: medico.sector_id
      },
      transaction
    });

    if (!derivacion) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Derivación no encontrada o no tiene permisos para modificarla' 
      });
    }

    if (derivacion.estado !== 'Pendiente') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Solo se pueden actualizar derivaciones pendientes' 
      });
    }

    if (!['Aprobada', 'Rechazada'].includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Estado inválido' 
      });
    }

    if (estado === 'Rechazada' && !motivo_rechazo) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Debe especificar el motivo del rechazo' 
      });
    }

    await derivacion.update({
      estado,
      motivo: estado === 'Rechazada' ? 
        `${derivacion.motivo}\n\nMOTIVO RECHAZO: ${motivo_rechazo}` : 
        derivacion.motivo
    }, { transaction });

    // Crear notificación para el paciente
    const pacienteData = await Paciente.findByPk(derivacion.paciente_id, { 
      include: [{ model: Usuario, as: 'usuario' }], 
      transaction 
    });

    await require('../../models').Notificacion.create({
      usuario_id: pacienteData.usuario_id,
      mensaje: `Su derivación ha sido ${estado.toLowerCase()}`,
      leida: false
    }, { transaction });

    // Crear registro en historial
    await require('../../models').HistorialMedico.create({
      paciente_id: derivacion.paciente_id,
      descripcion: `Derivación ${estado.toLowerCase()}`,
      tipo_evento: 'Otro',
      fecha: new Date()
    }, { transaction });

    await transaction.commit();

    console.log('✅ Derivación actualizada:', derivacion.id);

    res.json({
      success: true,
      message: `Derivación ${estado.toLowerCase()} correctamente`,
      data: derivacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar derivación:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al actualizar derivación' 
    });
  }
};

// ========================================
// OBTENER ESTADÍSTICAS
// ========================================
// ✅ CORREGIDO - SIN sequelize.fn() y .get()
exports.obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 obtenerEstadisticas - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    console.log('🔍 Contando derivaciones enviadas...');
    // Enviadas
    const enviadas = await SolicitudDerivacion.count({
      where: { origen_id: medico.sector_id }
    });

    console.log('🔍 Contando derivaciones recibidas...');
    // Recibidas
    const recibidas = await SolicitudDerivacion.count({
      where: { destino_id: medico.sector_id }
    });

    console.log('🔍 Contando derivaciones pendientes de recibir...');
    // Pendientes de recibir
    const pendientesRecibir = await SolicitudDerivacion.count({
      where: {
        destino_id: medico.sector_id,
        estado: 'Pendiente'
      }
    });

    console.log('🔍 Contando derivaciones este mes...');
    // Este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await SolicitudDerivacion.count({
      where: {
        [Op.or]: [
          { origen_id: medico.sector_id },
          { destino_id: medico.sector_id }
        ],
        fecha: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Obteniendo derivaciones por estado...');
    // ✅ SIN GROUP BY - traer todo y contar en JavaScript
    const porEstadoData = await SolicitudDerivacion.findAll({
      where: { origen_id: medico.sector_id },
      attributes: ['estado'],
      raw: true
    });

    // ✅ CONTAR EN JAVASCRIPT
    const estadosEnviadas = {};
    porEstadoData.forEach(item => {
      const estado = item.estado;
      if (!estadosEnviadas[estado]) {
        estadosEnviadas[estado] = 0;
      }
      estadosEnviadas[estado]++;
    });

    const finalResult = {
      enviadas,
      recibidas,
      pendientesRecibir,
      esteMes,
      porEstadoEnviadas: estadosEnviadas
    };

    console.log('✅ Estadísticas calculadas:', finalResult);

    res.json({
      success: true,
      data: finalResult
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER SECTORES
// ========================================
exports.obtenerSectores = async (req, res) => {
  try {
    console.log('🏥 obtenerSectores');
    
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Sectores obtenidos:', sectores.length);

    res.json({
      success: true,
      data: sectores
    });
  } catch (error) {
    console.error('❌ Error al obtener sectores:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER DERIVACIONES PENDIENTES
// ========================================
exports.obtenerDerivacionesPendientes = async (req, res) => {
  try {
    console.log('⏳ obtenerDerivacionesPendientes - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const derivaciones = await SolicitudDerivacion.findAll({
      where: {
        destino_id: medico.sector_id,
        estado: 'Pendiente'
      },
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
        }
      ],
      order: [['fecha', 'ASC']],
      limit: 20
    });

    console.log('✅ Derivaciones pendientes obtenidas:', derivaciones.length);

    res.json({
      success: true,
      data: derivaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener derivaciones pendientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER PACIENTES PARA FILTRO
// ========================================
exports.obtenerPacientesParaFiltro = async (req, res) => {
  try {
    console.log('👥 obtenerPacientesParaFiltro - usuario_id:', req.user.usuario_id);
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const { busqueda } = req.query;

    // Obtener pacientes únicos del médico que tienen derivaciones
    const derivaciones = await SolicitudDerivacion.findAll({
      where: {
        [Op.or]: [
          { origen_id: medico.sector_id },
          { destino_id: medico.sector_id }
        ]
      },
      attributes: ['paciente_id'],
      group: ['paciente_id'],
      raw: true
    });

    const pacientesIds = derivaciones.map(d => d.paciente_id);

    if (pacientesIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const whereClause = { id: { [Op.in]: pacientesIds } };

    const includeClause = {
      model: Usuario,
      as: 'usuario',
      attributes: ['id', 'nombre', 'apellido', 'dni'],
      where: busqueda ? {
        [Op.or]: [
          { nombre: { [Op.like]: `%${busqueda}%` } },
          { apellido: { [Op.like]: `%${busqueda}%` } },
          { dni: { [Op.like]: `%${busqueda}%` } }
        ]
      } : undefined
    };

    const pacientes = await Paciente.findAll({
      where: whereClause,
      include: [includeClause],
      limit: 20,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    console.log('✅ Pacientes obtenidos:', pacientes.length);

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};