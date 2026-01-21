const { 
  Paciente,
  Usuario,
  Medico,
  ObraSocial,
  EvaluacionMedica,
  Internacion,
  Turno,
  AltaMedica,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderBuscarPaciente = async (req, res) => {
  try {
    console.log('🔍 renderBuscarPaciente - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de búsqueda de pacientes...');

    res.render('dashboard/medico/buscar-paciente', {
      title: 'Buscar Paciente',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar buscar paciente:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// BUSCAR PACIENTES
// ========================================
exports.buscarPacientes = async (req, res) => {
  try {
    console.log('🔎 buscarPacientes - usuario_id:', req.user.usuario_id);
    
    const { 
      busqueda,
      estado,
      obraSocial,
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;

    if (!busqueda || busqueda.length < 2) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          totalPages: 0
        }
      });
    }

    const whereClause = {};

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }

    if (obraSocial && obraSocial !== 'TODOS') {
      whereClause.obra_social_id = obraSocial;
    }

    const includeClause = [
      {
        model: Usuario,
        as: 'usuario',
        attributes: { exclude: ['password'] },
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${busqueda}%` } },
            { apellido: { [Op.like]: `%${busqueda}%` } },
            { dni: { [Op.like]: `%${busqueda}%` } },
            { email: { [Op.like]: `%${busqueda}%` } }
          ]
        }
      },
      {
        model: ObraSocial,
        as: 'obraSocial',
        attributes: ['id', 'nombre'],
        required: false
      }
    ];

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Pacientes encontrados:', count);

    res.json({
      success: true,
      data: pacientes,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al buscar pacientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER DETALLE COMPLETO DEL PACIENTE
// ========================================
exports.obtenerDetallePaciente = async (req, res) => {
  try {
    console.log('👤 obtenerDetallePaciente - usuario_id:', req.user.usuario_id);
    
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

    const paciente = await Paciente.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['password'] }
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!paciente) {
      console.error('❌ Paciente no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    console.log('🔍 Obteniendo estadísticas del paciente...');

    // Obtener estadísticas del paciente
    const evaluaciones = await EvaluacionMedica.count({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      }
    });

    const turnos = await Turno.count({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      }
    });

    const internaciones = await Internacion.count({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      }
    });

    const altas = await AltaMedica.count({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      }
    });

    // Última evaluación
    const ultimaEvaluacion = await EvaluacionMedica.findOne({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      },
      order: [['fecha', 'DESC']],
      attributes: ['id', 'fecha']
    });

    // Verificar si tiene internación activa
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: paciente.id,
        fecha_alta: null
      },
      include: [
        {
          model: require('../../models').Habitacion,
          as: 'habitacion',
          attributes: ['numero']
        },
        {
          model: require('../../models').Cama,
          as: 'cama',
          attributes: ['numero']
        }
      ]
    });

    console.log('✅ Detalle del paciente obtenido');

    res.json({
      success: true,
      data: {
        paciente,
        estadisticas: {
          evaluaciones,
          turnos,
          internaciones,
          altas,
          ultimaEvaluacion,
          internacionActiva
        }
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener detalle del paciente:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER EVALUACIONES DEL PACIENTE
// ========================================
exports.obtenerEvaluacionesPaciente = async (req, res) => {
  try {
    console.log('📊 obtenerEvaluacionesPaciente - usuario_id:', req.user.usuario_id);
    
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

    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
        paciente_id: req.params.id,
        medico_id: medico.id
      },
      include: [
        {
          model: require('../../models').Diagnostico,
          as: 'diagnostico',
          attributes: ['codigo', 'nombre']
        },
        {
          model: require('../../models').Tratamiento,
          as: 'tratamiento',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Evaluaciones obtenidas:', evaluaciones.length);

    res.json({
      success: true,
      data: evaluaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener evaluaciones:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER TURNOS DEL PACIENTE
// ========================================
exports.obtenerTurnosPaciente = async (req, res) => {
  try {
    console.log('📅 obtenerTurnosPaciente - usuario_id:', req.user.usuario_id);
    
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

    const turnos = await Turno.findAll({
      where: {
        paciente_id: req.params.id,
        medico_id: medico.id
      },
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Turnos obtenidos:', turnos.length);

    res.json({
      success: true,
      data: turnos
    });
  } catch (error) {
    console.error('❌ Error al obtener turnos:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERNACIONES DEL PACIENTE
// ========================================
exports.obtenerInternacionesPaciente = async (req, res) => {
  try {
    console.log('🏥 obtenerInternacionesPaciente - usuario_id:', req.user.usuario_id);
    
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
        paciente_id: req.params.id,
        medico_id: medico.id
      },
      include: [
        {
          model: require('../../models').Habitacion,
          as: 'habitacion',
          attributes: ['numero']
        },
        {
          model: require('../../models').Cama,
          as: 'cama',
          attributes: ['numero']
        },
        {
          model: require('../../models').TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre']
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: 10
    });

    console.log('✅ Internaciones obtenidas:', internaciones.length);

    res.json({
      success: true,
      data: internaciones
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
// OBTENER OBRAS SOCIALES
// ========================================
exports.obtenerObrasSociales = async (req, res) => {
  try {
    console.log('💼 obtenerObrasSociales');
    
    const obrasSociales = await ObraSocial.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Obras sociales obtenidas:', obrasSociales.length);

    res.json({
      success: true,
      data: obrasSociales
    });
  } catch (error) {
    console.error('❌ Error al obtener obras sociales:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// BÚSQUEDA RÁPIDA (AUTOCOMPLETADO)
// ========================================
exports.busquedaRapida = async (req, res) => {
  try {
    console.log('⚡ busquedaRapida');
    
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'dni'],
          where: {
            [Op.or]: [
              { nombre: { [Op.like]: `%${q}%` } },
              { apellido: { [Op.like]: `%${q}%` } },
              { dni: { [Op.like]: `%${q}%` } }
            ]
          }
        }
      ],
      limit: 10,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    console.log('✅ Búsqueda rápida completada:', pacientes.length);

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error en búsqueda rápida:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER HISTORIAL MÉDICO DEL PACIENTE
// ========================================
exports.obtenerHistorialPaciente = async (req, res) => {
  try {
    console.log('📖 obtenerHistorialPaciente');
    
    const historial = await require('../../models').HistorialMedico.findAll({
      where: { paciente_id: req.params.id },
      include: [
        {
          model: require('../../models').MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre'],
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 20
    });

    console.log('✅ Historial obtenido:', historial.length);

    res.json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER RECETAS Y CERTIFICADOS DEL PACIENTE
// ========================================
exports.obtenerRecetasCertificadosPaciente = async (req, res) => {
  try {
    console.log('📋 obtenerRecetasCertificadosPaciente - usuario_id:', req.user.usuario_id);
    
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

    const items = await require('../../models').RecetaCertificado.findAll({
      where: {
        paciente_id: req.params.id,
        medico_id: medico.id
      },
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Recetas/Certificados obtenidos:', items.length);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('❌ Error al obtener recetas/certificados:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};