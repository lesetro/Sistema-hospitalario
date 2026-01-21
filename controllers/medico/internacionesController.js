const { 
  Internacion,
  Paciente,
  Usuario,
  Medico,
  Cama,
  Habitacion,
  TipoInternacion,
  Administrativo,
  EvaluacionMedica,
  IntervencionQuirurgica,
  ListaEspera,
  AltaMedica,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderInternaciones = async (req, res) => {
  try {
    console.log('🔍 renderInternaciones - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de internaciones...');

    res.render('dashboard/medico/internaciones', {
      title: 'Internaciones',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar internaciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER INTERNACIONES
// ========================================
exports.obtenerInternaciones = async (req, res) => {
  try {
    console.log('📋 obtenerInternaciones - usuario_id:', req.user.usuario_id);
    
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
      estadoPaciente,
      estadoEstudios,
      estadoOperacion,
      conAlta,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { medico_id: medico.id };

    if (pacienteId) {
      whereClause.paciente_id = pacienteId;
    }

    if (estadoPaciente && estadoPaciente !== 'TODOS') {
      whereClause.estado_paciente = estadoPaciente;
    }

    if (estadoEstudios && estadoEstudios !== 'TODOS') {
      whereClause.estado_estudios = estadoEstudios;
    }

    if (estadoOperacion && estadoOperacion !== 'TODOS') {
      whereClause.estado_operacion = estadoOperacion;
    }

    // Filtrar por alta
    if (conAlta === 'SI') {
      whereClause.fecha_alta = { [Op.ne]: null };
    } else if (conAlta === 'NO') {
      whereClause.fecha_alta = null;
    }

    const { count, rows: internaciones } = await Internacion.findAndCountAll({
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
          model: Cama,
          as: 'cama',
          attributes: ['id', 'numero', 'estado']
        },
        {
          model: Habitacion,
          as: 'habitacion',
          attributes: ['id', 'numero', 'tipo'],
          include: [
            {
              model: require('../../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['id', 'nombre']
        },
        {
          model: AltaMedica,
          as: 'altasMedicas',
          attributes: ['id', 'fecha_alta', 'tipo_alta'],
          required: false,
          limit: 1,
          order: [['fecha_alta', 'DESC']]
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Internaciones obtenidas:', count);

    res.json({
      success: true,
      data: internaciones,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener internaciones:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERNACIÓN POR ID
// ========================================
exports.obtenerInternacionPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerInternacionPorId - usuario_id:', req.user.usuario_id);
    
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

    const internacion = await Internacion.findOne({
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
          model: Cama,
          as: 'cama',
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
            }
          ]
        },
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
          model: TipoInternacion,
          as: 'tipoInternacion'
        },
        {
          model: Administrativo,
          as: 'administrativo',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }
          ]
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacionMedica',
          include: [
            {
              model: require('../../models').Diagnostico,
              as: 'diagnostico'
            }
          ]
        },
        {
          model: IntervencionQuirurgica,
          as: 'intervencionQuirurgica',
          required: false
        },
        {
          model: ListaEspera,
          as: 'lista_espera',
          attributes: ['id', 'estado', 'prioridad']
        },
        {
          model: AltaMedica,
          as: 'altasMedicas'
        }
      ]
    });

    if (!internacion) {
      console.error('❌ Internación no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Internación no encontrada' 
      });
    }

    console.log('✅ Internación encontrada:', internacion.id);

    res.json({
      success: true,
      data: internacion
    });
  } catch (error) {
    console.error('❌ Error al obtener internación:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// ACTUALIZAR ESTADO
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

    const internacion = await Internacion.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!internacion) {
      await transaction.rollback();
      console.error('❌ Internación no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Internación no encontrada' 
      });
    }

    const {
      estado_paciente,
      estado_estudios,
      estado_operacion,
      fecha_cirugia
    } = req.body;

    const updateData = {};
    if (estado_paciente) updateData.estado_paciente = estado_paciente;
    if (estado_estudios) updateData.estado_estudios = estado_estudios;
    if (estado_operacion) updateData.estado_operacion = estado_operacion;
    if (fecha_cirugia) updateData.fecha_cirugia = fecha_cirugia;

    await internacion.update(updateData, { transaction });

    // Crear registro en historial médico
    await require('../../models').HistorialMedico.create({
      paciente_id: internacion.paciente_id,
      descripcion: `Actualización de internación. Estado paciente: ${estado_paciente || internacion.estado_paciente}`,
      tipo_evento: 'Internacion',
      fecha: new Date()
    }, { transaction });

    await transaction.commit();

    console.log('✅ Internación actualizada:', internacion.id);

    res.json({
      success: true,
      message: 'Internación actualizada correctamente',
      data: internacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar internación:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERNACIONES ACTIVAS
// ========================================
exports.obtenerInternacionesActivas = async (req, res) => {
  try {
    console.log('📅 obtenerInternacionesActivas - usuario_id:', req.user.usuario_id);
    
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
          attributes: ['numero'],
          include: [
            {
              model: require('../../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: Cama,
          as: 'cama',
          attributes: ['numero']
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: 20
    });

    console.log('✅ Internaciones activas obtenidas:', internaciones.length);

    res.json({
      success: true,
      data: internaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener internaciones activas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER TIPOS DE INTERNACIÓN
// ========================================
exports.obtenerTiposInternacion = async (req, res) => {
  try {
    console.log('🏥 obtenerTiposInternacion');
    
    const tipos = await TipoInternacion.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Tipos de internación obtenidos:', tipos.length);

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('❌ Error al obtener tipos de internación:', error.message);
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

    // Obtener pacientes únicos del médico que tienen internaciones
    const internaciones = await Internacion.findAll({
      where: { medico_id: medico.id },
      attributes: ['paciente_id'],
      group: ['paciente_id'],
      raw: true
    });

    const pacientesIds = internaciones.map(i => i.paciente_id);

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

    console.log('🔍 Contando internaciones activas...');
    // Internaciones activas (sin alta)
    const activas = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_alta: null
      }
    });

    console.log('🔍 Contando internaciones con alta...');
    // Con alta
    const conAlta = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.ne]: null }
      }
    });

    console.log('🔍 Contando internaciones este mes...');
    // Este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_inicio: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Obteniendo internaciones por estado del paciente...');
    // ✅ SIN GROUP BY - traer todo y contar en JavaScript
    const porEstadoPacienteData = await Internacion.findAll({
      where: {
        medico_id: medico.id,
        fecha_alta: null
      },
      attributes: ['estado_paciente'],
      raw: true
    });

    // ✅ CONTAR EN JAVASCRIPT
    const estadosPaciente = {};
    porEstadoPacienteData.forEach(item => {
      const estado = item.estado_paciente;
      if (!estadosPaciente[estado]) {
        estadosPaciente[estado] = 0;
      }
      estadosPaciente[estado]++;
    });

    const finalResult = {
      activas,
      conAlta,
      esteMes,
      totalInternaciones: activas + conAlta,
      porEstadoPaciente: estadosPaciente
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