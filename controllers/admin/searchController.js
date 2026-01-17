const { Op } = require('sequelize');
const { 
  Paciente, Usuario, Admision, Turno, Medico, Enfermero, 
  Administrativo, Internacion, Rol, Especialidad, Sector,
  Factura, AltaMedica, EstudioSolicitado, EvaluacionMedica
} = require('../../models');

/**
 * Búsqueda global inteligente
 * GET /api/search/global
 */
const busquedaGlobal = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Ingrese al menos 2 caracteres'
      });
    }

    const searchTerm = search.trim();
    console.log('🔍 Búsqueda:', searchTerm);

    // Buscar usuarios que coincidan
    const usuarios = await Usuario.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${searchTerm}%` } },
          { apellido: { [Op.like]: `%${searchTerm}%` } },
          { dni: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['nombre']
        },
        {
          model: Paciente,
          as: 'paciente',
          required: false
        },
        {
          model: Medico,
          as: 'medico',
          required: false
        },
        {
          model: Enfermero,
          as: 'enfermero',
          required: false
        },
        {
          model: Administrativo,
          as: 'administrativo',
          required: false
        }
      ],
      limit: 20,
      order: [['nombre', 'ASC']]
    });

    const resultados = usuarios.map(u => ({
      id: u.id,
      nombre: `${u.nombre} ${u.apellido}`,
      dni: u.dni,
      email: u.email,
      rol: u.rol_principal?.nombre || 'Sin rol',
      tipo: u.paciente ? 'paciente' : 
            u.medico ? 'medico' : 
            u.enfermero ? 'enfermero' : 
            u.administrativo ? 'administrativo' : 'usuario',
      tipo_id: u.paciente?.id || u.medico?.id || u.enfermero?.id || u.administrativo?.id
    }));

    res.json({
      success: true,
      resultados,
      total: resultados.length
    });

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar'
    });
  }
};

/**
 * Obtener ficha completa de un usuario
 * GET /api/search/ficha/:usuarioId
 */
const getFichaCompleta = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const usuario = await Usuario.findByPk(usuarioId, {
      include: [
        {
          model: Rol,
          as: 'rol_principal',
          attributes: ['nombre']
        },
        {
          model: Rol,
          as: 'rol_secundario',
          attributes: ['nombre'],
          required: false
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Datos base
    const ficha = {
      usuario: {
        id: usuario.id,
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        dni: usuario.dni,
        email: usuario.email,
        telefono: usuario.telefono,
        fecha_nacimiento: usuario.fecha_nacimiento,
        sexo: usuario.sexo,
        rol_principal: usuario.rol_principal?.nombre,
        rol_secundario: usuario.rol_secundario?.nombre,
        estado: usuario.estado
      },
      paciente: null,
      medico: null,
      enfermero: null,
      administrativo: null,
      estadisticas: {}
    };

    // Si es PACIENTE
    const paciente = await Paciente.findOne({
      where: { usuario_id: usuarioId },
      include: [
        { model: require('../models').ObraSocial, as: 'obraSocial' }
      ]
    });

    if (paciente) {
      const [admisiones, internaciones, turnos, facturas, altas] = await Promise.all([
        Admision.count({ where: { paciente_id: paciente.id } }),
        Internacion.count({ where: { paciente_id: paciente.id } }),
        Turno.count({ where: { paciente_id: paciente.id } }),
        Factura.count({ where: { paciente_id: paciente.id } }),
        AltaMedica.count({ where: { paciente_id: paciente.id } })
      ]);

      // Últimas admisiones
      const ultimasAdmisiones = await Admision.findAll({
        where: { paciente_id: paciente.id },
        limit: 5,
        order: [['fecha', 'DESC']],
        attributes: ['id', 'fecha', 'estado']
      });

      ficha.paciente = {
        id: paciente.id,
        fecha_ingreso: paciente.fecha_ingreso,
        fecha_egreso: paciente.fecha_egreso,
        estado: paciente.estado,
        obra_social: paciente.obraSocial?.nombre || 'Sin obra social',
        observaciones: paciente.observaciones
      };

      ficha.estadisticas = {
        total_admisiones: admisiones,
        total_internaciones: internaciones,
        total_turnos: turnos,
        total_facturas: facturas,
        total_altas: altas,
        ultimas_admisiones: ultimasAdmisiones
      };
    }

    // Si es MÉDICO
    const medico = await Medico.findOne({
      where: { usuario_id: usuarioId },
      include: [
        { model: Especialidad, as: 'especialidad' },
        { model: Sector, as: 'sector' }
      ]
    });

    if (medico) {
      const pacientesAtendidos = await Admision.count({
        where: { medico_id: medico.id }
      });

      ficha.medico = {
        id: medico.id,
        matricula: medico.matricula,
        especialidad: medico.especialidad?.nombre,
        sector: medico.sector?.nombre,
        pacientes_atendidos: pacientesAtendidos
      };
    }

    // Si es ENFERMERO
    const enfermero = await Enfermero.findOne({
      where: { usuario_id: usuarioId },
      include: [
        { model: Sector, as: 'sector' }
      ]
    });

    if (enfermero) {
      ficha.enfermero = {
        id: enfermero.id,
        matricula: enfermero.matricula,
        nivel: enfermero.nivel,
        sector: enfermero.sector?.nombre,
        estado: enfermero.estado,
        fecha_ingreso: enfermero.fecha_ingreso
      };
    }

    // Si es ADMINISTRATIVO
    const administrativo = await Administrativo.findOne({
      where: { usuario_id: usuarioId },
      include: [
        { model: Sector, as: 'sector' }
      ]
    });

    if (administrativo) {
      ficha.administrativo = {
        id: administrativo.id,
        sector: administrativo.sector?.nombre,
        responsabilidad: administrativo.responsabilidad,
        descripcion: administrativo.descripcion,
        estado: administrativo.estado
      };
    }

    res.json({
      success: true,
      ficha
    });

  } catch (error) {
    console.error('❌ Error al obtener ficha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ficha'
    });
  }
};

module.exports = {
  busquedaGlobal,
  getFichaCompleta
};