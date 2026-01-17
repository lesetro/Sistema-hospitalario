const { 
    EvaluacionEnfermeria, 
    Paciente, 
    Usuario, 
    Enfermero, 
    ControlEnfermeria, 
    Internacion, 
    Cama, 
    Habitacion } = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// Listar pacientes para registro de signos vitales
exports.listarPacientes = async (req, res) => {
  try {
    const { tipo_paciente, busqueda } = req.query;
    
    let pacientes = [];
    
    if (tipo_paciente === 'internados' || !tipo_paciente) {
      const internados = await Internacion.findAll({
        where: {
          fecha_alta: null
        },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo'],
              where: busqueda ? {
                [Op.or]: [
                  { nombre: { [Op.like]: `%${busqueda}%` } },
                  { apellido: { [Op.like]: `%${busqueda}%` } },
                  { dni: { [Op.like]: `%${busqueda}%` } }
                ]
              } : {}
            }]
          },
          {
            model: Cama,
            as: 'cama',
            include: [{
              model: Habitacion,
              as: 'habitacion'
            }]
          }
        ]
      });
      
      pacientes = internados.map(i => ({
        paciente: i.paciente,
        tipo: 'internado',
        ubicacion: `${i.cama.habitacion.numero} - Cama ${i.cama.numero}`,
        internacion_id: i.id
      }));
    }
    
    if (tipo_paciente === 'evaluaciones' || !tipo_paciente) {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const evaluaciones = await EvaluacionEnfermeria.findAll({
        where: {
          fecha: {
            [Op.gte]: hace24h
          },
          tipo_egreso: 'PENDIENTE_EVALUACION'
        },
        include: [{
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo'],
            where: busqueda ? {
              [Op.or]: [
                { nombre: { [Op.like]: `%${busqueda}%` } },
                { apellido: { [Op.like]: `%${busqueda}%` } },
                { dni: { [Op.like]: `%${busqueda}%` } }
              ]
            } : {}
          }]
        }],
        order: [['fecha', 'DESC']]
      });
      
      const pacientesEval = evaluaciones.map(e => ({
        paciente: e.paciente,
        tipo: 'evaluacion',
        ubicacion: 'En evaluación',
        evaluacion_id: e.id
      }));
      
      pacientes = [...pacientes, ...pacientesEval];
    }

    for (let item of pacientes) {
      const ultimaEvaluacion = await EvaluacionEnfermeria.findOne({
        where: { paciente_id: item.paciente.id },
        order: [['fecha', 'DESC']],
        attributes: ['signos_vitales', 'fecha']
      });
      
      item.ultimos_signos = ultimaEvaluacion ? {
        signos: ultimaEvaluacion.signos_vitales,
        fecha: ultimaEvaluacion.fecha
      } : null;
    }

    res.render('dashboard/enfermero/signos-vitales', {
      title: 'Signos Vitales',
      user: req.user,
      pacientes,
      filtros: { tipo_paciente, busqueda }
    });

  } catch (error) {
    console.error('Error al listar pacientes:', error);
    res.status(500).render('error', {
      message: 'Error al cargar pacientes',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Formulario para registrar signos vitales
exports.formularioRegistro = async (req, res) => {
  try {
    const { paciente_id } = req.query;
    
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
      }]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const historial = await EvaluacionEnfermeria.findAll({
      where: { paciente_id },
      order: [['fecha', 'DESC']],
      limit: 10,
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

    res.render('dashboard/enfermero/signos-vitales-registro', {
      title: 'Registrar Signos Vitales',
      user: req.user,
      paciente,
      historial
    });

  } catch (error) {
    console.error('Error al cargar formulario:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Registrar signos vitales
exports.registrarSignos = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // ✅ CORRECCIÓN
    const enfermeroId = req.user.id;
    const {
      paciente_id,
      presion_arterial,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      temperatura,
      saturacion_oxigeno,
      dolor_escala,
      observaciones
    } = req.body;

    const paciente = await Paciente.findByPk(paciente_id, { transaction });
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const signosVitalesTexto = `PA: ${presion_arterial || 'N/A'}, FC: ${frecuencia_cardiaca || 'N/A'} lpm, FR: ${frecuencia_respiratoria || 'N/A'} rpm, T: ${temperatura || 'N/A'}°C, SpO2: ${saturacion_oxigeno || 'N/A'}%, Dolor: ${dolor_escala || 'N/A'}/10`;

    const evaluacion = await EvaluacionEnfermeria.create({
      paciente_id,
      enfermero_id: enfermeroId,
      fecha: new Date(),
      signos_vitales: signosVitalesTexto,
      observaciones: observaciones || null,
      tipo_egreso: 'PENDIENTE_EVALUACION'
    }, { transaction });

    const alertas = [];
    
    if (presion_arterial) {
      const [sistolica, diastolica] = presion_arterial.split('/').map(Number);
      if (sistolica > 140 || sistolica < 90 || diastolica > 90 || diastolica < 60) {
        alertas.push('Presión arterial fuera de rango normal');
      }
    }
    
    if (frecuencia_cardiaca) {
      const fc = Number(frecuencia_cardiaca);
      if (fc > 100 || fc < 60) {
        alertas.push('Frecuencia cardíaca anormal');
      }
    }
    
    if (temperatura) {
      const temp = Number(temperatura);
      if (temp >= 38 || temp < 36) {
        alertas.push('Temperatura anormal');
      }
    }
    
    if (saturacion_oxigeno) {
      const spo2 = Number(saturacion_oxigeno);
      if (spo2 < 95) {
        alertas.push('Saturación de oxígeno baja');
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Signos vitales registrados correctamente',
      evaluacion_id: evaluacion.id,
      alertas,
      redirect: '/dashboard/enfermero/signos-vitales'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al registrar signos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar signos vitales',
      error: error.message
    });
  }
};

// Ver historial de signos vitales de un paciente
exports.verHistorial = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
      }]
    });

    if (!paciente) {
      return res.status(404).render('error', {
        message: 'Paciente no encontrado'
      });
    }

    const historial = await EvaluacionEnfermeria.findAll({
      where: { paciente_id },
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

    res.render('dashboard/enfermero/signos-vitales-historial', {
      title: 'Historial de Signos Vitales',
      user: req.user,
      paciente,
      historial
    });

  } catch (error) {
    console.error('Error al ver historial:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el historial',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtener gráfica de evolución
exports.obtenerGrafica = async (req, res) => {
  try {
    const { paciente_id, parametro, dias } = req.query;

    if (!paciente_id || !parametro) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos'
      });
    }

    const diasAtras = dias ? parseInt(dias) : 7;
    const fechaInicio = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

    const evaluaciones = await EvaluacionEnfermeria.findAll({
      where: {
        paciente_id,
        fecha: {
          [Op.gte]: fechaInicio
        }
      },
      order: [['fecha', 'ASC']],
      attributes: ['id', 'fecha', 'signos_vitales']
    });

    const datos = evaluaciones.map(e => {
      const signos = e.signos_vitales || '';
      let valor = null;

      switch (parametro) {
        case 'presion_arterial':
          const paMatch = signos.match(/PA:\s*(\d+\/\d+)/);
          valor = paMatch ? paMatch[1] : null;
          break;
        case 'frecuencia_cardiaca':
          const fcMatch = signos.match(/FC:\s*(\d+)/);
          valor = fcMatch ? parseInt(fcMatch[1]) : null;
          break;
        case 'temperatura':
          const tempMatch = signos.match(/T:\s*([\d.]+)/);
          valor = tempMatch ? parseFloat(tempMatch[1]) : null;
          break;
        case 'saturacion_oxigeno':
          const spo2Match = signos.match(/SpO2:\s*(\d+)/);
          valor = spo2Match ? parseInt(spo2Match[1]) : null;
          break;
        case 'frecuencia_respiratoria':
          const frMatch = signos.match(/FR:\s*(\d+)/);
          valor = frMatch ? parseInt(frMatch[1]) : null;
          break;
      }

      return {
        fecha: e.fecha,
        valor
      };
    }).filter(d => d.valor !== null);

    res.json({
      success: true,
      datos
    });

  } catch (error) {
    console.error('Error al obtener gráfica:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar gráfica'
    });
  }
};

// Obtener últimos signos vitales de un paciente
exports.ultimosSignos = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const evaluacion = await EvaluacionEnfermeria.findOne({
      where: { paciente_id },
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

    if (!evaluacion) {
      return res.json({
        success: false,
        message: 'No hay signos vitales registrados'
      });
    }

    const signos = evaluacion.signos_vitales || '';
    const parsed = {
      presion_arterial: signos.match(/PA:\s*([^\,]+)/)?.[1]?.trim() || 'N/A',
      frecuencia_cardiaca: signos.match(/FC:\s*(\d+)/)?.[1] || 'N/A',
      frecuencia_respiratoria: signos.match(/FR:\s*(\d+)/)?.[1] || 'N/A',
      temperatura: signos.match(/T:\s*([\d.]+)/)?.[1] || 'N/A',
      saturacion_oxigeno: signos.match(/SpO2:\s*(\d+)/)?.[1] || 'N/A',
      dolor: signos.match(/Dolor:\s*(\d+)/)?.[1] || 'N/A'
    };

    res.json({
      success: true,
      signos: parsed,
      fecha: evaluacion.fecha,
      enfermero: `${evaluacion.enfermero.usuario.nombre} ${evaluacion.enfermero.usuario.apellido}`
    });

  } catch (error) {
    console.error('Error al obtener últimos signos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener signos vitales'
    });
  }
};

// Exportar historial a CSV
exports.exportarCSV = async (req, res) => {
  try {
    const { paciente_id } = req.params;

    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre', 'apellido', 'dni']
      }]
    });

    const historial = await EvaluacionEnfermeria.findAll({
      where: { paciente_id },
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

    let csv = 'Fecha,Hora,Enfermero,Signos Vitales,Observaciones\n';
    
    historial.forEach(e => {
      const fecha = new Date(e.fecha);
      csv += `${fecha.toLocaleDateString('es-AR')},${fecha.toLocaleTimeString('es-AR')},"${e.enfermero.usuario.nombre} ${e.enfermero.usuario.apellido}","${e.signos_vitales || ''}","${e.observaciones || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=signos_vitales_${paciente.usuario.dni}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar datos'
    });
  }
};

module.exports = exports;