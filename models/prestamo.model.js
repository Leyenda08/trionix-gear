import mongoose from "mongoose";

const prestamoSchema = new mongoose.Schema({
  equipoId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipo", required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  fechaPrestamo: { type: Date, default: Date.now },
  fechaLimite: { type: Date, required: true },
  fechaDevolucion: { type: Date, default: null },
  estado: { type: String, enum: ["activo", "devuelto"], default: "activo" },
  observaciones: { type: String, trim: true, maxlength: 300, default: "" },
}, { timestamps: true });

export default mongoose.model("Prestamo", prestamoSchema);