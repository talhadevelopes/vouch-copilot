import { Router, type Router as ExpressRouter } from "express";
import { AIController } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth";

const router: ExpressRouter = Router();

router.post("/", requireAuth, AIController.chat);

export default router;