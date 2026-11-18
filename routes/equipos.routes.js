import { Router } from "express";
import mongoose from "mongoose";
import Equipo from "../models/equipo.model.js";
import { crearEquipoSchema, actualizarEquipoSchema } from "../validators/equipo.validator.js";
import { httpError } from "../middlewares/errorHandler.js";

const router = Router();

// GET /api/equipos (con filtros)
router.get("/", async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.estado) filtro.estado = req.query.estado;
    const equipos = await Equipo.find(filtro).lean();
    res.json(equipos);
  } catch (e) { next(e); }
});

// GET /api/equipos/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) throw httpError(404, "Equipo no encontrado");
    res.json(equipo);
  } catch (e) { next(e); }
});

// POST /api/equipos
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = crearEquipoSchema.validate(req.body);
    if (error) throw httpError(400, error.details[0].message);
    const nuevo = await Equipo.create(value);
    res.status(201).json(nuevo);
  } catch (e) { next(e); }
});

// PUT /api/equipos/:id
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const { error, value } = actualizarEquipoSchema.validate(req.body);
    if (error) throw httpError(400, error.details[0].message);

    const actual = await Equipo.findById(req.params.id);
    if (!actual) throw httpError(404, "Equipo no encontrado");
    
    if (actual.estado === "prestado" && value.estado && value.estado !== "prestado") {
      throw httpError(409, "No puedes cambiar el estado de un equipo prestado");
    }
    if (value.estado === "prestado") {
      throw httpError(400, "El estado 'prestado' solo lo asigna el flujo de préstamos");
    }

    const actualizado = await Equipo.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    res.json(actualizado);
  } catch (e) { next(e); }
});

// DELETE /api/equipos/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) throw httpError(404, "Equipo no encontrado");
    
    if (equipo.estado === "prestado") {
      throw httpError(409, "No se puede eliminar un equipo que está prestado"); 
    }
    await Equipo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Equipo eliminado correctamente" });
  } catch (e) { next(e); }
});

export default router;