const { ListaEspera, 
    Paciente, 
    Usuario, 
    TipoTurno, 
    TipoEstudio, 
    Especialidad, 
    Habitacion, 
    Sector, 
    Administrativo, 
    Enfermero, 
    Medico } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar lista de espera (SOLO CONSULTA)
exports.listarListaEspera = async (req, res) => {
  try {
    const { tipo_turno, prioridad, estado, sector } = req.query;
    
    const whereCondition = {};
    
    if (tipo_turno) {
      whereCondition.tipo_turno_id = tipo_turno;
    }
    
    if (prioridad) {
      whereCondition.prioridad = prioridad;
    }
    
    if (estado) {
      whereCondition.estado = estado;
    } else {
      // Por defecto, solo mostrar pendientes y asignados
      whereCondition.estado = {
        [Op.in]: ['PENDIENTE', 'ASIGNADO']
      };
    }

    const includeHabitacion = sector ? {
      model: Habitacion,
      as: 'habitacion',
      required: false,
      include: [{
        model: Sector,
        as: 'sector',
        where: { id: sector }
      }]
    } : {
      model: Habitacion,
      as: 'habitacion',
      required: false,
      include: [{
        model: Sector,
        as: 'sector'
      }]
    };

    const listaEspera = await ListaEspera.findAll({
      where: whereCondition,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'telefono', 'fecha_nacimiento']
          }]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        },
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          required: false
        },
        {
          model: Especialidad,
          as: 'especialidad',
          required: false
        },
        includeHabitacion,
        {
          model: Administrativo,
          as: 'administrativo_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Medico,
          as: 'medico_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [
        ['prioridad', 'ASC'], // ALTA primero
        ['fecha_registro', 'ASC'] // Más antiguos primero
      ],
      subQuery: false
    });

    // Obtener datos para filtros
    const [tiposTurno, sectores] = await Promise.all([
      TipoTurno.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      }),
      Sector.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      })
    ]);

    // Estadísticas
    const estadisticas = {
      total: listaEspera.length,
      pendientes: listaEspera.filter(l => l.estado === 'PENDIENTE').length,
      asignados: listaEspera.filter(l => l.estado === 'ASIGNADO').length,
      alta_prioridad: listaEspera.filter(l => l.prioridad === 'ALTA').length,
      urgentes: listaEspera.filter(l => l.prioridad === 'ALTA' && l.estado === 'PENDIENTE').length
    };

    res.render('dashboard/enfermero/lista-espera', {
      title: 'Lista de Espera',
      user: req.user,
      listaEspera,
      tiposTurno,
      sectores,
      estadisticas,
      filtros: { tipo_turno, prioridad, estado, sector }
    });

  } catch (error) {
    console.error('Error al listar lista de espera:', error);
    res.status(500).render('error', {
      message: 'Error al cargar lista de espera',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de registro en lista de espera
exports.verDetalle = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await ListaEspera.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'telefono', 'fecha_nacimiento', 'email', 'sexo']
          }]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        },
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          required: false
        },
        {
          model: Especialidad,
          as: 'especialidad',
          required: false
        },
        {
          model: Habitacion,
          as: 'habitacion',
          required: false,
          include: [{
            model: Sector,
            as: 'sector'
          }]
        },
        {
          model: Administrativo,
          as: 'administrativo_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Enfermero,
          as: 'enfermero_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        },
        {
          model: Medico,
          as: 'medico_creador',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    if (!registro) {
      return res.status(404).render('error', {
        message: 'Registro no encontrado'
      });
    }

    // Calcular tiempo de espera
    const tiempoEsperaMins = Math.floor((new Date() - new Date(registro.fecha_registro)) / (1000 * 60));
    const tiempoEsperaHoras = Math.floor(tiempoEsperaMins / 60);
    const tiempoEsperaMinutosRestantes = tiempoEsperaMins % 60;

    res.render('dashboard/enfermero/lista-espera-detalle', {
      title: 'Detalle Lista de Espera',
      user: req.user,
      registro,
      tiempoEsperaHoras,
      tiempoEsperaMinutosRestantes
    });

  } catch (error) {
    console.error('Error al ver detalle:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el detalle',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtener siguiente paciente a llamar
exports.siguientePaciente = async (req, res) => {
  try {
    const { tipo_turno_id, sector_id } = req.query;

    const whereCondition = {
      estado: 'PENDIENTE'
    };

    if (tipo_turno_id) {
      whereCondition.tipo_turno_id = tipo_turno_id;
    }

    const includeHabitacion = sector_id ? {
      model: Habitacion,
      as: 'habitacion',
      required: true,
      include: [{
        model: Sector,
        as: 'sector',
        where: { id: sector_id }
      }]
    } : {
      model: Habitacion,
      as: 'habitacion',
      required: false
    };

    const siguiente = await ListaEspera.findOne({
      where: whereCondition,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'telefono']
          }]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        },
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          required: false
        },
        {
          model: Especialidad,
          as: 'especialidad',
          required: false
        },
        includeHabitacion
      ],
      order: [
        ['prioridad', 'ASC'],
        ['fecha_registro', 'ASC']
      ]
    });

    if (!siguiente) {
      return res.json({
        success: false,
        message: 'No hay pacientes en espera'
      });
    }

    // Calcular tiempo de espera
    const tiempoEsperaMins = Math.floor((new Date() - new Date(siguiente.fecha_registro)) / (1000 * 60));

    res.json({
      success: true,
      paciente: {
        id: siguiente.paciente.id,
        nombre: `${siguiente.paciente.usuario.nombre} ${siguiente.paciente.usuario.apellido}`,
        dni: siguiente.paciente.usuario.dni,
        telefono: siguiente.paciente.usuario.telefono
      },
      registro: {
        id: siguiente.id,
        tipo_turno: siguiente.tipo_turno.nombre,
        tipo_estudio: siguiente.tipo_estudio ? siguiente.tipo_estudio.nombre : null,
        especialidad: siguiente.especialidad ? siguiente.especialidad.nombre : null,
        prioridad: siguiente.prioridad,
        tiempo_espera_minutos: tiempoEsperaMins
      }
    });

  } catch (error) {
    console.error('Error al obtener siguiente paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener siguiente paciente'
    });
  }
};

// Buscar paciente en lista de espera
exports.buscarPaciente = async (req, res) => {
  try {
    const { busqueda } = req.query;

    if (!busqueda || busqueda.length < 2) {
      return res.json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const registros = await ListaEspera.findAll({
      where: {
        estado: {
          [Op.in]: ['PENDIENTE', 'ASIGNADO']
        }
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'telefono'],
            where: {
              [Op.or]: [
                { nombre: { [Op.like]: `%${busqueda}%` } },
                { apellido: { [Op.like]: `%${busqueda}%` } },
                { dni: { [Op.like]: `%${busqueda}%` } }
              ]
            }
          }]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        }
      ],
      order: [
        ['prioridad', 'ASC'],
        ['fecha_registro', 'ASC']
      ],
      limit: 10
    });

    res.json({
      success: true,
      resultados: registros.map(r => ({
        id: r.id,
        paciente: {
          id: r.paciente.id,
          nombre: `${r.paciente.usuario.nombre} ${r.paciente.usuario.apellido}`,
          dni: r.paciente.usuario.dni,
          telefono: r.paciente.usuario.telefono
        },
        tipo_turno: r.tipo_turno.nombre,
        prioridad: r.prioridad,
        estado: r.estado,
        fecha_registro: r.fecha_registro
      }))
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
};

// Obtener estadísticas por tipo de turno
exports.estadisticasPorTipo = async (req, res) => {
  try {
    const tiposTurno = await TipoTurno.findAll({
      attributes: ['id', 'nombre']
    });

    const estadisticas = [];

    for (const tipo of tiposTurno) {
      const [total, pendientes, altaPrioridad] = await Promise.all([
        ListaEspera.count({
          where: {
            tipo_turno_id: tipo.id,
            estado: {
              [Op.in]: ['PENDIENTE', 'ASIGNADO']
            }
          }
        }),
        ListaEspera.count({
          where: {
            tipo_turno_id: tipo.id,
            estado: 'PENDIENTE'
          }
        }),
        ListaEspera.count({
          where: {
            tipo_turno_id: tipo.id,
            estado: 'PENDIENTE',
            prioridad: 'ALTA'
          }
        })
      ]);

      estadisticas.push({
        tipo_turno: tipo.nombre,
        total,
        pendientes,
        alta_prioridad: altaPrioridad
      });
    }

    res.json({
      success: true,
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Pacientes con mayor tiempo de espera
exports.mayorTiempoEspera = async (req, res) => {
  try {
    const registros = await ListaEspera.findAll({
      where: {
        estado: 'PENDIENTE'
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
          model: TipoTurno,
          as: 'tipo_turno'
        }
      ],
      order: [['fecha_registro', 'ASC']],
      limit: 10
    });

    res.json({
      success: true,
      registros: registros.map(r => {
        const tiempoEsperaMins = Math.floor((new Date() - new Date(r.fecha_registro)) / (1000 * 60));
        const horas = Math.floor(tiempoEsperaMins / 60);
        const minutos = tiempoEsperaMins % 60;

        return {
          id: r.id,
          paciente: `${r.paciente.usuario.nombre} ${r.paciente.usuario.apellido}`,
          dni: r.paciente.usuario.dni,
          tipo_turno: r.tipo_turno.nombre,
          prioridad: r.prioridad,
          tiempo_espera: `${horas}h ${minutos}m`,
          tiempo_espera_minutos: tiempoEsperaMins
        };
      })
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros'
    });
  }
};

module.exports = exports;