import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Importaciones de la base de datos y middlewares
import { connectDB } from "./db.js";


// Importaciones de las rutas
import prestamosRoutes from "./routes/prestamos.routes.js";
import reportesRoutes from "./routes/reportes.routes.js"; // <-- Ojo, verifica que creaste este archivo, si lo creaste en la carpeta routes, sino, crea reportes.routes.js y ponle las rutas de reportes
import healthRoutes from "./routes/health.routes.js";
import equiposRoutes from "./routes/equipos.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

// Importaciones de la base de datos y middlewares
import errorHandler from "./middlewares/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- SEGURIDAD ---
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Configuración de Helmet para permitir tus scripts locales
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(hpp());

// --- RATE LIMIT ---
app.use("/api", rateLimit({ 
  windowMs: 60_000, 
  max: 120, 
  validate: { xForwardedForHeader: false } 
}));

// --- FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, "public")));

// --- RUTAS DE LA API ---
app.use("/api/health", healthRoutes);
app.use("/api/equipos", equiposRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/reportes", reportesRoutes);

// --- MANEJADOR DE ERRORES (SIEMPRE AL FINAL) ---
app.use(errorHandler);

// --- ARRANQUE ---
const PORT = Number(process.env.PORT) || 3000;

try {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[api] escuchando en 0.0.0.0:${PORT}`);
  });
} catch (e) {
  console.error("[api] fallo al arrancar:", e.message);
  process.exit(1);
}