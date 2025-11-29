// controllers/camasController.js
const db = require('../database/db');
const { 
  Cama, 
  Habitacion, 
  Sector, 
  ListasEsperas 
} = require('../models');

// Finalizar limpieza de cama
const finalizarLimpiezaCama = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { cama_id } = req.params;
    
    // Verificar que la cama existe y está en limpieza
    const cama = await Cama.findByPk(cama_id, {
      include: [{
        model: Habitacion,
        as: 'habitacion',
        include: [{
          model: Sector,
          as: 'sector'
        }]
      }],
      transaction
    });

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Cama no encontrada' });
    }

    if (cama.estado !== 'EnLimpieza') {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `La cama está en estado: ${cama.estado}. Solo se puede finalizar limpieza de camas en estado 'EnLimpieza'` 
      });
    }

    // Cambiar estado a Libre
    await cama.update({
      estado: 'Libre',
      fecha_fin_limpieza: null,
      updated_at: new Date()
    }, { transaction });

    console.log(`Cama ${cama_id} limpieza finalizada - Lista para nuevo paciente`);

    // Opcional: Notificar que hay cama disponible para lista de espera
    await procesarListaEsperaSector(cama.habitacion.sector_id, transaction);

    await transaction.commit();
    res.json({ 
      success: true,
      message: `Limpieza finalizada. Cama ${cama.numero} en ${cama.habitacion.sector.nombre} lista para nuevo paciente`,
      cama_id: cama.id,
      estado: 'Libre'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al finalizar limpieza:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al finalizar limpieza', 
      error: error.message 
    });
  }
};

// Procesar lista de espera cuando se libera una cama
const procesarListaEsperaSector = async (sector_id, transaction) => {
  try {
    // Buscar pacientes en lista de espera para este sector
    const pacientesEspera = await ListasEsperas.findAll({
      where: {
        tipo: 'INTERNACION',
        estado: 'PENDIENTE',
        sector_id: sector_id
      },
      order: [['prioridad', 'DESC'], ['fecha_registro', 'ASC']], // Prioridad alta primero, luego FIFO
      limit: 1,
      transaction
    });

    if (pacientesEspera.length > 0) {
      const pacienteEspera = pacientesEspera[0];
      console.log(`Cama liberada en sector ${sector_id}. Paciente en espera: ${pacienteEspera.paciente_id}`);
      
      // Aquí podrías implementar notificación automática o manual
      await crearAlertaCamaDisponible(pacienteEspera, sector_id, transaction);
    }

  } catch (error) {
    console.error('Error al procesar lista de espera:', error);
  }
};

// Crear alerta de cama disponible
const crearAlertaCamaDisponible = async (listaEspera, sector_id, transaction) => {
  try {
    console.log(`ALERTA: Cama disponible en sector ${sector_id} para paciente ${listaEspera.paciente_id}`);
    
    // Actualizar lista de espera como "NOTIFICADO"
    await listaEspera.update({
      estado: 'NOTIFICADO',
      observaciones: `Cama disponible - ${new Date().toLocaleString()}`
    }, { transaction });

  } catch (error) {
    console.error('Error al crear alerta:', error);
  }
};

// Obtener estado de todas las camas por sector
const getEstadoCamasPorSector = async (req, res) => {
  try {
    const estadoCamas = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas',
          attributes: ['id', 'numero', 'estado', 'sexo_ocupante', 'fecha_fin_limpieza']
        }],
        attributes: ['id', 'numero', 'tipo', 'sexo_permitido']
      }],
      attributes: ['id', 'nombre'],
      order: [['id', 'ASC'], ['habitaciones', 'numero', 'ASC'], ['habitaciones', 'camas', 'numero', 'ASC']]
    });

    // Agregar estadísticas por sector
    const estadisticas = estadoCamas.map(sector => {
      let totalCamas = 0;
      let camasLibres = 0;
      let camasOcupadas = 0;
      let camasEnLimpieza = 0;

      sector.habitaciones.forEach(habitacion => {
        habitacion.camas.forEach(cama => {
          totalCamas++;
          switch (cama.estado) {
            case 'Libre':
              camasLibres++;
              break;
            case 'Ocupada':
              camasOcupadas++;
              break;
            case 'EnLimpieza':
              camasEnLimpieza++;
              break;
          }
        });
      });

      const ocupacion = totalCamas > 0 ? ((camasOcupadas / totalCamas) * 100).toFixed(1) : 0;

      return {
        ...sector.toJSON(),
        estadisticas: {
          totalCamas,
          camasLibres,
          camasOcupadas,
          camasEnLimpieza,
          porcentajeOcupacion: ocupacion
        }
      };
    });

    res.json({ sectores: estadisticas });

  } catch (error) {
    console.error('Error al obtener estado de camas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estado de camas', 
      error: error.message 
    });
  }
};

module.exports = {
  finalizarLimpiezaCama,
  getEstadoCamasPorSector,
  procesarListaEsperaSector
};