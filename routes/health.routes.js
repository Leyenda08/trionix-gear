import { Router } from "express";
import { dbState } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const ok = dbState() === 1;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "error",
    db: ok ? "connected" : "disconnected",
  });
});

export default router;