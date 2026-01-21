const { 
  Paciente, 
  Usuario, 
  Medico,
  EvaluacionMedica,
  ObraSocial,
  HistorialMedico,
  Internacion,
  AltaMedica,
  Diagnostico,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA DE PACIENTES
// ========================================
exports.renderPacientes = async (req, res) => {
  try {
    console.log('🔍 renderPacientes - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
      console.error('❌ Usuario o Medico no encontrado');
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    res.render('dashboard/medico/pacientes', {
      title: 'Mis Pacientes',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar pacientes:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER PACIENTES DEL MÉDICO
// ========================================
exports.obtenerPacientes = async (req, res) => {
  try {
    console.log('👥 obtenerPacientes - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    console.log('✅ Médico encontrado:', medico.id);

    const { busqueda, estado, obraSocial, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros para pacientes
    const whereUsuario = {};
    const wherePaciente = {};

    if (busqueda) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (estado && estado !== 'TODOS') {
      wherePaciente.estado = estado;
    }

    if (obraSocial && obraSocial !== 'TODAS') {
      wherePaciente.obra_social_id = obraSocial;
    }

    // Obtener pacientes únicos que han sido atendidos por el médico
    console.log('🔍 Buscando evaluaciones...');
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { medico_id: medico.id },
      attributes: ['paciente_id'],
      group: ['paciente_id']
    });

    const pacientesIds = evaluaciones.map(e => e.paciente_id);
    console.log('✅ Pacientes encontrados:', pacientesIds.length);

    if (pacientesIds.length === 0) {
      console.warn('⚠️ Sin pacientes para este médico');
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          totalPages: 0
        }
      });
    }

    wherePaciente.id = { [Op.in]: pacientesIds };

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: wherePaciente,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: whereUsuario,
          attributes: ['id', 'nombre', 'apellido', 'dni', 'telefono', 'email', 'fecha_nacimiento', 'sexo']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    console.log('✅ Total de pacientes encontrados:', count);

    // Agregar información adicional de cada paciente
    const pacientesConInfo = await Promise.all(pacientes.map(async (paciente) => {
      // Última evaluación
      const ultimaEvaluacion = await EvaluacionMedica.findOne({
        where: { 
          paciente_id: paciente.id,
          medico_id: medico.id
        },
        order: [['fecha', 'DESC']],
        attributes: ['fecha', 'observaciones_diagnostico']
      });

      // Total de evaluaciones
      const totalEvaluaciones = await EvaluacionMedica.count({
        where: { 
          paciente_id: paciente.id,
          medico_id: medico.id
        }
      });

      // Internación activa
      const internacionActiva = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          medico_id: medico.id,
          fecha_alta: null
        }
      });

      return {
        ...paciente.toJSON(),
        ultimaEvaluacion,
        totalEvaluaciones,
        internacionActiva: !!internacionActiva
      };
    }));

    res.json({
      success: true,
      data: pacientesConInfo,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
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
// OBTENER DETALLE DE UN PACIENTE
// ========================================
exports.obtenerPacienteDetalle = async (req, res) => {
  try {
    console.log('🔍 obtenerPacienteDetalle - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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
          attributes: ['id', 'nombre', 'descripcion']
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

    // Verificar que el médico haya atendido al paciente
    const haAtendido = await EvaluacionMedica.findOne({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      }
    });

    if (!haAtendido) {
      console.error('❌ Médico no ha atendido este paciente');
      return res.status(403).json({ 
        success: false,
        message: 'No tiene permiso para ver este paciente' 
      });
    }

    // Obtener evaluaciones médicas
    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      },
      include: [
        {
          model: Diagnostico,
          as: 'diagnostico',
          attributes: ['id', 'nombre', 'codigo']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    // Obtener internaciones
    const internaciones = await Internacion.findAll({
      where: {
        paciente_id: paciente.id,
        medico_id: medico.id
      },
      include: [
        {
          model: require('../../models').Cama,
          as: 'cama',
          include: [
            {
              model: require('../../models').Habitacion,
              as: 'habitacion',
              attributes: ['numero', 'tipo']
            }
          ]
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: 5
    });

    // Obtener historial médico
    const historial = await HistorialMedico.findAll({
      where: { paciente_id: paciente.id },
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Datos del paciente obtenidos');

    res.json({
      success: true,
      data: {
        paciente,
        evaluaciones,
        internaciones,
        historial,
        estadisticas: {
          totalEvaluaciones: evaluaciones.length,
          totalInternaciones: internaciones.length
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
// OBTENER HISTORIAL MÉDICO DEL PACIENTE
// ========================================
exports.obtenerHistorialPaciente = async (req, res) => {
  try {
    console.log('📋 obtenerHistorialPaciente - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    const { pacienteId } = req.params;

    // Verificar que el médico haya atendido al paciente
    const haAtendido = await EvaluacionMedica.findOne({
      where: {
        paciente_id: pacienteId,
        medico_id: medico.id
      }
    });

    if (!haAtendido) {
      console.error('❌ Médico no ha atendido este paciente');
      return res.status(403).json({ 
        success: false,
        message: 'No tiene permiso para ver este historial' 
      });
    }

    const historial = await HistorialMedico.findAll({
      where: { paciente_id: pacienteId },
      include: [
        {
          model: require('../../models').MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC']]
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
// OBTENER EVALUACIONES DEL PACIENTE
// ========================================
exports.obtenerEvaluacionesPaciente = async (req, res) => {
  try {
    console.log('📊 obtenerEvaluacionesPaciente - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    const { pacienteId } = req.params;

    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
        paciente_id: pacienteId,
        medico_id: medico.id
      },
      include: [
        {
          model: Diagnostico,
          as: 'diagnostico',
          attributes: ['id', 'nombre', 'codigo']
        },
        {
          model: require('../../models').Tratamiento,
          as: 'tratamiento',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['fecha', 'DESC']]
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
// OBTENER OBRAS SOCIALES PARA FILTRO
// ========================================
exports.obtenerObrasSociales = async (req, res) => {
  try {
    console.log('🏥 obtenerObrasSociales');
    
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
// OBTENER ESTADÍSTICAS DE PACIENTES
// ========================================
exports.obtenerEstadisticasPacientes = async (req, res) => {
  try {
    console.log('📈 obtenerEstadisticasPacientes - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
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

    // Total de pacientes únicos
    const totalPacientes = await EvaluacionMedica.count({
      where: { medico_id: medico.id },
      distinct: true,
      col: 'paciente_id'
    });

    // Pacientes internados actualmente
    const pacientesInternados = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_alta: null
      }
    });

    // Evaluaciones este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const evaluacionesMes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: { [Op.gte]: inicioMes }
      }
    });

    console.log('✅ Estadísticas:', {
      totalPacientes,
      pacientesInternados,
      evaluacionesMes
    });

    res.json({
      success: true,
      data: {
        totalPacientes,
        pacientesInternados,
        evaluacionesMes
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};