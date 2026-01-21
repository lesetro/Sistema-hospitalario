const { 
  AltaMedica,
  Paciente,
  Usuario,
  Medico,
  Internacion,
  Admision,
  Cama,
  Habitacion,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderAltasMedicas = async (req, res) => {
  try {
    console.log('🔍 renderAltasMedicas - usuario_id:', req.user.usuario_id);
    
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: require('../../models').Especialidad, as: 'especialidad' }
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

    console.log('✅ Renderizando vista de altas médicas...');

    res.render('dashboard/medico/altas-medicas', {
      title: 'Altas Médicas',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar altas médicas:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER ALTAS
// ========================================
exports.obtenerAltas = async (req, res) => {
  try {
    console.log('📋 obtenerAltas - usuario_id:', req.user.usuario_id);
    
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

    const { 
      pacienteId,
      tipoAlta,
      estadoPaciente,
      fechaDesde,
      fechaHasta,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { medico_id: medico.id };

    if (pacienteId) {
      whereClause.paciente_id = pacienteId;
    }

    if (tipoAlta && tipoAlta !== 'TODOS') {
      whereClause.tipo_alta = tipoAlta;
    }

    if (estadoPaciente && estadoPaciente !== 'TODOS') {
      whereClause.estado_paciente = estadoPaciente;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fecha_alta = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
    } else if (fechaDesde) {
      whereClause.fecha_alta = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha_alta = { [Op.lte]: fechaHasta };
    }

    const { count, rows: altas } = await AltaMedica.findAndCountAll({
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
          model: Internacion,
          as: 'internacion',
          include: [
            {
              model: Habitacion,
              as: 'habitacion',
              attributes: ['numero']
            },
            {
              model: Cama,
              as: 'cama',
              attributes: ['numero']
            }
          ],
          required: false
        },
        {
          model: Admision,
          as: 'admision',
          attributes: ['id', 'fecha', 'estado'],
          required: false
        }
      ],
      order: [['fecha_alta', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Altas obtenidas:', count);

    res.json({
      success: true,
      data: altas,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener altas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ALTA POR ID
// ========================================
exports.obtenerAltaPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerAltaPorId - usuario_id:', req.user.usuario_id);
    
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

    const alta = await AltaMedica.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
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
          model: Internacion,
          as: 'internacion',
          include: [
            {
              model: Habitacion,
              as: 'habitacion',
              include: [
                {
                  model: require('../../models').Sector,
                  as: 'sector'
                }
              ]
            },
            {
              model: Cama,
              as: 'cama'
            },
            {
              model: require('../../models').TipoInternacion,
              as: 'tipoInternacion'
            }
          ]
        },
        {
          model: Admision,
          as: 'admision'
        }
      ]
    });

    if (!alta) {
      console.error('❌ Alta no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Alta médica no encontrada' 
      });
    }

    console.log('✅ Alta encontrada:', alta.id);

    res.json({
      success: true,
      data: alta
    });
  } catch (error) {
    console.error('❌ Error al obtener alta:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR ALTA
// ========================================
exports.crearAlta = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearAlta - usuario_id:', req.user.usuario_id);
    
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
      tipo_alta,
      instrucciones_post_alta,
      internacion_id,
      admision_id,
      estado_paciente
    } = req.body;

    // Validaciones
    if (!internacion_id && !admision_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Debe especificar una internación o una admisión' 
      });
    }

    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    // Validar internación si existe
    if (internacion_id) {
      const internacion = await Internacion.findOne({
        where: {
          id: internacion_id,
          medico_id: medico.id
        },
        transaction
      });
      
      if (!internacion) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Internación no encontrada o no pertenece a este médico' 
        });
      }
      
      if (internacion.fecha_alta) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'La internación ya tiene alta médica registrada' 
        });
      }
    }

    // Validar admisión si existe
    if (admision_id) {
      const admision = await Admision.findByPk(admision_id, { transaction });
      
      if (!admision) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Admisión no encontrada' 
        });
      }
      
      if (admision.estado === 'Completada') {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'La admisión ya está completada' 
        });
      }
    }

    // Crear alta médica
    const alta = await AltaMedica.create({
      paciente_id,
      medico_id: medico.id,
      fecha_alta: new Date(),
      tipo_alta,
      instrucciones_post_alta,
      internacion_id,
      admision_id,
      estado_paciente
    }, { transaction });

    await transaction.commit();

    console.log('✅ Alta creada:', alta.id);

    res.json({
      success: true,
      message: 'Alta médica registrada correctamente',
      data: alta
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear alta:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear alta médica' 
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

    console.log('🔍 Contando total de altas...');
    // Total de altas
    const totalAltas = await AltaMedica.count({
      where: { medico_id: medico.id }
    });

    console.log('🔍 Contando altas este mes...');
    // Este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await AltaMedica.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Contando altas esta semana...');
    // Esta semana
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const estaSemana = await AltaMedica.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.gte]: inicioSemana }
      }
    });

    console.log('🔍 Contando altas hoy...');
    // Hoy
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const hoyAltas = await AltaMedica.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.gte]: inicioHoy }
      }
    });

    console.log('🔍 Obteniendo altas por tipo...');
    // ✅ SIN GROUP BY - traer todo y contar en JavaScript
    const porTipoData = await AltaMedica.findAll({
      where: { medico_id: medico.id },
      attributes: ['tipo_alta'],
      raw: true
    });

    // ✅ CONTAR EN JAVASCRIPT
    const tipos = {};
    porTipoData.forEach(item => {
      const tipo = item.tipo_alta;
      if (!tipos[tipo]) {
        tipos[tipo] = 0;
      }
      tipos[tipo]++;
    });

    const finalResult = {
      totalAltas,
      esteMes,
      estaSemana,
      hoy: hoyAltas,
      porTipo: tipos
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
// OBTENER ALTAS RECIENTES
// ========================================
exports.obtenerAltasRecientes = async (req, res) => {
  try {
    console.log('📅 obtenerAltasRecientes - usuario_id:', req.user.usuario_id);
    
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

    const { limite = 10 } = req.query;

    const altas = await AltaMedica.findAll({
      where: { medico_id: medico.id },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ],
      order: [['fecha_alta', 'DESC']],
      limit: parseInt(limite)
    });

    console.log('✅ Altas recientes obtenidas:', altas.length);

    res.json({
      success: true,
      data: altas
    });
  } catch (error) {
    console.error('❌ Error al obtener altas recientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER PENDIENTES DE ALTA
// ========================================
exports.obtenerPendientesAlta = async (req, res) => {
  try {
    console.log('⏳ obtenerPendientesAlta - usuario_id:', req.user.usuario_id);
    
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

    console.log('🔍 Obteniendo internaciones sin alta...');
    // Internaciones sin alta
    const internaciones = await Internacion.findAll({
      where: {
        medico_id: medico.id,
        fecha_alta: null
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
          model: Habitacion,
          as: 'habitacion',
          attributes: ['numero']
        },
        {
          model: Cama,
          as: 'cama',
          attributes: ['numero']
        }
      ],
      order: [['fecha_inicio', 'ASC']],
      limit: 20
    });

    console.log('🔍 Obteniendo admisiones pendientes...');
    // Admisiones pendientes (sin internación y sin alta)
    const admisiones = await Admision.findAll({
      where: {
        medico_id: medico.id,
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
          model: Internacion,
          as: 'internacion',
          required: false
        }
      ],
      order: [['fecha', 'ASC']],
      limit: 20
    });

    // Filtrar admisiones que no tienen internación asociada
    const admisionesSinInternacion = admisiones.filter(adm => !adm.internacion);

    console.log('✅ Pendientes obtenidos - Internaciones:', internaciones.length, 'Admisiones:', admisionesSinInternacion.length);

    res.json({
      success: true,
      data: {
        internaciones,
        admisiones: admisionesSinInternacion
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener pendientes de alta:', error.message);
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

    // Obtener pacientes únicos del médico que tienen altas
    const altas = await AltaMedica.findAll({
      where: { medico_id: medico.id },
      attributes: ['paciente_id'],
      group: ['paciente_id'],
      raw: true
    });

    const pacientesIds = altas.map(a => a.paciente_id);

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