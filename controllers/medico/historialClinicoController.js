const { 
  HistorialMedico,
  Paciente,
  Usuario,
  Medico,
  MotivoConsulta,
  Admision,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderHistorialClinico = async (req, res) => {
  try {
    console.log('🔍 renderHistorialClinico - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de historial clínico...');

    res.render('dashboard/medico/historial-clinico', {
      title: 'Historial Clínico',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar historial clínico:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER HISTORIAL DEL PACIENTE
// ========================================
exports.obtenerHistorialPaciente = async (req, res) => {
  try {
    console.log('📋 obtenerHistorialPaciente - usuario_id:', req.user.usuario_id);
    
    const { 
      tipoEvento,
      fechaDesde,
      fechaHasta,
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { paciente_id: req.params.pacienteId };

    if (tipoEvento && tipoEvento !== 'TODOS') {
      whereClause.tipo_evento = tipoEvento;
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

    const { count, rows: historial } = await HistorialMedico.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Admision,
          as: 'admision',
          attributes: ['id', 'fecha'],
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Historial obtenido:', count);

    res.json({
      success: true,
      data: historial,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
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
// OBTENER INFORMACIÓN DEL PACIENTE
// ========================================
exports.obtenerInfoPaciente = async (req, res) => {
  try {
    console.log('👤 obtenerInfoPaciente');
    
    const paciente = await Paciente.findByPk(req.params.pacienteId, {
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
    });

    if (!paciente) {
      console.error('❌ Paciente no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    console.log('✅ Información del paciente obtenida');

    res.json({
      success: true,
      data: paciente
    });
  } catch (error) {
    console.error('❌ Error al obtener información del paciente:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER LÍNEA DE TIEMPO COMPLETA
// ========================================
exports.obtenerLineaTiempo = async (req, res) => {
  try {
    console.log('⏱️ obtenerLineaTiempo - usuario_id:', req.user.usuario_id);
    
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

    const pacienteId = req.params.pacienteId;

    console.log('🔍 Obteniendo todos los eventos...');

    // Obtener todos los eventos relevantes
    const [
      evaluaciones,
      internaciones,
      altas,
      turnos,
      recetas,
      estudios
    ] = await Promise.all([
      // Evaluaciones médicas
      require('../../models').EvaluacionMedica.findAll({
        where: { 
          paciente_id: pacienteId,
          medico_id: medico.id 
        },
        include: [
          {
            model: require('../../models').Diagnostico,
            as: 'diagnostico',
            attributes: ['codigo', 'nombre']
          }
        ],
        attributes: ['id', 'fecha', 'observaciones_diagnostico'],
        limit: 10,
        order: [['fecha', 'DESC']]
      }),
      
      // Internaciones
      require('../../models').Internacion.findAll({
        where: { 
          paciente_id: pacienteId,
          medico_id: medico.id 
        },
        include: [
          {
            model: require('../../models').TipoInternacion,
            as: 'tipoInternacion',
            attributes: ['nombre']
          }
        ],
        attributes: ['id', 'fecha_inicio', 'fecha_alta', 'estado_paciente'],
        limit: 10,
        order: [['fecha_inicio', 'DESC']]
      }),
      
      // Altas médicas
      require('../../models').AltaMedica.findAll({
        where: { 
          paciente_id: pacienteId,
          medico_id: medico.id 
        },
        attributes: ['id', 'fecha_alta', 'tipo_alta', 'estado_paciente'],
        limit: 10,
        order: [['fecha_alta', 'DESC']]
      }),
      
      // Turnos
      require('../../models').Turno.findAll({
        where: { 
          paciente_id: pacienteId,
          medico_id: medico.id 
        },
        attributes: ['id', 'fecha', 'estado'],
        limit: 10,
        order: [['fecha', 'DESC']]
      }),
      
      // Recetas y certificados
      require('../../models').RecetaCertificado.findAll({
        where: { 
          paciente_id: pacienteId,
          medico_id: medico.id 
        },
        attributes: ['id', 'fecha', 'tipo'],
        limit: 10,
        order: [['fecha', 'DESC']]
      }),
      
      // Estudios solicitados
      require('../../models').EstudioSolicitado.findAll({
        where: { paciente_id: pacienteId },
        include: [
          {
            model: require('../../models').TipoEstudio,
            as: 'tipo_estudio',
            attributes: ['nombre']
          },
          {
            model: require('../../models').EvaluacionMedica,
            as: 'evaluacion_medica',
            where: { medico_id: medico.id },
            attributes: ['id'],
            required: true
          }
        ],
        attributes: ['id', 'created_at', 'estado', 'urgencia'],
        limit: 10,
        order: [['created_at', 'DESC']]
      })
    ]);

    console.log('🔍 Consolidando eventos...');

    // Consolidar y ordenar todos los eventos
    const eventos = [];

    evaluaciones.forEach(ev => {
      eventos.push({
        tipo: 'Evaluación Médica',
        fecha: ev.fecha,
        icono: 'stethoscope',
        color: 'primary',
        descripcion: ev.diagnostico ? 
          `Diagnóstico: ${ev.diagnostico.codigo} - ${ev.diagnostico.nombre}` : 
          'Evaluación médica realizada',
        id: ev.id
      });
    });

    internaciones.forEach(int => {
      eventos.push({
        tipo: 'Internación',
        fecha: int.fecha_inicio,
        icono: 'bed',
        color: 'warning',
        descripcion: `${int.tipoInternacion?.nombre || 'Internación'} - Estado: ${int.estado_paciente}`,
        id: int.id
      });
    });

    altas.forEach(alta => {
      eventos.push({
        tipo: 'Alta Médica',
        fecha: alta.fecha_alta,
        icono: 'sign-out-alt',
        color: 'success',
        descripcion: `Alta ${alta.tipo_alta} - Estado: ${alta.estado_paciente}`,
        id: alta.id
      });
    });

    turnos.forEach(turno => {
      eventos.push({
        tipo: 'Turno',
        fecha: turno.fecha,
        icono: 'calendar-check',
        color: 'info',
        descripcion: `Turno ${turno.estado.toLowerCase()}`,
        id: turno.id
      });
    });

    recetas.forEach(rec => {
      eventos.push({
        tipo: rec.tipo,
        fecha: rec.fecha,
        icono: rec.tipo === 'Receta Medica' ? 'prescription' : 'certificate',
        color: 'secondary',
        descripcion: `${rec.tipo} emitido${rec.tipo === 'Receta Medica' ? 'a' : ''}`,
        id: rec.id
      });
    });

    estudios.forEach(est => {
      eventos.push({
        tipo: 'Estudio Solicitado',
        fecha: est.created_at,
        icono: 'microscope',
        color: est.urgencia === 'Alta' ? 'danger' : 'info',
        descripcion: `${est.tipo_estudio?.nombre || 'Estudio'} - ${est.estado}`,
        id: est.id
      });
    });

    // Ordenar por fecha descendente
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    console.log('✅ Línea de tiempo obtenida:', eventos.length, 'eventos');

    res.json({
      success: true,
      data: eventos.slice(0, 50) // Limitar a 50 eventos más recientes
    });
  } catch (error) {
    console.error('❌ Error al obtener línea de tiempo:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR ENTRADA EN HISTORIAL
// ========================================
exports.crearEntradaHistorial = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearEntradaHistorial - usuario_id:', req.user.usuario_id);
    
    const {
      paciente_id,
      tipo_evento,
      descripcion,
      motivo_consulta_id,
      admision_id
    } = req.body;

    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    const entrada = await HistorialMedico.create({
      paciente_id,
      tipo_evento,
      descripcion,
      motivo_consulta_id,
      admision_id,
      fecha: new Date()
    }, { transaction });

    await transaction.commit();

    console.log('✅ Entrada creada en historial:', entrada.id);

    res.json({
      success: true,
      message: 'Entrada creada en historial',
      data: entrada
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear entrada:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear entrada en historial' 
    });
  }
};

// ========================================
// OBTENER RESUMEN DEL HISTORIAL
// ========================================
// ✅ CORREGIDO - SIN sequelize.fn() y .get()
exports.obtenerResumenHistorial = async (req, res) => {
  try {
    console.log('📊 obtenerResumenHistorial');
    
    const pacienteId = req.params.pacienteId;

    console.log('🔍 Contando eventos por tipo...');

    // ✅ SIN GROUP BY - traer todo y contar en JavaScript
    const porTipoData = await HistorialMedico.findAll({
      where: { paciente_id: pacienteId },
      attributes: ['tipo_evento'],
      raw: true
    });

    // ✅ CONTAR EN JAVASCRIPT
    const resumen = {};
    porTipoData.forEach(item => {
      const tipo = item.tipo_evento;
      if (!resumen[tipo]) {
        resumen[tipo] = 0;
      }
      resumen[tipo]++;
    });

    console.log('🔍 Obteniendo total de entradas...');

    // Total de entradas
    const total = await HistorialMedico.count({
      where: { paciente_id: pacienteId }
    });

    console.log('🔍 Obteniendo primera y última entrada...');

    // Primera y última entrada
    const primera = await HistorialMedico.findOne({
      where: { paciente_id: pacienteId },
      order: [['fecha', 'ASC']],
      attributes: ['fecha']
    });

    const ultima = await HistorialMedico.findOne({
      where: { paciente_id: pacienteId },
      order: [['fecha', 'DESC']],
      attributes: ['fecha']
    });

    const finalResult = {
      total,
      porTipo: resumen,
      primeraEntrada: primera?.fecha,
      ultimaEntrada: ultima?.fecha
    };

    console.log('✅ Resumen calculado');

    res.json({
      success: true,
      data: finalResult
    });
  } catch (error) {
    console.error('❌ Error al obtener resumen:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};