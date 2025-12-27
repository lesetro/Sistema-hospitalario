
// ============================================================================
// UTILIDADES COMPARTIDAS PARA HORARIOS DE MÉDICOS
// ============================================================================

const { Turno, TurnoPersonal, Medico } = require('../models'); // ✅ Agregar Medico aquí
const { Op } = require('sequelize');

/**
 * Obtener horarios disponibles de un médico para una fecha específica
 * @param {number} medico_id - ID del médico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} duracion - Duración del turno en minutos (default: 20)
 * @returns {Promise<Array>} Array de horarios disponibles
 */
const obtenerHorariosDisponibles = async (medico_id, fecha, duracion = 20) => {
  try {
    console.log(`🔍 Buscando horarios para médico ID: ${medico_id}, fecha: ${fecha}`);
    
    // 1. Obtener el usuario_id del médico
    const medico = await Medico.findByPk(medico_id, {
      attributes: ['id', 'usuario_id']
    });

    if (!medico) {
      console.log(`❌ Médico ${medico_id} no encontrado`);
      return {
        success: false,
        message: 'Médico no encontrado',
        horarios: []
      };
    }

    console.log(` Médico encontrado. usuario_id: ${medico.usuario_id}`);

    // 2. Obtener turnos del médico usando usuario_id
    const turnosPersonal = await TurnoPersonal.findAll({
      where: {
        usuario_id: medico.usuario_id,
        tipo: 'Atencion'
      }
    });

    if (!turnosPersonal || turnosPersonal.length === 0) {
      console.log(` Médico ${medico_id} (usuario_id: ${medico.usuario_id}) no tiene horarios de atención configurados`);
      console.log(' Verifica que existan registros en turnospersonal con:');
      console.log(`   - usuario_id = ${medico.usuario_id}`);
      console.log(`   - tipo = 'Atencion'`);
      
      return {
        success: false,
        message: 'El médico no tiene horarios de atención configurados',
        horarios: []
      };
    }

    console.log(` Médico ${medico_id} tiene ${turnosPersonal.length} horario(s) configurado(s)`);
    console.log(' Horarios encontrados:', turnosPersonal.map(t => ({ 
      dias: t.dias, 
      inicio: t.hora_inicio, 
      fin: t.hora_fin 
    })));

    // 3. Obtener día de la semana de la fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    console.log(` Fecha solicitada: ${fecha} → ${diaSemana}`);

    // 4. Filtrar turnos del médico para ese día
    const turnoDelDia = turnosPersonal.find(turno => {
      console.log(` Comparando: "${turno.dias}" contiene "${diaSemana}"?`);
      return turno.dias.includes(diaSemana);
    });

    if (!turnoDelDia) {
      console.log(`❌ El médico NO atiende los ${diaSemana}`);
      console.log(`📋 Días que atiende: ${turnosPersonal.map(t => t.dias).join(' | ')}`);
      
      return {
        success: false,
        message: `El médico no atiende los días ${diaSemana}`,
        horarios: []
      };
    }

    console.log(` Turno encontrado para ${diaSemana}:`);
    console.log(`   Horario: ${turnoDelDia.hora_inicio} - ${turnoDelDia.hora_fin}`);

    // 5. Obtener turnos ya asignados para esa fecha
    const turnosOcupados = await Turno.findAll({
      where: {
        medico_id,
        fecha,
        estado: {
          [Op.in]: ['PENDIENTE', 'CONFIRMADO']
        }
      },
      attributes: ['hora_inicio', 'hora_fin']
    });

    console.log(` Turnos ocupados: ${turnosOcupados.length}`);
    if (turnosOcupados.length > 0) {
      console.log(' Horarios ocupados:', turnosOcupados.map(t => `${t.hora_inicio}-${t.hora_fin}`));
    }

    // 6. Generar slots disponibles
    const horaInicio = turnoDelDia.hora_inicio;
    const horaFin = turnoDelDia.hora_fin;
    
    const slots = generarSlots(horaInicio, horaFin, duracion);
    console.log(` Slots generados: ${slots.length} (cada ${duracion} minutos)`);
    
    // 7. Filtrar slots que no estén ocupados
    const slotsDisponibles = slots.filter(slot => {
      const ocupado = turnosOcupados.some(turno => {
        const turnoInicio = turno.hora_inicio;
        const turnoFin = turno.hora_fin;
        
        // Verificar si hay superposición
        return (
          (slot >= turnoInicio && slot < turnoFin) ||
          (calcularHoraFin(slot, duracion) > turnoInicio && calcularHoraFin(slot, duracion) <= turnoFin)
        );
      });
      
      return !ocupado;
    });

    console.log(` Slots disponibles: ${slotsDisponibles.length}`);
    console.log(` Horarios: ${slotsDisponibles.join(', ')}`);

    return {
      success: true,
      horarios: slotsDisponibles,
      turnoPersonal: {
        horaInicio,
        horaFin,
        dia: diaSemana
      }
    };

  } catch (error) {
    console.error('❌ Error al obtener horarios disponibles:', error);
    return {
      success: false,
      message: 'Error al obtener horarios disponibles',
      error: error.message,
      horarios: []
    };
  }
};

/**
 * Generar slots de tiempo
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {string} horaFin - Hora de fin en formato HH:MM
 * @param {number} duracion - Duración de cada slot en minutos
 * @returns {Array<string>} Array de horarios en formato HH:MM
 */
function generarSlots(horaInicio, horaFin, duracion) {
  const slots = [];
  
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
  
  let minutosActuales = horaInicioH * 60 + horaInicioM;
  const minutosFinales = horaFinH * 60 + horaFinM;
  
  while (minutosActuales + duracion <= minutosFinales) {
    const horas = Math.floor(minutosActuales / 60);
    const minutos = minutosActuales % 60;
    
    const horaFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    slots.push(horaFormateada);
    
    minutosActuales += duracion;
  }
  
  return slots;
}

/**
 * Calcular hora de fin dado un horario y duración
 * @param {string} horaInicio - Hora en formato HH:MM
 * @param {number} duracion - Duración en minutos
 * @returns {string} Hora de fin en formato HH:MM
 */
function calcularHoraFin(horaInicio, duracion) {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  let minutosTotal = horas * 60 + minutos + duracion;
  
  const nuevasHoras = Math.floor(minutosTotal / 60);
  const nuevosMinutos = minutosTotal % 60;
  
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
}

/**
 * Validar si un horario está disponible
 * @param {number} medico_id - ID del médico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} hora - Hora en formato HH:MM
 * @returns {Promise<boolean>} True si está disponible
 */
const validarHorarioDisponible = async (medico_id, fecha, hora) => {
  try {
    const turnoExistente = await Turno.findOne({
      where: {
        medico_id,
        fecha,
        hora_inicio: hora,
        estado: {
          [Op.in]: ['PENDIENTE', 'CONFIRMADO']
        }
      }
    });
    
    return !turnoExistente;
  } catch (error) {
    console.error('Error al validar horario:', error);
    return false;
  }
};

module.exports = {
  obtenerHorariosDisponibles,
  validarHorarioDisponible,
  generarSlots,
  calcularHoraFin
};