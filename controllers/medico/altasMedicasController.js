const { 
  AltaMedica,
  Paciente,
  Usuario,
  Medico,
  Internacion,
  Admision,
  Cama,
  Habitacion,
  ListaEspera,
  Notificacion,
  TipoTurno,
  Enfermero,
  EvaluacionEnfermeria,
  Sector,
  ObraSocial,
  Especialidad,
  TipoInternacion
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderAltasMedicas = async (req, res, next) => {
  try {
    console.log('🔍 renderAltasMedicas - usuario_id:', req.user.usuario_id);
    
    const usuario = await Usuario.findByPk(req.user.usuario_id, {
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Especialidad, as: 'especialidad' }
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
    next(error);
  }
};

// ========================================
// OBTENER ALTAS
// ========================================
exports.obtenerAltas = async (req, res, next) => {
  try {
    console.log(' obtenerAltas - usuario_id:', req.user.usuario_id);
    
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
    next(error);
  }
};

// ========================================
// OBTENER ALTA POR ID
// ========================================
exports.obtenerAltaPorId = async (req, res, next) => {
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
              model: ObraSocial,
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
                  model: Sector,
                  as: 'sector'
                }
              ]
            },
            {
              model: Cama,
              as: 'cama'
            },
            {
              model: TipoInternacion,
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
    next(error);
  }
};

// ========================================
// CREAR ALTA
// ========================================
exports.crearAlta = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log(' CREANDO ALTA MÉDICA');
    console.log(' Datos recibidos:', req.body);
    
    const { 
      paciente_id, 
      internacion_id, 
      admision_id,
      tipo_alta,
      estado_paciente,
      instrucciones_post_alta
    } = req.body;
    
    // Validaciones básicas
    if (!paciente_id) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar un paciente'
      });
    }
    
    if (!internacion_id && !admision_id) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar una internación o una admisión'
      });
    }
    
    // Validar que la internación existe
    if (internacion_id) {
      console.log(`🔍 Buscando internación ${internacion_id}...`);
      
      const internacion = await Internacion.findByPk(internacion_id, {
        include: [{ model: Paciente, as: 'paciente' }]
      });
      
      if (!internacion) {
        console.error(`❌ Internación ${internacion_id} NO encontrada`);
        return res.status(404).json({
          success: false,
          message: `La internación con ID ${internacion_id} no existe`
        });
      }
      
      console.log(`✅ Internación ${internacion_id} encontrada`);
      
      // Validar que el paciente coincide
      if (internacion.paciente_id != paciente_id) {
        return res.status(400).json({
          success: false,
          message: 'El paciente no coincide con la internación'
        });
      }
      
      // Validar que no tiene alta previa
      if (internacion.fecha_alta) {
        return res.status(400).json({
          success: false,
          message: 'Esta internación ya tiene fecha de alta registrada'
        });
      }
    }
    
    // Si es admisión, validar que existe
    if (admision_id) {
      console.log(`🔍 Buscando admisión ${admision_id}...`);
      
      const admision = await Admision.findByPk(admision_id);
      
      if (!admision) {
        console.error(`❌ Admisión ${admision_id} NO encontrada`);
        return res.status(404).json({
          success: false,
          message: `La admisión con ID ${admision_id} no existe`
        });
      }
      
      console.log(`✅ Admisión ${admision_id} encontrada`);
    }
    
    // Obtener médico desde el usuario logueado
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });
    
    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }
    
    // Crear la alta médica
    const altaData = {
      paciente_id,
      medico_id: medico.id,
      fecha_alta: new Date(),
      tipo_alta,
      estado_paciente,
      instrucciones_post_alta,
      internacion_id: internacion_id || null,
      admision_id: admision_id || null
    };
    
    console.log('📝 Creando alta con datos:', altaData);
    
    const alta = await AltaMedica.create(altaData, { transaction });
    
    await transaction.commit();
    
    console.log(`✅ Alta médica creada exitosamente. ID: ${alta.id}`);
    
    res.json({
      success: true,
      message: 'Alta médica registrada correctamente',
      data: alta
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear alta médica:', error);
    
    // Mensaje más específico para error de foreign key
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Error de referencia: La internación o admisión especificada no existe'
      });
    }
    
    next(error);
  }
};

// ========================================
// OBTENER ESTADÍSTICAS
// ========================================
exports.obtenerEstadisticas = async (req, res, next) => {
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
    const totalAltas = await AltaMedica.count({
      where: { medico_id: medico.id }
    });

    console.log('🔍 Contando altas este mes...');
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const esteMes = await AltaMedica.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.gte]: inicioMes }
      }
    });

    console.log('🔍 Contando altas esta semana...');
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
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const hoyAltas = await AltaMedica.count({
      where: {
        medico_id: medico.id,
        fecha_alta: { [Op.gte]: inicioHoy }
      }
    });

    console.log('🔍 Obteniendo altas por tipo...');
    const porTipoData = await AltaMedica.findAll({
      where: { medico_id: medico.id },
      attributes: ['tipo_alta'],
      raw: true
    });

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
    next(error);
  }
};

// ========================================
// OBTENER ALTAS RECIENTES
// ========================================
exports.obtenerAltasRecientes = async (req, res, next) => {
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
    next(error);
  }
};

// ========================================
// OBTENER PENDIENTES DE ALTA
// ========================================
exports.obtenerPendientesAlta = async (req, res, next) => {
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

    // 1. Internaciones sin alta
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

    // 2. Admisiones pendientes
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

    const admisionesSinInternacion = admisiones.filter(adm => !adm.internacion);

    // 3. LISTAS DE ESPERA PARA ALTAS MÉDICAS (DESDE ENFERMERÍA)
    
    const listasEsperaAltas = await ListaEspera.findAll({
      where: {
        estado: 'PENDIENTE'
        //  Removida la condición de tipo_turno del where principal
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'telefono']
            }
          ]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno',
          attributes: ['nombre', 'descripcion'],
          
          where: {
            nombre: { [Op.like]: '%Alta%' }  
          },
          required: true  
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',
          attributes: ['id', 'observaciones', 'fecha', 'signos_vitales'],
          required: false
        },
        {
          model: Enfermero,
          as: 'enfermero_creador',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }],
          required: false
        }
      ],
      order: [['fecha_registro', 'ASC']],
      limit: 20
    });

    console.log('✅ Pendientes obtenidos:', {
      internaciones: internaciones.length,
      admisiones: admisionesSinInternacion.length,
      listasEsperaAltas: listasEsperaAltas.length
    });

    res.json({
      success: true,
      data: {
        internaciones,
        admisiones: admisionesSinInternacion,
        listasEsperaAltas
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener pendientes de alta:', error.message);
    next(error);
  }
};

// ========================================
// CREAR ALTA DESDE SOLICITUD DE ENFERMERÍA
// ========================================
exports.crearAltaDesdeSolicitud = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('🏥 CREANDO ALTA DESDE SOLICITUD DE ENFERMERÍA');
    console.log('📋 Datos recibidos:', req.body);
    
    const { 
      lista_espera_id,
      tipo_alta,
      estado_paciente,
      instrucciones_post_alta
    } = req.body;
    
    if (!lista_espera_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de lista de espera es requerido'
      });
    }
    
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido']
      }],
      transaction
    });
    
    if (!medico) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }
    
    const listaEspera = await ListaEspera.findOne({
      where: {
        id: lista_espera_id,
        estado: 'PENDIENTE'
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario' }]
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluaciones_enfermeria',
          attributes: ['id', 'observaciones', 'signos_vitales']
        }
      ],
      transaction
    });
    
    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Solicitud de alta no encontrada o ya fue procesada'
      });
    }
    
    const paciente = await Paciente.findByPk(listaEspera.paciente_id, {
      transaction
    });
    
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    const altaData = {
      paciente_id: listaEspera.paciente_id,
      medico_id: medico.id,
      fecha_alta: new Date(),
      tipo_alta: tipo_alta || 'Alta Voluntaria',
      estado_paciente: estado_paciente || 'Estable',
      instrucciones_post_alta: instrucciones_post_alta || 'Seguimiento ambulatorio',
      origen: 'ENFERMERIA',
      lista_espera_id: lista_espera_id
    };
    
    console.log('📝 Creando alta con datos:', altaData);
    
    const alta = await AltaMedica.create(altaData, { transaction });
    
    await listaEspera.update({
      estado: 'COMPLETADO',
      fecha_completado: new Date()
    }, { transaction });
    
    if (listaEspera.creador_id && listaEspera.creador_tipo === 'ENFERMERO') {
      try {
        await Notificacion.create({
          usuario_id: listaEspera.creador_id,
          remitente_id: req.user.usuario_id,
          mensaje: `✅ ALTA MÉDICA OTORGADA\nPaciente: ${listaEspera.paciente?.usuario?.nombre || 'N/A'}\nMédico: Dr. ${medico.usuario?.nombre || 'N/A'}\nFecha: ${new Date().toLocaleDateString()}\nTipo de alta: ${altaData.tipo_alta}`,
          leida: false,
          tipo: 'ALTA_MEDICA'
        }, { transaction });
        console.log('✅ Notificación enviada al enfermero');
      } catch (error) {
        console.error('❌ Error al notificar enfermero:', error.message);
      }
    }
    
    if (listaEspera.paciente?.usuario?.id) {
      try {
        await Notificacion.create({
          usuario_id: listaEspera.paciente.usuario.id,
          remitente_id: req.user.usuario_id,
          mensaje: `🏥 ALTA MÉDICA\nEstimado paciente, se le ha otorgado el alta médica.\nMédico: Dr. ${medico.usuario?.nombre || 'N/A'}\nFecha: ${new Date().toLocaleDateString()}\nInstrucciones: ${altaData.instrucciones_post_alta || 'Seguimiento ambulatorio'}`,
          leida: false,
          tipo: 'ALTA_PACIENTE'
        }, { transaction });
        console.log('✅ Notificación enviada al paciente');
      } catch (error) {
        console.error('❌ Error al notificar paciente:', error.message);
      }
    }
    
    await transaction.commit();
    
    console.log(`✅ Alta médica creada desde solicitud. ID: ${alta.id}`);
    
    res.json({
      success: true,
      message: 'Alta médica otorgada correctamente',
      data: {
        alta_id: alta.id,
        paciente_id: alta.paciente_id,
        fecha_alta: alta.fecha_alta
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear alta desde solicitud:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de alta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========================================
// OBTENER PACIENTES PARA FILTRO
// ========================================
exports.obtenerPacientesParaFiltro = async (req, res, next) => {
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
    next(error);
  }
};