const { 
  IntervencionQuirurgica,
  Paciente,
  Usuario,
  Medico,
  Habitacion,
  EvaluacionMedica,
  ListaEspera,
  Internacion,
  sequelize
} = require('../../models');
const { Op } = require('sequelize');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderIntervenciones = async (req, res) => {
  try {
    console.log('🔍 renderIntervenciones - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de intervenciones...');

    res.render('dashboard/medico/intervenciones', {
      title: 'Intervenciones Quirúrgicas',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar intervenciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message
    });
  }
};

// ========================================
// OBTENER INTERVENCIONES
// ========================================
exports.obtenerIntervenciones = async (req, res) => {
  try {
    console.log('📋 obtenerIntervenciones - usuario_id:', req.user.usuario_id);
    
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
      estado,
      resultado,
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

    if (resultado && resultado !== 'TODOS') {
      whereClause.resultado_cirugia = resultado;
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fecha_inicio = {
        [Op.between]: [fechaDesde, fechaHasta]
      };
    } else if (fechaDesde) {
      whereClause.fecha_inicio = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.fecha_inicio = { [Op.lte]: fechaHasta };
    }

    // Filtrar por estado (en curso o finalizadas)
    if (estado === 'EN_CURSO') {
      whereClause.fecha_fin = null;
    } else if (estado === 'FINALIZADAS') {
      whereClause.fecha_fin = { [Op.ne]: null };
    }

    const { count, rows: intervenciones } = await IntervencionQuirurgica.findAndCountAll({
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
          model: Habitacion,
          as: 'habitacion',
          attributes: ['id', 'numero', 'tipo']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          attributes: ['id', 'fecha'],
          required: false
        },
        {
          model: ListaEspera,
          as: 'lista_espera',
          attributes: ['id', 'estado', 'prioridad'],
          required: false
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('✅ Intervenciones obtenidas:', count);

    res.json({
      success: true,
      data: intervenciones,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener intervenciones:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERVENCIÓN POR ID
// ========================================
exports.obtenerIntervencionPorId = async (req, res) => {
  try {
    console.log('🔍 obtenerIntervencionPorId - usuario_id:', req.user.usuario_id);
    
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

    const intervencion = await IntervencionQuirurgica.findOne({
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
          model: Habitacion,
          as: 'habitacion',
          include: [
            {
              model: require('../../models').Sector,
              as: 'sector',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [
            {
              model: require('../../models').Diagnostico,
              as: 'diagnostico',
              attributes: ['codigo', 'nombre']
            }
          ]
        },
        {
          model: ListaEspera,
          as: 'lista_espera',
          attributes: ['id', 'estado', 'prioridad']
        },
        {
          model: Internacion,
          as: 'intervencion_quirurgica',
          attributes: ['id', 'fecha_inicio', 'estado_paciente'],
          required: false
        }
      ]
    });

    if (!intervencion) {
      console.error('❌ Intervención no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Intervención no encontrada' 
      });
    }

    console.log('✅ Intervención encontrada:', intervencion.id);

    res.json({
      success: true,
      data: intervencion
    });
  } catch (error) {
    console.error('❌ Error al obtener intervención:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER INTERVENCIONES PRÓXIMAS
// ========================================
exports.obtenerIntervencionesProximas = async (req, res) => {
  try {
    console.log('📅 obtenerIntervencionesProximas - usuario_id:', req.user.usuario_id);
    
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
    const proximosDias = new Date();
    proximosDias.setDate(hoy.getDate() + 7);

    const intervenciones = await IntervencionQuirurgica.findAll({
      where: {
        medico_id: medico.id,
        fecha_inicio: {
          [Op.between]: [hoy, proximosDias]
        },
        fecha_fin: null
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
        },
        {
          model: Habitacion,
          as: 'habitacion',
          attributes: ['numero']
        }
      ],
      order: [['fecha_inicio', 'ASC']],
      limit: 10
    });

    console.log('✅ Intervenciones próximas encontradas:', intervenciones.length);

    res.json({
      success: true,
      data: intervenciones
    });
  } catch (error) {
    console.error('❌ Error al obtener intervenciones próximas:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// CREAR INTERVENCIÓN
// ========================================
exports.crearIntervencion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('✅ crearIntervencion - usuario_id:', req.user.usuario_id);
    
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
      habitacion_id,
      evaluacion_medica_id,
      lista_espera_id,
      tipo_procedimiento,
      fecha_inicio,
      observaciones
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

    const habitacion = await Habitacion.findByPk(habitacion_id, { transaction });
    if (!habitacion) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Habitación no encontrada' 
      });
    }

    if (evaluacion_medica_id) {
      const evaluacion = await EvaluacionMedica.findOne({
        where: {
          id: evaluacion_medica_id,
          medico_id: medico.id
        },
        transaction
      });
      if (!evaluacion) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Evaluación médica no encontrada o no pertenece a este médico' 
        });
      }
    }

    const listaEspera = await ListaEspera.findByPk(lista_espera_id, { transaction });
    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Lista de espera no encontrada' 
      });
    }

    // Crear intervención
    const intervencion = await IntervencionQuirurgica.create({
      paciente_id,
      medico_id: medico.id,
      habitacion_id,
      evaluacion_medica_id,
      lista_espera_id,
      tipo_procedimiento,
      fecha_inicio: fecha_inicio || new Date(),
      observaciones
    }, { transaction });

    await transaction.commit();

    console.log('✅ Intervención creada:', intervencion.id);

    res.json({
      success: true,
      message: 'Intervención quirúrgica creada correctamente',
      data: intervencion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear intervención:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// ACTUALIZAR INTERVENCIÓN
// ========================================
exports.actualizarIntervencion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 actualizarIntervencion - usuario_id:', req.user.usuario_id);
    
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

    const intervencion = await IntervencionQuirurgica.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!intervencion) {
      await transaction.rollback();
      console.error('❌ Intervención no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Intervención no encontrada' 
      });
    }

    const { observaciones } = req.body;

    // Solo se pueden actualizar intervenciones en curso
    if (intervencion.fecha_fin) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'No se puede actualizar una intervención finalizada' 
      });
    }

    await intervencion.update({ observaciones }, { transaction });

    await transaction.commit();

    console.log('✅ Intervención actualizada:', intervencion.id);

    res.json({
      success: true,
      message: 'Intervención actualizada correctamente',
      data: intervencion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar intervención:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// FINALIZAR INTERVENCIÓN
// ========================================
exports.finalizarIntervencion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('❌ finalizarIntervencion - usuario_id:', req.user.usuario_id);
    
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

    const intervencion = await IntervencionQuirurgica.findOne({
      where: {
        id: req.params.id,
        medico_id: medico.id
      },
      transaction
    });

    if (!intervencion) {
      await transaction.rollback();
      console.error('❌ Intervención no encontrada');
      return res.status(404).json({ 
        success: false,
        message: 'Intervención no encontrada' 
      });
    }

    if (intervencion.fecha_fin) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'La intervención ya está finalizada' 
      });
    }

    const { resultado_cirugia, observaciones } = req.body;

    if (!resultado_cirugia) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Debe especificar el resultado de la cirugía' 
      });
    }

    await intervencion.update({
      fecha_fin: new Date(),
      resultado_cirugia,
      observaciones
    }, { transaction });

    // Actualizar lista de espera
    if (intervencion.lista_espera_id) {
      await ListaEspera.update(
        { estado: 'COMPLETADO' },
        { where: { id: intervencion.lista_espera_id }, transaction }
      );
    }

    // Crear registro en historial médico
    await require('../../models').HistorialMedico.create({
      paciente_id: intervencion.paciente_id,
      descripcion: `Intervención quirúrgica: ${intervencion.tipo_procedimiento}. Resultado: ${resultado_cirugia}`,
      tipo_evento: 'Cirugia',
      fecha: new Date()
    }, { transaction });

    await transaction.commit();

    console.log('✅ Intervención finalizada:', intervencion.id);

    res.json({
      success: true,
      message: 'Intervención finalizada correctamente',
      data: intervencion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al finalizar intervención:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// OBTENER HABITACIONES DISPONIBLES
// ========================================
exports.obtenerHabitacionesDisponibles = async (req, res) => {
  try {
    console.log('🏥 obtenerHabitacionesDisponibles');
    
    const habitaciones = await Habitacion.findAll({
      attributes: ['id', 'numero', 'tipo'],
      include: [
        {
          model: require('../../models').Sector,
          as: 'sector',
          attributes: ['nombre']
        },
        {
          model: require('../../models').TipoDeServicio,
          as: 'tipoServicio',
          attributes: ['nombre']
        }
      ],
      order: [['numero', 'ASC']]
    });

    console.log('✅ Habitaciones encontradas:', habitaciones.length);

    res.json({
      success: true,
      data: habitaciones
    });
  } catch (error) {
    console.error('❌ Error al obtener habitaciones:', error.message);
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

    console.log('🔍 Contando intervenciones en curso...');
    // Intervenciones en curso
    const enCurso = await IntervencionQuirurgica.count({
      where: {
        medico_id: medico.id,
        fecha_fin: null
      }
    });

    console.log('🔍 Contando intervenciones finalizadas...');
    // Intervenciones finalizadas
    const finalizadas = await IntervencionQuirurgica.count({
      where: {
        medico_id: medico.id,
        fecha_fin: { [Op.ne]: null }
      }
    });

    console.log('🔍 Contando intervenciones este mes...');
    // Intervenciones este mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await IntervencionQuirurgica.count({
      where: {
        medico_id: medico.id,
        fecha_inicio: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Obteniendo intervenciones por resultado...');
    // ✅ SIN sequelize.fn() y .get() - traer todo y contar en JavaScript
    const porResultadoData = await IntervencionQuirurgica.findAll({
      where: {
        medico_id: medico.id,
        resultado_cirugia: { [Op.ne]: null }
      },
      attributes: ['resultado_cirugia'],
      raw: true
    });

    // ✅ CONTAR EN JAVASCRIPT
    const resultados = {};
    porResultadoData.forEach(item => {
      const resultado = item.resultado_cirugia;
      if (!resultados[resultado]) {
        resultados[resultado] = 0;
      }
      resultados[resultado]++;
    });

    const finalResult = {
      enCurso,
      finalizadas,
      esteMes,
      totalIntervenciones: enCurso + finalizadas,
      porResultado: resultados
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