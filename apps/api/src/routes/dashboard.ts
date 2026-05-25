import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../middleware/auth";
import { DashboardController } from "../controllers/dashboard.controller";

const router: ExpressRouter = Router();

router.get("/history", requireAuth, DashboardController.getHistory);
router.post("/analysis", requireAuth, DashboardController.createAnalysis);
router.patch("/analysis/:id", requireAuth, DashboardController.updateAnalysis);
router.get("/analysis/:id", requireAuth, DashboardController.getAnalysisById);
router.post("/analysis/:id/share", requireAuth, DashboardController.createShareLink);

export default router;
