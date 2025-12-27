const express = require('express');
const router = express.Router();
const { Admision, Paciente, Usuario, Medico, Sector, Turno } = require('../../models');
const db = require('../../database/db');

// GET /admin/dashboard - Dashboard administrativo
router.get('/dashboard', async (req, res) => {
  try {
    console.log("🏥 Cargando dashboard administrativo...");

    // Obtener admisiones con relaciones
    const admisiones = await Admision.findAll({
      include: [
        {
          model: Paciente,
          as: "paciente",
          attributes: ["id"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nombre", "apellido", "dni"],
            },
          ],
        },
        {
          model: Turno,
          as: "turno",
          attributes: ["id", "fecha", "hora_inicio", "hora_fin", "estado"],
        },
        {
          model: Medico,
          as: "medico",
          attributes: ["id"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nombre", "apellido"],
            },
          ],
        },
        { model: Sector, as: "sector", attributes: ["id", "nombre"] },
      ],
      limit: 10,
      order: [['fecha', 'DESC']]
    });

    // Calcular estadísticas
    const estadisticas = {
      pacientesActivos: await Paciente.count({ where: { estado: 'Activo' } }),
      camasOcupadas: await db.sequelize.models.Cama?.count({ where: { estado: "Ocupada" } }) || 0,
      camasLibres: await db.sequelize.models.Cama?.count({ where: { estado: "Libre" } }) || 0,
      turnosHoy: await Turno.count({
        where: {
          fecha: new Date().toISOString().split("T")[0],
        },
      }),
      admisionesHoy: await Admision.count({
        where: {
          fecha: {
            [db.Sequelize.Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        },
      }),
    };

    console.log(" Estadísticas:", estadisticas);
    console.log(` Admisiones: ${admisiones.length}`);

    res.render("dashboard/admin/dashboard-admin", {
      title: "Dashboard Administrativo",
      estadisticas,
      admisiones,
      alertas: [],
      pagination: null,
    });

  } catch (error) {
    console.error("❌ Error al cargar dashboard:", error);
    res.status(500).render("error", {
      message: "Error al cargar el dashboard",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

module.exports = router;