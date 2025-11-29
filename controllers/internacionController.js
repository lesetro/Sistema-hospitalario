// controllers/internacionController.js - VERSIÓN DE DEBUG
const db = require('../database/db');
const { 
  Sector, 
  Habitacion, 
  Cama, 
  Internacion,
  Paciente,
  Usuario,
  ListasEsperas,
  TipoDeServicio
} = require('../models');

// Vista principal de internación
const getVistaInternacion = async (req, res) => {
  try {
    res.render('dashboard/admin/internacion', {
      title: 'Gestión de Internación',
      layout: 'dashboard/admin/dashboard-admin'
    });
  } catch (error) {
    console.error('Error al cargar vista de internación:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la vista de internación',
      error: error 
    });
  }
};

// VERSIÓN SIMPLIFICADA PARA DEBUG
const getDashboardData = async (req, res) => {
  try {
    console.log('🔍 Iniciando getDashboardData...');

    // PASO 1: Probar consulta básica de sectores
    console.log('📊 PASO 1: Obteniendo sectores básicos...');
    const sectoresBasicos = await Sector.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });
    console.log('✅ Sectores obtenidos:', sectoresBasicos.length);

    // PASO 2: Probar habitaciones sin includes complejos
    console.log('📊 PASO 2: Obteniendo habitaciones...');
    const habitaciones = await Habitacion.findAll({
      attributes: ['id', 'numero', 'tipo', 'sector_id'],
      order: [['numero', 'ASC']]
    });
    console.log('✅ Habitaciones obtenidas:', habitaciones.length);

    // PASO 3: Probar camas básicas
    console.log('📊 PASO 3: Obteniendo camas...');
    const camas = await Cama.findAll({
      attributes: ['id', 'numero', 'estado', 'habitacion_id'],
      order: [['numero', 'ASC']]
    });
    console.log('✅ Camas obtenidas:', camas.length);

    // PASO 4: Probar listas de espera básicas
    console.log('📊 PASO 4: Obteniendo listas de espera...');
    const listasEsperaBasicas = await ListasEsperas.findAll({
      where: {
        tipo: 'INTERNACION',
        estado: 'PENDIENTE'
      },
      attributes: ['id', 'paciente_id', 'tipo', 'prioridad', 'estado', 'fecha_registro'],
      order: [['prioridad', 'DESC'], ['fecha_registro', 'ASC']]
    });
    console.log('✅ Listas de espera obtenidas:', listasEsperaBasicas.length);

    // Estadísticas generales básicas
    const estadisticasGenerales = {
      totalSectores: sectoresBasicos.length,
      totalHabitaciones: habitaciones.length,
      totalCamas: camas.length,
      camasLibres: camas.filter(c => c.estado === 'Libre').length,
      camasOcupadas: camas.filter(c => c.estado === 'Ocupada').length,
      camasEnLimpieza: camas.filter(c => c.estado === 'EnLimpieza').length,
      porcentajeOcupacion: camas.length > 0 ? 
        ((camas.filter(c => c.estado === 'Ocupada').length / camas.length) * 100).toFixed(1) : 0
    };

    // Crear estructura básica de sectores
    const sectoresConDatos = sectoresBasicos.map(sector => {
      const habitacionesSector = habitaciones.filter(h => h.sector_id === sector.id);
      const camasSector = camas.filter(c => {
        const habitacion = habitaciones.find(h => h.id === c.habitacion_id);
        return habitacion && habitacion.sector_id === sector.id;
      });

      return {
        id: sector.id,
        nombre: sector.nombre,
        habitaciones: habitacionesSector.map(habitacion => ({
          id: habitacion.id,
          numero: habitacion.numero,
          tipo: habitacion.tipo,
          camas: camas.filter(c => c.habitacion_id === habitacion.id).map(cama => ({
            id: cama.id,
            numero: cama.numero,
            estado: cama.estado,
            pacienteActual: null, // Por ahora null para simplificar
            tiempoRestanteLimpieza: null
          })),
          estadisticas: {
            totalCamas: camas.filter(c => c.habitacion_id === habitacion.id).length,
            libres: camas.filter(c => c.habitacion_id === habitacion.id && c.estado === 'Libre').length,
            ocupadas: camas.filter(c => c.habitacion_id === habitacion.id && c.estado === 'Ocupada').length,
            enLimpieza: camas.filter(c => c.habitacion_id === habitacion.id && c.estado === 'EnLimpieza').length,
            porcentajeOcupacion: 0
          }
        })),
        estadisticas: {
          totalHabitaciones: habitacionesSector.length,
          habitacionesConCamas: habitacionesSector.length,
          totalCamas: camasSector.length,
          camasLibres: camasSector.filter(c => c.estado === 'Libre').length,
          camasOcupadas: camasSector.filter(c => c.estado === 'Ocupada').length,
          camasEnLimpieza: camasSector.filter(c => c.estado === 'EnLimpieza').length,
          porcentajeOcupacion: camasSector.length > 0 ? 
            ((camasSector.filter(c => c.estado === 'Ocupada').length / camasSector.length) * 100).toFixed(1) : 0
        }
      };
    });

    console.log('✅ Datos procesados correctamente');

    res.json({
      sectores: sectoresConDatos,
      estadisticasGenerales,
      listasEspera: listasEsperaBasicas, // Sin includes por ahora
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR COMPLETO en getDashboardData:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener datos del dashboard',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Placeholder functions para que no haya errores de importación
const crearHabitacion = async (req, res) => {
  res.json({ success: false, message: 'Función en desarrollo' });
};

const crearCama = async (req, res) => {
  res.json({ success: false, message: 'Función en desarrollo' });
};

const agregarPacienteListaEspera = async (req, res) => {
  res.json({ success: false, message: 'Función en desarrollo' });
};

const eliminarPacienteListaEspera = async (req, res) => {
  res.json({ success: false, message: 'Función en desarrollo' });
};

module.exports = {
  getVistaInternacion,
  getDashboardData,
  crearHabitacion,
  crearCama,
  agregarPacienteListaEspera,
  eliminarPacienteListaEspera
};