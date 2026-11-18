import Joi from "joi";

export const crearEquipoSchema = Joi.object({
  codigo: Joi.string().pattern(/^EQ-\d{4}$/).required(),
  nombre: Joi.string().min(3).max(100).required(),
  categoria: Joi.string().valid("portatil", "proyector", "camara", "audio", "redes").required(),
  estado: Joi.string().valid("disponible", "mantenimiento").default("disponible"),
  ubicacion: Joi.string().max(100).default("Almacen principal"),
}).unknown(false);

export const actualizarEquipoSchema = Joi.object({
  codigo: Joi.string().pattern(/^EQ-\d{4}$/),
  nombre: Joi.string().min(3).max(100),
  categoria: Joi.string().valid("portatil", "proyector", "camara", "audio", "redes"),
  estado: Joi.string().valid("disponible", "mantenimiento"),
  ubicacion: Joi.string().max(100),
}).unknown(false);