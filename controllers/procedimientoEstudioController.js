
const { Op } = require('sequelize');
const {
  Paciente,
  Usuario,
  EstudioSolicitado,
  TipoEstudio,
  EvaluacionMedica,
  Medico,
  Especialidad,
  Diagnostico,
  TipoDiagnostico,
  Tratamiento,
  ProcedimientoPreQuirurgico,
  ProcedimientoEnfermeria,
  EvaluacionEnfermeria,
  Enfermero,
  IntervencionQuirurgica,
  Habitacion,
  TurnoEstudio,
  ControlEnfermeria
} = require('../models');

/**
 * Vista principal de consulta
 */
const getVistaProcedimientosEstudios = async (req, res) => {
  try {
    res.render('dashboard/admin/procedimiento/consulta', {
      title: 'Consulta de Procedimientos y Estudios'
    });
  } catch (error) {
    console.error('Error al cargar vista:', error);
    res.status(500).render('error', {
      message: 'Error al cargar la página de consulta'
    });
  }
};

/**
 * Buscar paciente por DNI
 */
const buscarPacientePorDNI = async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({
        success: false,
        message: 'Ingrese un DNI'
      });
    }

    const paciente = await Paciente.findOne({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          where: { dni: dni },
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'fecha_nacimiento']
        }
      ]
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Obtener resumen de datos
    const [estudios, evaluaciones, procedimientosPreQ, procedimientosEnf, intervenciones] = await Promise.all([
      EstudioSolicitado.count({ where: { paciente_id: paciente.id } }),
      EvaluacionMedica.count({ where: { paciente_id: paciente.id } }),
      ProcedimientoPreQuirurgico.count({
        include: [{
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { paciente_id: paciente.id }
        }]
      }),
      ProcedimientoEnfermeria.count({
        include: [{
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { paciente_id: paciente.id }
        }]
      }),
      IntervencionQuirurgica.count({ where: { paciente_id: paciente.id } })
    ]);

    res.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombre: paciente.usuario.nombre,
        apellido: paciente.usuario.apellido,
        dni: paciente.usuario.dni,
        email: paciente.usuario.email,
        telefono: paciente.usuario.telefono,
        fecha_nacimiento: paciente.usuario.fecha_nacimiento,
        estado: paciente.estado
      },
      resumen: {
        estudios,
        evaluaciones,
        procedimientosPreQuirurgicos: procedimientosPreQ,
        procedimientosEnfermeria: procedimientosEnf,
        intervenciones
      }
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar paciente',
      error: error.message
    });
  }
};

/**
 * Obtener estudios solicitados de un paciente
 */
const getEstudiosPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, estado = '' } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereEstudio = { paciente_id: id };
    if (estado) whereEstudio.estado = estado;

    const { count, rows: estudios } = await EstudioSolicitado.findAndCountAll({
      where: whereEstudio,
      include: [
        {
          model: TipoEstudio,
          as: 'tipo_estudio',
          attributes: ['nombre', 'categoria', 'requiere_ayuno']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          include: [
            {
              model: Medico,
              as: 'medico',
              include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
                { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
              ]
            }
          ]
        },
        {
          model: TurnoEstudio,
          as: 'turno_estudio',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const estudiosFormateados = estudios.map(e => ({
      id: e.id,
      tipo_estudio: e.tipo_estudio?.nombre || 'No especificado',
      categoria: e.tipo_estudio?.categoria || '',
      requiere_ayuno: e.tipo_estudio?.requiere_ayuno || false,
      urgencia: e.urgencia,
      estado: e.estado,
      observaciones: e.observaciones,
      medico: e.evaluacion_medica?.medico ? 
        `Dr. ${e.evaluacion_medica.medico.usuario.nombre} ${e.evaluacion_medica.medico.usuario.apellido}` : 
        'No especificado',
      especialidad: e.evaluacion_medica?.medico?.especialidad?.nombre || '',
      fecha_solicitud: e.created_at,
      turno: e.turno_estudio ? {
        fecha: e.turno_estudio.fecha,
        hora: e.turno_estudio.hora,
        estado: e.turno_estudio.estado,
        resultado: e.turno_estudio.resultado
      } : null
    }));

    res.json({
      success: true,
      estudios: estudiosFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener estudios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudios del paciente',
      error: error.message
    });
  }
};

/**
 * Obtener evaluaciones médicas de un paciente
 */
const getEvaluacionesPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: evaluaciones } = await EvaluacionMedica.findAndCountAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        {
          model: Diagnostico,
          as: 'diagnostico',
          include: [
            { model: TipoDiagnostico, as: 'tipoDiagnostico', attributes: ['nombre'] }
          ],
          required: false
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['fecha', 'DESC']]
    });

    const evaluacionesFormateadas = evaluaciones.map(e => ({
      id: e.id,
      fecha: e.fecha,
      medico: `Dr. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}`,
      especialidad: e.medico.especialidad?.nombre || '',
      diagnostico: e.diagnostico ? {
        codigo: e.diagnostico.codigo,
        nombre: e.diagnostico.nombre,
        tipo: e.diagnostico.tipoDiagnostico?.nombre || ''
      } : null,
      tratamiento: e.tratamiento?.nombre || null,
      observaciones: e.observaciones_diagnostico
    }));

    res.json({
      success: true,
      evaluaciones: evaluacionesFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evaluaciones',
      error: error.message
    });
  }
};

/**
 * Obtener procedimientos pre-quirúrgicos de un paciente
 */
const getProcedimientosPreQuirurgicos = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, estado = '' } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereProcedimiento = {};
    if (estado) whereProcedimiento.estado = estado;

    const { count, rows: procedimientos } = await ProcedimientoPreQuirurgico.findAndCountAll({
      where: whereProcedimiento,
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { paciente_id: id },
          include: [
            {
              model: Medico,
              as: 'medico',
              include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
              ]
            }
          ]
        },
        {
          model: EvaluacionEnfermeria,
          as: 'evaluacion_enfermeria',
          include: [
            {
              model: Enfermero,
              as: 'enfermero',
              include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
              ]
            }
          ],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const procedimientosFormateados = procedimientos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      estado: p.estado,
      medico: `Dr. ${p.evaluacion_medica.medico.usuario.nombre} ${p.evaluacion_medica.medico.usuario.apellido}`,
      enfermero: p.evaluacion_enfermeria?.enfermero ? 
        `${p.evaluacion_enfermeria.enfermero.usuario.nombre} ${p.evaluacion_enfermeria.enfermero.usuario.apellido}` : 
        'No asignado',
      fecha_creacion: p.created_at,
      fecha_actualizacion: p.updated_at
    }));

    res.json({
      success: true,
      procedimientos: procedimientosFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener procedimientos pre-quirúrgicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener procedimientos',
      error: error.message
    });
  }
};

/**
 * Obtener procedimientos de enfermería de un paciente
 */
const getProcedimientosEnfermeria = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: procedimientos } = await ProcedimientoEnfermeria.findAndCountAll({
      include: [
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          where: { paciente_id: id },
          include: [
            {
              model: Medico,
              as: 'medico',
              include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }
              ]
            }
          ]
        },
        {
          model: Tratamiento,
          as: 'tratamiento',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const procedimientosFormateados = procedimientos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      duracion_estimada: p.duracion_estimada,
      requiere_preparacion: p.requiere_preparacion,
      tratamiento: p.tratamiento?.nombre || 'No especificado',
      medico: `Dr. ${p.evaluacion_medica.medico.usuario.nombre} ${p.evaluacion_medica.medico.usuario.apellido}`,
      fecha_creacion: p.created_at
    }));

    res.json({
      success: true,
      procedimientos: procedimientosFormateados,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener procedimientos de enfermería:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener procedimientos',
      error: error.message
    });
  }
};

/**
 * Obtener intervenciones quirúrgicas de un paciente
 */
const getIntervencionesPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: intervenciones } = await IntervencionQuirurgica.findAndCountAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
            { model: Especialidad, as: 'especialidad', attributes: ['nombre'] }
          ]
        },
        {
          model: Habitacion,
          as: 'habitacion',
          attributes: ['numero', 'tipo']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          attributes: ['fecha']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['fecha_inicio', 'DESC']]
    });

    const intervencionesFormateadas = intervenciones.map(i => ({
      id: i.id,
      tipo_procedimiento: i.tipo_procedimiento,
      fecha_inicio: i.fecha_inicio,
      fecha_fin: i.fecha_fin,
      resultado: i.resultado_cirugia,
      observaciones: i.observaciones,
      medico: `Dr. ${i.medico.usuario.nombre} ${i.medico.usuario.apellido}`,
      especialidad: i.medico.especialidad?.nombre || '',
      habitacion: `${i.habitacion.tipo} #${i.habitacion.numero}`,
      duracion: i.fecha_fin ? 
        Math.round((new Date(i.fecha_fin) - new Date(i.fecha_inicio)) / (1000 * 60)) : 
        'En curso'
    }));

    res.json({
      success: true,
      intervenciones: intervencionesFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener intervenciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener intervenciones',
      error: error.message
    });
  }
};

/**
 * Obtener timeline completo del paciente
 */
const getTimelinePaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const eventos = [];

    // Evaluaciones médicas
    const evaluaciones = await EvaluacionMedica.findAll({
      where: { paciente_id: id },
      include: [
        {
          model: Medico,
          as: 'medico',
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
        },
        { model: Diagnostico, as: 'diagnostico', attributes: ['nombre'] }
      ],
      limit: 20,
      order: [['fecha', 'DESC']]
    });

    evaluaciones.forEach(e => {
      eventos.push({
        tipo: 'Evaluación Médica',
        fecha: e.fecha,
        descripcion: `Evaluación con Dr. ${e.medico.usuario.nombre} ${e.medico.usuario.apellido}`,
        detalles: e.diagnostico?.nombre || 'Sin diagnóstico registrado',
        icono: 'fa-user-md',
        color: 'primary'
      });
    });

    // Estudios
    const estudios = await EstudioSolicitado.findAll({
      where: { paciente_id: id },
      include: [{ model: TipoEstudio, as: 'tipo_estudio', attributes: ['nombre'] }],
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    estudios.forEach(e => {
      eventos.push({
        tipo: 'Estudio',
        fecha: e.created_at,
        descripcion: e.tipo_estudio?.nombre || 'Estudio',
        detalles: `Estado: ${e.estado} - Urgencia: ${e.urgencia}`,
        icono: 'fa-microscope',
        color: e.estado === 'Realizado' ? 'success' : e.estado === 'Pendiente' ? 'warning' : 'danger'
      });
    });

    // Intervenciones
    const intervenciones = await IntervencionQuirurgica.findAll({
      where: { paciente_id: id },
      limit: 10,
      order: [['fecha_inicio', 'DESC']]
    });

    intervenciones.forEach(i => {
      eventos.push({
        tipo: 'Intervención Quirúrgica',
        fecha: i.fecha_inicio,
        descripcion: i.tipo_procedimiento,
        detalles: i.resultado_cirugia || 'En proceso',
        icono: 'fa-hospital',
        color: 'danger'
      });
    });

    // Ordenar por fecha
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      success: true,
      timeline: eventos.slice(0, 30) // Últimos 30 eventos
    });

  } catch (error) {
    console.error('Error al obtener timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener timeline',
      error: error.message
    });
  }
};

module.exports = {
  getVistaProcedimientosEstudios,
  buscarPacientePorDNI,
  getEstudiosPaciente,
  getEvaluacionesPaciente,
  getProcedimientosPreQuirurgicos,
  getProcedimientosEnfermeria,
  getIntervencionesPaciente,
  getTimelinePaciente
};