import Joi from "joi";

export const crearPrestamoSchema = Joi.object({
  equipoId: Joi.string().hex().length(24).required(),
  usuarioId: Joi.string().hex().length(24).required(),
  fechaLimite: Joi.date().iso().greater("now").required(),
  observaciones: Joi.string().max(300).allow("").default(""),
}).unknown(false);