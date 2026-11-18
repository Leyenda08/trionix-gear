import { Router } from "express";
import Prestamo from "../models/prestamo.model.js";
import Equipo from "../models/equipo.model.js";

const router = Router();

// GET /api/reportes/top-equipos
router.get("/top-equipos", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const top = await Prestamo.aggregate([
      { $group: { _id: "$equipoId", totalPrestamos: { $sum: 1 } } },
      { $sort: { totalPrestamos: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "equipos",
          localField: "_id",
          foreignField: "_id",
          as: "equipo"
        }
      },
      { $unwind: "$equipo" },
      { $project: { _id: 0, codigo: "$equipo.codigo", nombre: "$equipo.nombre", totalPrestamos: 1 } }
    ]);
    res.json(top);
  } catch (e) { next(e); }
});

// GET /api/reportes/resumen
router.get("/resumen", async (req, res, next) => {
  try {
    const now = new Date();
    const [porEstado, activos, vencidos, porTipo] = await Promise.all([
      Equipo.aggregate([{ $group: { _id: "$estado", total: { $sum: 1 } } }]),
      Prestamo.countDocuments({ estado: "activo" }),
      Prestamo.countDocuments({ estado: "activo", fechaLimite: { $lt: now } }),
      Prestamo.aggregate([
        { $match: { estado: "activo" } },
        {
          $lookup: {
            from: "usuarios",
            localField: "usuarioId",
            foreignField: "_id",
            as: "usuario"
          }
        },
        { $unwind: "$usuario" },
        { $group: { _id: "$usuario.tipo", total: { $sum: 1 } } }
      ])
    ]);
    
    res.json({ equiposPorEstado: porEstado, prestamosActivos: activos, prestamosVencidos: vencidos, activosPorTipoUsuario: porTipo });
  } catch (e) { next(e); }
});

export default router;