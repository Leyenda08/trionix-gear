import mongoose from "mongoose";
import "dotenv/config";
import Equipo from "./models/equipo.model.js";
import Usuario from "./models/usuario.model.js";
import Prestamo from "./models/prestamo.model.js";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a Mongo para seeding...");

  // Limpiar base de datos
  await Equipo.deleteMany({});
  await Usuario.deleteMany({});
  await Prestamo.deleteMany({});
  console.log("Colecciones limpias.");

  // 1. Crear 8 Equipos
  const equipos = await Equipo.insertMany([
    { codigo: "EQ-0001", nombre: "Portatil HP", categoria: "portatil" },
    { codigo: "EQ-0002", nombre: "Portatil Dell", categoria: "portatil" },
    { codigo: "EQ-0003", nombre: "Proyector Epson", categoria: "proyector" },
    { codigo: "EQ-0004", nombre: "Camara Canon", categoria: "camara" },
    { codigo: "EQ-0005", nombre: "Microfono Shure", categoria: "audio" },
    { codigo: "EQ-0006", nombre: "Router Cisco", categoria: "redes" },
    { codigo: "EQ-0007", nombre: "Switch TP-Link", categoria: "redes" },
    { codigo: "EQ-0008", nombre: "Parlante JBL", categoria: "audio" }
  ]);

  // 2. Crear 5 Usuarios (3 tipos)
  const usuarios = await Usuario.insertMany([
    { nombre: "Ana Estudiante", documento: "100000001", email: "ana@test.com", tipo: "estudiante" },
    { nombre: "Luis Estudiante", documento: "100000002", email: "luis@test.com", tipo: "estudiante" },
    { nombre: "Profe Carlos", documento: "200000001", email: "carlos@test.com", tipo: "docente" },
    { nombre: "Profe Maria", documento: "200000002", email: "maria@test.com", tipo: "docente" },
    { nombre: "Admin Sofia", documento: "300000001", email: "sofia@test.com", tipo: "administrativo" }
  ]);

  // 3. Crear 6 Préstamos (2 devueltos, 1 vencido)
  const ahora = new Date();
  const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1);
  const manana = new Date(ahora); manana.setDate(manana.getDate() + 1);
  const pasado = new Date(ahora); pasado.setDate(pasado.getDate() - 5);

  await Prestamo.insertMany([
    // Préstamos activos normales
    { equipoId: equipos[0]._id, usuarioId: usuarios[0]._id, fechaLimite: manana, estado: "activo" },
    { equipoId: equipos[2]._id, usuarioId: usuarios[2]._id, fechaLimite: manana, estado: "activo" },
    
    // Préstamo VENCIDO (El equipo sigue prestado, la fecha ya pasó)
    { equipoId: equipos[3]._id, usuarioId: usuarios[1]._id, fechaLimite: pasado, estado: "activo" },
    
    // Préstamos DEVUELTOS (El equipo ya está disponible otra vez)
    { equipoId: equipos[1]._id, usuarioId: usuarios[3]._id, fechaLimite: manana, estado: "devuelto", fechaDevolucion: ayer },
    { equipoId: equipos[4]._id, usuarioId: usuarios[4]._id, fechaLimite: manana, estado: "devuelto", fechaDevolucion: ayer },
    { equipoId: equipos[5]._id, usuarioId: usuarios[0]._id, fechaLimite: manana, estado: "devuelto", fechaDevolucion: ayer }
  ]);

  // Actualizar estados de equipos para que coincidan con los préstamos activos
  await Equipo.findByIdAndUpdate(equipos[0]._id, { estado: "prestado" });
  await Equipo.findByIdAndUpdate(equipos[2]._id, { estado: "prestado" });
  await Equipo.findByIdAndUpdate(equipos[3]._id, { estado: "prestado" });

  console.log("¡Datos de prueba insertados con éxito!");
  process.exit(0);
}

seed();