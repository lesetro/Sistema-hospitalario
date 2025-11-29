const { Op } = require('sequelize');

class FilterService {
  
  /**
   * Construir condiciones WHERE dinámicamente
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
        default:
          whereClause[field] = value;
      }
    });
    
    return whereClause;
  }
  
  /**
   * Limpiar filtros vacíos
   */
  static cleanFilters(queryParams) {
    const cleaned = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && value !== '') cleaned[key] = value;
    });
    return cleaned;
  }
  
  /**
   * Mapeos específicos por entidad
   */
  static getFieldMappings(entity) {
    const mappings = {
      admisiones: {
        dni: { field: '$paciente.usuario.dni$', operator: 'like' },
        nombre: { field: '$paciente.usuario.nombre$', operator: 'like' },
        estado: { field: 'estado' },
        fecha_desde: { field: 'fecha', operator: 'gte' },
        fecha_hasta: { field: 'fecha', operator: 'lte' },
        medico_id: { field: 'medico_id' },
        sector_id: { field: 'sector_id' }
      },
      
      pacientes: {
        dni: { field: '$usuario.dni$', operator: 'like' },
        nombre: { field: '$usuario.nombre$', operator: 'like' },
        apellido: { field: '$usuario.apellido$', operator: 'like' },
        estado: { field: 'estado' },
        obra_social_id: { field: 'obra_social_id' }
      },
      
      turnos: {
        fecha_desde: { field: 'fecha', operator: 'gte' },
        fecha_hasta: { field: 'fecha', operator: 'lte' },
        estado: { field: 'estado' },
        medico_id: { field: 'medico_id' },
        paciente_dni: { field: '$paciente.usuario.dni$', operator: 'like' }
      }
    };
    
    return mappings[entity] || {};
  }
  
  /**
   * Aplicar filtros a cualquier entidad
   */
  static applyFilters(filters, entity) {
    const fieldMappings = this.getFieldMappings(entity);
    return this.buildWhereConditions(filters, fieldMappings);
  }
}

module.exports = FilterService;