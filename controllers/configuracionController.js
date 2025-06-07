const { MotivoAdmision, MotivoConsulta, FormaIngreso, Rol, Tratamiento , TipoDeServicio, Especialidad, TipoTurno, Sector } = require('../models');

const models = {
  
  motivos: { model: MotivoAdmision, title: 'Motivos de Admisión' },
  formas: { model: FormaIngreso, title: 'Motivo de Ingreso' },
  tiposEstudio: { model: TipoDeServicio, title: 'Tipos de Servicio' },
  especialidades: { model: Especialidad, title: 'Especialidades' },
  tiposTurno: { model: TipoTurno, title: 'Tipos de Turno' },
  sectores: { model: Sector, title: 'Sectores' },
  tratamiento: { model: Tratamiento, title: 'Tratamiento' },
  rol: { model: Rol, title: 'Rol' },
  consulta : { model: MotivoConsulta, title: 'Motivo consulta' },
};

const renderConfig = async (req, res) => {
  try {
    const { table } = req.params;
    const activeTable = table && models[table] ? table : 'motivos'; // Tabla por defecto: motivos
    const tables = {};

    // Obtener datos de todas las tablas para los tabs
    for (const [key, { model }] of Object.entries(models)) {
      tables[key] = await model.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    }

    res.render('dashboard/admin/configuracion', {
      title: 'Configuración',
      tables,
      activeTable,
      tableTitle: models[activeTable].title,
      models: Object.keys(models).map(key => ({ key, title: models[key].title })),
    });
  } catch (error) {
    console.error('Error al renderizar configuración:', error);
    res.status(500).json({ message: 'Error al renderizar configuración', error: error.message });
  }
};

const getConfigTable = async (req, res) => {
  try {
    const table = req.params.table;
    const Model = models[table]?.model;
    if (!Model) {
      return res.status(404).json({ message: 'Tabla no encontrada' });
    }
    const records = await Model.findAll();
    res.json(records);
  } catch (error) {
    console.error(`Error al obtener ${req.params.table}:`, error);
    res.status(500).json({ message: `Error al obtener ${req.params.table}`, error: error.message });
  }
};

const createConfigRecord = async (req, res) => {
  try {
    const table = req.params.table;
    const Model = models[table]?.model;
    if (!Model) {
      return res.status(404).json({ message: 'Tabla no encontrada' });
    }
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: 'El campo nombre es obligatorio' });
    }
    const record = await Model.create({ nombre, descripcion: descripcion || null });
    res.status(201).json({ message: `${table} creado con éxito`, record });
  } catch (error) {
    console.error(`Error al crear ${req.params.table}:`, error);
    res.status(400).json({ message: `Error al crear ${req.params.table}`, error: error.message });
  }
};

const updateConfigRecord = async (req, res) => {
  try {
    const table = req.params.table;
    const Model = models[table]?.model;
    if (!Model) {
      return res.status(404).json({ message: 'Tabla no encontrada' });
    }
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: 'El campo nombre es obligatorio' });
    }
    const record = await Model.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: `${table} no encontrado` });
    }
    await record.update({ nombre, descripcion: descripcion || null });
    res.json({ message: `${table} actualizado con éxito`, record });
  } catch (error) {
    console.error(`Error al actualizar ${req.params.table}:`, error);
    res.status(400).json({ message: `Error al actualizar ${req.params.table}`, error: error.message });
  }
};

const deleteConfigRecord = async (req, res) => {
  try {
    const table = req.params.table;
    const Model = models[table]?.model;
    if (!Model) {
      return res.status(404).json({ message: 'Tabla no encontrada' });
    }
    const { id } = req.params;
    const record = await Model.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: `${table} no encontrado` });
    }
    await record.destroy();
    res.json({ message: `${table} eliminado con éxito` });
  } catch (error) {
    console.error(`Error al eliminar ${req.params.table}:`, error);
    res.status(400).json({ message: `Error al eliminar ${req.params.table}`, error: error.message });
  }
};
const getConfigRecord = async (req, res) => {
  try {
    const table = req.params.table;
    const Model = models[table]?.model;
    if (!Model) {
      return res.status(404).json({ message: 'Tabla no encontrada' });
    }
    const { id } = req.params;
    const record = await Model.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: `${table} no encontrado` });
    }
    res.json(record);
  } catch (error) {
    console.error(`Error al obtener registro de ${req.params.table}:`, error);
    res.status(500).json({ message: `Error al obtener registro de ${req.params.table}`, error: error.message });
  }
};

module.exports = {
  renderConfig,
  getConfigTable,
  createConfigRecord,
  updateConfigRecord,
  deleteConfigRecord,
  getConfigRecord,
};