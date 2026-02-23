const { 
  EvaluacionEnfermeria, 
  Paciente, 
  Usuario,
  Enfermero,
  Medico,
  ListaEspera,
  TipoTurno,
  Especialidad,
  Sector
} = require('../models');
const { Op, Sequelize } = require('sequelize'); 

class NotificacionesService {
  
  constructor() {
    this.clientesSSE = new Map();
    console.log('Servicio de Notificaciones inicializado');
  }

  // ========================================
  // VERIFICAR EMERGENCIAS PENDIENTES (MÉDICO)
  // ========================================
  
  async verificarEmergenciasPendientes(medicoId) {
    try {
      console.log(`🔍 Buscando emergencias para médico: ${medicoId}`);

      const emergencias = await EvaluacionEnfermeria.findAll({
        where: {
          medico_id: medicoId,
          tipo_egreso: {
            [Op.in]: [
              'DERIVACION_MEDICO',
              'DERIVACION_URGENCIA'
            ]
          }
        },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            required: true,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
            }]
          },
          {
            model: Enfermero,
            as: 'enfermero',
            required: false,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido']
            }]
          }
        ],
        order: [
          [Sequelize.literal(`CASE 
            WHEN tipo_egreso = 'DERIVACION_URGENCIA' THEN 1
            WHEN tipo_egreso = 'DERIVACION_MEDICO'   THEN 2
            ELSE 3
          END`), 'ASC'],
          ['fecha', 'ASC']
        ],
        limit: 50
      });

      const count = emergencias.length;
      const hayPendientes = count > 0;

      console.log(`📊 Emergencias encontradas: ${count}`);

      return {
        success: true,
        hay_pendientes: hayPendientes,
        count,
        emergencias: emergencias.map(e => ({
          id: e.id,
          paciente_id: e.paciente_id,
          paciente_nombre: `${e.paciente.usuario.nombre} ${e.paciente.usuario.apellido}`,
          paciente_dni: e.paciente.usuario.dni,
          nivel_triaje: e.nivel_triaje,
          tipo_egreso: e.tipo_egreso,
          prioridad: e.prioridad,
          fecha: e.fecha,
          signos_vitales: e.signos_vitales,
          observaciones: e.observaciones,
          enfermero: e.enfermero 
            ? `${e.enfermero.usuario.nombre} ${e.enfermero.usuario.apellido}` 
            : 'No asignado',
          es_urgente: e.tipo_egreso === 'DERIVACION_URGENCIA'
        }))
      };

    } catch (error) {
      console.error('❌ Error al verificar emergencias:', error);
      return {
        success: false,
        hay_pendientes: false,
        count: 0,
        emergencias: [],
        error: error.message
      };
    }
  }

  // ========================================
  // VERIFICAR CIRUGÍAS PENDIENTES (CIRUJANO)
  // ========================================
  
  async verificarCirugiasPendientes(medicoId, usuarioId) {
    try {
      console.log(` Buscando cirugías pendientes para médico: ${medicoId}`);

      // Obtener el médico con su sector y especialidad
      const medico = await Medico.findOne({
        where: usuarioId ? { usuario_id: usuarioId } : { id: medicoId },
        include: [
          { model: Sector, as: 'sector' },
          { model: Especialidad, as: 'especialidad' }
        ]
      });

      if (!medico) {
        console.log('❌ Médico no encontrado');
        return {
          success: false,
          hay_pendientes: false,
          count: 0,
          cirugias: []
        };
      }

      // Verificar si es cirujano
      const esCirujano = medico.especialidad?.nombre?.toLowerCase().includes('cirug');
      const esDeEmergencias = medico.sector?.nombre?.toLowerCase().includes('emergencia');

      console.log(`🔍 Es cirujano: ${esCirujano}, Es de emergencias: ${esDeEmergencias}`);

      // Primero buscar el TipoTurno de cirugía
      const tipoTurnoCirugia = await TipoTurno.findOne({
        where: {
          nombre: { [Op.or]: [
            { [Op.like]: '%CIRUGIA%' }
          ]}
        }
      });

      // Si no existe tipo de turno de cirugía, no hay cirugías pendientes
      if (!tipoTurnoCirugia) {
        console.log('ℹ️ No existe TipoTurno de cirugía');
        return {
          success: true,
          hay_pendientes: false,
          count: 0,
          sin_asignar: 0,
          cirugias: []
        };
      }

      // Buscar en ListaEspera con tipo_turno_id de cirugía
      const whereClause = {
        tipo_turno_id: tipoTurnoCirugia.id,
        estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] }
      };

      if (esCirujano || esDeEmergencias) {
        // Cirujano de emergencias ve las suyas + las sin asignar
        whereClause[Op.or] = [
          { medico_id: medico.id },
          { medico_id: null }
        ];
      } else {
        // Otros médicos solo ven las asignadas a ellos
        whereClause.medico_id = medico.id;
      }

      const cirugias = await ListaEspera.findAll({
        where: whereClause,
        include: [
          {
            model: Paciente,
            as: 'paciente',
            required: true,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
            }]
          },
          {
            model: TipoTurno,
            as: 'tipo_turno',
            attributes: ['id', 'nombre']
          }
        ],
        order: [
          [Sequelize.literal(`CASE 
            WHEN prioridad = 'CRITICA' THEN 1
            WHEN prioridad = 'URGENTE' THEN 2
            WHEN prioridad = 'ALTA' THEN 3
            WHEN prioridad = 'MEDIA' THEN 4
            ELSE 5
          END`), 'ASC'],
          ['fecha_registro', 'ASC']
        ],
        limit: 50
      });

      const count = cirugias.length;
      const sinAsignar = cirugias.filter(c => !c.medico_id).length;

      console.log(`🔪 Cirugías encontradas: ${count} (${sinAsignar} sin asignar)`);

      return {
        success: true,
        hay_pendientes: sinAsignar > 0, 
        count: sinAsignar, 
        total: count, 
        cirugias: cirugias.map(c => ({
          id: c.id,
          paciente_id: c.paciente_id,
          paciente_nombre: `${c.paciente.usuario.nombre} ${c.paciente.usuario.apellido}`,
          paciente_dni: c.paciente.usuario.dni,
          prioridad: c.prioridad,
          estado: c.estado,
          es_urgencia: c.tipo_turno?.nombre === 'URGENCIA',
          fecha_registro: c.fecha_registro,
          observaciones: c.observaciones,
          sin_asignar: !c.medico_id
        }))
      };

    } catch (error) {
      console.error('❌ Error al verificar cirugías:', error);
      return {
        success: false,
        hay_pendientes: false,
        count: 0,
        sin_asignar: 0,
        cirugias: []
      };
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================
  async obtenerEstadisticasEmergencias(sectorId) {
    try {
      return { total: 0, criticas: 0, en_proceso: 0 };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }

  // ========================================
  // FUNCIONES EN DESARROLLO (SSE)
  // ========================================
  async enviarMensajeInterno(emisorId, receptorId, mensaje) {
    console.warn('⚠️ Función no implementada: enviarMensajeInterno');
    throw new Error('Función en desarrollo - Disponible en v2.0.0');
  }

  async verificarMensajesNoLeidos(usuarioId) {
    console.warn('⚠️ Función no implementada: verificarMensajesNoLeidos');
    return { count: 0, mensajes: [] };
  }

  conectarClienteSSE(req, res) {
    console.warn('⚠️ Función no implementada: conectarClienteSSE');
    throw new Error('SSE en desarrollo - Disponible en v2.0.0');
  }

  notificarUsuarioSSE(usuarioId, notificacion) {
    console.warn('⚠️ Función no implementada: notificarUsuarioSSE');
  }

  // ========================================
  // RESUMEN DE NOTIFICACIONES
  // ========================================
  async obtenerResumenNotificaciones(usuarioId, rol) {
    const resumen = {
      emergencias: 0,
      cirugias: 0,
      mensajes: 0,
      estudios: 0,
      turnos: 0
    };

    try {
      if (rol === 'MEDICO') {
        const medico = await Medico.findOne({ 
          where: { usuario_id: usuarioId },
          include: [{ model: Especialidad, as: 'especialidad' }]
        });
        
        if (medico) {
          // Verificar emergencias
          const resultEmergencias = await this.verificarEmergenciasPendientes(medico.id);
          resumen.emergencias = resultEmergencias.count;
          
          // Verificar cirugías
          const resultCirugias = await this.verificarCirugiasPendientes(medico.id, usuarioId);
          resumen.cirugias = resultCirugias.sin_asignar || 0;
        }
      }

      return resumen;
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return resumen;
    }
  }
}

module.exports = new NotificacionesService();