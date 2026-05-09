import { Router } from "express";
import { healthCheck } from "../controllers/index.js";

const router = Router();

router.get("/", healthCheck);

export default router;
