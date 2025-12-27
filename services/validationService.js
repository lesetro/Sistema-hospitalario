class ValidationService {
  
  // Validaciones básicas
  static validateDNI(dni) {
    if (!dni) return { valid: false, message: 'DNI es requerido' };
    
    const dniStr = dni.toString().replace(/\D/g, '');
    if (dniStr.length < 7 || dniStr.length > 8) {
      return { valid: false, message: 'DNI debe tener entre 7 y 8 dígitos' };
    }
    
    return { valid: true };
  }

  static validateEmail(email) {
    if (!email) return { valid: false, message: 'Email es requerido' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Formato de email inválido' };
    }
    
    return { valid: true };
  }

  static validatePhone(phone) {
    if (!phone) return { valid: true }; 
    
    const phoneStr = phone.toString().replace(/\D/g, '');
    if (phoneStr.length < 10 || phoneStr.length > 15) {
      return { valid: false, message: 'Teléfono debe tener entre 10 y 15 dígitos' };
    }
    
    return { valid: true };
  }

  static validateDate(date, fieldName = 'Fecha') {
    if (!date) return { valid: false, message: `${fieldName} es requerida` };
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { valid: false, message: `${fieldName} inválida` };
    }
    
    return { valid: true, date: dateObj };
  }

  static validateBirthDate(birthDate) {
    const validation = this.validateDate(birthDate, 'Fecha de nacimiento');
    if (!validation.valid) return validation;
    
    const today = new Date();
    const birth = validation.date;
    
    if (birth > today) {
      return { valid: false, message: 'La fecha de nacimiento no puede ser futura' };
    }
    
    const age = today.getFullYear() - birth.getFullYear();
    if (age > 120) {
      return { valid: false, message: 'Fecha de nacimiento no válida (edad mayor a 120 años)' };
    }
    
    return { valid: true, age };
  }

  // Validaciones médicas específicas
  static validateVitalSigns(vitals) {
    const errors = [];
    
    if (vitals.presion_sistolica) {
      const sistolica = parseInt(vitals.presion_sistolica);
      if (sistolica < 70 || sistolica > 200) {
        errors.push('Presión sistólica debe estar entre 70 y 200 mmHg');
      }
    }
    
    if (vitals.presion_diastolica) {
      const diastolica = parseInt(vitals.presion_diastolica);
      if (diastolica < 40 || diastolica > 120) {
        errors.push('Presión diastólica debe estar entre 40 y 120 mmHg');
      }
    }
    
    if (vitals.temperatura) {
      const temp = parseFloat(vitals.temperatura);
      if (temp < 35 || temp > 42) {
        errors.push('Temperatura debe estar entre 35°C y 42°C');
      }
    }
    
    if (vitals.frecuencia_cardiaca) {
      const fc = parseInt(vitals.frecuencia_cardiaca);
      if (fc < 40 || fc > 200) {
        errors.push('Frecuencia cardíaca debe estar entre 40 y 200 bpm');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateAppointmentTime(fecha, hora) {
    const dateValidation = this.validateDate(fecha, 'Fecha del turno');
    if (!dateValidation.valid) return dateValidation;
    
    if (!hora) return { valid: false, message: 'Hora del turno es requerida' };
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(hora)) {
      return { valid: false, message: 'Formato de hora inválido (HH:MM)' };
    }
    
    // Verificar que la fecha/hora no sea en el pasado
    const appointmentDateTime = new Date(`${fecha}T${hora}`);
    if (appointmentDateTime < new Date()) {
      return { valid: false, message: 'No se pueden agendar turnos en el pasado' };
    }
    
    return { valid: true };
  }

  // Validación de formularios completos
  static validatePatientForm(data) {
    const errors = [];
    
    // Campos obligatorios
    const requiredFields = ['nombre', 'apellido', 'dni', 'email', 'fecha_nacimiento', 'sexo'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`${field.replace('_', ' ')} es requerido`);
      }
    });
    
    // Validaciones específicas
    if (data.dni) {
      const dniValidation = this.validateDNI(data.dni);
      if (!dniValidation.valid) errors.push(dniValidation.message);
    }
    
    if (data.email) {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.valid) errors.push(emailValidation.message);
    }
    
    if (data.telefono) {
      const phoneValidation = this.validatePhone(data.telefono);
      if (!phoneValidation.valid) errors.push(phoneValidation.message);
    }
    
    if (data.fecha_nacimiento) {
      const birthValidation = this.validateBirthDate(data.fecha_nacimiento);
      if (!birthValidation.valid) errors.push(birthValidation.message);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateAdmissionForm(data) {
    const errors = [];
    
    // Campos obligatorios
    const requiredFields = ['paciente_id', 'administrativo_id', 'motivo_id', 'forma_ingreso_id', 'fecha'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`${field.replace('_', ' ')} es requerido`);
      }
    });
    
    // Validar fecha de admisión
    if (data.fecha) {
      const dateValidation = this.validateDate(data.fecha, 'Fecha de admisión');
      if (!dateValidation.valid) errors.push(dateValidation.message);
    }
    
    // Validar turno si se proporciona
    if (data.turno_fecha && data.turno_hora) {
      const appointmentValidation = this.validateAppointmentTime(data.turno_fecha, data.turno_hora);
      if (!appointmentValidation.valid) errors.push(appointmentValidation.message);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Método utilitario para middleware
  static createValidationMiddleware(validationType) {
    return (req, res, next) => {
      let validation;
      
      switch (validationType) {
        case 'patient':
          validation = this.validatePatientForm(req.body);
          break;
        case 'admission':
          validation = this.validateAdmissionForm(req.body);
          break;
        default:
          return next();
      }
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validation.errors
        });
      }
      
      next();
    };
  }
}

module.exports = ValidationService;