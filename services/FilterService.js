const { Op } = require('sequelize');
const { 
  Usuario, 
  Paciente, 
  Medico, 
  Enfermero, 
  Administrativo,
  Internacion,
  Admision,
  Turno,
  Sector,
  Especialidad,
  ObraSocial,
  Habitacion,
  Cama
} = require('../models');

class FilterService {
  
  /**
   * BÚSQUEDA GLOBAL - Busca en pacientes, médicos, enfermeros y administrativos
   * @param {string} searchTerm - Término de búsqueda (DNI, nombre, apellido)
   * @param {object} options - Opciones adicionales { limit, offset, tipo }
   * @returns {Promise<object>} Resultados agrupados por tipo
   */
  static async busquedaGlobal(searchTerm, options = {}) {
    const { limit = 10, offset = 0, tipo = 'all' } = options;
    
    if (!searchTerm || searchTerm.trim().length < 3) {
      return {
        success: false,
        message: 'El término de búsqueda debe tener al menos 3 caracteres',
        resultados: []
      };
    }

    const term = searchTerm.trim();
    const esDNI = /^\d+$/.test(term); // Detectar si es solo números (DNI)
    
    // Condición de búsqueda flexible
    const whereCondition = esDNI ? {
      dni: { [Op.like]: `%${term}%` }
    } : {
      [Op.or]: [
        { nombre: { [Op.like]: `%${term}%` } },
        { apellido: { [Op.like]: `%${term}%` } },
        { dni: { [Op.like]: `%${term}%` } }
      ]
    };

    try {
      const resultados = {};

      // BUSCAR PACIENTES
      if (tipo === 'all' || tipo === 'pacientes') {
        const pacientes = await Usuario.findAll({
          where: whereCondition,
          include: [{
            model: Paciente,
            as: 'paciente',
            required: true,
            include: [
              { model: ObraSocial, as: 'obraSocial', attributes: ['id', 'nombre'] }
            ]
          }],
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'sexo', 'fecha_nacimiento'],
          limit,
          offset
        });

        resultados.pacientes = pacientes.map(u => ({
          id: u.paciente.id,
          usuario_id: u.id,
          dni: u.dni,
          nombre_completo: `${u.nombre} ${u.apellido}`,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          sexo: u.sexo,
          fecha_nacimiento: u.fecha_nacimiento,
          obra_social: u.paciente.obraSocial?.nombre || 'Sin obra social',
          estado: u.paciente.estado,
          tipo: 'paciente'
        }));
      }

      // BUSCAR MÉDICOS
      if (tipo === 'all' || tipo === 'medicos') {
        const medicos = await Usuario.findAll({
          where: whereCondition,
          include: [{
            model: Medico,
            as: 'medico',
            required: true,
            include: [
              { model: Especialidad, as: 'especialidad', attributes: ['id', 'nombre'] },
              { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
            ]
          }],
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'sexo'],
          limit,
          offset
        });

        resultados.medicos = medicos.map(u => ({
          id: u.medico.id,
          usuario_id: u.id,
          dni: u.dni,
          nombre_completo: `Dr/a. ${u.nombre} ${u.apellido}`,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          matricula: u.medico.matricula,
          especialidad: u.medico.especialidad?.nombre || 'Sin especialidad',
          sector: u.medico.sector?.nombre || 'Sin sector',
          tipo: 'medico'
        }));
      }

      // BUSCAR ENFERMEROS
      if (tipo === 'all' || tipo === 'enfermeros') {
        const enfermeros = await Usuario.findAll({
          where: whereCondition,
          include: [{
            model: Enfermero,
            as: 'enfermero',
            required: true,
            include: [
              { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
            ]
          }],
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'sexo'],
          limit,
          offset
        });

        resultados.enfermeros = enfermeros.map(u => ({
          id: u.enfermero.id,
          usuario_id: u.id,
          dni: u.dni,
          nombre_completo: `${u.nombre} ${u.apellido}`,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          matricula: u.enfermero.matricula,
          nivel: u.enfermero.nivel,
          sector: u.enfermero.sector?.nombre || 'Sin sector',
          estado: u.enfermero.estado,
          tipo: 'enfermero'
        }));
      }

      // BUSCAR ADMINISTRATIVOS
      if (tipo === 'all' || tipo === 'administrativos') {
        const administrativos = await Usuario.findAll({
          where: whereCondition,
          include: [{
            model: Administrativo,
            as: 'administrativo',
            required: true,
            include: [
              { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
            ]
          }],
          attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'sexo'],
          limit,
          offset
        });

        resultados.administrativos = administrativos.map(u => ({
          id: u.administrativo.id,
          usuario_id: u.id,
          dni: u.dni,
          nombre_completo: `${u.nombre} ${u.apellido}`,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          responsabilidad: u.administrativo.responsabilidad,
          sector: u.administrativo.sector?.nombre || 'Sin sector',
          estado: u.administrativo.estado,
          tipo: 'administrativo'
        }));
      }

      // Calcular totales
      const totalResultados = Object.values(resultados).reduce((sum, arr) => sum + arr.length, 0);

      return {
        success: true,
        termino_busqueda: term,
        total_resultados: totalResultados,
        resultados,
        message: totalResultados > 0 ? 
          `Se encontraron ${totalResultados} resultado(s)` : 
          'No se encontraron resultados'
      };

    } catch (error) {
      console.error('Error en búsqueda global:', error);
      return {
        success: false,
        message: 'Error al realizar la búsqueda',
        error: error.message,
        resultados: {}
      };
    }
  }

  /**
   * BUSCAR PACIENTE POR DNI - Específico para internaciones/admisiones
   * @param {string} dni - DNI del paciente
   * @returns {Promise<object>} Datos del paciente con información relevante
   */
  static async buscarPacientePorDNI(dni) {
    try {
      if (!dni || dni.trim().length < 7) {
        return {
          success: false,
          existe: false,
          message: 'DNI inválido (debe tener al menos 7 dígitos)'
        };
      }

      const usuario = await Usuario.findOne({
        where: { dni: dni.trim() },
        include: [{
          model: Paciente,
          as: 'paciente',
          required: true,
          include: [
            { 
              model: ObraSocial, 
              as: 'obraSocial',
              attributes: ['id', 'nombre', 'descripcion']
            }
          ]
        }],
        attributes: ['id', 'dni', 'nombre', 'apellido', 'email', 'sexo', 'fecha_nacimiento', 'telefono']
      });

      if (!usuario || !usuario.paciente) {
        return {
          success: false,
          existe: false,
          message: 'No se encontró un paciente con ese DNI'
        };
      }

      const paciente = usuario.paciente;

      // Verificar si tiene internación activa (sin fecha_alta)
      const internacionActiva = await Internacion.findOne({
        where: {
          paciente_id: paciente.id,
          fecha_alta: null
        },
        include: [
          { 
            model: Habitacion, 
            as: 'habitacion',
            include: [
              { model: Sector, as: 'sector', attributes: ['id', 'nombre'] }
            ]
          },
          { model: Cama, as: 'cama', attributes: ['id', 'numero'] }
        ]
      });

      if (internacionActiva) {
        return {
          success: false,
          existe: true,
          internado: true,
          message: 'El paciente ya tiene una internación activa',
          paciente: {
            id: paciente.id,
            usuario_id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dni: usuario.dni,
            sexo: usuario.sexo
          },
          internacion: {
            id: internacionActiva.id,
            habitacion: internacionActiva.habitacion?.numero || 'N/A',
            cama: internacionActiva.cama?.numero || 'N/A',
            sector: internacionActiva.habitacion?.sector?.nombre || 'N/A',
            fecha_inicio: internacionActiva.fecha_inicio
          }
        };
      }

      // Devolver datos del paciente
      return {
        success: true,
        existe: true,
        internado: false,
        paciente: {
          id: paciente.id,
          usuario_id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: usuario.dni,
          sexo: usuario.sexo,
          fecha_nacimiento: usuario.fecha_nacimiento,
          telefono: usuario.telefono,
          email: usuario.email,
          obra_social: paciente.obraSocial,
          obra_social_id: paciente.obra_social_id,
          estado: paciente.estado,
          fecha_ingreso: paciente.fecha_ingreso
        }
      };

    } catch (error) {
      console.error('Error al buscar paciente por DNI:', error);
      return {
        success: false,
        existe: false,
        message: 'Error al buscar paciente',
        error: error.message
      };
    }
  }

  /**
   * FILTROS DINÁMICOS - Construir condiciones WHERE
   * @param {object} filters - Objeto con filtros { campo: valor }
   * @param {object} fieldMappings - Mapeo de campos { campo: { field, operator } }
   * @returns {object} Condiciones WHERE de Sequelize
   */
  static buildWhereConditions(filters, fieldMappings) {
    const whereClause = {};
    
    Object.entries(filters).forEach(([filterKey, value]) => {
      if (!value || value === '') return;
      
      const mapping = fieldMappings[filterKey];
      if (!mapping) return;
      
      const { field, operator = 'exact' } = mapping;
      
      switch (operator) {
        case 'like':
          whereClause[field] = { [Op.like]: `%${value}%` };
          break;
        case 'gte':
          whereClause[field] = { [Op.gte]: value };
          break;
        case 'lte':
          whereClause[field] = { [Op.lte]: value };
          break;
        case 'between':
          if (filters[filterKey + '_hasta']) {
            whereClause[field] = { [Op.between]: [value, filters[filterKey + '_hasta']] };
          } else {
            whereClause[field] = { [Op.gte]: value };
          }
          break;
        case 'in':
          whereClause[field] = { [Op.in]: Array.isArray(value) ? value : [value] };
          break;
        default:
          whereClause[field] = value;
      }
    });
    
    return whereClause;
  }
  
  /**
   * MAPEOS DE CAMPOS POR ENTIDAD
   */
  static getFieldMappings(entity) {
    const mappings = {
      admisiones: {
        dni: { field: '$paciente.usuario.dni$', operator: 'like' },
        nombre: { field: '$paciente.usuario.nombre$', operator: 'like' },
        apellido: { field: '$paciente.usuario.apellido$', operator: 'like' },
        estado: { field: 'estado' },
        fecha_desde: { field: 'fecha', operator: 'gte' },
        fecha_hasta: { field: 'fecha', operator: 'lte' },
        medico_id: { field: 'medico_id' },
        sector_id: { field: 'sector_id' },
        motivo_id: { field: 'motivo_id' }
      },
      
      pacientes: {
        dni: { field: '$usuario.dni$', operator: 'like' },
        nombre: { field: '$usuario.nombre$', operator: 'like' },
        apellido: { field: '$usuario.apellido$', operator: 'like' },
        estado: { field: 'estado' },
        obra_social_id: { field: 'obra_social_id' },
        sexo: { field: '$usuario.sexo$' }
      },
      
      turnos: {
        fecha_desde: { field: 'fecha', operator: 'gte' },
        fecha_hasta: { field: 'fecha', operator: 'lte' },
        estado: { field: 'estado' },
        medico_id: { field: 'medico_id' },
        paciente_dni: { field: '$paciente.usuario.dni$', operator: 'like' },
        sector_id: { field: 'sector_id' }
      },

      internaciones: {
        dni: { field: '$paciente.usuario.dni$', operator: 'like' },
        nombre: { field: '$paciente.usuario.nombre$', operator: 'like' },
        apellido: { field: '$paciente.usuario.apellido$', operator: 'like' },
        estado_paciente: { field: 'estado_paciente' },
        sector_id: { field: '$habitacion.sector_id$' },
        medico_id: { field: 'medico_id' },
        fecha_inicio_desde: { field: 'fecha_inicio', operator: 'gte' },
        fecha_inicio_hasta: { field: 'fecha_inicio', operator: 'lte' },
        tiene_alta: { field: 'fecha_alta', operator: 'custom' } // Manejado especialmente
      },

      medicos: {
        dni: { field: '$usuario.dni$', operator: 'like' },
        nombre: { field: '$usuario.nombre$', operator: 'like' },
        apellido: { field: '$usuario.apellido$', operator: 'like' },
        especialidad_id: { field: 'especialidad_id' },
        sector_id: { field: 'sector_id' },
        matricula: { field: 'matricula', operator: 'like' }
      }
    };
    
    return mappings[entity] || {};
  }
  
  /**
   * APLICAR FILTROS A UNA CONSULTA
   * @param {object} filters - Filtros del query
   * @param {string} entity - Nombre de la entidad (admisiones, pacientes, etc.)
   * @returns {object} Condiciones WHERE
   */
  static applyFilters(filters, entity) {
    const fieldMappings = this.getFieldMappings(entity);
    return this.buildWhereConditions(filters, fieldMappings);
  }

  /**
   * LIMPIAR FILTROS VACÍOS
   */
  static cleanFilters(queryParams) {
    const cleaned = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'undefined' && value !== 'null') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
}

module.exports = FilterService;