import { Router } from "express";
import mongoose from "mongoose";
import Prestamo from "../models/prestamo.model.js";
import Equipo from "../models/equipo.model.js";
import { crearPrestamoSchema } from "../validators/prestamo.validator.js";
import { crearPrestamo } from "../services/prestamo.service.js";
import { httpError } from "../middlewares/errorHandler.js";

const router = Router();

// POST /api/prestamos
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = crearPrestamoSchema.validate(req.body);
    if (error) throw httpError(400, error.details[0].message);

    const resultado = await crearPrestamo(value);
    
    const response = {
      ...resultado.prestamo._doc,
      equipo: resultado.equipo,
      usuario: resultado.usuario
    };
    res.status(201).json(response);
  } catch (e) { next(e); }
});

// PATCH /api/prestamos/:id/devolver
router.patch("/:id/devolver", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const prestamo = await Prestamo.findById(req.params.id);
    if (!prestamo) throw httpError(404, "Este préstamo no ha sido encontrado");
    
    if (prestamo.estado === "devuelto") throw httpError(409, "Este préstamo ya fue devuelto");

    prestamo.estado = "devuelto";
    prestamo.fechaDevolucion = new Date();
    await prestamo.save();

    await Equipo.findByIdAndUpdate(prestamo.equipoId, { $set: { estado: "disponible" } });

    res.json({ mensaje: "Equipo devuelto correctamente", prestamo });
  } catch (e) { next(e); }
});

// GET /api/prestamos
router.get("/", async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;

    const prestamos = await Prestamo.find(filtro)
      .populate("equipoId", "codigo nombre categoria")
      .populate("usuarioId", "nombre tipo")
      .lean();

    const now = new Date();
    let data = prestamos.map(p => {
      const obj = {
        ...p,
        equipo: p.equipoId,
        usuario: p.usuarioId,
        vencido: p.estado === "activo" && p.fechaLimite < now
      };
      delete obj.equipoId;
      delete obj.usuarioId;
      return obj;
    });

    if (req.query.vencidos === "true") {
      data = data.filter(p => p.vencido);
    }

    res.json(data);
  } catch (e) { next(e); }
});

// GET /api/prestamos/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const p = await Prestamo.findById(req.params.id)
      .populate("equipoId", "codigo nombre categoria")
      .populate("usuarioId", "nombre tipo")
      .lean();
    if (!p) throw httpError(404, "Préstamo no encontrado");

    const now = new Date();
    const obj = { ...p, equipo: p.equipoId, usuario: p.usuarioId, vencido: p.estado === "activo" && p.fechaLimite < now };
    delete obj.equipoId;
    delete obj.usuarioId;
    
    res.json(obj);
  } catch (e) { next(e); }
});

export default router;