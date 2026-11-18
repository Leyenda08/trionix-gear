export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const httpError = (status, msg) => new HttpError(status, msg);

export default function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || "campo";
    return res.status(409).json({ error: `El campo "${campo}" ya existe` });
  }
  if (err.name === "ValidationError") return res.status(400).json({ error: "Datos inválidos" });
  if (err.name === "CastError") return res.status(400).json({ error: "ID inválido" });
  console.error("[UNHANDLED]", err);
  return res.status(500).json({ error: "Error interno del servidor" });
}