const { Op } = require('sequelize');
const db = require('../database/db');
const {
  Usuario,
  Rol,
  Medico,
  Enfermero,
  Administrativo,
  Sector,
  Especialidad,
  TurnoPersonal,
  Habitacion,
  Cama
} = require('../models');

/**
 * Vista principal de gestión de personal
 */
const getVistaPersonal = async (req, res) => {
  try {
    const [roles, sectores, especialidades] = await Promise.all([
      Rol.findAll({ attributes: ['id', 'nombre'], order: [['nombre', 'ASC']] }),
      Sector.findAll({ attributes: ['id', 'nombre'], order: [['nombre', 'ASC']] }),
      Especialidad.findAll({ attributes: ['id', 'nombre'], order: [['nombre', 'ASC']] })
    ]);

    res.render('dashboard/admin/personal/gestion', {
      title: 'Gestión de Personal Hospitalario',
      roles,
      sectores,
      especialidades
    });
  } catch (error) {
    console.error('Error al cargar vista de personal:', error);
    res.status(500).render('error', { message: 'Error al cargar gestión de personal' });
  }
};

/**
 * Obtener estadísticas del dashboard
 */
const getEstadisticas = async (req, res) => {
  try {
    const [medicos, enfermeros, administrativos, medicosActivos, enfermerosActivos, 
           medicosSinSector, enfermerosSinSector, personalSinTurno] = await Promise.all([
      Medico.count(),
      Enfermero.count(),
      Administrativo.count(),
      Medico.count({ include: [{ model: Usuario, as: 'usuario', where: { estado: 'Activo' } }] }),
      Enfermero.count({ where: { estado: 'Activo' } }),
      Medico.count({ where: { sector_id: null } }),
      Enfermero.count({ where: { sector_id: null } }),
      TurnoPersonal.count({ where: { usuario_id: null } })
    ]);

    // Médicos por especialidad
    const medicosPorEspecialidad = await Medico.findAll({
      attributes: ['especialidad_id', [db.sequelize.fn('COUNT', db.sequelize.col('Medico.id')), 'total']],
      include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
      group: ['especialidad_id'],
      raw: true
    });

    // Enfermeros por nivel
    const enfermerosPorNivel = await Enfermero.findAll({
      attributes: ['nivel', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']],
      group: ['nivel'],
      raw: true
    });

    // Personal por sector
    const personalPorSector = await Sector.findAll({
      attributes: [
        'id',
        'nombre',
        [db.sequelize.fn('COUNT', db.sequelize.col('medicos.id')), 'medicos'],
        [db.sequelize.fn('COUNT', db.sequelize.col('enfermeros.id')), 'enfermeros']
      ],
      include: [
        { model: Medico, as: 'medicos', attributes: [] },
        { model: Enfermero, as: 'enfermeros', attributes: [] }
      ],
      group: ['Sector.id'],
      raw: true
    });

    res.json({
      success: true,
      resumen: {
        total_medicos: medicos,
        total_enfermeros: enfermeros,
        total_administrativos: administrativos,
        medicos_activos: medicosActivos,
        enfermeros_activos: enfermerosActivos,
        medicos_sin_sector: medicosSinSector,
        enfermeros_sin_sector: enfermerosSinSector,
        personal_sin_turno: personalSinTurno
      },
      medicosPorEspecialidad,
      enfermerosPorNivel,
      personalPorSector
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas', error: error.message });
  }
};

/**
 * Buscar personal con filtros avanzados
 */
const buscarPersonal = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      busqueda = '',
      rol_id = '',
      tipo_personal = '', // medico, enfermero, administrativo
      sector_id = '',
      estado = '',
      sin_asignar = false
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros para Usuario
    const whereUsuario = {};
    if (estado) whereUsuario.estado = estado;
    
    if (busqueda.length >= 3) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { dni: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (rol_id) whereUsuario.rol_principal_id = rol_id;

    // Buscar según tipo de personal
    let personal = [];
    let count = 0;

    if (tipo_personal === 'medico' || !tipo_personal) {
      const whereMedico = {};
      if (sector_id) whereMedico.sector_id = sector_id;
      if (sin_asignar === 'true') whereMedico.sector_id = null;

      const medicos = await Medico.findAndCountAll({
        where: whereMedico,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            where: Object.keys(whereUsuario).length ? whereUsuario : undefined,
            attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'estado']
          },
          { model: Sector, as: 'sector', attributes: ['nombre'] },
          { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
        ],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      personal = medicos.rows.map(m => ({
        id: m.id,
        usuario_id: m.usuario_id,
        tipo: 'Médico',
        nombre: `${m.usuario.nombre} ${m.usuario.apellido}`,
        dni: m.usuario.dni,
        email: m.usuario.email,
        telefono: m.usuario.telefono,
        estado: m.usuario.estado,
        sector: m.sector?.nombre || 'Sin asignar',
        sector_id: m.sector_id,
        especialidad: m.especialidad?.nombre || '',
        matricula: m.matricula,
        detalle: `Matrícula: ${m.matricula}`
      }));
      count = medicos.count;
    }

    if (tipo_personal === 'enfermero' || !tipo_personal) {
      const whereEnfermero = {};
      if (sector_id) whereEnfermero.sector_id = sector_id;
      if (sin_asignar === 'true') whereEnfermero.sector_id = null;

      const enfermeros = await Enfermero.findAndCountAll({
        where: whereEnfermero,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            where: Object.keys(whereUsuario).length ? whereUsuario : undefined,
            attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'estado']
          },
          { model: Sector, as: 'sector', attributes: ['nombre'] }
        ],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const enfermerosFormateados = enfermeros.rows.map(e => ({
        id: e.id,
        usuario_id: e.usuario_id,
        tipo: 'Enfermero',
        nombre: `${e.usuario.nombre} ${e.usuario.apellido}`,
        dni: e.usuario.dni,
        email: e.usuario.email,
        telefono: e.usuario.telefono,
        estado: e.estado,
        sector: e.sector?.nombre || 'Sin asignar',
        sector_id: e.sector_id,
        nivel: e.nivel,
        matricula: e.matricula,
        detalle: `Nivel: ${e.nivel} | Mat: ${e.matricula}`
      }));

      personal = tipo_personal === 'enfermero' ? enfermerosFormateados : [...personal, ...enfermerosFormateados];
      count += enfermeros.count;
    }

    if (tipo_personal === 'administrativo' || !tipo_personal) {
      const whereAdmin = {};
      if (sector_id) whereAdmin.sector_id = sector_id;
      if (sin_asignar === 'true') whereAdmin.sector_id = null;

      const administrativos = await Administrativo.findAndCountAll({
        where: whereAdmin,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            where: Object.keys(whereUsuario).length ? whereUsuario : undefined,
            attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'estado']
          },
          { model: Sector, as: 'sector', attributes: ['nombre'] }
        ],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      const administrativosFormateados = administrativos.rows.map(a => ({
        id: a.id,
        usuario_id: a.usuario_id,
        tipo: 'Administrativo',
        nombre: `${a.usuario.nombre} ${a.usuario.apellido}`,
        dni: a.usuario.dni,
        email: a.usuario.email,
        telefono: a.usuario.telefono,
        estado: a.estado,
        sector: a.sector?.nombre || 'Sin asignar',
        sector_id: a.sector_id,
        responsabilidad: a.responsabilidad,
        detalle: `Responsabilidad: ${a.responsabilidad}`
      }));

      personal = tipo_personal === 'administrativo' ? administrativosFormateados : [...personal, ...administrativosFormateados];
      count += administrativos.count;
    }

    res.json({
      success: true,
      personal,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al buscar personal:', error);
    res.status(500).json({ success: false, message: 'Error al buscar personal', error: error.message });
  }
};

/**
 * Obtener detalles completos de un empleado
 */
const getDetallesEmpleado = async (req, res) => {
  try {
    const { tipo, id } = req.params;
    let empleado = null;

    switch(tipo) {
      case 'medico':
        empleado = await Medico.findByPk(id, {
          include: [
            { model: Usuario, as: 'usuario' },
            { model: Sector, as: 'sector' },
            { model: Especialidad, as: 'especialidad' }
          ]
        });
        break;

      case 'enfermero':
        empleado = await Enfermero.findByPk(id, {
          include: [
            { model: Usuario, as: 'usuario' },
            { model: Sector, as: 'sector' }
          ]
        });
        break;

      case 'administrativo':
        empleado = await Administrativo.findByPk(id, {
          include: [
            { model: Usuario, as: 'usuario' },
            { model: Sector, as: 'sector' },
            { model: TurnoPersonal, as: 'turno' }
          ]
        });
        break;
    }

    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    // Obtener turnos personales
    const turnos = await TurnoPersonal.findAll({
      where: { usuario_id: empleado.usuario_id },
      include: [{ model: Sector, as: 'sector', attributes: ['nombre'] }]
    });

    res.json({
      success: true,
      empleado: {
        ...empleado.toJSON(),
        turnos
      }
    });

  } catch (error) {
    console.error('Error al obtener detalles:', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalles', error: error.message });
  }
};

/**
 * Asignar sector a un empleado
 */
const asignarSector = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { tipo, id } = req.params;
    const { sector_id } = req.body;

    let empleado = null;

    switch(tipo) {
      case 'medico':
        empleado = await Medico.findByPk(id, { transaction });
        break;
      case 'enfermero':
        empleado = await Enfermero.findByPk(id, { transaction });
        break;
      case 'administrativo':
        empleado = await Administrativo.findByPk(id, { transaction });
        break;
    }

    if (!empleado) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    await empleado.update({ sector_id }, { transaction });
    await transaction.commit();

    res.json({ success: true, message: 'Sector asignado correctamente' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al asignar sector:', error);
    res.status(500).json({ success: false, message: 'Error al asignar sector', error: error.message });
  }
};

/**
 * Crear/actualizar turno de trabajo
 */
const gestionarTurno = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      id, // Si existe, es UPDATE
      usuario_id,
      tipo,
      dias,
      hora_inicio,
      hora_fin,
      sector_id
    } = req.body;

    if (id) {
      // Actualizar turno existente
      const turno = await TurnoPersonal.findByPk(id, { transaction });
      if (!turno) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Turno no encontrado' });
      }

      await turno.update({ tipo, dias, hora_inicio, hora_fin, sector_id }, { transaction });
      await transaction.commit();
      
      return res.json({ success: true, message: 'Turno actualizado correctamente' });
    } else {
      // Crear nuevo turno
      const turno = await TurnoPersonal.create({
        usuario_id,
        tipo,
        dias,
        hora_inicio,
        hora_fin,
        sector_id
      }, { transaction });

      await transaction.commit();
      
      return res.json({ success: true, message: 'Turno creado correctamente', turno });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error al gestionar turno:', error);
    res.status(500).json({ success: false, message: 'Error al gestionar turno', error: error.message });
  }
};

/**
 * Solicitar cambio de turno
 */
const solicitarCambioTurno = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      turno_origen_id,
      turno_destino_id,
      fecha_cambio,
      motivo
    } = req.body;

    // Validar que los turnos existan
    const [turnoOrigen, turnoDestino] = await Promise.all([
      TurnoPersonal.findByPk(turno_origen_id, { transaction }),
      TurnoPersonal.findByPk(turno_destino_id, { transaction })
    ]);

    if (!turnoOrigen || !turnoDestino) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Turnos no encontrados' });
    }
    // Intercambiar usuarios asignados a los turnos
    
    const usuarioTemp = turnoOrigen.usuario_id;
    await turnoOrigen.update({ usuario_id: turnoDestino.usuario_id }, { transaction });
    await turnoDestino.update({ usuario_id: usuarioTemp }, { transaction });

    await transaction.commit();

    res.json({ success: true, message: 'Cambio de turno realizado correctamente' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar turno:', error);
    res.status(500).json({ success: false, message: 'Error al realizar cambio de turno', error: error.message });
  }
};

/**
 * Asignar tarea de limpieza
 */
const asignarLimpieza = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      tipo, // 'sector', 'habitacion', 'cama'
      id_elemento,
      usuario_id,
      fecha_fin_limpieza
    } = req.body;

    let elemento = null;

    switch(tipo) {
      case 'sector':
        elemento = await Sector.findByPk(id_elemento, { transaction });
        break;

      case 'habitacion':
        elemento = await Habitacion.findByPk(id_elemento, { transaction });
        break;

      case 'cama':
        elemento = await Cama.findByPk(id_elemento, { transaction });
        await elemento.update({
          estado: 'EnLimpieza',
          fecha_fin_limpieza: fecha_fin_limpieza || new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 horas
        }, { transaction });
        break;
    }

    if (!elemento) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Elemento no encontrado' });
    }

    await transaction.commit();

    res.json({ success: true, message: 'Tarea de limpieza asignada correctamente' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al asignar limpieza:', error);
    res.status(500).json({ success: false, message: 'Error al asignar limpieza', error: error.message });
  }
};

/**
 * Dar de baja a un empleado
 */
const bajaEmpleado = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { tipo, id } = req.params;
    const { motivo } = req.body;

    let empleado = null;

    switch(tipo) {
      case 'medico':
        empleado = await Medico.findByPk(id, { include: [{ model: Usuario, as: 'usuario' }], transaction });
        break;
      case 'enfermero':
        empleado = await Enfermero.findByPk(id, { include: [{ model: Usuario, as: 'usuario' }], transaction });
        await empleado.update({ estado: 'Inactivo' }, { transaction });
        break;
      case 'administrativo':
        empleado = await Administrativo.findByPk(id, { include: [{ model: Usuario, as: 'usuario' }], transaction });
        await empleado.update({ estado: 'Inactivo' }, { transaction });
        break;
    }

    if (!empleado) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    // Actualizar estado del usuario
    await empleado.usuario.update({ estado: 'Inactivo' }, { transaction });

    await transaction.commit();

    res.json({ success: true, message: 'Empleado dado de baja correctamente' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al dar de baja:', error);
    res.status(500).json({ success: false, message: 'Error al dar de baja', error: error.message });
  }
};

module.exports = {
  getVistaPersonal,
  getEstadisticas,
  buscarPersonal,
  getDetallesEmpleado,
  asignarSector,
  gestionarTurno,
  solicitarCambioTurno,
  asignarLimpieza,
  bajaEmpleado
};