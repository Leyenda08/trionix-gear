import Joi from "joi";

export const crearUsuarioSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required(),
  documento: Joi.string().pattern(/^\d{6,12}$/).required(),
  email: Joi.string().email().required(),
  tipo: Joi.string().valid("estudiante", "docente", "administrativo").required(),
  activo: Joi.boolean().default(true),
}).unknown(false);

export const actualizarUsuarioSchema = Joi.object({
  nombre: Joi.string().min(3).max(100),
  documento: Joi.string().pattern(/^\d{6,12}$/),
  email: Joi.string().email(),
  tipo: Joi.string().valid("estudiante", "docente", "administrativo"),
  activo: Joi.boolean(),
}).unknown(false);