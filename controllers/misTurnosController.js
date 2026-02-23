const { TurnoPersonal, Sector, Usuario } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
moment.locale('es');

// Controlador principal de turnos para todos los roles
exports.misTurnos = async (req, res, next) => {
  try {
    
    const { usuario_id, rol, rol_ruta } = req.user;
    const { mes, anio } = req.query;

    const mesActual = mes ? parseInt(mes) : moment().month() + 1;
    const anioActual = anio ? parseInt(anio) : moment().year();

    // Obtener turnos del usuario
    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuario_id
      },
      include: [{
        model: Sector,
        as: 'sector',
        attributes: ['id', 'nombre', 'descripcion']
      }],
      order: [
        ['dias', 'ASC'],
        ['hora_inicio', 'ASC']
      ]
    });

    // Formatear turnos para mejor visualización
    const turnosFormateados = turnos.map(turno => ({
      id: turno.id,
      tipo: turno.tipo,
      dias: turno.dias.split(',').map(d => d.trim()),
      diasOriginal: turno.dias,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      sector: turno.sector,
      sector_nombre: turno.sector.nombre,
      horario: `${turno.hora_inicio} - ${turno.hora_fin}`
    }));

    // Generar calendario
    const calendario = generarCalendario(mesActual, anioActual, turnos);

    // Encontrar turno actual
    const ahora = moment();
    const diaActual = ahora.day();
    const horaActual = ahora.hours() * 60 + ahora.minutes();

    let turnoActual = null;
    let proximoTurno = null;

    for (const turno of turnos) {
      const diasTurno = parsearDiasTurno(turno.dias);
      const horaInicio = convertirHoraAMinutos(turno.hora_inicio);
      const horaFin = convertirHoraAMinutos(turno.hora_fin);

      // Verificar si es el turno actual
      if (diasTurno.includes(diaActual) && 
          horaActual >= horaInicio && 
          horaActual <= horaFin) {
        turnoActual = {
          ...turno.toJSON(),
          sector: turno.sector,
          tiempo_restante: `${Math.floor((horaFin - horaActual) / 60)}h ${(horaFin - horaActual) % 60}m`
        };
      }

      // Buscar próximo turno
      if (!proximoTurno && diasTurno.includes(diaActual) && horaInicio > horaActual) {
        proximoTurno = turno;
      }
    }

    // Si no hay próximo turno hoy, buscar en los próximos días
    if (!proximoTurno) {
      for (let i = 1; i <= 7; i++) {
        const diaBusqueda = (diaActual + i) % 7;
        const proximoTurnoEncontrado = turnos.find(turno => {
          const diasTurno = parsearDiasTurno(turno.dias);
          return diasTurno.includes(diaBusqueda);
        });
        
        if (proximoTurnoEncontrado) {
          proximoTurno = proximoTurnoEncontrado;
          break;
        }
      }
    }

    // Estadísticas
    const estadisticas = {
      total_turnos: turnos.length,
      guardias_activas: turnos.filter(t => t.tipo === 'Guardia Activa').length,
      guardias_pasivas: turnos.filter(t => t.tipo === 'Guardia Pasiva').length,
      atencion: turnos.filter(t => t.tipo === 'Atencion').length
    };

    // ✅ USAR LA RUTA CORRECTA DEL DASHBOARD (rol_ruta del middleware)
    const vista = `dashboard/${rol_ruta}/mis-turnos`;
    
    res.render(vista, {
      title: 'Mis Turnos',
      user: req.user, // ✅ Ya incluye todo del middleware
      turnos: turnosFormateados,
      calendario,
      turnoActual,
      proximoTurno,
      estadisticas,
      mesActual,
      anioActual,
      nombreMes: moment(`${anioActual}-${mesActual}`, 'YYYY-M').format('MMMM YYYY'),
      hoy: moment().format('YYYY-MM-DD'),
      moment: moment
    });

  } catch (error) {
    console.error('Error al cargar mis turnos:', error);
    next(error);
  }
};
// NUEVA FUNCIÓN - Obtener próximas fechas (API para modal)
exports.getProximasFechas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.user;

    console.log('=== API PROXIMAS FECHAS ===');
    console.log('Turno ID:', id);
    console.log('Usuario ID:', usuario_id);

    const turno = await TurnoPersonal.findOne({
      where: { 
        id: parseInt(id), 
        usuario_id: usuario_id
      },
      attributes: ['id', 'tipo', 'dias', 'hora_inicio', 'hora_fin', 'sector_id'],
      include: [{ 
        model: Sector, 
        as: 'sector',
        attributes: ['id', 'nombre']
      }]
    });

    if (!turno) {
      console.log('❌ Turno no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Turno no encontrado' 
      });
    }

    console.log('✅ Turno encontrado:', turno.id);
    
    // Asegurar que días es string
    const diasString = turno.dias || '';
    
    // Calcular próximas ocurrencias
    const proximasOcurrencias = calcularProximasOcurrencias({
      id: turno.id,
      tipo: turno.tipo,
      dias: diasString,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      sector: turno.sector
    }, 10);

    console.log('Ocurrencias calculadas:', proximasOcurrencias.length);

    res.json({
      success: true,
      turno: {
        id: turno.id,
        tipo: turno.tipo,
        dias: turno.dias,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        sector_nombre: turno.sector?.nombre || 'Sin sector'
      },
      proximasOcurrencias
    });

  } catch (error) {
    console.error('❌ Error en getProximasFechas:', error);
    next(error);
  }
};
// Ver detalle de turno específico
exports.verTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario_id, rol_ruta } = req.user; 

    const turno = await TurnoPersonal.findOne({
      where: {
        id,
        usuario_id: usuario_id
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    if (!turno) {
      return res.status(404).render('error', {
        message: 'Turno no encontrado',
        user: req.user
      });
    }

    const proximasOcurrencias = calcularProximasOcurrencias(turno, 10);

    res.render(`dashboard/${rol_ruta}/mis-turnos-detalle`, {
      title: 'Detalle de Turno',
      user: req.user,
      turno,
      proximasOcurrencias,
      dias: turno.dias.split(',').map(d => d.trim())
    });

  } catch (error) {
    console.error('Error al ver turno:', error);
    next(error);
  }
};

// API: Obtener turnos del día
exports.turnosDelDia = async (req, res, next) => {
  try {
    const { usuario_id } = req.user; // ✅ Usar del middleware
    const { fecha } = req.query;

    const fechaBusqueda = fecha ? moment(fecha) : moment();
    const diaSemana = fechaBusqueda.day();

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuario_id
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
      fecha: fechaBusqueda.format('YYYY-MM-DD'),
      dia: fechaBusqueda.format('dddd'),
      turnos: turnosDelDia.map(t => ({
        id: t.id,
        tipo: t.tipo,
        hora_inicio: t.hora_inicio,
        hora_fin: t.hora_fin,
        sector: t.sector.nombre,
        sector_id: t.sector.id,
        horario: `${t.hora_inicio} - ${t.hora_fin}`
      }))
    });

  } catch (error) {
    console.error('Error al obtener turnos del día:', error);
    next(error);
  }
};

// API: Obtener turnos de la semana
exports.turnosSemana = async (req, res, next) => {
  try {
    const { usuario_id } = req.user; // ✅ Usar del middleware
    const { fecha } = req.query;

    const fechaRef = fecha ? moment(fecha) : moment();
    
    // Lunes como inicio de semana
    const inicioSemana = fechaRef.clone().startOf('isoWeek');

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuario_id
      },
      include: [{
        model: Sector,
        as: 'sector'
      }]
    });

    const semana = [];
    for (let i = 0; i < 7; i++) {
      const dia = inicioSemana.clone().add(i, 'days');
      const diaSemana = dia.day();
      
      const turnosDelDia = turnos.filter(turno => {
        const diasTurno = parsearDiasTurno(turno.dias);
        return diasTurno.includes(diaSemana);
      });

      semana.push({
        fecha: dia.format('YYYY-MM-DD'),
        dia: dia.format('dddd'),
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
      semana,
      inicio_semana: inicioSemana.format('YYYY-MM-DD'),
      fin_semana: inicioSemana.clone().add(6, 'days').format('YYYY-MM-DD')
    });

  } catch (error) {
    console.error('Error al obtener turnos de la semana:', error);
    next(error);
  }
};

// Exportar turnos a calendario (iCal)
exports.exportarCalendario = async (req, res, next) => {
  try {
    const { usuario_id } = req.user; // ✅ Usar del middleware

    const turnos = await TurnoPersonal.findAll({
      where: {
        usuario_id: usuario_id
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
    next(error);
  }
};

// ============== FUNCIONES AUXILIARES ==============

function generarCalendario(mes, anio, turnos) {
  const primerDia = moment(`${anio}-${mes}-01`, 'YYYY-MM-DD');
  const ultimoDia = primerDia.clone().endOf('month');
  const diasMes = ultimoDia.date();
  
  const calendario = [];
  let semana = [];

  const diaSemanaInicio = primerDia.day();
  const diasVaciosInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
  
  // Días vacíos al inicio
  for (let i = 0; i < diasVaciosInicio; i++) {
    semana.push({ dia: null, turnos: [] });
  }

  // Días del mes
  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = moment(`${anio}-${mes}-${dia}`, 'YYYY-MM-DD');
    const diaSemana = fecha.day();
    
    const turnosDelDia = turnos.filter(turno => {
      const diasTurno = parsearDiasTurno(turno.dias);
      return diasTurno.includes(diaSemana);
    }).map(turno => ({
      id: turno.id,
      tipo: turno.tipo,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      sector: turno.sector.nombre
    }));

    semana.push({
      dia,
      fecha: fecha.format('YYYY-MM-DD'),
      esHoy: fecha.isSame(moment(), 'day'),
      turnos: turnosDelDia,
      tieneTurnos: turnosDelDia.length > 0
    });

    if (semana.length === 7) {
      calendario.push(semana);
      semana = [];
    }
  }

  // Días vacíos al final
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
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6
  };

  return dias.toLowerCase()
    .split(',')
    .map(d => mapaDias[d.trim()])
    .filter(d => d !== undefined);
}

function convertirHoraAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function calcularProximasOcurrencias(turno, cantidad) {
  const ocurrencias = [];
  const diasTurno = parsearDiasTurno(turno.dias);
  
  let fecha = moment();
  let encontradas = 0;

  while (encontradas < cantidad) {
    if (diasTurno.includes(fecha.day())) {
      ocurrencias.push({
        fecha: fecha.format('YYYY-MM-DD'),
        dia: fecha.format('dddd, D [de] MMMM'),
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        esHoy: fecha.isSame(moment(), 'day')
      });
      encontradas++;
    }
    fecha.add(1, 'day');
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