import Equipo from "../models/equipo.model.js";
import Usuario from "../models/usuario.model.js";
import Prestamo from "../models/prestamo.model.js";
import { httpError } from "../middlewares/errorHandler.js";

const TOPES = { estudiante: 2, docente: 4, administrativo: 3 };
const DIAS_MAX = { estudiante: 7, docente: 15, administrativo: 7 };

export async function crearPrestamo(datos) {
  const { equipoId, usuarioId, fechaLimite, observaciones } = datos;

  // 1. Validar Usuario (R2)
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw httpError(404, "Usuario no encontrado");
  if (!usuario.activo) throw httpError(400, "El usuario está inactivo");

  // 2. Validar Equipo (Existencia)
  const equipo = await Equipo.findById(equipoId);
  if (!equipo) throw httpError(404, "Equipo no encontrado");

  // 3. Validar Topes (R3)
  const activos = await Prestamo.countDocuments({ usuarioId, estado: "activo" });
  const tope = TOPES[usuario.tipo];
  if (activos >= tope) {
    throw httpError(409, `El usuario alcanzó el tope de ${tope} préstamos activos (tipo: ${usuario.tipo})`);
  }

  // 4. Validar Fechas (R4)
  const ahora = new Date();
  const limite = new Date(fechaLimite);
  if (limite <= ahora) throw httpError(400, "La fecha límite debe estar en el futuro");
  const diasMax = DIAS_MAX[usuario.tipo];
  if ((limite - ahora) / 86400000 > diasMax) {
    throw httpError(400, `Máximo ${diasMax} días de préstamo para ${usuario.tipo}`);
  }

  // 5. Concurrencia Atómica (R8)
  // Solo actualiza si el equipo sigue estando "disponible"
  const equipoActualizado = await Equipo.findOneAndUpdate(
    { _id: equipoId, estado: "disponible" },
    { $set: { estado: "prestado" } },
    { new: true }
  );

  if (!equipoActualizado) {
    throw httpError(409, `El equipo no está disponible (estado actual: ${equipo.estado})`);
  }

  // 6. Crear préstamo (con compensación si falla)
  try {
    const prestamo = await Prestamo.create({
      equipoId, usuarioId, fechaLimite: limite, observaciones: observaciones || "",
    });
    return { prestamo, equipo: equipoActualizado, usuario };
  } catch (error) {
    // Si falla el préstamo, devolvemos el equipo a "disponible" (Compensación)
    await Equipo.updateOne({ _id: equipoId, estado: "prestado" }, { $set: { estado: "disponible" } });
    throw error;
  }
}