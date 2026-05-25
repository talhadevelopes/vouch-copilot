import { Router, type Router as ExpressRouter } from "express";
import type { requireAuth } from "../middleware/auth";
import { CoreAuthController } from "../controllers/auth/core.controller";
import { SocialAuthController } from "../controllers/auth/social.controller";
import { OTPController } from "../controllers/auth/otp.controller";
import { ExtensionAuthController } from "../controllers/auth/extension.controller";
import { requireAuth as requireAuthMiddleware } from "../middleware/auth";

const router: ExpressRouter = Router();

router.post("/register", CoreAuthController.register);
router.post("/login", CoreAuthController.login);
router.post("/google", SocialAuthController.googleLogin);
router.post("/otp/request", OTPController.requestOtp);
router.post("/otp/verify", OTPController.verifyOtp);
router.post("/set-password", requireAuthMiddleware, OTPController.setPassword);
router.post("/extension/link-code", requireAuthMiddleware, ExtensionAuthController.createExtensionLinkCode);
router.post("/extension/link-code/exchange", ExtensionAuthController.exchangeExtensionLinkCode);
router.post("/demo-login", CoreAuthController.demoLogin);
router.post("/refresh", CoreAuthController.refresh);
router.get("/me", requireAuthMiddleware, CoreAuthController.me);
router.post("/logout", requireAuthMiddleware, CoreAuthController.logout);

export default router;
