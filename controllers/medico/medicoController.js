const { 
  Usuario, 
  Medico, 
  Turno, 
  Paciente, 
  EvaluacionMedica, 
  Internacion,
  Especialidad,
  Sector,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR DASHBOARD
// ========================================
exports.renderDashboard = async (req, res) => {
  try {
    console.log('🔍 DEBUG renderDashboard:');
    console.log('req.user:', req.user);
    console.log('req.user.usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Especialidad, as: 'especialidad' },
            { model: Sector, as: 'sector' }
          ]
        }
      ]
    });

    console.log('usuario encontrado:', usuario ? 'SÍ' : 'NO');
    console.log('usuario.medico:', usuario?.medico ? 'SÍ' : 'NO');

    if (!usuario || !usuario.medico) {
      console.error('❌ No se encontró usuario o medico');
      return res.status(404).render('error', {
        title: 'Error',
        message: 'No tienes permisos de médico'
      });
    }

    console.log('✅ Renderizando dashboard...');
    
    res.render('dashboard/medico/dashboard', {
      title: 'Dashboard',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error en renderDashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER ESTADÍSTICAS GENERALES
// ========================================
exports.obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 obtenerEstadisticas - usuario_id:', req.user.usuario_id);
    
    // ✅ CORRECTO: Usar usuario_id, no id
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      console.error('❌ Médico no encontrado para usuario:', req.user.usuario_id);
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    console.log('✅ Médico encontrado:', medico.id);

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Turnos del día
    console.log('🔍 Contando turnos de hoy...');
    const turnosHoy = await Turno.count({
      where: {
        medico_id: medico.id,
        fecha: {
          [Op.gte]: hoy,
          [Op.lte]: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: {
          [Op.in]: ['CONFIRMADO', 'PENDIENTE']
        }
      }
    });
    console.log('Turnos hoy:', turnosHoy);

    // Turnos pendientes totales
    console.log('🔍 Contando turnos pendientes...');
    const turnosPendientes = await Turno.count({
      where: {
        medico_id: medico.id,
        estado: 'PENDIENTE',
        fecha: {
          [Op.gte]: hoy
        }
      }
    });
    console.log('Turnos pendientes:', turnosPendientes);

    // Pacientes atendidos este mes
    console.log('🔍 Contando pacientes atendidos...');
    const pacientesAtendidosMes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      distinct: true,
      col: 'paciente_id'
    });
    console.log('Pacientes atendidos:', pacientesAtendidosMes);

    // Internaciones activas
    console.log('🔍 Contando internaciones activas...');
    const internacionesActivas = await Internacion.count({
      where: {
        medico_id: medico.id,
        fecha_alta: null
      }
    });
    console.log('Internaciones activas:', internacionesActivas);

    // Evaluaciones médicas este mes
    console.log('🔍 Contando evaluaciones del mes...');
    const evaluacionesMes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id,
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      }
    });
    console.log('Evaluaciones mes:', evaluacionesMes);

    // Total de pacientes únicos
    console.log('🔍 Contando pacientes totales...');
    const totalPacientes = await EvaluacionMedica.count({
      where: {
        medico_id: medico.id
      },
      distinct: true,
      col: 'paciente_id'
    });
    console.log('Total pacientes:', totalPacientes);

    const respuesta = {
      success: true,
      data: {
        turnosHoy,
        turnosPendientes,
        pacientesAtendidosMes,
        internacionesActivas,
        evaluacionesMes,
        totalPacientes
      }
    };

    console.log('✅ Respuesta final:', respuesta);
    res.json(respuesta);
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER TURNOS PRÓXIMOS
// ========================================
exports.obtenerTurnosProximos = async (req, res) => {
  try {
    console.log('📅 obtenerTurnosProximos - usuario_id:', req.user.usuario_id);
    
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

    const hoy = new Date();
    const limite = req.query.limite || 5;

    const turnos = await Turno.findAll({
      where: {
        medico_id: medico.id,
        fecha: {
          [Op.gte]: hoy
        },
        estado: {
          [Op.in]: ['CONFIRMADO', 'PENDIENTE']
        }
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
        }
      ],
      order: [
        ['fecha', 'ASC'],
        ['hora_inicio', 'ASC']
      ],
      limit: parseInt(limite)
    });

    console.log('✅ Turnos próximos:', turnos.length);
    
    res.json({
      success: true,
      data: turnos
    });
  } catch (error) {
    console.error('❌ Error en obtenerTurnosProximos:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER PACIENTES RECIENTES
// ========================================
exports.obtenerPacientesRecientes = async (req, res) => {
  try {
    console.log('👥 obtenerPacientesRecientes - usuario_id:', req.user.usuario_id);
    
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

    const limite = req.query.limite || 10;

    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
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
              attributes: ['nombre', 'apellido', 'dni', 'email']
            }
          ]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limite)
    });

    console.log('✅ Pacientes recientes:', evaluaciones.length);
    
    res.json({
      success: true,
      data: evaluaciones
    });
  } catch (error) {
    console.error('❌ Error en obtenerPacientesRecientes:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERNACIONES EN CURSO
// ========================================
exports.obtenerInternacionesEnCurso = async (req, res) => {
  try {
    console.log('🛏️ obtenerInternacionesEnCurso - usuario_id:', req.user.usuario_id);
    
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
      order: [['fecha_inicio', 'DESC']]
    });

    console.log('✅ Internaciones activas:', internaciones.length);
    
    res.json({
      success: true,
      data: internaciones
    });
  } catch (error) {
    console.error('❌ Error en obtenerInternacionesEnCurso:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER ACTIVIDAD RECIENTE
// ========================================
exports.obtenerActividadReciente = async (req, res) => {
  try {
    console.log('⚡ obtenerActividadReciente - usuario_id:', req.user.usuario_id);
    
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

    const limite = req.query.limite || 15;

    // Obtener las últimas evaluaciones médicas
    const evaluaciones = await EvaluacionMedica.findAll({
      where: {
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
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limite)
    });

    console.log('✅ Actividades recientes:', evaluaciones.length);

    const actividades = evaluaciones.map(ev => ({
      tipo: 'evaluacion',
      descripcion: `Evaluación médica - ${ev.paciente.usuario.nombre} ${ev.paciente.usuario.apellido}`,
      fecha: ev.createdAt,
      paciente: `${ev.paciente.usuario.nombre} ${ev.paciente.usuario.apellido}`
    }));

    res.json({
      success: true,
      data: actividades
    });
  } catch (error) {
    console.error('❌ Error en obtenerActividadReciente:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};