import { Router, type Router as ExpressRouter } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

const router: ExpressRouter = Router();

router.get("/analysis/:shareId", DashboardController.getPublicAnalysis);

export default router;
