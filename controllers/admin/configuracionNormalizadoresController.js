const { 
  Diagnostico, TipoDiagnostico, Especialidad, FormaIngreso, 
  MotivoAdmision, MotivoConsulta, Noticia, ObraSocial,
  ProcedimientoEnfermeria, ProcedimientoPreQuirurgico,
  Sector, TipoDeServicio, TipoEstudio, TipoInternacion,
  TipoTurno, Tratamiento, Usuario
} = require('../../models');

const { Op } = require('sequelize');

/**
 * Vista principal de configuración
 */
const getVistaNormalizadores = async (req, res) => {
  try {
    res.render('dashboard/admin/configuracion/normalizadores', {
      title: 'Configuración de Datos Base',
      user: req.user || req.session.user || req.session.usuario
    });
  } catch (error) {
    console.error('Error al cargar vista:', error);
    res.status(500).render('error', { message: 'Error al cargar la página' });
  }
};

/**
 * Obtener estadísticas de todos los modelos
 */
const getEstadisticas = async (req, res) => {
  try {
    const [
      sectores, especialidades, obrasSociales, tratamientos,
      tiposEstudio, tiposDiagnostico, diagnosticos, motivosAdmision,
      motivosConsulta, formasIngreso, tiposServicio, tiposInternacion,
      tiposTurno
    ] = await Promise.all([
      Sector.count(),
      Especialidad.count(),
      ObraSocial.count(),
      Tratamiento.count(),
      TipoEstudio.count(),
      TipoDiagnostico.count(),
      Diagnostico.count(),
      MotivoAdmision.count(),
      MotivoConsulta.count(),
      FormaIngreso.count(),
      TipoDeServicio.count(),
      TipoInternacion.count(),
      TipoTurno.count()
    ]);

    res.json({
      success: true,
      estadisticas: {
        sectores,
        especialidades,
        obras_sociales: obrasSociales,
        tratamientos,
        tipos_estudio: tiposEstudio,
        tipos_diagnostico: tiposDiagnostico,
        diagnosticos,
        motivos_admision: motivosAdmision,
        motivos_consulta: motivosConsulta,
        formas_ingreso: formasIngreso,
        tipos_servicio: tiposServicio,
        tipos_internacion: tiposInternacion,
        tipos_turno: tiposTurno
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

/**
 * CRUD GENÉRICO - Obtener lista
 */
const getLista = async (req, res) => {
  try {
    const { modelo } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;

    const Modelo = getModelo(modelo);
    if (!Modelo) {
      return res.status(400).json({ success: false, message: 'Modelo no válido' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Búsqueda
    if (search && search.trim()) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    // Include especial para Diagnostico
    const include = [];
    if (modelo === 'diagnosticos') {
      include.push({
        model: TipoDiagnostico,
        as: 'tipoDiagnostico',
        attributes: ['nombre']
      });
    }

    const { count, rows } = await Modelo.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      datos: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

/**
 * CRUD GENÉRICO - Crear
 */
const crear = async (req, res) => {
  try {
    const { modelo } = req.params;
    const datos = req.body;

    const Modelo = getModelo(modelo);
    if (!Modelo) {
      return res.status(400).json({ success: false, message: 'Modelo no válido' });
    }

    // Validaciones específicas
    if (!datos.nombre || !datos.nombre.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre es obligatorio' 
      });
    }

    // Para Diagnostico, verificar que tenga tipo_diagnostico_id
    if (modelo === 'diagnosticos' && !datos.tipo_diagnostico_id) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de diagnóstico es obligatorio'
      });
    }

    const nuevo = await Modelo.create(datos);

    res.json({
      success: true,
      message: 'Creado correctamente',
      dato: nuevo
    });

  } catch (error) {
    console.error('Error al crear:', error);
    
    // Error de clave duplicada
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un registro con ese nombre o código'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al crear',
      error: error.message
    });
  }
};

/**
 * CRUD GENÉRICO - Actualizar
 */
const actualizar = async (req, res) => {
  try {
    const { modelo, id } = req.params;
    const datos = req.body;

    const Modelo = getModelo(modelo);
    if (!Modelo) {
      return res.status(400).json({ success: false, message: 'Modelo no válido' });
    }

    const registro = await Modelo.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }

    await registro.update(datos);

    res.json({
      success: true,
      message: 'Actualizado correctamente',
      dato: registro
    });

  } catch (error) {
    console.error('Error al actualizar:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un registro con ese nombre o código'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar',
      error: error.message
    });
  }
};

/**
 * CRUD GENÉRICO - Eliminar
 */
const eliminar = async (req, res) => {
  try {
    const { modelo, id } = req.params;

    const Modelo = getModelo(modelo);
    if (!Modelo) {
      return res.status(400).json({ success: false, message: 'Modelo no válido' });
    }

    const registro = await Modelo.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }

    await registro.destroy();

    res.json({
      success: true,
      message: 'Eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar:', error);

    // Error de clave foránea (tiene registros relacionados)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar porque tiene registros relacionados'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de un registro
 */
const getDetalle = async (req, res) => {
  try {
    const { modelo, id } = req.params;

    const Modelo = getModelo(modelo);
    if (!Modelo) {
      return res.status(400).json({ success: false, message: 'Modelo no válido' });
    }

    const include = [];
    if (modelo === 'diagnosticos') {
      include.push({
        model: TipoDiagnostico,
        as: 'tipoDiagnostico'
      });
    }

    const registro = await Modelo.findByPk(id, { include });
    
    if (!registro) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro no encontrado' 
      });
    }

    res.json({
      success: true,
      dato: registro
    });

  } catch (error) {
    console.error('Error al obtener detalle:', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalle' });
  }
};

/**
 * Obtener lista de Tipos de Diagnóstico (para el select)
 */
const getTiposDiagnosticoLista = async (req, res) => {
  try {
    const tipos = await TipoDiagnostico.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      tipos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tipos' });
  }
};

// ============================================================================
// HELPER: Mapear nombre de modelo a clase Sequelize
// ============================================================================
function getModelo(nombreModelo) {
  const modelos = {
    'sectores': Sector,
    'especialidades': Especialidad,
    'obras-sociales': ObraSocial,
    'tratamientos': Tratamiento,
    'tipos-estudio': TipoEstudio,
    'tipos-diagnostico': TipoDiagnostico,
    'diagnosticos': Diagnostico,
    'motivos-admision': MotivoAdmision,
    'motivos-consulta': MotivoConsulta,
    'formas-ingreso': FormaIngreso,
    'tipos-servicio': TipoDeServicio,
    'tipos-internacion': TipoInternacion,
    'tipos-turno': TipoTurno
  };

  return modelos[nombreModelo] || null;
}

module.exports = {
  getVistaNormalizadores,
  getEstadisticas,
  getLista,
  crear,
  actualizar,
  eliminar,
  getDetalle,
  getTiposDiagnosticoLista
};