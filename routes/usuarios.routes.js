import { Router } from "express";
import mongoose from "mongoose";
import Usuario from "../models/usuario.model.js";
import Prestamo from "../models/prestamo.model.js";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "../validators/usuario.validator.js";
import { httpError } from "../middlewares/errorHandler.js";

const router = Router();

// GET /api/usuarios
router.get("/", async (req, res, next) => {
  try {
    const filtro = {};
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.activo) filtro.activo = req.query.activo === "true";
    const usuarios = await Usuario.find(filtro).lean();
    res.json(usuarios);
  } catch (e) { next(e); }
});

// GET /api/usuarios/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) throw httpError(404, "Usuario no encontrado");
    res.json(usuario);
  } catch (e) { next(e); }
});

// POST /api/usuarios
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = crearUsuarioSchema.validate(req.body);
    if (error) throw httpError(400, error.details[0].message);
    const nuevo = await Usuario.create(value);
    res.status(201).json(nuevo);
  } catch (e) { next(e); }
});

// PUT /api/usuarios/:id
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const { error, value } = actualizarUsuarioSchema.validate(req.body);
    if (error) throw httpError(400, error.details[0].message);

    const actualizado = await Usuario.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!actualizado) throw httpError(404, "Usuario no encontrado");
    
    res.json(actualizado);
  } catch (e) { next(e); }
});

// DELETE /api/usuarios/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw httpError(400, "ID inválido");
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) throw httpError(404, "Usuario no encontrado");

    // R7: No eliminar si tiene préstamos activos
    const prestamosActivos = await Prestamo.countDocuments({ usuarioId: req.params.id, estado: "activo" });
    if (prestamosActivos > 0) {
      throw httpError(409, "No se puede eliminar un usuario con préstamos activos");
    }

    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (e) { next(e); }
});

export default router;