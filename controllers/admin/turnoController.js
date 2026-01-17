const { Op } = require("sequelize");
const db = require("../../database/db");
const {
  Turno,
  ListaEspera,
  Paciente,
  Usuario,
  Medico,
  Enfermero,
  Administrativo,
  TipoTurno,
  Especialidad,
  TipoEstudio,
  Sector,
  Habitacion,
  Admision,
  EvaluacionMedica,
  EvaluacionEnfermeria,
  EstudioSolicitado,
  HistorialMedico,
  ObraSocial,
  Diagnostico,
  Internacion,
  Cama
} = require("../../models");
const { obtenerHorariosDisponibles } = require('../../services/horariosUtils');

// ==================== VISTA PRINCIPAL ====================
const getVistaTurnos = async (req, res) => {
  try {
    // Cargar datos necesarios para los selects
    const [medicos, sectores, tiposTurno] = await Promise.all([
      Medico.findAll({
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }, {
          model: Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        }],
        attributes: ['id', 'matricula']
      }),
      Sector.findAll({ attributes: ['id', 'nombre'] }),
      TipoTurno.findAll({ attributes: ['id', 'nombre', 'descripcion'] })
    ]);

    res.render("dashboard/admin/turno/turnos", {
      title: "Gestión de Turnos y Listas de Espera",
      layout: "dashboard/admin/dashboard-admin",
      medicos,
      sectores,
      tiposTurno
    });
  } catch (error) {
    console.error("Error al cargar vista de turnos:", error);
    res.status(500).render("error", {
      message: "Error al cargar la vista de turnos",
      error: error,
    });
  }
};

// ==================== DASHBOARD DE TURNOS Y LISTAS ====================
const getDashboardTurnos = async (req, res) => {
  try {
    console.log("🔍 Obteniendo dashboard de turnos...");

    const { fecha, estado_turno, estado_lista, tipo_turno_id } = req.query;

    // FILTROS PARA TURNOS
    const whereTurno = {};
    if (fecha) whereTurno.fecha = fecha;
    if (estado_turno) whereTurno.estado = estado_turno;

    // FILTROS PARA LISTAS DE ESPERA
    const whereLista = {};
    if (estado_lista) whereLista.estado = estado_lista;
    if (tipo_turno_id) whereLista.tipo_turno_id = tipo_turno_id;

    // 1: OBTENER TURNOS CON RELACIONES
    const turnos = await Turno.findAll({
      where: whereTurno,
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ['nombre', 'apellido', 'dni', 'sexo']
            }
          ]
        },
        {
          model: Medico,
          as: "medico",
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ['nombre', 'apellido']
            }
          ]
        },
        { model: Sector, as: "sector" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: ListaEspera, as: "lista_espera" }
      ],
      order: [
        ["fecha", "DESC"],
        ["hora_inicio", "ASC"]
      ],
      limit: 100
    });

    console.log("✅ Turnos obtenidos:", turnos.length);

    // 2: OBTENER LISTAS DE ESPERA
    const listasEspera = await ListaEspera.findAll({
      where: whereLista,
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ['nombre', 'apellido', 'dni', 'sexo']
            }
          ]
        },
        { model: TipoTurno, as: "tipo_turno" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: Especialidad, as: "especialidad" },
        {
          model: Habitacion,
          as: "habitacion",
          include: [{ model: Sector, as: "sector" }]
        },
        { model: Turno, as: "turno" }
      ],
      order: [
        ["prioridad", "DESC"],
        ["fecha_registro", "ASC"]
      ],
      limit: 200
    });

    console.log("✅ Listas de espera obtenidas:", listasEspera.length);
    
    // 3: OBTENER CREADORES
    const creadoresIds = {
      administrativos: [],
      enfermeros: [],
      medicos: [],
    };
    
    listasEspera.forEach((lista) => {
      if (lista.creador_tipo === "ADMINISTRATIVO") {
        creadoresIds.administrativos.push(lista.creador_id);
      } else if (lista.creador_tipo === "ENFERMERO") {
        creadoresIds.enfermeros.push(lista.creador_id);
      } else if (lista.creador_tipo === "MEDICO") {
        creadoresIds.medicos.push(lista.creador_id);
      }
    });

    const [administrativos, enfermeros, medicos] = await Promise.all([
      creadoresIds.administrativos.length > 0
        ? Administrativo.findAll({
            where: { id: creadoresIds.administrativos },
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          })
        : Promise.resolve([]),
      creadoresIds.enfermeros.length > 0
        ? Enfermero.findAll({
            where: { id: creadoresIds.enfermeros },
            include: [{
              model: Usuario,
              as: "usuario",
              attributes: ['nombre', 'apellido']
            }]
          })
        : Promise.resolve([]),
      creadoresIds.medicos.length > 0
        ? Medico.findAll({
            where: { id: creadoresIds.medicos },
            include: [{
              model: Usuario,
              as: "usuario",
              attributes: ['nombre', 'apellido']
            }]
          })
        : Promise.resolve([])
    ]);

    const administrativosMap = new Map(administrativos.map((a) => [a.id, a]));
    const enfermerosMap = new Map(enfermeros.map((e) => [e.id, e]));
    const medicosMap = new Map(medicos.map((m) => [m.id, m]));

    // 4: FORMATEAR DATOS
    const turnosFormateados = turnos.map((turno) => ({
      id: turno.id,
      fecha: turno.fecha,
      horaInicio: turno.hora_inicio,
      horaFin: turno.hora_fin,
      estado: turno.estado,
      paciente: {
        id: turno.paciente?.id,
        nombre: turno.paciente?.usuario?.nombre,
        apellido: turno.paciente?.usuario?.apellido,
        dni: turno.paciente?.usuario?.dni,
        sexo: turno.paciente?.usuario?.sexo
      },
      medico: {
        id: turno.medico?.id,
        nombre: turno.medico?.usuario?.nombre,
        apellido: turno.medico?.usuario?.apellido
      },
      sector: turno.sector,
      tipoEstudio: turno.tipo_estudio,
      listaEspera: turno.lista_espera
    }));

    const listasFormateadas = listasEspera.map((lista) => {
      let creador = null;

      if (lista.creador_tipo === "ADMINISTRATIVO") {
        const admin = administrativosMap.get(lista.creador_id);
        if (admin) {
          creador = {
            tipo: "ADMINISTRATIVO",
            nombre: admin.usuario?.nombre,
            apellido: admin.usuario?.apellido
          };
        }
      } else if (lista.creador_tipo === "ENFERMERO") {
        const enf = enfermerosMap.get(lista.creador_id);
        if (enf) {
          creador = {
            tipo: "ENFERMERO",
            nombre: enf.usuario?.nombre,
            apellido: enf.usuario?.apellido
          };
        }
      } else if (lista.creador_tipo === "MEDICO") {
        const med = medicosMap.get(lista.creador_id);
        if (med) {
          creador = {
            tipo: "MEDICO",
            nombre: med.usuario?.nombre,
            apellido: med.usuario?.apellido
          };
        }
      }

      // Calcular días de espera
      const diasEspera = Math.floor(
        (new Date() - new Date(lista.fecha_registro)) / (1000 * 60 * 60 * 24)
      );

      return {
        id: lista.id,
        paciente: {
          id: lista.paciente?.id,
          nombre: lista.paciente?.usuario?.nombre,
          apellido: lista.paciente?.usuario?.apellido,
          dni: lista.paciente?.usuario?.dni,
          sexo: lista.paciente?.usuario?.sexo
        },
        tipoTurno: lista.tipo_turno,
        tipoEstudio: lista.tipo_estudio,
        especialidad: lista.especialidad,
        prioridad: lista.prioridad,
        estado: lista.estado,
        diasEspera,
        habitacion: lista.habitacion,
        creador,
        fechaRegistro: lista.fecha_registro,
        turnoAsignado: lista.turno
      };
    });

    // 5: ESTADÍSTICAS
    const estadisticas = {
      turnos: {
        total: turnos.length,
        pendientes: turnos.filter((t) => t.estado === "PENDIENTE").length,
        confirmados: turnos.filter((t) => t.estado === "CONFIRMADO").length,
        completados: turnos.filter((t) => t.estado === "COMPLETADO").length,
        cancelados: turnos.filter((t) => t.estado === "CANCELADO").length
      },
      listasEspera: {
        total: listasEspera.length,
        pendientes: listasEspera.filter((l) => l.estado === "PENDIENTE").length,
        asignados: listasEspera.filter((l) => l.estado === "ASIGNADO").length,
        completados: listasEspera.filter((l) => l.estado === "COMPLETADO").length,
        cancelados: listasEspera.filter((l) => l.estado === "CANCELADO").length,
        porPrioridad: {
          alta: listasEspera.filter((l) => l.prioridad === "ALTA" && l.estado === "PENDIENTE").length,
          media: listasEspera.filter((l) => l.prioridad === "MEDIA" && l.estado === "PENDIENTE").length,
          baja: listasEspera.filter((l) => l.prioridad === "BAJA" && l.estado === "PENDIENTE").length
        }
      }
    };

    res.json({
      turnos: turnosFormateados,
      listasEspera: listasFormateadas,
      estadisticas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ ERROR en getDashboardTurnos:", error);
    res.status(500).json({
      message: "Error al obtener datos del dashboard",
      error: error.message
    });
  }
};

// ==================== ✅ NUEVA: VER DETALLES DE PACIENTE ====================
const getDetallesPaciente = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    console.log(`🔍 Obteniendo detalles del paciente ID: ${paciente_id}`);

    // Cargar TODOS los datos del paciente
    const [
      paciente,
      admisiones,
      turnos,
      listasEspera,
      internaciones,
      historial
    ] = await Promise.all([
      // Datos personales
      Paciente.findByPk(paciente_id, {
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'email', 'telefono', 'fecha_nacimiento', 'sexo']
          },
          {
            model: ObraSocial,
            as: 'obraSocial',
            attributes: ['nombre']
          }
        ]
      }),
      
      // Admisiones
      Admision.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
          },
          { model: Sector, as: 'sector', attributes: ['nombre'] },
          { model: TipoEstudio, as: 'tipo_estudio', attributes: ['nombre'] },
          { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
        ],
        order: [['fecha', 'DESC']],
        limit: 10
      }),
      
      // Turnos
      Turno.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
          },
          { model: Sector, as: 'sector', attributes: ['nombre'] },
          { model: TipoEstudio, as: 'tipo_estudio', attributes: ['nombre'] }
        ],
        order: [['fecha', 'DESC']],
        limit: 10
      }),
      
      // Listas de espera
      ListaEspera.findAll({
        where: { paciente_id },
        include: [
          { model: TipoTurno, as: 'tipo_turno', attributes: ['nombre'] },
          { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
        ],
        order: [['fecha_registro', 'DESC']],
        limit: 10
      }),
      
      // Internaciones
      Internacion.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: 'medico',
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
          },
          {
            model: Habitacion,
            as: 'habitacion',
            attributes: ['numero'],
            include: [{ model: Sector, as: 'sector', attributes: ['nombre'] }]
          },
          {
            model: Cama,
            as: 'cama',
            attributes: ['numero']
          }
        ],
        order: [['fecha_inicio', 'DESC']],
        limit: 5
      }),
      
      // Historial médico
      HistorialMedico.findAll({
        where: { paciente_id },
        order: [['fecha', 'DESC']],
        limit: 10
      })
    ]);

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    // Calcular estadísticas
    const estadisticas = {
      totalAdmisiones: admisiones.length,
      totalTurnos: turnos.length,
      turnosPendientes: turnos.filter(t => t.estado === 'PENDIENTE').length,
      listaEsperaPendiente: listasEspera.filter(l => l.estado === 'PENDIENTE').length,
      internacionActiva: internaciones.some(i => !i.fecha_alta)
    };

    res.json({
      paciente: {
        id: paciente.id,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        dni: paciente.usuario.dni,
        email: paciente.usuario.email,
        telefono: paciente.usuario.telefono,
        fechaNacimiento: paciente.usuario.fecha_nacimiento,
        sexo: paciente.usuario.sexo,
        obraSocial: paciente.obraSocial?.nombre || 'Sin obra social',
        fechaIngreso: paciente.fecha_ingreso,
        estado: paciente.estado
      },
      admisiones,
      turnos,
      listasEspera,
      internaciones,
      historial,
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener detalles del paciente:', error);
    res.status(500).json({
      message: 'Error al obtener detalles del paciente',
      error: error.message
    });
  }
};

// ====================  NUEVA: CARGAR MÉDICOS ====================
const getMedicos = async (req, res) => {
  try {
    const { especialidad_id, sector_id } = req.query;

    const where = {};
    if (especialidad_id) where.especialidad_id = especialidad_id;
    if (sector_id) where.sector_id = sector_id;

    const medicos = await Medico.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        },
        {
          model: Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        },
        {
          model: Sector,
          as: 'sector',
          attributes: ['nombre']
        }
      ],
      attributes: ['id', 'matricula']
    });

    res.json({ medicos });
  } catch (error) {
    console.error('Error al cargar médicos:', error);
    res.status(500).json({
      message: 'Error al cargar médicos',
      error: error.message
    });
  }
};

// ==================== OBTENER TURNO POR ID ====================
const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [{ model: Usuario, as: "usuario" }]
        },
        {
          model: Medico,
          as: "medico",
          include: [{ model: Usuario, as: "usuario" }]
        },
        { model: Sector, as: "sector" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: ListaEspera, as: "lista_espera" }
      ]
    });

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    res.json({ turno });
  } catch (error) {
    console.error("Error al obtener turno:", error);
    res.status(500).json({
      message: "Error al obtener turno",
      error: error.message
    });
  }
};

// ==================== OBTENER LISTA DE ESPERA POR ID ====================
const getListaEsperaById = async (req, res) => {
  try {
    const { id } = req.params;

    const lista = await ListaEspera.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [{ model: Usuario, as: "usuario" }]
        },
        { model: TipoTurno, as: "tipo_turno" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: Especialidad, as: "especialidad" },
        {
          model: Habitacion,
          as: "habitacion",
          include: [{ model: Sector, as: "sector" }]
        },
        { model: Turno, as: "turno" }
      ]
    });

    if (!lista) {
      return res.status(404).json({ message: "Lista de espera no encontrada" });
    }

    res.json({ lista });
  } catch (error) {
    console.error("Error al obtener lista de espera:", error);
    res.status(500).json({
      message: "Error al obtener lista de espera",
      error: error.message
    });
  }
};

// ==================== ASIGNAR TURNO A LISTA DE ESPERA ====================
const asignarTurnoListaEspera = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { lista_espera_id, fecha, hora_inicio, medico_id, sector_id } = req.body;

    if (!lista_espera_id || !fecha || !hora_inicio) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Campos obligatorios: lista_espera_id, fecha, hora_inicio"
      });
    }

    const listaEspera = await ListaEspera.findByPk(lista_espera_id, { transaction });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Lista de espera no encontrada" });
    }

    if (listaEspera.estado !== "PENDIENTE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La lista de espera está en estado ${listaEspera.estado}`
      });
    }

    // Calcular hora_fin
    const [hours, minutes] = hora_inicio.split(":");
    let totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 20;
    const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const newMinutes = String(totalMinutes % 60).padStart(2, "0");
    const hora_fin = `${newHours}:${newMinutes}`;

    // Crear turno
    const turno = await Turno.create({
      fecha,
      hora_inicio,
      hora_fin,
      estado: "PENDIENTE",
      paciente_id: listaEspera.paciente_id,
      medico_id: medico_id || null,
      sector_id: sector_id || null,
      tipo_estudio_id: listaEspera.tipo_estudio_id
    }, { transaction });

    // Actualizar lista de espera
    await listaEspera.update({
      turno_id: turno.id,
      estado: "ASIGNADO"
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Turno asignado correctamente",
      turno,
      listaEspera
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al asignar turno:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar turno",
      error: error.message
    });
  }
};

// ====================  CAMBIAR ESTADO DE TURNO ====================
const cambiarEstadoTurno = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'];
    
    if (!estadosValidos.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    const turno = await Turno.findByPk(id, { transaction });

    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Turno no encontrado' });
    }

    await turno.update({ estado }, { transaction });

    // Si se completa, actualizar lista de espera
    if (estado === 'COMPLETADO') {
      await ListaEspera.update(
        { estado: 'COMPLETADO' },
        { where: { turno_id: turno.id }, transaction }
      );
    }

    // Si se cancela, volver lista a pendiente
    if (estado === 'CANCELADO') {
      await ListaEspera.update(
        { estado: 'PENDIENTE', turno_id: null },
        { where: { turno_id: turno.id }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Turno ${estado}`,
      turno
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del turno',
      error: error.message
    });
  }
};

// ==================== CANCELAR TURNO  ====================
const cancelarTurno = async (req, res) => {
  return cambiarEstadoTurno(req, res);
};

// ==================== COMPLETAR TURNO  ====================
const completarTurno = async (req, res) => {
  return cambiarEstadoTurno(req, res);
};


/**
 * Obtener horarios disponibles de un médico
 */
const getHorariosDisponibles = async (req, res) => {
  try {
    const { medico_id } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    // Obtener horarios disponibles usando la utilidad compartida
    const resultado = await obtenerHorariosDisponibles(medico_id, fecha);

    res.json(resultado);

  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles',
      error: error.message
    });
  }
};

module.exports = {
  getVistaTurnos,
  getDashboardTurnos,
  getDetallesPaciente,
  getMedicos,
  getTurnoById,
  getListaEsperaById,
  asignarTurnoListaEspera,
  cambiarEstadoTurno,
  cancelarTurno,
  completarTurno,
  getHorariosDisponibles
};