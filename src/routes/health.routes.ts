import { Router } from "express";
import { liveCheck, readyCheck } from "../controllers/health.controller.js";

const router = Router();

router.get("/", readyCheck);
router.get("/live", liveCheck);
router.get("/ready", readyCheck);

export default router;
