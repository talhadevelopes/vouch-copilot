import type { Response } from "express";
import { prisma } from "../../db/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../services/auth/jwt";
import { comparePassword, hashPassword } from "../../services/auth/password";
import { ApiResponse } from "../../utils/api-response";
import { loginSchema, refreshSchema, registerSchema } from "../../validators/auth.validator";
import type { AuthRequest } from "../../middleware/auth";

export async function issueTokens(user: { id: string; email: string }) {
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
    await prisma.refreshToken.upsert({
        where: { userId: user.id },
        update: { token: refreshToken },
        create: { userId: user.id, token: refreshToken },
    });
    return { accessToken, refreshToken };
}

export class CoreAuthController {
    static async register(req: AuthRequest, res: Response) {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }
        const { email, password, name } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            return ApiResponse.error(res, "User already exists", "CONFLICT", 409);
        }

        const user = await prisma.user.create({
            data: {
                id: `usr_${crypto.randomUUID()}`,
                email: email.toLowerCase(),
                name: name.trim(),
                passwordHash: await hashPassword(password),
            },
        });

        const { accessToken, refreshToken } = await issueTokens(user);

        return ApiResponse.success(
            res,
            "Registration successful",
            { user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken },
            201,
        );
    }

    static async login(req: AuthRequest, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return ApiResponse.error(res, "Invalid credentials", "UNAUTHORIZED", 401);
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return ApiResponse.error(res, "Invalid credentials", "UNAUTHORIZED", 401);
        }

        const { accessToken, refreshToken } = await issueTokens(user);

        return ApiResponse.success(res, "Login successful", {
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    }

    static async demoLogin(req: AuthRequest, res: Response) {
        const demoPasswordHash = await hashPassword("demo1234");
        const demoEmail = "demo@vouch.app";
        let user = await prisma.user.findUnique({ where: { email: demoEmail } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: `usr_${crypto.randomUUID()}`,
                    email: demoEmail,
                    name: "Demo User",
                    passwordHash: demoPasswordHash,
                },
            });
        }

        const { accessToken, refreshToken } = await issueTokens(user);

        return ApiResponse.success(res, "Demo login successful", {
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    }

    static async refresh(req: AuthRequest, res: Response) {
        const parsed = refreshSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }
        const { refreshToken } = parsed.data;

        try {
            const payload = verifyRefreshToken(refreshToken);
            const user = await prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) {
                return ApiResponse.error(res, "Unauthorized", "UNAUTHORIZED", 401);
            }

            const stored = await prisma.refreshToken.findUnique({ where: { userId: user.id } });
            if (!stored || stored.token !== refreshToken) {
                return ApiResponse.error(res, "Invalid refresh token", "UNAUTHORIZED", 401);
            }

            const { accessToken: newAccess, refreshToken: newRefresh } = await issueTokens(user);

            return ApiResponse.success(res, "Token refreshed", { accessToken: newAccess, refreshToken: newRefresh });
        } catch {
            return ApiResponse.error(res, "Invalid refresh token", "UNAUTHORIZED", 401);
        }
    }

    static async me(req: AuthRequest, res: Response) {
        const userId = req.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return ApiResponse.error(res, "Unauthorized", "UNAUTHORIZED", 401);
        }
        return ApiResponse.success(res, "Current user fetched", {
            user: { id: user.id, email: user.email, name: user.name },
        });
    }

    static async logout(req: AuthRequest, res: Response) {
        const userId = req.userId;
        await prisma.refreshToken.deleteMany({ where: { userId } });
        return ApiResponse.success(res, "Logout successful", { ok: true });
    }
}