const { Paciente, 
    Usuario, 
    ObraSocial, 
    Internacion, 
    Cama, 
    Habitacion, 
    Sector, 
    EvaluacionEnfermeria, 
    Enfermero, 
    Admision, 
    Turno, 
    ListaEspera, 
    TipoTurno } = require('../../models');
const { Op } = require('sequelize');

// Vista principal de búsqueda
exports.vistaBusqueda = async (req, res) => {
  try {
    res.render('dashboard/enfermero/buscar-paciente', {
      title: 'Buscar Paciente',
      user: req.user
    });
  } catch (error) {
    console.error('Error al cargar vista de búsqueda:', error);
    res.status(500).render('error', {
      message: 'Error al cargar búsqueda',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Búsqueda general de pacientes
exports.buscarPacientes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const busqueda = q.trim();

    // Buscar pacientes
    const pacientes = await Paciente.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email'],
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${busqueda}%` } },
            { apellido: { [Op.like]: `%${busqueda}%` } },
            { dni: { [Op.like]: `%${busqueda}%` } }
          ]
        }
      }],
      limit: 20
    });

    // Para cada paciente, obtener información adicional
    const resultados = await Promise.all(pacientes.map(async (paciente) => {
      // Verificar si está internado
      const internacion = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          fecha_alta: null
        },
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

      // Última evaluación de enfermería
      const ultimaEvaluacion = await EvaluacionEnfermeria.findOne({
        where: { paciente_id: paciente.id },
        order: [['fecha', 'DESC']],
        include: [{
          model: Enfermero,
          as: 'enfermero',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }]
      });

      // Verificar si está en lista de espera
      const enListaEspera = await ListaEspera.findOne({
        where: {
          paciente_id: paciente.id,
          estado: {
            [Op.in]: ['PENDIENTE', 'ASIGNADO']
          }
        },
        include: [{
          model: TipoTurno,
          as: 'tipo_turno'
        }]
      });

      return {
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        edad: Math.floor((new Date() - new Date(paciente.usuario.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365)),
        sexo: paciente.usuario.sexo,
        telefono: paciente.usuario.telefono,
        email: paciente.usuario.email,
        estado: paciente.estado,
        internado: internacion ? {
          habitacion: internacion.cama.habitacion.numero,
          cama: internacion.cama.numero,
          sector: internacion.cama.habitacion.sector.nombre,
          estado_paciente: internacion.estado_paciente,
          internacion_id: internacion.id
        } : null,
        ultima_evaluacion: ultimaEvaluacion ? {
          fecha: ultimaEvaluacion.fecha,
          enfermero: `${ultimaEvaluacion.enfermero.usuario.nombre} ${ultimaEvaluacion.enfermero.usuario.apellido}`,
          tipo_egreso: ultimaEvaluacion.tipo_egreso
        } : null,
        en_lista_espera: enListaEspera ? {
          tipo_turno: enListaEspera.tipo_turno.nombre,
          prioridad: enListaEspera.prioridad,
          estado: enListaEspera.estado
        } : null
      };
    }));

    res.json({
      success: true,
      total: resultados.length,
      pacientes: resultados
    });

  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
};

// Obtener ficha rápida de paciente
exports.fichaRapida = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono', 'email']
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          required: false
        }
      ]
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Internación actual
    const internacion = await Internacion.findOne({
      where: {
        paciente_id: id,
        fecha_alta: null
      },
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

    // Últimas 3 evaluaciones de enfermería
    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: { paciente_id: id },
      order: [['fecha', 'DESC']],
      limit: 3,
      include: [{
        model: Enfermero,
        as: 'enfermero',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }]
    });

    // Admisiones recientes
    const admisiones = await Admision.findAll({
      where: { paciente_id: id },
      order: [['fecha', 'DESC']],
      limit: 3
    });

    // Lista de espera actual
    const listaEspera = await ListaEspera.findAll({
      where: {
        paciente_id: id,
        estado: {
          [Op.in]: ['PENDIENTE', 'ASIGNADO']
        }
      },
      include: [{
        model: TipoTurno,
        as: 'tipo_turno'
      }]
    });

    // Turnos próximos
    const turnosProximos = await Turno.findAll({
      where: {
        paciente_id: id,
        fecha: {
          [Op.gte]: new Date()
        },
        estado: {
          [Op.in]: ['PENDIENTE', 'CONFIRMADO']
        }
      },
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
      limit: 3
    });

    res.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
        dni: paciente.usuario.dni,
        edad: Math.floor((new Date() - new Date(paciente.usuario.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365)),
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        sexo: paciente.usuario.sexo,
        telefono: paciente.usuario.telefono,
        email: paciente.usuario.email,
        estado: paciente.estado,
        obra_social: paciente.obraSocial ? paciente.obraSocial.nombre : 'Sin obra social'
      },
      internacion: internacion ? {
        id: internacion.id,
        habitacion: internacion.cama.habitacion.numero,
        cama: internacion.cama.numero,
        sector: internacion.cama.habitacion.sector.nombre,
        estado_paciente: internacion.estado_paciente,
        fecha_inicio: internacion.fecha_inicio
      } : null,
      evaluaciones: evaluaciones.map(e => ({
        id: e.id,
        fecha: e.fecha,
        enfermero: `${e.enfermero.usuario.nombre} ${e.enfermero.usuario.apellido}`,
        signos_vitales: e.signos_vitales,
        tipo_egreso: e.tipo_egreso
      })),
      admisiones_recientes: admisiones.length,
      en_lista_espera: listaEspera.map(l => ({
        id: l.id,
        tipo_turno: l.tipo_turno.nombre,
        prioridad: l.prioridad,
        estado: l.estado
      })),
      turnos_proximos: turnosProximos.length
    });

  } catch (error) {
    console.error('Error al obtener ficha rápida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ficha del paciente',
      error: error.message
    });
  }
};

// Búsqueda avanzada con filtros
exports.busquedaAvanzada = async (req, res) => {
  try {
    const { nombre, apellido, dni, edad_min, edad_max, sexo, estado, internado } = req.query;

    const whereConditionPaciente = {};
    const whereConditionUsuario = {};

    if (nombre) {
      whereConditionUsuario.nombre = { [Op.like]: `%${nombre}%` };
    }

    if (apellido) {
      whereConditionUsuario.apellido = { [Op.like]: `%${apellido}%` };
    }

    if (dni) {
      whereConditionUsuario.dni = { [Op.like]: `%${dni}%` };
    }

    if (sexo) {
      whereConditionUsuario.sexo = sexo;
    }

    if (estado) {
      whereConditionPaciente.estado = estado;
    }

    // Filtro por edad
    if (edad_min || edad_max) {
      const fechaMax = edad_min ? new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(edad_min))) : null;
      const fechaMin = edad_max ? new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(edad_max))) : null;

      if (fechaMin && fechaMax) {
        whereConditionUsuario.fecha_nacimiento = {
          [Op.between]: [fechaMin, fechaMax]
        };
      } else if (fechaMax) {
        whereConditionUsuario.fecha_nacimiento = {
          [Op.lte]: fechaMax
        };
      } else if (fechaMin) {
        whereConditionUsuario.fecha_nacimiento = {
          [Op.gte]: fechaMin
        };
      }
    }

    const pacientes = await Paciente.findAll({
      where: whereConditionPaciente,
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono'],
        where: whereConditionUsuario
      }],
      limit: 50
    });

    // Si se filtra por internado
    let resultados = pacientes;
    if (internado === 'true') {
      const pacientesInternados = await Internacion.findAll({
        where: { fecha_alta: null },
        attributes: ['paciente_id']
      });
      const idsInternados = pacientesInternados.map(i => i.paciente_id);
      resultados = pacientes.filter(p => idsInternados.includes(p.id));
    } else if (internado === 'false') {
      const pacientesInternados = await Internacion.findAll({
        where: { fecha_alta: null },
        attributes: ['paciente_id']
      });
      const idsInternados = pacientesInternados.map(i => i.paciente_id);
      resultados = pacientes.filter(p => !idsInternados.includes(p.id));
    }

    res.json({
      success: true,
      total: resultados.length,
      pacientes: resultados.map(p => ({
        id: p.id,
        nombre: `${p.usuario.nombre} ${p.usuario.apellido}`,
        dni: p.usuario.dni,
        edad: Math.floor((new Date() - new Date(p.usuario.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365)),
        sexo: p.usuario.sexo,
        estado: p.estado
      }))
    });

  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda avanzada',
      error: error.message
    });
  }
};

// Accesos rápidos para paciente
exports.accesoRapido = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion } = req.query;

    switch (accion) {
      case 'evaluacion':
        return res.redirect(`dashboard/enfermero/evaluaciones/nueva?paciente_id=${id}`);
      
      case 'signos-vitales':
        return res.redirect(`dashboard/enfermero/signos-vitales/registro?paciente_id=${id}`);
      
      case 'control':
        return res.redirect(`dashboard/enfermero/controles/nuevo?paciente_id=${id}`);
      
      case 'internacion':
        const internacion = await Internacion.findOne({
          where: {
            paciente_id: id,
            fecha_alta: null
          }
        });
        if (internacion) {
          return res.redirect(`dashboard/enfermero/internados/${internacion.id}`);
        } else {
          return res.status(404).json({
            success: false,
            message: 'El paciente no está internado'
          });
        }
      
      case 'ficha':
        return res.redirect(`dashboard/enfermero/pacientes/${id}`);
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida'
        });
    }

  } catch (error) {
    console.error('Error en acceso rápido:', error);
    res.status(500).json({
      success: false,
      message: 'Error en acceso rápido',
      error: error.message
    });
  }
};

module.exports = exports;