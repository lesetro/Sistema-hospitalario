
const { Op } = require('sequelize');

class SearchPaginationService {
  constructor(model, searchFields = [], includes = []) {
    this.model = model;
    this.searchFields = searchFields;
    this.includes = includes;
  }

  async search(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    let whereCondition = {};
    if (search && this.searchFields.length > 0) {
      whereCondition[Op.or] = this.searchFields.map(field => ({
        [field]: { [Op.like]: `%${search}%` }
      }));
    }

    // Ejecutar consulta con conteo
    const { count, rows } = await this.model.findAndCountAll({
      where: whereCondition,
      include: this.includes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = SearchPaginationService;