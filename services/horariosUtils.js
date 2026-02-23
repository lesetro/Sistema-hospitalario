// ============================================================================
// UTILIDADES COMPARTIDAS PARA HORARIOS DE MÉDICOS (ACTUALIZADA)
// ============================================================================

const { Turno, TurnoPersonal, Medico, TipoDeServicio, Sector, Usuario } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener horarios disponibles de un médico para una fecha específica
 * @param {number} medico_id - ID del médico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} duracion - Duración del turno en minutos (default: 20)
 * @param {number} tipo_servicio_id - ID del tipo de servicio (opcional)
 * @returns {Promise<Object>} Objeto con horarios disponibles y validaciones
 */
const obtenerHorariosDisponibles = async (medico_id, fecha, duracion = 20, tipo_servicio_id = null) => {
  try {
    console.log(`🔍 Buscando horarios para médico ID: ${medico_id}, fecha: ${fecha}, servicio: ${tipo_servicio_id}`);
    
    // 1. Obtener el médico con su información completa
   
    const medico = await Medico.findByPk(medico_id, {
      include: [
        { model: Usuario, as: 'usuario' },
        { model: Sector, as: 'sector' }
      ]
    });

    if (!medico) {
      return {
        success: false,
        message: 'Médico no encontrado',
        horarios: []
      };
    }

    // 2. VALIDACIÓN: Si se especifica tipo_servicio, verificar compatibilidad
    if (tipo_servicio_id) {
      const servicioValido = await validarServicioMedico(medico_id, tipo_servicio_id);
      
      if (!servicioValido.disponible) {
        return {
          success: false,
          message: servicioValido.mensaje,
          horarios: []
        };
      }
    }

    console.log(`✅ Médico encontrado: ${medico.usuario?.nombre || 'N/A'}`);
    console.log(`📋 Sector del médico: ${medico.sector?.nombre || 'Sin sector'} (ID: ${medico.sector_id})`);

    // 3. Obtener turnos del médico usando usuario_id
    const turnosPersonal = await TurnoPersonal.findAll({
      where: {
        usuario_id: medico.usuario_id,
        tipo: { [Op.in]: ['Atencion', 'Guardia Activa', 'Guardia Pasiva', 'Cirugía Programada'] }
      }
    });

    if (!turnosPersonal || turnosPersonal.length === 0) {
      return {
        success: false,
        message: 'El médico no tiene horarios de atención configurados',
        horarios: []
      };
    }

    console.log(`📅 Médico tiene ${turnosPersonal.length} horario(s) configurado(s)`);

    // 4. Obtener día de la semana de la fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    console.log(`📅 Fecha solicitada: ${fecha} → ${diaSemana}`);

    // 5. Filtrar turnos del médico para ese día
    const turnosDelDia = turnosPersonal.filter(turno => {
      return turno.dias.includes(diaSemana);
    });

    if (turnosDelDia.length === 0) {
      return {
        success: false,
        message: `El médico no atiende los días ${diaSemana}`,
        horarios: []
      };
    }

    console.log(`✅ Encontrados ${turnosDelDia.length} turno(s) para ${diaSemana}`);

    // 6. Obtener turnos ya asignados para esa fecha
    const turnosOcupados = await Turno.findAll({
      where: {
        medico_id,
        fecha,
        estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] }
      },
      attributes: ['hora_inicio', 'hora_fin']
    });

    console.log(`📊 Turnos ocupados: ${turnosOcupados.length}`);

    // 7. Calcular capacidad disponible (si hay tipo_servicio)
    let capacidadInfo = null;
    if (tipo_servicio_id) {
      capacidadInfo = await calcularCapacidadServicio(tipo_servicio_id, fecha, medico_id);
      
      if (capacidadInfo.capacidad_disponible <= 0) {
        return {
          success: false,
          message: `Sin capacidad disponible para este servicio. Máximo: ${capacidadInfo.capacidad_total}`,
          horarios: []
        };
      }
    }

    // 8. Generar slots disponibles para cada turno del día
    let todosSlotsDisponibles = [];
    
    for (const turnoDelDia of turnosDelDia) {
      const horaInicio = turnoDelDia.hora_inicio;
      const horaFin = turnoDelDia.hora_fin;
      
      console.log(`⏰ Procesando turno: ${horaInicio} - ${horaFin}`);
      
      const slots = generarSlots(horaInicio, horaFin, duracion);
      console.log(`📋 Slots generados: ${slots.length} (cada ${duracion} minutos)`);
      
      // Filtrar slots que no estén ocupados
      const slotsDisponibles = slots.filter(slot => {
        const ocupado = turnosOcupados.some(turno => {
          return haySuperposicion(slot, calcularHoraFin(slot, duracion), turno.hora_inicio, turno.hora_fin);
        });
        
        return !ocupado;
      });
      
      todosSlotsDisponibles = [...todosSlotsDisponibles, ...slotsDisponibles];
    }

    console.log(`✅ Total slots disponibles: ${todosSlotsDisponibles.length}`);

    return {
      success: true,
      horarios: todosSlotsDisponibles,
      turnoPersonal: {
        horaInicio: turnosDelDia[0]?.hora_inicio,
        horaFin: turnosDelDia[0]?.hora_fin,
        dia: diaSemana,
        tipo: turnosDelDia[0]?.tipo
      },
      capacidad: capacidadInfo,
      estadisticas: {
        turnosOcupados: turnosOcupados.length,
        slotsDisponibles: todosSlotsDisponibles.length
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
 * Validar si un médico puede atender un tipo de servicio
 */
const validarServicioMedico = async (medico_id, tipo_servicio_id) => {
  try {
    // Obtener el servicio
    const servicio = await TipoDeServicio.findByPk(tipo_servicio_id, {
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!servicio) {
      return {
        disponible: false,
        mensaje: 'Servicio no encontrado'
      };
    }

    // Obtener el médico con su sector
    const medico = await Medico.findByPk(medico_id, {
      include: [{ model: Sector, as: 'sector' }]
    });

    if (!medico) {
      return {
        disponible: false,
        mensaje: 'Médico no encontrado'
      };
    }

    // Validar que el médico esté en el mismo sector que el servicio
    if (medico.sector_id !== servicio.sector_id) {
      return {
        disponible: false,
        mensaje: `El médico pertenece al sector "${medico.sector?.nombre || 'N/A'}" y el servicio está en "${servicio.sector?.nombre || 'N/A'}"`
      };
    }

    return {
      disponible: true,
      mensaje: 'Servicio válido para el médico',
      servicio,
      medico
    };

  } catch (error) {
    console.error('Error en validarServicioMedico:', error);
    return {
      disponible: false,
      mensaje: 'Error al validar el servicio'
    };
  }
};

/**
 * Calcular capacidad disponible para un servicio
 */
const calcularCapacidadServicio = async (tipo_servicio_id, fecha, medico_id = null) => {
  try {
    // 1. Contar turnos ya asignados para este servicio en la fecha
    const whereClause = {
      tipo_servicio_id,
      fecha,
      estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] }
    };

    // Si se especifica médico, contar solo sus turnos
    if (medico_id) {
      whereClause.medico_id = medico_id;
    }

    const turnosAsignados = await Turno.count({
      where: whereClause
    });

    // 2. Obtener capacidad del servicio (podrías agregar este campo a TipoDeServicio)
    const servicio = await TipoDeServicio.findByPk(tipo_servicio_id);
    const capacidadTotal = servicio.capacidad_diaria || 10; // Valor por defecto

    return {
      capacidad_total: capacidadTotal,
      capacidad_ocupada: turnosAsignados,
      capacidad_disponible: Math.max(0, capacidadTotal - turnosAsignados),
      mensaje: turnosAsignados >= capacidadTotal 
        ? 'Capacidad completa para este servicio' 
        : `Disponible: ${capacidadTotal - turnosAsignados}/${capacidadTotal}`
    };

  } catch (error) {
    console.error('Error en calcularCapacidadServicio:', error);
    return {
      capacidad_total: 10,
      capacidad_ocupada: 0,
      capacidad_disponible: 10,
      mensaje: 'Error al calcular capacidad'
    };
  }
};

/**
 * Verificar superposición de horarios
 */
function haySuperposicion(inicio1, fin1, inicio2, fin2) {
  return (
    (inicio1 >= inicio2 && inicio1 < fin2) ||
    (fin1 > inicio2 && fin1 <= fin2) ||
    (inicio2 >= inicio1 && inicio2 < fin1) ||
    (fin2 > inicio1 && fin2 <= fin1)
  );
}

/**
 * Generar slots de tiempo (mantener tu función original)
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
 * Calcular hora de fin
 */
function calcularHoraFin(horaInicio, duracion) {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  let minutosTotal = horas * 60 + minutos + duracion;
  
  const nuevasHoras = Math.floor(minutosTotal / 60);
  const nuevosMinutos = minutosTotal % 60;
  
  return `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}`;
}

/**
 * Validar si un horario está disponible (versión mejorada)
 */
const validarHorarioDisponible = async (medico_id, fecha, hora, duracion = 20, tipo_servicio_id = null) => {
  try {
    // 1. Verificar si ya existe un turno en ese horario
    const turnoExistente = await Turno.findOne({
      where: {
        medico_id,
        fecha,
        estado: { [Op.in]: ['PENDIENTE', 'CONFIRMADO'] },
        [Op.or]: [
          {
            hora_inicio: { [Op.lte]: hora },
            hora_fin: { [Op.gt]: hora }
          },
          {
            hora_inicio: { [Op.lt]: calcularHoraFin(hora, duracion) },
            hora_fin: { [Op.gte]: calcularHoraFin(hora, duracion) }
          }
        ]
      }
    });
    
    if (turnoExistente) {
      return {
        disponible: false,
        mensaje: 'El médico ya tiene un turno asignado en ese horario'
      };
    }

    // 2. Si hay tipo_servicio, validar capacidad
    if (tipo_servicio_id) {
      const capacidad = await calcularCapacidadServicio(tipo_servicio_id, fecha, medico_id);
      
      if (capacidad.capacidad_disponible <= 0) {
        return {
          disponible: false,
          mensaje: `Sin capacidad disponible para este servicio (${capacidad.capacidad_ocupada}/${capacidad.capacidad_total})`
        };
      }
    }

    return {
      disponible: true,
      mensaje: 'Horario disponible'
    };

  } catch (error) {
    console.error('Error al validar horario:', error);
    return {
      disponible: false,
      mensaje: 'Error al validar el horario'
    };
  }
};

module.exports = {
  obtenerHorariosDisponibles,
  validarHorarioDisponible,
  validarServicioMedico,
  calcularCapacidadServicio,
  generarSlots,
  calcularHoraFin
};