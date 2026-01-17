const { Op } = require('sequelize');
const { Noticia, Usuario } = require('../../models');

/**
 * Helper para obtener usuario de sesión
 */
function getUsuarioSesion(req) {
  return req.user || req.session.user || req.session.usuario || {};
}

function getUsuarioId(req) {
  const usuario = getUsuarioSesion(req);
  return usuario.usuario_id || usuario.id || null;
}

/**
 * Vista principal de gestión de noticias
 */
const getVistaNoticias = async (req, res) => {
  try {
    res.render('dashboard/admin/noticias/index', {
      title: 'Gestión de Noticias',
      user: getUsuarioSesion(req)
    });
  } catch (error) {
    console.error('Error al cargar vista de noticias:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la página',
      user: getUsuarioSesion(req)
    });
  }
};

/**
 * Obtener lista de noticias con paginación
 */
const getListaNoticias = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      mostrar_antiguas = 'false' // Nuevo: mostrar noticias antiguas (eliminadas)
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Búsqueda por título o texto
    if (search && search.trim()) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { texto: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro de fecha (ocultar noticias "eliminadas" = fecha antigua)
    if (mostrar_antiguas === 'false') {
      // Solo mostrar noticias recientes 
      const fechaLimite = new Date();
      fechaLimite.setFullYear(fechaLimite.getFullYear() - 3);
      where.fecha = { [Op.gte]: fechaLimite };
    }

    const { count, rows: noticias } = await Noticia.findAndCountAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['fecha', 'DESC']]
    });

    const noticiasFormateadas = noticias.map(n => ({
      id: n.id,
      titulo: n.titulo,
      texto: n.texto.substring(0, 150) + '...', 
      fecha: n.fecha,
      autor: `${n.autor?.nombre || ''} ${n.autor?.apellido || ''}`,
      autor_id: n.autor_id,
      es_antigua: esNoticiaAntigua(n.fecha), // Marca si está "eliminada"
      created_at: n.created_at
    }));

    res.json({
      success: true,
      noticias: noticiasFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de noticias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener noticias',
      error: error.message
    });
  }
};

/**
 * Obtener detalle de una noticia
 */
const getDetalleNoticia = async (req, res) => {
  try {
    const { id } = req.params;

    const noticia = await Noticia.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    res.json({
      success: true,
      noticia: {
        id: noticia.id,
        titulo: noticia.titulo,
        texto: noticia.texto,
        fecha: noticia.fecha,
        autor: `${noticia.autor?.nombre || ''} ${noticia.autor?.apellido || ''}`,
        autor_id: noticia.autor_id,
        autor_email: noticia.autor?.email,
        created_at: noticia.created_at,
        updated_at: noticia.updated_at,
        es_antigua: esNoticiaAntigua(noticia.fecha)
      }
    });

  } catch (error) {
    console.error('Error al obtener detalle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle'
    });
  }
};

/**
 * Crear nueva noticia
 */
const crearNoticia = async (req, res) => {
  try {
    const { titulo, texto, fecha } = req.body;
    const autorId = getUsuarioId(req);

    if (!autorId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validaciones
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El título es obligatorio'
      });
    }

    if (!texto || !texto.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El texto es obligatorio'
      });
    }

    if (titulo.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'El título no puede superar los 255 caracteres'
      });
    }

    // Crear noticia
    const nuevaNoticia = await Noticia.create({
      titulo: titulo.trim(),
      texto: texto.trim(),
      fecha: fecha || new Date(),
      autor_id: autorId
    });

    res.json({
      success: true,
      message: 'Noticia creada correctamente',
      noticia: nuevaNoticia
    });

  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear noticia',
      error: error.message
    });
  }
};

/**
 * Actualizar noticia
 */
const actualizarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, texto, fecha } = req.body;
    const usuarioId = getUsuarioId(req);

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Verificar que el usuario es el autor
    if (noticia.autor_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta noticia'
      });
    }

    // Validaciones
    if (titulo && titulo.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'El título no puede superar los 255 caracteres'
      });
    }

    // Actualizar
    await noticia.update({
      titulo: titulo?.trim() || noticia.titulo,
      texto: texto?.trim() || noticia.texto,
      fecha: fecha || noticia.fecha
    });

    res.json({
      success: true,
      message: 'Noticia actualizada correctamente',
      noticia
    });

  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar noticia',
      error: error.message
    });
  }
};

/**
 * Eliminar noticia (cambiar fecha a antigua)
 */
const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = getUsuarioId(req);

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Verificar permisos (autor o admin)
    if (noticia.autor_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta noticia'
      });
    }

    // "Eliminar" = cambiar fecha a hace 5 años (no se muestra en home)
    const fechaAntigua = new Date();
    fechaAntigua.setFullYear(fechaAntigua.getFullYear() - 5);

    await noticia.update({
      fecha: fechaAntigua
    });

    res.json({
      success: true,
      message: 'Noticia eliminada correctamente (oculta del home)'
    });

  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar noticia',
      error: error.message
    });
  }
};

/**
 * Restaurar noticia (volver a mostrar en home)
 */
const restaurarNoticia = async (req, res) => {
  try {
    const { id } = req.params;

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Restaurar = poner fecha actual
    await noticia.update({
      fecha: new Date()
    });

    res.json({
      success: true,
      message: 'Noticia restaurada correctamente (visible en home)'
    });

  } catch (error) {
    console.error('Error al restaurar noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar noticia'
    });
  }
};

/**
 * Obtener estadísticas
 */
const getEstadisticas = async (req, res) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 3);

    const [totalNoticias, noticiasActivas, noticiasAntiguas, noticiasMes] = await Promise.all([
      Noticia.count(),
      Noticia.count({
        where: {
          fecha: { [Op.gte]: fechaLimite }
        }
      }),
      Noticia.count({
        where: {
          fecha: { [Op.lt]: fechaLimite }
        }
      }),
      Noticia.count({
        where: {
          fecha: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total: totalNoticias,
        activas: noticiasActivas,
        antiguas: noticiasAntiguas,
        mes_actual: noticiasMes
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function esNoticiaAntigua(fecha) {
  const fechaLimite = new Date();
  fechaLimite.setFullYear(fechaLimite.getFullYear() - 3);
  return new Date(fecha) < fechaLimite;
}

module.exports = {
  getVistaNoticias,
  getListaNoticias,
  getDetalleNoticia,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
  restaurarNoticia,
  getEstadisticas
};