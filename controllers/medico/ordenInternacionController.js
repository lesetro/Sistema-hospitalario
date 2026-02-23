const { Internacion, EvaluacionEnfermeria, Paciente, Usuario, Medico, Enfermero, Cama, Habitacion, Sector, TipoInternacion } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ============================================
// LISTAR ÓRDENES DE UN PACIENTE INTERNADO
// ============================================
exports.listarOrdenesPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;
    const userRole = req.user.rol;

    const internacion = await Internacion.findOne({
      where: { paciente_id, fecha_alta: null },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{ model: Usuario, as: 'usuario' }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{ model: Sector, as: 'sector' }]
          }]
        }
      ]
    });

    if (!internacion) {
      return res.status(404).render('error', {
        message: 'Paciente sin internación activa',
        user: req.user
      });
    }

    // Buscar órdenes por paciente_id O por internacion_id
    let ordenes = await EvaluacionEnfermeria.findAll({
      where: {
        [Op.or]: [
          { paciente_id, tipo_egreso: 'ORDEN_MEDICA' },
          { internacion_id: internacion.id, tipo_egreso: 'ORDEN_MEDICA' }
        ]
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [
        ['prioridad', 'DESC'],
        ['fecha', 'DESC']
      ]
    });

    console.log(`📋 Órdenes encontradas para paciente ${paciente_id}:`, ordenes.length);

    // Si es enfermero, filtrar solo PENDIENTES (case-insensitive)
    if (userRole === 'ENFERMERO') {
      ordenes = ordenes.filter(o => 
        o.estado && o.estado.toUpperCase() === 'PENDIENTE'
      );
      console.log(`👩‍⚕️ Filtrado para enfermero (solo PENDIENTE): ${ordenes.length} órdenes`);
    }

    // Agregar internación a cada orden
    const ordenesConInternacion = ordenes.map(orden => {
      const ordenObj = orden.toJSON();
      ordenObj.internacion = internacion;
      return ordenObj;
    });

    const estadisticas = {
      total: ordenesConInternacion.length,
      pendientes: ordenesConInternacion.filter(o => o.estado && o.estado.toUpperCase() === 'PENDIENTE').length,
      completadas: ordenesConInternacion.filter(o => o.estado && o.estado.toUpperCase() === 'COMPLETADA').length,
      canceladas: ordenesConInternacion.filter(o => o.estado && o.estado.toUpperCase() === 'CANCELADA').length,
      urgentes: ordenesConInternacion.filter(o => o.prioridad === 'URGENTE' && o.estado && o.estado.toUpperCase() === 'PENDIENTE').length
    };

    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    // ========================================
    // RENDERIZAR VISTA SEGÚN EL ROL
    // ========================================
    if (userRole === 'ENFERMERO') {
      return res.render('dashboard/enfermero/ordenes-paciente-lista', {
        title: 'Órdenes Médicas del Paciente',
        user: req.user,
        ordenes: ordenesConInternacion,
        estadisticas,
        internacion,
        filtros: { estado: '', prioridad: '', paciente: '', sector: '' }
      });
    }

    // Vista para médico (original)
    res.render('dashboard/medico/ordenes-internacion-lista', {
      title: 'Órdenes del Paciente',
      user: req.user,
      ordenes: ordenesConInternacion,
      estadisticas,
      sectores,
      filtros: { estado: '', prioridad: '', paciente: '', sector: '' }
    });

  } catch (error) {
    console.error('Error al listar órdenes:', error);
    next(error);
  }
};

// ============================================
// BUSCAR INTERNACIONES ACTIVAS 
// ============================================
exports.buscarInternaciones = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        internaciones: [],
        total: 0
      });
    }

    const internaciones = await Internacion.findAll({
      where: {
        fecha_alta: null
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          required: true,
          include: [{
            model: Usuario,
            as: 'usuario',
            required: true,
            attributes: ['id', 'dni', 'nombre', 'apellido'],
            where: {
              [Op.or]: [
                { dni: { [Op.like]: `%${q}%` } },
                { nombre: { [Op.like]: `%${q}%` } },
                { apellido: { [Op.like]: `%${q}%` } }
              ]
            }
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{
              model: Sector,
              as: 'sector'
            }]
          }]
        }
      ],
      limit: 10,
      order: [[{ model: Paciente, as: 'paciente' }, { model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    const internacionesFormateadas = internaciones.map(i => ({
      id: i.id,
      paciente_id: i.paciente.id,
      paciente_nombre: `${i.paciente.usuario.apellido}, ${i.paciente.usuario.nombre}`,
      paciente_dni: i.paciente.usuario.dni,
      ubicacion: `Sector ${i.cama.habitacion.sector.nombre} - Hab. ${i.cama.habitacion.numero} - Cama ${i.cama.numero}`,
      sector_id: i.cama.habitacion.sector_id,
      fecha_ingreso: i.fecha_ingreso
    }));

    res.json({
      success: true,
      internaciones: internacionesFormateadas,
      total: internacionesFormateadas.length
    });

  } catch (error) {
    console.error('Error al buscar internaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar internaciones',
      internaciones: []
    });
  }
};

// ============================================
// OBTENER DATOS DE INTERNACIÓN POR ID
// ============================================
exports.obtenerDatosInternacion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const internacion = await Internacion.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento']
          }]
        },
        {
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{
              model: Sector,
              as: 'sector',
              attributes: ['id', 'nombre']
            }]
          }]
        },
        {
          model: TipoInternacion,
          as: 'tipo_internacion'
        }
      ]
    });

    if (!internacion) {
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    res.json({
      success: true,
      internacion: {
        id: internacion.id,
        paciente_id: internacion.paciente.id,
        paciente_nombre: `${internacion.paciente.usuario.nombre} ${internacion.paciente.usuario.apellido}`,
        paciente_dni: internacion.paciente.usuario.dni,
        ubicacion: `${internacion.cama.habitacion.sector.nombre} - Hab. ${internacion.cama.habitacion.numero} - Cama ${internacion.cama.numero}`,
        fecha_ingreso: internacion.fecha_ingreso,
        diagnostico: internacion.diagnostico_ingreso,
        tipo_internacion: internacion.tipo_internacion?.nombre || 'No especificado'
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de internación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de internación'
    });
  }
};

// ============================================
// CREAR orden para internación 
// ============================================
exports.crear = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const medicoId = req.user.medico_id;
    
    const {
      internacion_id,
      paciente_id,
      tipo_orden,
      descripcion,
      indicaciones_especificas,
      frecuencia,
      prioridad,
      requiere_monitoreo_continuo,
      observaciones_adicionales
    } = req.body;

    console.log(`\n========== CREANDO ORDEN ==========`);
    console.log(`📋 internacion_id: ${internacion_id}`);
    console.log(`👤 paciente_id: ${paciente_id}`);
    console.log(`👨‍⚕️ medico_id: ${medicoId}`);
    console.log(`📝 tipo_orden: ${tipo_orden}`);

    // Validar campos requeridos
    if (!internacion_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID de internación requerido'
      });
    }

    if (!paciente_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID de paciente requerido'
      });
    }

    if (!tipo_orden) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tipo de orden requerido'
      });
    }

    if (!descripcion || descripcion.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Descripción requerida'
      });
    }

    // Validar que la internación existe y está activa
    const internacion = await Internacion.findByPk(internacion_id, {
      include: [{
        model: Cama,
        as: 'cama',
        include: [{
          model: Habitacion,
          as: 'habitacion',
          include: [{
            model: Sector,
            as: 'sector'
          }]
        }]
      }],
      transaction
    });

    if (!internacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Internación no encontrada'
      });
    }

    if (internacion.fecha_alta) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pueden crear órdenes para internaciones con alta médica'
      });
    }

    // Construir descripción completa de la orden
    let descripcionCompleta = `=== ORDEN PARA PACIENTE INTERNADO ===\n`;
    descripcionCompleta += `Fecha: ${new Date().toLocaleString('es-AR')}\n`;
    descripcionCompleta += `Médico: Dr. ${req.user.nombre} ${req.user.apellido}\n`;
    descripcionCompleta += `Ubicación: Sector ${internacion.cama.habitacion.sector.nombre} - Habitación ${internacion.cama.habitacion.numero} - Cama ${internacion.cama.numero}\n\n`;
    
    descripcionCompleta += `=== TIPO DE ORDEN ===\n${tipo_orden}\n\n`;
    descripcionCompleta += `=== DESCRIPCIÓN ===\n${descripcion}\n\n`;
    
    if (indicaciones_especificas && indicaciones_especificas.trim() !== '') {
      descripcionCompleta += `=== INDICACIONES ESPECÍFICAS ===\n${indicaciones_especificas}\n\n`;
    }
    
    if (frecuencia && frecuencia.trim() !== '') {
      descripcionCompleta += `=== FRECUENCIA ===\n${frecuencia}\n\n`;
    }
    
    if (requiere_monitoreo_continuo === 'true' || requiere_monitoreo_continuo === true) {
      descripcionCompleta += `⚠️ REQUIERE MONITOREO CONTINUO\n\n`;
    }
    
    if (observaciones_adicionales && observaciones_adicionales.trim() !== '') {
      descripcionCompleta += `=== OBSERVACIONES ADICIONALES ===\n${observaciones_adicionales}\n`;
    }

    // Crear la evaluación de enfermería con la orden
    const ordenInternacion = await EvaluacionEnfermeria.create({
      paciente_id: parseInt(paciente_id),
      enfermero_id: null,
      medico_id: medicoId,
      fecha: new Date(),
      observaciones: descripcionCompleta,
      tipo_egreso: 'ORDEN_MEDICA',
      prioridad: prioridad || 'NORMAL',
      estado: 'PENDIENTE',
      internacion_id: parseInt(internacion_id)
    }, { transaction });

    console.log(`✅ Orden creada con ID: ${ordenInternacion.id}`);
    console.log(`   paciente_id guardado: ${ordenInternacion.paciente_id}`);
    console.log(`   internacion_id guardado: ${ordenInternacion.internacion_id}`);
    console.log(`========== FIN CREACIÓN ==========\n`);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden creada correctamente',
      orden_id: ordenInternacion.id,
      redirect: `/medico/ordenes-internacion`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear orden de internación:', error);
    next(error);
  }
};

// ============================================
// LISTAR órdenes 
// ============================================
exports.listar = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    const sectorId = req.user.sector_id;
    const { estado, prioridad, paciente, sector } = req.query;
    
    console.log('📋 Listando órdenes para internados - Usuario:', req.user.email);
    
    const whereCondition = {
      tipo_egreso: 'ORDEN_MEDICA'
    };
    
    // Si es médico, mostrar solo sus órdenes
    if (userRole === 'MEDICO') {
      whereCondition.medico_id = req.user.medico_id;
    }
    
    // Si es enfermero, mostrar solo pendientes de su sector
    if (userRole === 'ENFERMERO') {
      whereCondition.estado = 'PENDIENTE';
    }
    
    if (estado && userRole === 'MEDICO') {
      whereCondition.estado = estado;
    }

    if (prioridad) {
      whereCondition.prioridad = prioridad;
    }

    // Buscar órdenes
    const ordenes = await EvaluacionEnfermeria.findAll({
      where: whereCondition,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          required: true,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          required: true,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [
        ['prioridad', 'DESC'],
        ['estado', 'ASC'],
        ['fecha', 'DESC']
      ]
    });

    console.log(` Encontradas ${ordenes.length} órdenes`);

    // Obtener internaciones para cada orden
    const ordenesConInternacion = await Promise.all(
      ordenes.map(async (orden) => {
        const ordenObj = orden.toJSON();
        if (orden.internacion_id) {
          try {
            const internacion = await Internacion.findByPk(orden.internacion_id, {
              include: [{
                model: Cama,
                as: 'cama',
                include: [{
                  model: Habitacion,
                  as: 'habitacion',
                  include: [{
                    model: Sector,
                    as: 'sector'
                  }]
                }]
              }]
            });
            ordenObj.internacion = internacion;
          } catch (err) {
            console.log('Error al cargar internación:', err.message);
            ordenObj.internacion = null;
          }
        }
        return ordenObj;
      })
    );

    // Filtrar por sector
    let ordenesFiltradas = ordenesConInternacion;
    if (sector) {
      ordenesFiltradas = ordenesFiltradas.filter(o => 
        o.internacion && 
        o.internacion.cama && 
        o.internacion.cama.habitacion && 
        o.internacion.cama.habitacion.sector_id === parseInt(sector)
      );
    }

    if (userRole === 'ENFERMERO' && sectorId) {
      ordenesFiltradas = ordenesFiltradas.filter(o => 
        o.internacion && 
        o.internacion.cama && 
        o.internacion.cama.habitacion && 
        o.internacion.cama.habitacion.sector_id === sectorId
      );
    }

    // Filtrar por paciente
    if (paciente) {
      const pacienteLower = paciente.toLowerCase();
      ordenesFiltradas = ordenesFiltradas.filter(o => 
        o.paciente.usuario.nombre.toLowerCase().includes(pacienteLower) ||
        o.paciente.usuario.apellido.toLowerCase().includes(pacienteLower) ||
        o.paciente.usuario.dni.includes(paciente)
      );
    }

    // Calcular estadísticas
    const estadisticas = {
      total: ordenesFiltradas.length,
      pendientes: ordenesFiltradas.filter(o => o.estado === 'PENDIENTE').length,
      completadas: ordenesFiltradas.filter(o => o.estado === 'COMPLETADA').length,
      canceladas: ordenesFiltradas.filter(o => o.estado === 'CANCELADA').length,
      urgentes: ordenesFiltradas.filter(o => o.prioridad === 'URGENTE' && o.estado === 'PENDIENTE').length
    };

    console.log('📊 Estadísticas:', estadisticas);

    // Obtener sectores para filtro
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    // Renderizar vista
    res.render('dashboard/medico/ordenes-internacion-lista', {
      title: 'Órdenes para Internados',
      user: req.user,
      ordenes: ordenesFiltradas,
      sectores,
      estadisticas,
      filtros: { 
        estado: estado || '', 
        prioridad: prioridad || '', 
        paciente: paciente || '', 
        sector: sector ? parseInt(sector) : '' 
      }
    });

  } catch (error) {
    console.error('❌ Error al listar órdenes de internación:', error);
    next(error);
  }
};

// ============================================
// VER DETALLE (COMPARTIDO PARA MÉDICO Y ENFERMERO)
// ============================================
exports.verDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.rol;

    console.log(` Ver detalle de orden ${id} - Rol: ${userRole}`);

    const orden = await EvaluacionEnfermeria.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono']
          }]
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!orden) {
      return res.status(404).render('error', {
        message: 'Orden no encontrada',
        user: req.user
      });
    }

    // Verificar que sea una orden médica
    if (orden.tipo_egreso !== 'ORDEN_MEDICA') {
      return res.status(404).render('error', {
        message: 'Este registro no es una orden médica',
        user: req.user
      });
    }

    // Obtener datos de internación
    let internacion = null;
    if (orden.internacion_id) {
      internacion = await Internacion.findByPk(orden.internacion_id, {
        include: [{
          model: Cama,
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{
              model: Sector,
              as: 'sector'
            }]
          }]
        }]
      });
    }

    // Calcular días de internación si existe
    let diasInternado = null;
    if (internacion && internacion.fecha_inicio) {
      diasInternado = Math.floor((new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24));
    }

    // ========================================
    // RENDERIZAR VISTA SEGÚN EL ROL
    // ========================================
    if (userRole === 'ENFERMERO') {
      return res.render('dashboard/enfermero/ordenes-detalle', {
        title: 'Detalle de Orden Médica',
        user: req.user,
        orden,
        internacion,
        diasInternado
      });
    }

    // Vista para médico (original)
    res.render('dashboard/medico/ordenes-internacion-detalle', {
      title: 'Detalle de Orden',
      user: req.user,
      orden,
      internacion,
      diasInternado,
      esEnfermero: false
    });

  } catch (error) {
    console.error('Error al ver detalle de orden:', error);
    next(error);
  }
};

// ============================================
// FORMULARIO PARA CREAR (vista completa)
// ============================================
exports.formularioCrear = async (req, res, next) => {
  try {
    const { internacion_id } = req.query;

    let internacionSeleccionada = null;

    if (internacion_id) {
      internacionSeleccionada = await Internacion.findByPk(internacion_id, {
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni']
            }]
          },
          {
            model: Cama,
            as: 'cama',
            include: [{
              model: Habitacion,
              as: 'habitacion',
              include: [{
                model: Sector,
                as: 'sector',
                attributes: ['id', 'nombre']
              }]
            }]
          }
        ]
      });
    }

    // Obtener sectores para selector rápido
    const sectores = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.render('dashboard/medico/ordenes-internacion-crear', {
      title: 'Crear Orden para Paciente Internado',
      user: req.user,
      internacion: internacionSeleccionada,
      sectores
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    next(error);
  }
};

// ============================================
// EDITAR orden
// ============================================
exports.editar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;

    const orden = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    if (orden.tipo_egreso !== 'ORDEN_MEDICA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este registro no es una orden médica'
      });
    }

    if (orden.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar esta orden'
      });
    }

    if (orden.estado === 'COMPLETADA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una orden ya completada'
      });
    }

    const {
      tipo_orden,
      descripcion,
      indicaciones_especificas,
      frecuencia,
      prioridad,
      requiere_monitoreo_continuo,
      observaciones_adicionales
    } = req.body;

    if (!tipo_orden || !descripcion) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tipo de orden y descripción son requeridos'
      });
    }

    let descripcionCompleta = `=== ORDEN PARA PACIENTE INTERNADO (ACTUALIZADA) ===\n`;
    descripcionCompleta += `Fecha actualización: ${new Date().toLocaleString('es-AR')}\n`;
    descripcionCompleta += `Médico: Dr. ${req.user.nombre} ${req.user.apellido}\n\n`;
    
    descripcionCompleta += `=== TIPO DE ORDEN ===\n${tipo_orden}\n\n`;
    descripcionCompleta += `=== DESCRIPCIÓN ===\n${descripcion}\n\n`;
    
    if (indicaciones_especificas && indicaciones_especificas.trim() !== '') {
      descripcionCompleta += `=== INDICACIONES ESPECÍFICAS ===\n${indicaciones_especificas}\n\n`;
    }
    
    if (frecuencia && frecuencia.trim() !== '') {
      descripcionCompleta += `=== FRECUENCIA ===\n${frecuencia}\n\n`;
    }
    
    if (requiere_monitoreo_continuo === 'true' || requiere_monitoreo_continuo === true) {
      descripcionCompleta += `⚠️ REQUIERE MONITOREO CONTINUO\n\n`;
    }
    
    if (observaciones_adicionales && observaciones_adicionales.trim() !== '') {
      descripcionCompleta += `=== OBSERVACIONES ADICIONALES ===\n${observaciones_adicionales}\n`;
    }

    await orden.update({
      observaciones: descripcionCompleta,
      prioridad: prioridad || orden.prioridad
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden actualizada correctamente',
      redirect: `/medico/ordenes-internacion/${id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al editar orden:', error);
    next(error);
  }
};

// ============================================
// ELIMINAR/CANCELAR orden
// ============================================
exports.eliminar = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const medicoId = req.user.medico_id;
    const { motivo_cancelacion } = req.body;

    const orden = await EvaluacionEnfermeria.findByPk(id, { transaction });
    
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    if (orden.tipo_egreso !== 'ORDEN_MEDICA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este registro no es una orden médica'
      });
    }

    if (orden.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para cancelar esta orden'
      });
    }

    if (orden.estado === 'COMPLETADA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una orden ya completada'
      });
    }

    if (!motivo_cancelacion || motivo_cancelacion.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar un motivo de cancelación'
      });
    }

    await orden.update({
      estado: 'CANCELADA',
      observaciones: orden.observaciones + `\n\n=== ORDEN CANCELADA ===\nFecha: ${new Date().toLocaleString('es-AR')}\nMédico: Dr. ${req.user.nombre} ${req.user.apellido}\nMotivo: ${motivo_cancelacion}`
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orden cancelada correctamente',
      redirect: '/medico/ordenes-internacion'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar orden:', error);
    next(error);
  }
};

// ============================================
// OBTENER ÓRDENES DE UN PACIENTE INTERNADO (API)
// ============================================
exports.obtenerOrdenesPaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;

    const internacion = await Internacion.findOne({
      where: {
        paciente_id,
        fecha_alta: null
      }
    });

    if (!internacion) {
      return res.json({
        success: false,
        message: 'El paciente no tiene internación activa',
        ordenes: []
      });
    }

    // Buscar por ambos: paciente_id e internacion_id
    const ordenes = await EvaluacionEnfermeria.findAll({
      where: {
        [Op.or]: [
          { paciente_id, tipo_egreso: 'ORDEN_MEDICA' },
          { internacion_id: internacion.id, tipo_egreso: 'ORDEN_MEDICA' }
        ],
        estado: 'PENDIENTE'
      },
      include: [{
        model: Medico,
        as: 'medico',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [
        ['prioridad', 'DESC'],
        ['fecha', 'ASC']
      ]
    });

    res.json({
      success: true,
      total: ordenes.length,
      internacion_id: internacion.id,
      ordenes: ordenes.map(o => ({
        id: o.id,
        observaciones: o.observaciones.substring(0, 150) + (o.observaciones.length > 150 ? '...' : ''),
        prioridad: o.prioridad,
        medico: `Dr. ${o.medico.usuario.nombre} ${o.medico.usuario.apellido}`,
        fecha: o.fecha
      }))
    });

  } catch (error) {
    console.error('Error al obtener órdenes del paciente internado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      ordenes: []
    });
  }
};

// ============================================
// EJECUTAR orden (para enfermero)
// ============================================
exports.ejecutarOrden = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const enfermeroId = req.user.enfermero_id || req.user.id;
    const {
      observaciones_ejecucion,
      complicaciones
    } = req.body;

    console.log(` Ejecutando orden ${id} - Enfermero ID: ${enfermeroId}`);

    const orden = await EvaluacionEnfermeria.findByPk(id, { 
      include: [{
        model: Paciente,
        as: 'paciente'
      }],
      transaction 
    });
    
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Case-insensitive comparison
    const estadoUpper = orden.estado ? orden.estado.toUpperCase() : '';
    
    if (estadoUpper === 'COMPLETADA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya fue ejecutada'
      });
    }

    if (estadoUpper === 'CANCELADA') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta orden fue cancelada y no puede ser ejecutada'
      });
    }

    // Validar observaciones
    if (!observaciones_ejecucion || observaciones_ejecucion.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Las observaciones de ejecución son requeridas'
      });
    }

    // Actualizar orden
    let observacionesCompletas = orden.observaciones || '';
    observacionesCompletas += `\n\n=== EJECUCIÓN DE ORDEN ===\n`;
    observacionesCompletas += `Fecha: ${new Date().toLocaleString('es-AR')}\n`;
    observacionesCompletas += `Enfermero: ${req.user.nombre} ${req.user.apellido}\n\n`;
    observacionesCompletas += `Observaciones: ${observaciones_ejecucion}`;
    
    if (complicaciones && complicaciones.trim() !== '') {
      observacionesCompletas += `\n\n⚠️ COMPLICACIONES REPORTADAS:\n${complicaciones}`;
    }

    // Guardar con estado en MAYÚSCULAS para consistencia
    await orden.update({
      estado: 'COMPLETADA',
      enfermero_id: enfermeroId,
      observaciones: observacionesCompletas
    }, { transaction });

    await transaction.commit();

    console.log(` Orden ${id} ejecutada correctamente`);

    // Determinar la URL de redirección
    let redirectUrl = '/enfermero/internados';
    if (orden.internacion_id) {
      redirectUrl = `/enfermero/internados/${orden.internacion_id}`;
    }

    res.json({
      success: true,
      message: 'Orden ejecutada correctamente',
      tiene_complicaciones: !!(complicaciones && complicaciones.trim() !== ''),
      redirect: redirectUrl
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al ejecutar orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar la orden: ' + error.message
    });
  }
};

module.exports = exports;