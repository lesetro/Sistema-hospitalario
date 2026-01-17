const { 
    TurnoPersonal, 
    Usuario, 
    Sector, 
    Enfermero } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');
moment.locale('es');

// Vista principal de turnos
exports.misTurnos = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const usuarioId = req.user.usuario_id;
    const { mes, anio } = req.query;

    const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anioActual = anio ? parseInt(anio) : new Date().getFullYear();

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuarioId
      },
      include: [{
        model: Sector,
        as: 'sector'
      }],
      order: [['hora_inicio', 'ASC']]
    });

    const calendario = generarCalendario(mesActual, anioActual, turnos);

    const ahora = new Date();
    const diaActual = ahora.getDay();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    const turnoActual = turnos.find(turno => {
      const diasTurno = parsearDiasTurno(turno.dias);
      const horaInicio = convertirHoraAMinutos(turno.hora_inicio);
      const horaFin = convertirHoraAMinutos(turno.hora_fin);

      return diasTurno.includes(diaActual) && horaActual >= horaInicio && horaActual <= horaFin;
    });

    const proximoTurno = encontrarProximoTurno(turnos, ahora);

    const estadisticas = {
      total_turnos: turnos.length,
      guardias_activas: turnos.filter(t => t.tipo === 'Guardia Activa').length,
      guardias_pasivas: turnos.filter(t => t.tipo === 'Guardia Pasiva').length,
      atencion: turnos.filter(t => t.tipo === 'Atencion').length
    };

    res.render('dashboard/enfermero/mis-turnos', {
      title: 'Mis Turnos',
      user: req.user,
      turnos,
      calendario,
      turnoActual,
      proximoTurno,
      estadisticas,
      mesActual,
      anioActual,
      nombreMes: moment(`${anioActual}-${mesActual}`, 'YYYY-M').format('MMMM YYYY')
    });

  } catch (error) {
    console.error('Error al cargar mis turnos:', error);
    res.status(500).render('error', {
      message: 'Error al cargar turnos',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Ver detalle de turno específico
exports.verTurno = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ CORRECCIÓN
    const usuarioId = req.user.usuario_id;

    const turno = await TurnoPersonal.findOne({
      where: {
        id,
        usuario_id: usuarioId
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    if (!turno) {
      return res.status(404).render('error', {
        message: 'Turno no encontrado'
      });
    }

    const proximasOcurrencias = calcularProximasOcurrencias(turno, 10);

    res.render('dashboard/enfermero/mis-turnos-detalle', {
      title: 'Detalle de Turno',
      user: req.user,
      turno,
      proximasOcurrencias
    });

  } catch (error) {
    console.error('Error al ver turno:', error);
    res.status(500).render('error', {
      message: 'Error al cargar detalle del turno',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Obtener turnos del día
exports.turnosDelDia = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const usuarioId = req.user.usuario_id;
    const { fecha } = req.query;

    const fechaBusqueda = fecha ? new Date(fecha) : new Date();
    const diaSemana = fechaBusqueda.getDay();

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuarioId
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    const turnosDelDia = turnos.filter(turno => {
      const diasTurno = parsearDiasTurno(turno.dias);
      return diasTurno.includes(diaSemana);
    });

    res.json({
      success: true,
      fecha: fechaBusqueda.toISOString().split('T')[0],
      dia: moment(fechaBusqueda).format('dddd'),
      turnos: turnosDelDia.map(t => ({
        id: t.id,
        tipo: t.tipo,
        hora_inicio: t.hora_inicio,
        hora_fin: t.hora_fin,
        sector: t.sector.nombre
      }))
    });

  } catch (error) {
    console.error('Error al obtener turnos del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos'
    });
  }
};

// Obtener turnos de la semana
exports.turnosSemana = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const usuarioId = req.user.usuario_id;
    const { fecha } = req.query;

    const fechaRef = fecha ? new Date(fecha) : new Date();
    
    const inicioSemana = new Date(fechaRef);
    inicioSemana.setDate(fechaRef.getDate() - (fechaRef.getDay() === 0 ? 6 : fechaRef.getDay() - 1));

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuarioId
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    const semana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      
      const diaSemana = dia.getDay();
      const turnosDelDia = turnos.filter(turno => {
        const diasTurno = parsearDiasTurno(turno.dias);
        return diasTurno.includes(diaSemana);
      });

      semana.push({
        fecha: dia.toISOString().split('T')[0],
        dia: moment(dia).format('dddd'),
        turnos: turnosDelDia.map(t => ({
          id: t.id,
          tipo: t.tipo,
          hora_inicio: t.hora_inicio,
          hora_fin: t.hora_fin,
          sector: t.sector.nombre
        }))
      });
    }

    res.json({
      success: true,
      semana
    });

  } catch (error) {
    console.error('Error al obtener turnos de la semana:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener turnos'
    });
  }
};

// Exportar turnos a calendario (iCal)
exports.exportarCalendario = async (req, res) => {
  try {
    // ✅ CORRECCIÓN
    const usuarioId = req.user.usuario_id;

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuarioId
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Hospital//Turnos Personal//ES\n';
    ical += 'CALSCALE:GREGORIAN\n';
    ical += 'METHOD:PUBLISH\n';

    turnos.forEach(turno => {
      const diasTurno = parsearDiasTurno(turno.dias);
      
      const hoy = new Date();
      const finPeriodo = new Date();
      finPeriodo.setMonth(hoy.getMonth() + 3);

      let fecha = new Date(hoy);
      while (fecha <= finPeriodo) {
        if (diasTurno.includes(fecha.getDay())) {
          ical += 'BEGIN:VEVENT\n';
          ical += `UID:${turno.id}-${fecha.toISOString().split('T')[0]}@hospital\n`;
          ical += `DTSTAMP:${formatearFechaIcal(new Date())}\n`;
          ical += `DTSTART:${formatearFechaHoraIcal(fecha, turno.hora_inicio)}\n`;
          ical += `DTEND:${formatearFechaHoraIcal(fecha, turno.hora_fin)}\n`;
          ical += `SUMMARY:${turno.tipo} - ${turno.sector.nombre}\n`;
          ical += `DESCRIPTION:Turno de trabajo en ${turno.sector.nombre}\n`;
          ical += `LOCATION:${turno.sector.nombre}\n`;
          ical += 'END:VEVENT\n';
        }
        fecha.setDate(fecha.getDate() + 1);
      }
    });

    ical += 'END:VCALENDAR';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=mis-turnos.ics');
    res.send(ical);

  } catch (error) {
    console.error('Error al exportar calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar calendario'
    });
  }
};

// ============== FUNCIONES AUXILIARES ==============

function generarCalendario(mes, anio, turnos) {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  const diasMes = ultimoDia.getDate();
  
  const calendario = [];
  let semana = [];

  const diaSemanaInicio = primerDia.getDay();
  const diasVaciosInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
  
  for (let i = 0; i < diasVaciosInicio; i++) {
    semana.push({ dia: null, turnos: [] });
  }

  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = new Date(anio, mes - 1, dia);
    const diaSemana = fecha.getDay();
    
    const turnosDelDia = turnos.filter(turno => {
      const diasTurno = parsearDiasTurno(turno.dias);
      return diasTurno.includes(diaSemana);
    });

    semana.push({
      dia,
      fecha: fecha.toISOString().split('T')[0],
      esHoy: fecha.toDateString() === new Date().toDateString(),
      turnos: turnosDelDia
    });

    if (semana.length === 7) {
      calendario.push(semana);
      semana = [];
    }
  }

  while (semana.length < 7) {
    semana.push({ dia: null, turnos: [] });
  }
  if (semana.length > 0) {
    calendario.push(semana);
  }

  return calendario;
}

function parsearDiasTurno(dias) {
  const mapaDias = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Miercoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Sabado': 6
  };

  return dias.split(',').map(d => mapaDias[d.trim()]).filter(d => d !== undefined);
}

function convertirHoraAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function encontrarProximoTurno(turnos, ahora) {
  const diaActual = ahora.getDay();
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

  for (let turno of turnos) {
    const diasTurno = parsearDiasTurno(turno.dias);
    const horaInicio = convertirHoraAMinutos(turno.hora_inicio);

    if (diasTurno.includes(diaActual) && horaInicio > horaActual) {
      return turno;
    }
  }

  for (let i = 1; i <= 7; i++) {
    const diaBusqueda = (diaActual + i) % 7;
    
    for (let turno of turnos) {
      const diasTurno = parsearDiasTurno(turno.dias);
      if (diasTurno.includes(diaBusqueda)) {
        return turno;
      }
    }
  }

  return null;
}

function calcularProximasOcurrencias(turno, cantidad) {
  const ocurrencias = [];
  const diasTurno = parsearDiasTurno(turno.dias);
  
  let fecha = new Date();
  let encontradas = 0;

  while (encontradas < cantidad) {
    if (diasTurno.includes(fecha.getDay())) {
      ocurrencias.push({
        fecha: new Date(fecha).toISOString().split('T')[0],
        dia: moment(fecha).format('dddd, D [de] MMMM'),
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin
      });
      encontradas++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }

  return ocurrencias;
}

function formatearFechaIcal(fecha) {
  return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatearFechaHoraIcal(fecha, hora) {
  const [h, m] = hora.split(':');
  const fechaHora = new Date(fecha);
  fechaHora.setHours(parseInt(h), parseInt(m), 0, 0);
  return formatearFechaIcal(fechaHora);
}

module.exports = exports;