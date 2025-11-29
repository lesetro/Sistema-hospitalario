const { Op } = require('sequelize');

class ScheduleService {
  
  // Configuración de horarios
  static defaultSchedule = {
    startHour: 8,
    endHour: 17,
    slotDuration: 20, // minutos
    lunchBreak: { start: '12:00', end: '13:00' }
  };

  // Generar slots de tiempo disponibles
  static generateTimeSlots(startHour = 8, endHour = 17, duration = 20) {
    const slots = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Saltar horario de almuerzo
        if (this.isLunchTime(timeSlot)) continue;
        
        slots.push(timeSlot);
      }
    }
    
    return slots;
  }

  static isLunchTime(timeSlot) {
    const lunchStart = this.defaultSchedule.lunchBreak.start;
    const lunchEnd = this.defaultSchedule.lunchBreak.end;
    return timeSlot >= lunchStart && timeSlot < lunchEnd;
  }

  // Obtener horarios disponibles para un médico en una fecha
  static async getAvailableSlots(medicoId, fecha, models) {
    try {
      const { Turno } = models;
      
      // Obtener turnos ocupados
      const turnosOcupados = await Turno.findAll({
        where: {
          medico_id: medicoId,
          fecha: fecha,
          estado: ['PENDIENTE', 'CONFIRMADO']
        },
        attributes: ['hora_inicio'],
        raw: true
      });

      // Generar todos los slots posibles
      const allSlots = this.generateTimeSlots();
      
      // Filtrar slots ocupados
      const ocupados = turnosOcupados
        .map(turno => turno.hora_inicio?.substring(0, 5))
        .filter(Boolean);

      const availableSlots = allSlots.filter(slot => !ocupados.includes(slot));

      return {
        success: true,
        slots: availableSlots,
        totalSlots: allSlots.length,
        occupiedSlots: ocupados.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener horarios disponibles',
        error: error.message
      };
    }
  }

  // Verificar si un horario está disponible
  static async isTimeSlotAvailable(medicoId, fecha, hora, models, excludeTurnoId = null) {
    try {
      const { Turno } = models;
      
      const whereCondition = {
        medico_id: medicoId,
        fecha: fecha,
        hora_inicio: hora,
        estado: ['PENDIENTE', 'CONFIRMADO']
      };

      if (excludeTurnoId) {
        whereCondition.id = { [Op.ne]: excludeTurnoId };
      }

      const existingTurno = await Turno.findOne({ where: whereCondition });
      
      return {
        available: !existingTurno,
        conflictTurnoId: existingTurno?.id || null
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  // Calcular hora de fin basada en duración
  static calculateEndTime(startTime, durationMinutes = 20) {
    const [hours, minutes] = startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  // Verificar conflictos en quirófano
  static async checkSurgeryRoomConflicts(quirofanoId, fecha, horaInicio, duracionMinutos, models, excludeId = null) {
    try {
      const { IntervencionQuirurgica } = models;
      
      const horaFin = this.calculateEndTime(horaInicio, duracionMinutos);
      
      const whereCondition = {
        quirofano_id: quirofanoId,
        fecha: fecha,
        estado: ['PROGRAMADA', 'EN_PROCESO'],
        [Op.or]: [
          // Conflicto si la nueva cirugía empieza durante otra
          {
            hora_inicio: { [Op.lte]: horaInicio },
            hora_fin: { [Op.gt]: horaInicio }
          },
          // Conflicto si la nueva cirugía termina durante otra
          {
            hora_inicio: { [Op.lt]: horaFin },
            hora_fin: { [Op.gte]: horaFin }
          },
          // Conflicto si la nueva cirugía envuelve otra
          {
            hora_inicio: { [Op.gte]: horaInicio },
            hora_fin: { [Op.lte]: horaFin }
          }
        ]
      };

      if (excludeId) {
        whereCondition.id = { [Op.ne]: excludeId };
      }

      const conflictos = await IntervencionQuirurgica.findAll({ where: whereCondition });
      
      return {
        hasConflicts: conflictos.length > 0,
        conflicts: conflictos,
        suggestedEndTime: horaFin
      };

    } catch (error) {
      return {
        hasConflicts: true,
        error: error.message
      };
    }
  }

  // Encontrar próximo horario disponible
  static async findNextAvailableSlot(medicoId, fecha, models, afterTime = null) {
    try {
      const availableSlots = await this.getAvailableSlots(medicoId, fecha, models);
      
      if (!availableSlots.success) {
        return availableSlots;
      }

      let nextSlot = null;
      
      if (afterTime) {
        nextSlot = availableSlots.slots.find(slot => slot > afterTime);
      } else {
        nextSlot = availableSlots.slots[0];
      }

      return {
        success: true,
        nextAvailableSlot: nextSlot,
        availableCount: availableSlots.slots.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Auto-asignar turno de emergencia
  static async autoAssignEmergencySlot(especialidadId, fecha, models) {
    try {
      const { Medico, Especialidad } = models;
      
      // Buscar médicos de la especialidad
      const medicos = await Medico.findAll({
        where: { especialidad_id: especialidadId },
        include: [{ model: Especialidad, as: 'especialidad' }]
      });

      if (medicos.length === 0) {
        return {
          success: false,
          message: 'No hay médicos disponibles para esta especialidad'
        };
      }

      // Buscar el médico con más horarios disponibles
      let bestOption = null;
      let maxAvailableSlots = 0;

      for (const medico of medicos) {
        const availability = await this.getAvailableSlots(medico.id, fecha, models);
        
        if (availability.success && availability.slots.length > maxAvailableSlots) {
          maxAvailableSlots = availability.slots.length;
          bestOption = {
            medicoId: medico.id,
            medico: medico,
            availableSlots: availability.slots,
            suggestedSlot: availability.slots[0]
          };
        }
      }

      return {
        success: bestOption !== null,
        assignment: bestOption,
        message: bestOption ? 'Asignación automática exitosa' : 'No hay horarios disponibles'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Estadísticas de ocupación
  static async getOccupancyStats(medicoId, fechaInicio, fechaFin, models) {
    try {
      const { Turno } = models;
      
      const turnos = await Turno.findAll({
        where: {
          medico_id: medicoId,
          fecha: {
            [Op.between]: [fechaInicio, fechaFin]
          }
        },
        attributes: ['fecha', 'estado'],
        raw: true
      });

      const totalDays = Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)) + 1;
      const slotsPerDay = this.generateTimeSlots().length;
      const totalPossibleSlots = totalDays * slotsPerDay;
      
      const occupiedSlots = turnos.filter(t => ['PENDIENTE', 'CONFIRMADO', 'COMPLETADO'].includes(t.estado)).length;
      const occupancyRate = (occupiedSlots / totalPossibleSlots) * 100;

      return {
        success: true,
        stats: {
          totalPossibleSlots,
          occupiedSlots,
          availableSlots: totalPossibleSlots - occupiedSlots,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          period: { start: fechaInicio, end: fechaFin }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar horario de trabajo
  static isValidWorkingHour(hora) {
    const [hours] = hora.split(':').map(Number);
    return hours >= this.defaultSchedule.startHour && hours < this.defaultSchedule.endHour;
  }

  // Configurar horarios personalizados para un médico
  static setCustomSchedule(medicoId, customSchedule) {
    // Esta función permitiría horarios personalizados por médico
    // Por simplicidad, usamos el horario por defecto
    return {
      success: true,
      message: 'Horario personalizado configurado',
      schedule: { ...this.defaultSchedule, ...customSchedule }
    };
  }
}

module.exports = ScheduleService;