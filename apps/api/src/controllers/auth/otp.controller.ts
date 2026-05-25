import type { Response } from "express";
import { prisma } from "../../db/prisma";
import { hashPassword } from "../../services/auth/password";
import { ApiResponse } from "../../utils/api-response";
import { otpRequestSchema, otpVerifySchema, setPasswordSchema } from "../../validators/auth.validator";
import { issueTokens } from "./core.controller";
import { sendOtpEmail } from "../../services/auth/mail";
import type { AuthRequest } from "../../middleware/auth";

export class OTPController {
    static async requestOtp(req: AuthRequest, res: Response) {
        const parsed = otpRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }

        const email = parsed.data.email.toLowerCase();
        const code = `${Math.floor(100000 + Math.random() * 900000)}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.otpCode.create({
            data: {
                id: `otp_${crypto.randomUUID()}`,
                email,
                code,
                expiresAt,
            },
        });

        try {
            await sendOtpEmail(email, code);
        } catch (error) {
            return ApiResponse.error(
                res,
                error instanceof Error ? error.message : "Unable to send OTP",
                "MAIL_ERROR",
                500,
            );
        }

        return ApiResponse.success(res, "OTP sent successfully", { email });
    }

    static async verifyOtp(req: AuthRequest, res: Response) {
        const parsed = otpVerifySchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }

        const email = parsed.data.email.toLowerCase();
        const code = parsed.data.code;
        const name = parsed.data.name?.trim();

        const otp = await prisma.otpCode.findFirst({
            where: {
                email,
                code,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!otp) {
            return ApiResponse.error(res, "Invalid or expired OTP", "UNAUTHORIZED", 401);
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        const user =
            existing ??
            (await prisma.user.create({
                data: {
                    id: `usr_${crypto.randomUUID()}`,
                    email,
                    name: name || email.split("@")[0] || "OTP User",
                    passwordHash: await hashPassword(`otp_${crypto.randomUUID()}`),
                    authProvider: "otp",
                },
            }));

        if (existing && name && existing.name !== name) {
            await prisma.user.update({
                where: { id: existing.id },
                data: { name },
            });
        }

        await prisma.otpCode.update({
            where: { id: otp.id },
            data: { consumedAt: new Date(), userId: user.id },
        });

        const { accessToken, refreshToken } = await issueTokens(user);
        return ApiResponse.success(res, "OTP login successful", {
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken,
        });
    }

    static async setPassword(req: AuthRequest, res: Response) {
        const userId = req.userId;
        const parsed = setPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
        }

        const { password } = parsed.data;
        const passwordHash = await hashPassword(password);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return ApiResponse.success(res, "Password updated successfully", { ok: true });
    }
}