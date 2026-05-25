import type { Response } from "express";
import { prisma } from "../../db/prisma";
import { ApiResponse } from "../../utils/api-response";
import { extensionCodeExchangeSchema } from "../../validators/auth.validator";
import { issueTokens } from "./core.controller";
import type { AuthRequest } from "../../middleware/auth";

export class ExtensionAuthController {

    static async createExtensionLinkCode(req: AuthRequest, res: Response) {
        const userId = req.userId!;
        const now = new Date();

        // Look for a valid existing code first
        const existing = await prisma.extensionLinkCode.findFirst({
            where: {
                userId,
                consumedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
        });

        if (existing) {
            return ApiResponse.success(res, "Existing code reused", {
                code: existing.code,
                expiresAt: existing.expiresAt,
            });
        }

        const code = `${Math.floor(100000 + Math.random() * 900000)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await prisma.extensionLinkCode.create({
            data: {
                id: `xlc_${crypto.randomUUID()}`,
                code,
                userId,
                expiresAt,
            },
        });

        return ApiResponse.success(res, "Extension link code created", { code, expiresAt });
    }

    static async exchangeExtensionLinkCode(req: AuthRequest, res: Response) {
        const parsed = extensionCodeExchangeSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }

        const code = parsed.data.code;
        const link = await prisma.extensionLinkCode.findFirst({
            where: {
                code,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!link) {
            return ApiResponse.error(res, "Invalid or expired code", "UNAUTHORIZED", 401);
        }

        await prisma.extensionLinkCode.update({
            where: { id: link.id },
            data: { consumedAt: new Date() },
        });

        const { accessToken, refreshToken } = await issueTokens(link.user);
        return ApiResponse.success(res, "Extension linked successfully", {
            user: { id: link.user.id, email: link.user.email, name: link.user.name },
            accessToken,
            refreshToken,
        });
    }
}