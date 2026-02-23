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
  Cama,
  TurnoPersonal,
  TipoDeServicio, 
} = require("../../models");
const { obtenerHorariosDisponibles } = require("../../services/horariosUtils");

// ==================== VISTA PRINCIPAL ====================
const getVistaTurnos = async (req, res, next) => {
  try {
    // Cargar datos necesarios para los selects
    const [medicos, sectores, tiposTurno] = await Promise.all([
      Medico.findAll({
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["nombre", "apellido"],
          },
          {
            model: Especialidad,
            as: "especialidad",
            attributes: ["nombre"],
          },
        ],
        attributes: ["id", "matricula"],
      }),
      Sector.findAll({ 
        attributes: ["id", "nombre"],
        include: [{ 
          model: TipoDeServicio,
          as: 'tipos_de_servicio',
          attributes: ['id', 'nombre', 'descripcion']
        }]
      }),
      TipoTurno.findAll({ attributes: ["id", "nombre", "descripcion"] }),
    ]);

    res.render("dashboard/admin/turno/turnos", {
      title: "Gestión de Turnos y Listas de Espera",
      layout: "dashboard/admin/dashboard-admin",
      medicos,
      sectores,
      tiposTurno,
    });
  } catch (error) {
    console.error("Error al cargar vista de turnos:", error);
    next(error);
  }
};

// ==================== VISTA POR SERVICIO ====================
const getVistaServicio = async (req, res, next) => {
  try {
    const { servicio_id } = req.params;
    
    // Obtener el servicio con su sector
    const servicio = await TipoDeServicio.findByPk(servicio_id, {
      include: [
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
      ]
    });
    
    if (!servicio) {
      return res.status(404).render('error', {
        message: 'Servicio no encontrado',
        error: { status: 404 }
      });
    }
    
    res.render("dashboard/admin/turno/servicio", {
      title: `Gestión: ${servicio.nombre}`,
      layout: "dashboard/admin/dashboard-admin",
      servicio,
      hoy: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Error al cargar vista de servicio:", error);
    next(error);
  }
};

// ==================== DATOS DE SERVICIO (API) ====================
const getDatosServicio = async (req, res, next) => {
  try {
    const { servicio_id } = req.params;
    const { fecha } = req.query;
    
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
    
    const servicio = await TipoDeServicio.findByPk(servicio_id, {
      include: [
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
      ]
    });
    
    if (!servicio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Servicio no encontrado' 
      });
    }
    
    // Obtener lista de espera para este servicio CON TIPO DE SERVICIO Y SECTOR
    const listaEspera = await ListaEspera.findAll({
      where: { 
        tipo_servicio_id: servicio_id,
        estado: 'PENDIENTE'
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'sexo']
          }]
        },
        { model: TipoTurno, as: 'tipo_turno', attributes: ['nombre'] },
        
        {
          model: TipoDeServicio,
          as: 'tipo_servicio',
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [
        db.sequelize.literal(`CASE prioridad 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          WHEN 'BAJA' THEN 3 
          ELSE 4 END`),
        ['fecha_registro', 'ASC']
      ]
    });
    
    // Obtener turnos para este servicio hoy CON TIPO DE SERVICIO Y SECTOR
    const turnosHoy = await Turno.findAll({
      where: { 
        tipo_servicio_id: servicio_id,
        fecha: fechaFiltro,
        estado: ['PENDIENTE', 'CONFIRMADO']
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
          }],
          required: false
        },
        
        {
          model: TipoDeServicio,
          as: 'tipo_servicio',
          include: [{ model: Sector, as: 'sector', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [['hora_inicio', 'ASC']]
    });
    
    // Formatear lista de espera con días de espera
    const listaFormateada = listaEspera.map(lista => {
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
        tipoTurno: lista.tipo_turno?.nombre,
        tipoServicio: lista.tipo_servicio,
        prioridad: lista.prioridad,
        diasEspera,
        fechaRegistro: lista.fecha_registro
      };
    });
    
    // Formatear turnos
    const turnosFormateados = turnosHoy.map(turno => ({
      id: turno.id,
      fecha: turno.fecha,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      estado: turno.estado,
      paciente: {
        id: turno.paciente?.id,
        nombre: turno.paciente?.usuario?.nombre,
        apellido: turno.paciente?.usuario?.apellido,
        dni: turno.paciente?.usuario?.dni
      },
      medico: turno.medico ? {
        id: turno.medico.id,
        nombre: turno.medico.usuario?.nombre,
        apellido: turno.medico.usuario?.apellido
      } : null,
      tipoServicio: turno.tipo_servicio
    }));
    
    res.json({
      success: true,
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        sector: servicio.sector
      },
      listaEspera: listaFormateada,
      turnos: turnosFormateados,
      estadisticas: {
        enEspera: listaEspera.length,
        turnosHoy: turnosHoy.length,
        fecha: fechaFiltro
      }
    });
    
  } catch (error) {
    console.error("❌ Error en getDatosServicio:", error);
    next(error);
  }
};

// ==================== ASIGNAR TURNO DESDE SERVICIO ====================
const asignarTurnoServicio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { lista_espera_id, fecha, hora_inicio, medico_id, tipo_servicio_id } = req.body;

    if (!lista_espera_id || !fecha || !hora_inicio || !tipo_servicio_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Campos obligatorios: lista_espera_id, fecha, hora_inicio, tipo_servicio_id",
      });
    }

    // 1. Obtener lista de espera con el servicio Y SU SECTOR
    const listaEspera = await ListaEspera.findByPk(lista_espera_id, {
      include: [{
        model: TipoDeServicio, 
        as: 'tipo_servicio',
        include: [{ model: Sector, as: 'sector' }]
      }],
      transaction
    });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Lista de espera no encontrada" 
      });
    }

    if (listaEspera.estado !== "PENDIENTE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La lista de espera está en estado ${listaEspera.estado}`,
      });
    }

    // 2. Validar que el servicio solicitado coincida con el de la lista
    if (listaEspera.tipo_servicio_id !== parseInt(tipo_servicio_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El servicio no coincide con la lista de espera",
      });
    }

    // 3. Validar disponibilidad del médico y horario
    const validacion = await validarHorarioDisponible(
      medico_id, 
      fecha, 
      hora_inicio, 
      20, // duración por defecto
      tipo_servicio_id
    );

    if (!validacion.disponible) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: validacion.mensaje,
      });
    }

    // 4. Calcular hora_fin (20 minutos por defecto)
    const hora_fin = calcularHoraFin(hora_inicio, 20);

    // 5. Crear turno vinculado al servicio CON SECTOR_ID
    const turno = await Turno.create(
      {
        fecha,
        hora_inicio,
        hora_fin,
        estado: "PENDIENTE",
        paciente_id: listaEspera.paciente_id,
        medico_id: medico_id || null,
        tipo_servicio_id: tipo_servicio_id,
        sector_id: listaEspera.tipo_servicio?.sector?.id || null,
        tipo_estudio_id: listaEspera.tipo_estudio_id,
      },
      { transaction },
    );

    // 6. Actualizar lista de espera
    await listaEspera.update(
      {
        turno_id: turno.id,
        estado: "ASIGNADO",
      },
      { transaction },
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Turno asignado correctamente",
      turno,
      listaEspera,
      validacion
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al asignar turno:", error);
    next(error);
  }
};

// ==================== CANCELAR TURNO DESDE SERVICIO ====================
const cancelarTurnoServicio = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { turno_id } = req.params;

    const turno = await Turno.findByPk(turno_id, { transaction });

    if (!turno) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Turno no encontrado" 
      });
    }

    // Cambiar estado del turno
    await turno.update({ 
      estado: "CANCELADO" 
    }, { transaction });

    // Buscar y actualizar la lista de espera asociada
    const listaEspera = await ListaEspera.findOne({
      where: { turno_id: turno.id },
      transaction
    });

    if (listaEspera) {
      await listaEspera.update({
        estado: "PENDIENTE",
        turno_id: null
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Turno cancelado y paciente devuelto a lista de espera",
      turno
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al cancelar turno:", error);
    next(error);
  }
};

// ==================== OBTENER SERVICIOS POR SECTOR ====================
const getServiciosPorSector = async (req, res, next) => {
  try {
    const { sector_id } = req.params;
    
    const servicios = await TipoDeServicio.findAll({
      where: { sector_id },
      attributes: ['id', 'nombre', 'descripcion'],
      include: [
        {
          model: ListaEspera,
          as: 'listas_espera',
          where: { estado: 'PENDIENTE' },
          required: false,
          attributes: ['id']
        },
        {
          model: Turno,
          as: 'turnos',
          where: { 
            fecha: new Date().toISOString().split('T')[0],
            estado: ['PENDIENTE', 'CONFIRMADO']
          },
          required: false,
          attributes: ['id']
        },
        { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
      ]
    });
    
    // Formatear con conteos
    const serviciosFormateados = servicios.map(servicio => ({
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      sector: servicio.sector,
      estadisticas: {
        enEspera: servicio.listas_espera?.length || 0,
        turnosHoy: servicio.turnos?.length || 0
      }
    }));
    
    res.json({
      success: true,
      servicios: serviciosFormateados
    });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
   next(error);
  }
};

// ==================== DASHBOARD DE TURNOS Y LISTAS ====================
const getDashboardTurnos = async (req, res, next) => {
  try {
    console.log("🔍 Obteniendo dashboard de turnos...");

    const { fecha, estado_turno, estado_lista, tipo_turno_id, sector_id, tipo_servicio_id } = req.query;

    // FILTROS PARA TURNOS
    const whereTurno = {};
    if (fecha) whereTurno.fecha = fecha;
    if (estado_turno) whereTurno.estado = estado_turno;
    if (sector_id) whereTurno.sector_id = sector_id;
    if (tipo_servicio_id) whereTurno.tipo_servicio_id = tipo_servicio_id;

    // FILTROS PARA LISTAS DE ESPERA
    const whereLista = {};
    if (estado_lista) whereLista.estado = estado_lista;
    if (tipo_turno_id) whereLista.tipo_turno_id = tipo_turno_id;
    if (sector_id) whereLista.sector_id = sector_id;
    if (tipo_servicio_id) whereLista.tipo_servicio_id = tipo_servicio_id;

    // 1: OBTENER TURNOS CON RELACIONES (CON SECTOR EN TIPO DE SERVICIO)
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
              attributes: ["nombre", "apellido", "dni", "sexo"],
            },
          ],
        },
        {
          model: Medico,
          as: "medico",
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
        { model: Sector, as: "sector" },
        { model: TipoEstudio, as: "tipo_estudio" },
        
        {
          model: TipoDeServicio, 
          as: "tipo_servicio",
          include: [{ model: Sector, as: "sector" }]
        },
        { model: ListaEspera, as: "lista_espera" },
      ],
      order: [
        ["fecha", "DESC"],
        ["hora_inicio", "ASC"],
      ],
      limit: 100,
    });

    console.log("✅ Turnos obtenidos:", turnos.length);

    // 2: OBTENER LISTAS DE ESPERA (CON SECTOR EN TIPO DE SERVICIO)
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
              attributes: ["nombre", "apellido", "dni", "sexo"],
            },
          ],
        },
        { model: TipoTurno, as: "tipo_turno" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: Especialidad, as: "especialidad" },
        
        {
          model: TipoDeServicio, 
          as: "tipo_servicio",
          include: [{ model: Sector, as: "sector" }]
        },
        {
          model: Habitacion,
          as: "habitacion",
          include: [{ model: Sector, as: "sector" }],
        },
        { model: Turno, as: "turno" },
      ],
      order: [
        ["prioridad", "DESC"],
        ["fecha_registro", "ASC"],
      ],
      limit: 200,
    });

    console.log(" Listas de espera obtenidas:", listasEspera.length);

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
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          })
        : Promise.resolve([]),
      creadoresIds.enfermeros.length > 0
        ? Enfermero.findAll({
            where: { id: creadoresIds.enfermeros },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          })
        : Promise.resolve([]),
      creadoresIds.medicos.length > 0
        ? Medico.findAll({
            where: { id: creadoresIds.medicos },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          })
        : Promise.resolve([]),
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
        sexo: turno.paciente?.usuario?.sexo,
      },
      medico: {
        id: turno.medico?.id,
        nombre: turno.medico?.usuario?.nombre,
        apellido: turno.medico?.usuario?.apellido,
      },
      sector: turno.sector,
      tipoEstudio: turno.tipo_estudio,
      tipoServicio: turno.tipo_servicio,
      listaEspera: turno.lista_espera,
    }));

    const listasFormateadas = listasEspera.map((lista) => {
      let creador = null;

      if (lista.creador_tipo === "ADMINISTRATIVO") {
        const admin = administrativosMap.get(lista.creador_id);
        if (admin) {
          creador = {
            tipo: "ADMINISTRATIVO",
            nombre: admin.usuario?.nombre,
            apellido: admin.usuario?.apellido,
          };
        }
      } else if (lista.creador_tipo === "ENFERMERO") {
        const enf = enfermerosMap.get(lista.creador_id);
        if (enf) {
          creador = {
            tipo: "ENFERMERO",
            nombre: enf.usuario?.nombre,
            apellido: enf.usuario?.apellido,
          };
        }
      } else if (lista.creador_tipo === "MEDICO") {
        const med = medicosMap.get(lista.creador_id);
        if (med) {
          creador = {
            tipo: "MEDICO",
            nombre: med.usuario?.nombre,
            apellido: med.usuario?.apellido,
          };
        }
      }

      // Calcular días de espera
      let diasEspera = 0;

      if (lista.estado === "PENDIENTE") {
        // Solo contar días si sigue pendiente
        diasEspera = Math.floor(
          (new Date() - new Date(lista.fecha_registro)) / (1000 * 60 * 60 * 24),
        );
      } else if (lista.estado === "ASIGNADO" && lista.turno) {
        // Si está asignado, contar hasta la fecha del turno
        diasEspera = Math.floor(
          (new Date(lista.turno.fecha) - new Date(lista.fecha_registro)) /
            (1000 * 60 * 60 * 24),
        );
      } else if (lista.estado === "COMPLETADO") {
        // Si está completado, no mostrar días (o mostrar 0)
        diasEspera = 0;
      }

      return {
        id: lista.id,
        paciente: {
          id: lista.paciente?.id,
          nombre: lista.paciente?.usuario?.nombre,
          apellido: lista.paciente?.usuario?.apellido,
          dni: lista.paciente?.usuario?.dni,
          sexo: lista.paciente?.usuario?.sexo,
        },
        tipoTurno: lista.tipo_turno,
        tipoEstudio: lista.tipo_estudio,
        tipoServicio: lista.tipo_servicio,
        especialidad: lista.especialidad,
        prioridad: lista.prioridad,
        estado: lista.estado,
        diasEspera,
        habitacion: lista.habitacion,
        creador,
        fechaRegistro: lista.fecha_registro,
        turnoAsignado: lista.turno,
      };
    });

    // 5: ESTADÍSTICAS
    const estadisticas = {
      turnos: {
        total: turnos.length,
        pendientes: turnos.filter((t) => t.estado === "PENDIENTE").length,
        confirmados: turnos.filter((t) => t.estado === "CONFIRMADO").length,
        completados: turnos.filter((t) => t.estado === "COMPLETADO").length,
        cancelados: turnos.filter((t) => t.estado === "CANCELADO").length,
      },
      listasEspera: {
        total: listasEspera.length,
        pendientes: listasEspera.filter((l) => l.estado === "PENDIENTE").length,
        asignados: listasEspera.filter((l) => l.estado === "ASIGNADO").length,
        completados: listasEspera.filter((l) => l.estado === "COMPLETADO")
          .length,
        cancelados: listasEspera.filter((l) => l.estado === "CANCELADO").length,
        porPrioridad: {
          alta: listasEspera.filter(
            (l) => l.prioridad === "ALTA" && l.estado === "PENDIENTE",
          ).length,
          media: listasEspera.filter(
            (l) => l.prioridad === "MEDIA" && l.estado === "PENDIENTE",
          ).length,
          baja: listasEspera.filter(
            (l) => l.prioridad === "BAJA" && l.estado === "PENDIENTE",
          ).length,
        },
      },
    };

    res.json({
      turnos: turnosFormateados,
      listasEspera: listasFormateadas,
      estadisticas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ ERROR en getDashboardTurnos:", error);
    next(error);
  }
};

// ==================== ✅ NUEVA: VER DETALLES DE PACIENTE ====================
const getDetallesPaciente = async (req, res, next) => {
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
      historial,
    ] = await Promise.all([
      // Datos personales
      Paciente.findByPk(paciente_id, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: [
              "nombre",
              "apellido",
              "dni",
              "email",
              "telefono",
              "fecha_nacimiento",
              "sexo",
            ],
          },
          {
            model: ObraSocial,
            as: "obraSocial",
            attributes: ["nombre"],
          },
        ],
      }),

      // Admisiones
      Admision.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: "medico",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          },
          { model: Sector, as: "sector", attributes: ["nombre"] },
          { model: TipoEstudio, as: "tipo_estudio", attributes: ["nombre"] },
          { model: Especialidad, as: "especialidad", attributes: ["nombre"] },
        ],
        order: [["fecha", "DESC"]],
        limit: 10,
      }),

      // Turnos CON TIPO DE SERVICIO
      Turno.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: "medico",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          },
          { model: Sector, as: "sector", attributes: ["nombre"] },
          { model: TipoEstudio, as: "tipo_estudio", attributes: ["nombre"] },
          { 
            model: TipoDeServicio, 
            as: "tipo_servicio",
            attributes: ["id", "nombre"]
          }
        ],
        order: [["fecha", "DESC"]],
        limit: 10,
      }),

      // Listas de espera CON TIPO DE SERVICIO
      ListaEspera.findAll({
        where: { paciente_id },
        include: [
          { model: TipoTurno, as: "tipo_turno", attributes: ["nombre"] },
          { model: Especialidad, as: "especialidad", attributes: ["nombre"] },
          { 
            model: TipoDeServicio, 
            as: "tipo_servicio",
            attributes: ["id", "nombre"]
          }
        ],
        order: [["fecha_registro", "DESC"]],
        limit: 10,
      }),

      // Internaciones
      Internacion.findAll({
        where: { paciente_id },
        include: [
          {
            model: Medico,
            as: "medico",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["nombre", "apellido"],
              },
            ],
          },
          {
            model: Habitacion,
            as: "habitacion",
            attributes: ["numero"],
            include: [{ model: Sector, as: "sector", attributes: ["nombre"] }],
          },
          {
            model: Cama,
            as: "cama",
            attributes: ["numero"],
          },
        ],
        order: [["fecha_inicio", "DESC"]],
        limit: 5,
      }),

      // Historial médico
      HistorialMedico.findAll({
        where: { paciente_id },
        order: [["fecha", "DESC"]],
        limit: 10,
      }),
    ]);

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    // Calcular estadísticas
    const estadisticas = {
      totalAdmisiones: admisiones.length,
      totalTurnos: turnos.length,
      turnosPendientes: turnos.filter((t) => t.estado === "PENDIENTE").length,
      listaEsperaPendiente: listasEspera.filter((l) => l.estado === "PENDIENTE")
        .length,
      internacionActiva: internaciones.some((i) => !i.fecha_alta),
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
        obraSocial: paciente.obraSocial?.nombre || "Sin obra social",
        fechaIngreso: paciente.fecha_ingreso,
        estado: paciente.estado,
      },
      admisiones,
      turnos,
      listasEspera,
      internaciones,
      historial,
      estadisticas,
    });
  } catch (error) {
    console.error("Error al obtener detalles del paciente:", error);
    next(error);
  }
};

// ====================  NUEVA: CARGAR MÉDICOS ====================
const getMedicos = async (req, res, next) => {
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
          as: "usuario",
          attributes: ["nombre", "apellido"],
        },
        {
          model: Especialidad,
          as: "especialidad",
          attributes: ["nombre"],
        },
        {
          model: Sector,
          as: "sector",
          attributes: ["nombre"],
        },
      ],
      attributes: ["id", "matricula"],
    });

    res.json({ medicos });
  } catch (error) {
    console.error("Error al cargar médicos:", error);
    next(error);
  }
};

// ==================== OBTENER TURNO POR ID ====================
const getTurnoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [{ model: Usuario, as: "usuario" }],
        },
        {
          model: Medico,
          as: "medico",
          include: [{ model: Usuario, as: "usuario" }],
        },
        { model: Sector, as: "sector" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { 
          model: TipoDeServicio, 
          as: "tipo_servicio",
          include: [{ model: Sector, as: "sector" }]
        },
        { model: ListaEspera, as: "lista_espera" },
      ],
    });

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    res.json({ turno });
  } catch (error) {
    console.error("Error al obtener turno:", error);
    next(error);
  }
};

// ==================== OBTENER LISTA DE ESPERA POR ID ====================
const getListaEsperaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lista = await ListaEspera.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: "paciente",
          include: [{ model: Usuario, as: "usuario" }],
        },
        { model: TipoTurno, as: "tipo_turno" },
        { model: TipoEstudio, as: "tipo_estudio" },
        { model: Especialidad, as: "especialidad" },
        { 
          model: TipoDeServicio, 
          as: "tipo_servicio",
          include: [{ model: Sector, as: "sector" }]
        },
        {
          model: Habitacion,
          as: "habitacion",
          include: [{ model: Sector, as: "sector" }],
        },
        { model: Turno, as: "turno" },
      ],
    });

    if (!lista) {
      return res.status(404).json({ message: "Lista de espera no encontrada" });
    }

    res.json({ lista });
  } catch (error) {
    console.error("Error al obtener lista de espera:", error);
    next(error);
  }
};

// ==================== ASIGNAR TURNO A LISTA DE ESPERA ====================
const asignarTurnoListaEspera = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { lista_espera_id, fecha, hora_inicio, medico_id, sector_id, tipo_servicio_id } =
      req.body;

    if (!lista_espera_id || !fecha || !hora_inicio || !tipo_servicio_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Campos obligatorios: lista_espera_id, fecha, hora_inicio, tipo_servicio_id",
      });
    }

    //  OBTENER LISTA CON TIPO DE SERVICIO Y SECTOR
    const listaEspera = await ListaEspera.findByPk(lista_espera_id, {
      include: [{
        model: TipoDeServicio, 
        as: 'tipo_servicio',
        include: [{ model: Sector, as: 'sector' }]
      }],
      transaction,
    });

    if (!listaEspera) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Lista de espera no encontrada" });
    }

    if (listaEspera.estado !== "PENDIENTE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La lista de espera está en estado ${listaEspera.estado}`,
      });
    }

    //  VALIDAR QUE EL SERVICIO COINCIDA
    if (listaEspera.tipo_servicio_id !== parseInt(tipo_servicio_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "El servicio no coincide con la lista de espera",
      });
    }

    // Calcular hora_fin
    const [hours, minutes] = hora_inicio.split(":");
    let totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 20;
    const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const newMinutes = String(totalMinutes % 60).padStart(2, "0");
    const hora_fin = `${newHours}:${newMinutes}`;

    //  CREAR TURNO CON TIPO_SERVICIO_ID Y SECTOR_ID
    const turno = await Turno.create(
      {
        fecha,
        hora_inicio,
        hora_fin,
        estado: "PENDIENTE",
        paciente_id: listaEspera.paciente_id,
        medico_id: medico_id || null,
        tipo_servicio_id: tipo_servicio_id,
        sector_id: listaEspera.tipo_servicio?.sector?.id || sector_id || null,
        tipo_estudio_id: listaEspera.tipo_estudio_id,
      },
      { transaction },
    );

    // Actualizar lista de espera
    await listaEspera.update(
      {
        turno_id: turno.id,
        estado: "ASIGNADO",
      },
      { transaction },
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Turno asignado correctamente",
      turno,
      listaEspera,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al asignar turno:", error);
   next(error);
  }
};

// ====================  CAMBIAR ESTADO DE TURNO ====================
const cambiarEstadoTurno = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = [
      "PENDIENTE",
      "CONFIRMADO",
      "COMPLETADO",
      "CANCELADO",
    ];

    if (!estadosValidos.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}`,
      });
    }

    const turno = await Turno.findByPk(id, { transaction });

    if (!turno) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Turno no encontrado" });
    }

    await turno.update({ estado }, { transaction });

    // Si se completa, actualizar lista de espera
    if (estado === "COMPLETADO") {
      await ListaEspera.update(
        { estado: "COMPLETADO" },
        { where: { turno_id: turno.id }, transaction },
      );
    }

    // Si se cancela, volver lista a pendiente
    if (estado === "CANCELADO") {
      await ListaEspera.update(
        { estado: "PENDIENTE", turno_id: null },
        { where: { turno_id: turno.id }, transaction },
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Turno ${estado}`,
      turno,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al cambiar estado:", error);
    next(error);
  }
};

// ==================== CANCELAR TURNO  ====================
const cancelarTurno = async (req, res, next) => {
  return cambiarEstadoTurno(req, res, next);
};

// ==================== COMPLETAR TURNO  ====================
const completarTurno = async (req, res, next) => {
  return cambiarEstadoTurno(req, res, next);
};

/**
 * Obtener horarios disponibles de un médico
 */
const getHorariosDisponibles = async (req, res, next) => {
  try {
    const { medico_id } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: "La fecha es requerida",
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    // Obtener horarios disponibles usando la utilidad compartida
    const resultado = await obtenerHorariosDisponibles(medico_id, fecha);

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener horarios:", error);
   next(error);
  }
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Validar horario disponible para un médico
 */
// ==================== FUNCIÓN CORREGIDA ====================
async function validarHorarioDisponible(medico_id, fecha, hora_inicio, duracion_minutos = 20, tipo_servicio_id) {
  try {
    // Si no hay médico, se asume que el horario está disponible
    if (!medico_id) {
      return { disponible: true, mensaje: "Horario disponible" };
    }

    // 1. PRIMERO: Consultar TurnoPersonal para ver si el médico trabaja en ese horario
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    // Obtener médico con usuario_id
    const medico = await Medico.findByPk(medico_id, {
      include: [{ model: Usuario, as: 'usuario' }]
    });

    if (!medico || !medico.usuario) {
      return { disponible: false, mensaje: "Médico no encontrado" };
    }

    // Consultar TurnoPersonal del médico
    const turnosPersonal = await TurnoPersonal.findAll({
      where: {
        usuario_id: medico.usuario.id,
        tipo: { [Op.in]: ['Atencion', 'Guardia Activa', 'Guardia Pasiva'] }
      }
    });

    if (!turnosPersonal || turnosPersonal.length === 0) {
      return { disponible: false, mensaje: "Médico sin horarios configurados" };
    }

    // Filtrar turnos para ese día
    const turnoDelDia = turnosPersonal.find(turno => {
      try {
        // Manejar string de días separados por comas
        const diasArray = turno.dias.split(',').map(d => d.trim());
        return diasArray.includes(diaSemana);
      } catch (error) {
        console.error('Error al procesar días:', error);
        return false;
      }
    });

    if (!turnoDelDia) {
      return { disponible: false, mensaje: `Médico no trabaja los ${diaSemana}` };
    }

    // Verificar que la hora esté dentro del horario del médico
    const horaInicioTurno = new Date(`${fecha}T${turnoDelDia.hora_inicio}`);
    const horaFinTurno = new Date(`${fecha}T${turnoDelDia.hora_fin}`);
    const horaSolicitada = new Date(`${fecha}T${hora_inicio}`);
    const horaFinSolicitada = new Date(horaSolicitada.getTime() + duracion_minutos * 60000);

    if (horaSolicitada < horaInicioTurno || horaFinSolicitada > horaFinTurno) {
      return { 
        disponible: false, 
        mensaje: `Horario fuera del turno del médico (${turnoDelDia.hora_inicio} - ${turnoDelDia.hora_fin})` 
      };
    }

    // 2. SEGUNDO: Validar que no haya solapamiento con otros turnos
    const turnosSolapados = await Turno.findAll({
      where: {
        medico_id,
        fecha,
        estado: { [Op.notIn]: ['CANCELADO', 'COMPLETADO'] },
        [Op.or]: [
          // Turno empieza dentro del nuevo turno
          {
            hora_inicio: { [Op.between]: [hora_inicio, horaFinSolicitada.toTimeString().slice(0, 8)] }
          },
          // Turno termina dentro del nuevo turno
          {
            hora_fin: { [Op.between]: [hora_inicio, horaFinSolicitada.toTimeString().slice(0, 8)] }
          },
          // Turno cubre completamente el nuevo turno
          {
            [Op.and]: [
              { hora_inicio: { [Op.lte]: hora_inicio } },
              { hora_fin: { [Op.gte]: horaFinSolicitada.toTimeString().slice(0, 8) } }
            ]
          }
        ]
      }
    });

    if (turnosSolapados.length > 0) {
      return { 
        disponible: false, 
        mensaje: `El médico ya tiene ${turnosSolapados.length} turno(s) en este horario` 
      };
    }

    // 3. TERCERO: Si hay tipo_servicio, validar sector
    if (tipo_servicio_id) {
      // Verificar que el servicio esté en el mismo sector que el médico
      const servicio = await TipoDeServicio.findByPk(tipo_servicio_id, {
        include: [{ model: Sector, as: 'sector' }]
      });

      const medicoCompleto = await Medico.findByPk(medico_id, {
        include: [{ model: Sector, as: 'sector' }]
      });

      if (servicio && medicoCompleto && servicio.sector_id !== medicoCompleto.sector_id) {
        return {
          disponible: false,
          mensaje: `Servicio no disponible en el sector del médico (Servicio: ${servicio.sector?.nombre}, Médico: ${medicoCompleto.sector?.nombre})`
        };
      }
    }

    return { disponible: true, mensaje: "Horario disponible" };

  } catch (error) {
    console.error("Error al validar horario:", error);
    return { disponible: false, mensaje: "Error al validar horario" };
  }
}

/**
 * Calcular hora fin a partir de hora inicio y duración
 */
function calcularHoraFin(hora_inicio, duracion_minutos = 20) {
  const [hours, minutes] = hora_inicio.split(":");
  let totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + duracion_minutos;
  const newHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const newMinutes = String(totalMinutes % 60).padStart(2, "0");
  return `${newHours}:${newMinutes}`;
}
// turnoController.js - Añade esta función
const debugServicio = async (req, res, next) => {
  try {
    const { servicio_id } = req.params;
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    
    console.log('🔍 DEBUG - servicio_id:', servicio_id);
    console.log('🔍 DEBUG - fecha:', fecha);
    
    // Verificar si el servicio existe
    const servicio = await TipoDeServicio.findByPk(servicio_id);
    console.log('🔍 DEBUG - Servicio encontrado:', servicio ? 'SI' : 'NO');
    
    // Verificar turnos
    const turnosCount = await Turno.count({
      where: { 
        tipo_servicio_id: servicio_id,
        fecha: fecha
      }
    });
    console.log('🔍 DEBUG - Turnos count:', turnosCount);
    
    // Verificar listas de espera
    const listasCount = await ListaEspera.count({
      where: { 
        tipo_servicio_id: servicio_id,
        estado: 'PENDIENTE'
      }
    });
    console.log('🔍 DEBUG - Listas count:', listasCount);
    
    // Consultar algunos turnos de ejemplo
    const turnosEjemplo = await Turno.findAll({
      where: { 
        tipo_servicio_id: servicio_id,
        fecha: fecha
      },
      limit: 5,
      raw: true
    });
    
    console.log('🔍 DEBUG - Turnos ejemplo:', turnosEjemplo);
    
    res.json({
      servicio_id,
      fecha,
      servicio_existe: !!servicio,
      turnos_count: turnosCount,
      listas_count: listasCount,
      turnos_ejemplo: turnosEjemplo,
      servicio_nombre: servicio?.nombre
    });
  } catch (error) {
    console.error('❌ DEBUG error:', error);
    next(error);
  }
};
// ==================== ✅ NUEVA: OBTENER MÉDICOS POR SERVICIO ====================
const getMedicosPorServicio = async (req, res, next) => {
  try {
    const { servicio_id } = req.params;

    // Obtener el servicio con su sector
    const servicio = await TipoDeServicio.findByPk(servicio_id, {
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Buscar médicos del mismo sector
    const medicos = await Medico.findAll({
      where: { sector_id: servicio.sector_id },
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
        }
      ],
      attributes: ['id', 'matricula']
    });

    const medicosFormateados = medicos.map(medico => ({
      id: medico.id,
      nombre: medico.usuario?.nombre || '',
      apellido: medico.usuario?.apellido || '',
      especialidad: medico.especialidad?.nombre || '',
      matricula: medico.matricula
    }));

    res.json({
      success: true,
      medicos: medicosFormateados,
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        sector: servicio.sector
      }
    });

  } catch (error) {
    console.error('Error al obtener médicos por servicio:', error);
    next(error);
  }
};

// ====================  VALIDAR HORARIO DISPONIBLE (API) ====================
const validarHorarioDisponibleAPI = async (req, res, next) => {
  try {
    const { medico_id, fecha, hora, tipo_servicio_id, duracion = 30 } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Fecha y hora son requeridas'
      });
    }

    // Usar la función de horariosUtils
    const validacion = await validarHorarioDisponible(
      medico_id,
      fecha,
      hora,
      duracion,
      tipo_servicio_id
    );

    res.json(validacion);

  } catch (error) {
    console.error('Error al validar horario:', error);
    next(error);
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
  getHorariosDisponibles,
  getVistaServicio,
  getDatosServicio,
  asignarTurnoServicio,
  cancelarTurnoServicio,
  debugServicio,
  getMedicosPorServicio,
  validarHorarioDisponibleAPI,
  getServiciosPorSector
};