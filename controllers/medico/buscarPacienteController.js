const { 
  Paciente,
  Usuario,
  Medico,
  ObraSocial,
  EvaluacionMedica,
  Internacion,
  Turno,
  AltaMedica,
  HistorialMedico,
  RecetaCertificado,
  Habitacion,
  Cama,
  TipoInternacion,
  Diagnostico,
  Tratamiento,
  MotivoConsulta,
  ListaEspera
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA
// ========================================
exports.renderBuscarPaciente = async (req, res, next) => {
  try {
    console.log('🔍 renderBuscarPaciente - usuario_id:', req.user.usuario_id);
    
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

    console.log('✅ Renderizando vista de búsqueda de pacientes...');

    res.render('dashboard/medico/buscar-paciente', {
      title: 'Buscar Paciente',
      user: {
        ...usuario.toJSON(),
        especialidad: usuario.medico?.especialidad?.nombre
      }
    });
  } catch (error) {
    console.error('❌ Error al renderizar buscar paciente:', error);
    next(error);
  }
};


// ========================================
// BUSCAR PACIENTES DEL MÉDICO
// ========================================
exports.buscarPacientes = async (req, res, next) => {
  try {
    const { q, estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Obtener médico
    const medico = await Medico.findOne({
      where: { usuario_id: req.user.usuario_id }
    });

    if (!medico) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }

    
    // PASO 1: Obtener IDs de pacientes asociados a este médico
    // por turno, internación o lista de espera (urgencias aceptadas)
    const [pacientesPorTurno, pacientesPorInternacion, pacientesPorUrgencia] = await Promise.all([
      // Por turno
      Turno.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      // Por internación
      Internacion.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      }),
      // Por urgencia aceptada
      ListaEspera.findAll({
        where: { medico_id: medico.id },
        attributes: ['paciente_id'],
        raw: true
      })
    ]);

    // Unificar y desduplicar IDs
    const todosLosIds = [
      ...pacientesPorTurno.map(t => t.paciente_id),
      ...pacientesPorInternacion.map(i => i.paciente_id),
      ...pacientesPorUrgencia.map(u => u.paciente_id)
    ];

    const idsUnicos = [...new Set(todosLosIds)];

    if (idsUnicos.length === 0) {
      return res.json({
        success: true,
        pacientes: [],
        total: 0,
        page: parseInt(page),
        total_pages: 0
      });
    }
    // Después del PASO 1
    console.log('IDs por turno:', pacientesPorTurno.map(t => t.paciente_id));
    console.log('IDs por internacion:', pacientesPorInternacion.map(i => i.paciente_id));
    console.log('IDs por urgencia:', pacientesPorUrgencia.map(u => u.paciente_id));
    console.log('IDs únicos finales:', idsUnicos);

    // PASO 2: Construir filtros
    const whereClause = { id: { [Op.in]: idsUnicos } };

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }


    let tieneFiltroBusqueda = false;
    const whereUsuario = {};
    if (q && q.length >= 2) {
      whereUsuario[Op.or] = [
        { nombre:   { [Op.like]: `%${q}%` } },
        { apellido: { [Op.like]: `%${q}%` } },
        { dni:      { [Op.like]: `%${q}%` } }
      ];
      tieneFiltroBusqueda = true;
    }

    // PASO 3: Buscar pacientes con sus datos
    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where: whereClause,
      include: [
        {
         model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['password'] },
          where: tieneFiltroBusqueda ? whereUsuario : undefined  
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });
    // Después del PASO 3
    console.log('Count después de findAndCountAll:', count);
    console.log('Pacientes encontrados:', pacientes.map(p => p.id));
    //  PASO 4: Para cada paciente, determinar su relación con el médico
    const pacientesFormateados = await Promise.all(pacientes.map(async paciente => {
      const [internacionActiva, ultimoTurno] = await Promise.all([
        Internacion.findOne({
          where: { paciente_id: paciente.id, medico_id: medico.id, fecha_alta: null }
        }),
        Turno.findOne({
          where: { paciente_id: paciente.id, medico_id: medico.id },
          order: [['fecha', 'DESC']]
        })
      ]);

      return {
        id: paciente.id,
        usuario_id: paciente.usuario.id,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        nombre_completo: `${paciente.usuario.apellido}, ${paciente.usuario.nombre}`,
        dni: paciente.usuario.dni,
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        edad: calcularEdad(paciente.usuario.fecha_nacimiento),
        sexo: paciente.usuario.sexo,
        telefono: paciente.usuario.telefono,
        email: paciente.usuario.email,
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        estado: paciente.estado,
       
        relacion: {
          internado: !!internacionActiva,
          internacion_id: internacionActiva?.id || null,
          ultimo_turno: ultimoTurno?.fecha || null,
          ultimo_turno_estado: ultimoTurno?.estado || null
        }
      };
    }));

    res.json({
      success: true,
      pacientes: pacientesFormateados,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit)
    });

  } catch (error) {
    console.error('❌ Error al buscar pacientes del médico:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al buscar pacientes',
      pacientes: [],
      total: 0
    });
  }
};

// ========================================
// BÚSQUEDA RÁPIDA (AUTOCOMPLETADO) 
// ========================================
exports.busquedaRapida = async (req, res, next) => {
  try {
    console.log(' busquedaRapida');
    
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ 
        success: true, 
        pacientes: [] 
      });
    }

    const pacientes = await Paciente.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo', 'telefono'],
          where: {
            [Op.or]: [
              { nombre: { [Op.like]: `%${q}%` } },
              { apellido: { [Op.like]: `%${q}%` } },
              { dni: { [Op.like]: `%${q}%` } }
            ]
          }
        },
        {
          model: ObraSocial,
          as: 'obraSocial',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      limit: 10,
      order: [[{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC']]
    });

    const pacientesFormateados = pacientes.map(paciente => ({
      id: paciente.id,
      usuario_id: paciente.usuario.id,
      nombre_completo: `${paciente.usuario.apellido}, ${paciente.usuario.nombre}`,
      nombre: paciente.usuario.nombre,
      apellido: paciente.usuario.apellido,
      dni: paciente.usuario.dni,
      edad: paciente.usuario.fecha_nacimiento ? calcularEdad(paciente.usuario.fecha_nacimiento) : null,
      sexo: paciente.usuario.sexo,
      telefono: paciente.usuario.telefono,
      obra_social: paciente.obraSocial?.nombre || 'Sin obra social'
    }));

    console.log('Búsqueda rápida completada:', pacientesFormateados.length);

    res.json({
      success: true,
      pacientes: pacientesFormateados
    });

  } catch (error) {
    console.error('❌ Error en búsqueda rápida:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda rápida',
      pacientes: []
    });
  }
};

// ========================================
// OBTENER DETALLE COMPLETO DEL PACIENTE
// ========================================
exports.obtenerDetallePaciente = async (req, res, next) => {
  try {
    console.log('👤 obtenerDetallePaciente - ID:', req.params.id);
    
    const paciente = await Paciente.findByPk(req.params.id, {
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
    });

    if (!paciente) {
      console.error('❌ Paciente no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    // Obtener estadísticas del paciente (sin filtrar por médico)
    const [evaluaciones, turnos, internaciones, altas] = await Promise.all([
      EvaluacionMedica.count({ where: { paciente_id: paciente.id } }),
      Turno.count({ where: { paciente_id: paciente.id } }),
      Internacion.count({ where: { paciente_id: paciente.id } }),
      AltaMedica.count({ where: { paciente_id: paciente.id } })
    ]);

    // Última evaluación
    const ultimaEvaluacion = await EvaluacionMedica.findOne({
      where: { paciente_id: paciente.id },
      order: [['fecha', 'DESC']],
      attributes: ['id', 'fecha'],
      include: [{
        model: Medico,
        as: 'medico',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }]
    });

    // Verificar si tiene internación activa
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: paciente.id,
        fecha_alta: null
      },
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
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ]
    });

    const pacienteFormateado = {
      id: paciente.id,
      usuario: {
        id: paciente.usuario.id,
        dni: paciente.usuario.dni,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        nombre_completo: `${paciente.usuario.apellido}, ${paciente.usuario.nombre}`,
        email: paciente.usuario.email,
        telefono: paciente.usuario.telefono,
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        edad: paciente.usuario.fecha_nacimiento ? calcularEdad(paciente.usuario.fecha_nacimiento) : null,
        sexo: paciente.usuario.sexo
      },
      obra_social: paciente.obraSocial || { nombre: 'Sin obra social' },
      obra_social_id: paciente.obraSocial?.id,
      fecha_ingreso: paciente.fecha_ingreso,
      estado: paciente.estado,
      observaciones: paciente.observaciones,
      estadisticas: {
        evaluaciones,
        turnos,
        internaciones,
        altas
      },
      ultima_evaluacion: ultimaEvaluacion ? {
        id: ultimaEvaluacion.id,
        fecha: ultimaEvaluacion.fecha,
        medico: ultimaEvaluacion.medico ? 
          `Dr. ${ultimaEvaluacion.medico.usuario.nombre} ${ultimaEvaluacion.medico.usuario.apellido}` : null
      } : null,
      internacion_activa: internacionActiva ? {
        id: internacionActiva.id,
        fecha_inicio: internacionActiva.fecha_inicio,
        habitacion: internacionActiva.habitacion?.numero,
        cama: internacionActiva.cama?.numero,
        medico: internacionActiva.medico ? 
          `Dr. ${internacionActiva.medico.usuario.nombre} ${internacionActiva.medico.usuario.apellido}` : null,
        diagnostico: internacionActiva.diagnostico_ingreso
      } : null
    };

    console.log('✅ Detalle del paciente obtenido');

    res.json({
      success: true,
      paciente: pacienteFormateado
    });

  } catch (error) {
    console.error('❌ Error al obtener detalle del paciente:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del paciente'
    });
  }
};

// ========================================
// OBTENER EVALUACIONES DEL PACIENTE
// ========================================
exports.obtenerEvaluacionesPaciente = async (req, res, next) => {
  try {
    console.log('📊 obtenerEvaluacionesPaciente - ID:', req.params.id);
    
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { paciente_id: req.params.id },
      include: [
        {
          model: Diagnostico,
          as: 'diagnostico',
          attributes: ['codigo', 'nombre'],
          required: false
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          attributes: ['nombre'],
          required: false
        },
        {
          model: Medico,
          as: 'medico',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Evaluaciones obtenidas:', evaluaciones.length);

    res.json({
      success: true,
      evaluaciones: evaluaciones.map(e => ({
        id: e.id,
        fecha: e.fecha,
        motivo_consulta: e.motivo_consulta,
        diagnostico_presuntivo: e.diagnostico_presuntivo,
        diagnostico: e.diagnostico,
        tratamiento: e.tratamiento,
        medico: e.medico ? 
          `Dr. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}` : null
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener evaluaciones:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluaciones'
    });
  }
};

// ========================================
// OBTENER TURNOS DEL PACIENTE
// ========================================
exports.obtenerTurnosPaciente = async (req, res, next) => {
  try {
    console.log('📅 obtenerTurnosPaciente - ID:', req.params.id);
    
    const turnos = await Turno.findAll({
      where: { paciente_id: req.params.id },
      include: [
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
          model: require('../../models').Especialidad,
          as: 'especialidad',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC'], ['hora', 'DESC']],
      limit: 10
    });

    console.log('✅ Turnos obtenidos:', turnos.length);

    res.json({
      success: true,
      turnos: turnos.map(t => ({
        id: t.id,
        fecha: t.fecha,
        hora: t.hora,
        especialidad: t.especialidad?.nombre,
        medico: t.medico ? 
          `Dr. ${t.medico.usuario.nombre} ${t.medico.usuario.apellido}` : null,
        motivo: t.motivo_consulta,
        estado: t.estado
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener turnos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos'
    });
  }
};

// ========================================
// OBTENER INTERNACIONES DEL PACIENTE
// ========================================
exports.obtenerInternacionesPaciente = async (req, res, next) => {
  try {
    console.log('🏥 obtenerInternacionesPaciente - ID:', req.params.id);
    
    const internaciones = await Internacion.findAll({
      where: { paciente_id: req.params.id },
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
        },
        {
          model: TipoInternacion,
          as: 'tipoInternacion',
          attributes: ['nombre']
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
          model: AltaMedica,
          as: 'alta_medica'
        }
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: 10
    });

    console.log('✅ Internaciones obtenidas:', internaciones.length);

    res.json({
      success: true,
      internaciones: internaciones.map(i => ({
        id: i.id,
        fecha_inicio: i.fecha_inicio,
        fecha_alta: i.fecha_alta,
        dias_internado: i.fecha_alta ? 
          Math.ceil((new Date(i.fecha_alta) - new Date(i.fecha_inicio)) / (1000 * 60 * 60 * 24)) : 
          Math.ceil((new Date() - new Date(i.fecha_inicio)) / (1000 * 60 * 60 * 24)),
        diagnostico: i.diagnostico_ingreso,
        habitacion: i.habitacion?.numero,
        cama: i.cama?.numero,
        tipo: i.tipoInternacion?.nombre,
        medico: i.medico ? 
          `Dr. ${i.medico.usuario.nombre} ${i.medico.usuario.apellido}` : null,
        estado: i.fecha_alta ? 'Finalizada' : 'Activa',
        alta: i.alta_medica ? {
          fecha: i.alta_medica.fecha_alta,
          tipo: i.alta_medica.tipo_alta,
          estado_paciente: i.alta_medica.estado_paciente
        } : null
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener internaciones:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener internaciones'
    });
  }
};

// ========================================
// OBTENER HISTORIAL MÉDICO DEL PACIENTE
// ========================================
exports.obtenerHistorialPaciente = async (req, res, next) => {
  try {
    console.log('📖 obtenerHistorialPaciente - ID:', req.params.id);
    
    const historial = await HistorialMedico.findAll({
      where: { paciente_id: req.params.id },
      include: [
        {
          model: MotivoConsulta,
          as: 'motivo_consulta',
          attributes: ['nombre'],
          required: false
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 20
    });

    console.log('✅ Historial obtenido:', historial.length);

    res.json({
      success: true,
      historial: historial.map(h => ({
        id: h.id,
        fecha: h.fecha,
        descripcion: h.descripcion,
        tipo_evento: h.tipo_evento,
        motivo_consulta: h.motivo_consulta?.nombre
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener historial:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

// ========================================
// OBTENER RECETAS Y CERTIFICADOS DEL PACIENTE
// ========================================
exports.obtenerRecetasCertificadosPaciente = async (req, res, next) => {
  try {
    console.log('📋 obtenerRecetasCertificadosPaciente - ID:', req.params.id);
    
    const items = await RecetaCertificado.findAll({
      where: { paciente_id: req.params.id },
      include: [{
        model: Medico,
        as: 'medico',
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'apellido']
        }]
      }],
      order: [['fecha', 'DESC']],
      limit: 10
    });

    console.log('✅ Recetas/Certificados obtenidos:', items.length);

    res.json({
      success: true,
      items: items.map(i => ({
        id: i.id,
        tipo: i.tipo,
        fecha: i.fecha,
        descripcion: i.descripcion,
        medico: i.medico ? 
          `Dr. ${i.medico.usuario.nombre} ${i.medico.usuario.apellido}` : null
      }))
    });

  } catch (error) {
    console.error('❌ Error al obtener recetas/certificados:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas y certificados'
    });
  }
};

// ========================================
// OBTENER OBRAS SOCIALES
// ========================================
exports.obtenerObrasSociales = async (req, res, next) => {
  try {
    console.log('💼 obtenerObrasSociales');
    
    const obrasSociales = await ObraSocial.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    console.log('✅ Obras sociales obtenidas:', obrasSociales.length);

    res.json({
      success: true,
      obras_sociales: obrasSociales
    });

  } catch (error) {
    console.error('❌ Error al obtener obras sociales:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener obras sociales'
    });
  }
};

// ========================================
// FUNCIÓN AUXILIAR - Calcular edad
// ========================================
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}