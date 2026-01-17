
const { Op } = require('sequelize');
const { 
  AltaMedica, Paciente, Usuario, Medico, Internacion, 
  Admision, Especialidad, Cama, Habitacion, Sector,
  ObraSocial, TipoInternacion
} = require('../../models');

/**
 * Vista principal de altas médicas
 */
const getVistaAltas = async (req, res) => {
  try {
    res.render('dashboard/admin/altas/altas-index', {
      title: 'Altas Médicas',
      user: req.user || req.session.user || req.session.usuario
    });
  } catch (error) {
    console.error('Error al cargar vista de altas:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la página',
      user: req.user || req.session.user
    });
  }
};

/**
 * Obtener lista de altas con paginación y búsqueda

 */
const getListaAltas = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      tipo_alta = '',
      estado_paciente = '',
      fecha_desde = '',
      fecha_hasta = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir condiciones de búsqueda
    const whereAlta = {};
    const wherePaciente = {};
    const whereUsuario = {};

    // Filtro por tipo de alta
    if (tipo_alta) {
      whereAlta.tipo_alta = tipo_alta;
    }

    // Filtro por estado del paciente
    if (estado_paciente) {
      whereAlta.estado_paciente = estado_paciente;
    }

    // Filtro por rango de fechas
    if (fecha_desde && fecha_hasta) {
      whereAlta.fecha_alta = {
        [Op.between]: [fecha_desde, fecha_hasta]
      };
    } else if (fecha_desde) {
      whereAlta.fecha_alta = {
        [Op.gte]: fecha_desde
      };
    } else if (fecha_hasta) {
      whereAlta.fecha_alta = {
        [Op.lte]: fecha_hasta
      };
    }

    // Búsqueda por nombre, apellido o DNI
    if (search && search.trim()) {
      whereUsuario[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: altas } = await AltaMedica.findAndCountAll({
      where: whereAlta,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          where: wherePaciente,
          required: true,
          include: [
            {
              model: Usuario,
              as: 'usuario',
              where: whereUsuario,
              attributes: ['id', 'nombre', 'apellido', 'dni', 'sexo', 'fecha_nacimiento']
            },
            {
              model: ObraSocial,
              as: 'obraSocial',
              attributes: ['nombre'],
              required: false
            }
          ]
        },
        {
          model: Medico,
          as: 'medico',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            },
            {
              model: Especialidad,
              as: 'especialidad',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: Internacion,
          as: 'internacion',
          required: false,
          include: [
            {
              model: Cama,
              as: 'cama',
              attributes: ['numero'],
              include: [
                {
                  model: Habitacion,
                  as: 'habitacion',
                  attributes: ['numero'],
                  include: [
                    {
                      model: Sector,
                      as: 'sector',
                      attributes: ['nombre']
                    }
                  ]
                }
              ]
            },
            {
              model: TipoInternacion,
              as: 'tipoInternacion',
              attributes: ['nombre']
            }
          ]
        },
        {
          model: Admision,
          as: 'admision',
          required: false,
          attributes: ['id', 'fecha', 'estado']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['fecha_alta', 'DESC']],
      distinct: true
    });

    // Formatear datos para el frontend
    const altasFormateadas = altas.map(alta => {
      const pacienteUsuario = alta.paciente?.usuario;
      const medicoUsuario = alta.medico?.usuario;

      return {
        id: alta.id,
        fecha_alta: alta.fecha_alta,
        tipo_alta: alta.tipo_alta,
        estado_paciente: alta.estado_paciente,
        
        // Datos del paciente
        paciente: {
          id: alta.paciente_id,
          nombre: `${pacienteUsuario?.nombre || ''} ${pacienteUsuario?.apellido || ''}`,
          dni: pacienteUsuario?.dni || 'N/A',
          sexo: pacienteUsuario?.sexo || 'N/A',
          edad: calcularEdad(pacienteUsuario?.fecha_nacimiento),
          obra_social: alta.paciente?.obraSocial?.nombre || 'Sin obra social'
        },
        
        // Datos del médico
        medico: {
          nombre: `Dr/a. ${medicoUsuario?.nombre || ''} ${medicoUsuario?.apellido || ''}`,
          especialidad: alta.medico?.especialidad?.nombre || 'N/A'
        },
        
        // Datos de internación (si existe)
        internacion: alta.internacion ? {
          cama: alta.internacion.cama?.numero || 'N/A',
          habitacion: alta.internacion.cama?.habitacion?.numero || 'N/A',
          sector: alta.internacion.cama?.habitacion?.sector?.nombre || 'N/A',
          tipo: alta.internacion.tipoInternacion?.nombre || 'N/A',
          fecha_inicio: alta.internacion.fecha_inicio
        } : null,
        
        // Datos de admisión
        admision_id: alta.admision_id,
        
        // Instrucciones
        tiene_instrucciones: !!alta.instrucciones_post_alta
      };
    });

    res.json({
      success: true,
      altas: altasFormateadas,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener lista de altas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener altas médicas',
      error: error.message
    });
  }
};

/**
 * Obtener detalle completo de un alta médica

 */
const getDetalleAlta = async (req, res) => {
  try {
    const { id } = req.params;

    const alta = await AltaMedica.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 'sexo', 'fecha_nacimiento']
            },
            {
              model: ObraSocial,
              as: 'obraSocial'
            }
          ]
        },
        {
          model: Medico,
          as: 'medico',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'email', 'telefono']
            },
            {
              model: Especialidad,
              as: 'especialidad'
            },
            {
              model: Sector,
              as: 'sector'
            }
          ]
        },
        {
          model: Internacion,
          as: 'internacion',
          required: false,
          include: [
            {
              model: Cama,
              as: 'cama',
              include: [
                {
                  model: Habitacion,
                  as: 'habitacion',
                  include: [
                    {
                      model: Sector,
                      as: 'sector'
                    }
                  ]
                }
              ]
            },
            {
              model: TipoInternacion,
              as: 'tipoInternacion'
            }
          ]
        },
        {
          model: Admision,
          as: 'admision',
          required: false
        }
      ]
    });

    if (!alta) {
      return res.status(404).json({
        success: false,
        message: 'Alta médica no encontrada'
      });
    }

    // Formatear respuesta completa
    const pacienteUsuario = alta.paciente?.usuario;
    const medicoUsuario = alta.medico?.usuario;

    const detalleCompleto = {
      id: alta.id,
      fecha_alta: alta.fecha_alta,
      tipo_alta: alta.tipo_alta,
      estado_paciente: alta.estado_paciente,
      instrucciones_post_alta: alta.instrucciones_post_alta,
      created_at: alta.created_at,

      // Información del paciente
      paciente: {
        id: alta.paciente_id,
        nombre_completo: `${pacienteUsuario?.nombre} ${pacienteUsuario?.apellido}`,
        dni: pacienteUsuario?.dni,
        email: pacienteUsuario?.email,
        telefono: pacienteUsuario?.telefono,
        sexo: pacienteUsuario?.sexo,
        fecha_nacimiento: pacienteUsuario?.fecha_nacimiento,
        edad: calcularEdad(pacienteUsuario?.fecha_nacimiento),
        obra_social: alta.paciente?.obraSocial?.nombre || 'Sin obra social',
        estado: alta.paciente?.estado
      },

      // Información del médico
      medico: {
        id: alta.medico_id,
        nombre_completo: `Dr/a. ${medicoUsuario?.nombre} ${medicoUsuario?.apellido}`,
        email: medicoUsuario?.email,
        telefono: medicoUsuario?.telefono,
        matricula: alta.medico?.matricula,
        especialidad: alta.medico?.especialidad?.nombre,
        sector: alta.medico?.sector?.nombre
      },

      // Información de internación
      internacion: alta.internacion ? {
        id: alta.internacion.id,
        fecha_inicio: alta.internacion.fecha_inicio,
        fecha_cirugia: alta.internacion.fecha_cirugia,
        estado_operacion: alta.internacion.estado_operacion,
        estado_estudios: alta.internacion.estado_estudios,
        cama: {
          numero: alta.internacion.cama?.numero,
          habitacion: alta.internacion.cama?.habitacion?.numero,
          sector: alta.internacion.cama?.habitacion?.sector?.nombre
        },
        tipo_internacion: alta.internacion.tipoInternacion?.nombre,
        dias_internado: calcularDiasInternado(alta.internacion.fecha_inicio, alta.fecha_alta)
      } : null,

      // Información de admisión
      admision: alta.admision ? {
        id: alta.admision.id,
        fecha: alta.admision.fecha,
        estado: alta.admision.estado
      } : null
    };

    res.json({
      success: true,
      alta: detalleCompleto
    });

  } catch (error) {
    console.error('Error al obtener detalle de alta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de altas médicas
 */
const getEstadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      totalAltas,
      altasMes,
      altasVoluntarias,
      altasMedicas,
      altasContraindicadas,
      pacientesEstables,
      pacientesGraves,
      pacientesFallecidos
    ] = await Promise.all([
      AltaMedica.count(),
      AltaMedica.count({
        where: {
          fecha_alta: { [Op.gte]: inicioMes }
        }
      }),
      AltaMedica.count({ where: { tipo_alta: 'Voluntaria' } }),
      AltaMedica.count({ where: { tipo_alta: 'Medica' } }),
      AltaMedica.count({ where: { tipo_alta: 'Contraindicada' } }),
      AltaMedica.count({ where: { estado_paciente: 'Estable' } }),
      AltaMedica.count({ where: { estado_paciente: 'Grave' } }),
      AltaMedica.count({ where: { estado_paciente: 'Fallecido' } })
    ]);

    res.json({
      success: true,
      estadisticas: {
        total_altas: totalAltas,
        altas_mes: altasMes,
        por_tipo: {
          voluntarias: altasVoluntarias,
          medicas: altasMedicas,
          contraindicadas: altasContraindicadas
        },
        por_estado: {
          estables: pacientesEstables,
          graves: pacientesGraves,
          fallecidos: pacientesFallecidos
        }
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

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 'N/A';
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

function calcularDiasInternado(fechaInicio, fechaAlta) {
  if (!fechaInicio || !fechaAlta) return 0;
  
  const inicio = new Date(fechaInicio);
  const alta = new Date(fechaAlta);
  const diferencia = alta - inicio;
  
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

module.exports = {
  getVistaAltas,
  getListaAltas,
  getDetalleAlta,
  getEstadisticas
};