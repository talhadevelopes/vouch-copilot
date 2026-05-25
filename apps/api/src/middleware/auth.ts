import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth/jwt";
import { ApiResponse } from "../utils/api-response";
import { prisma } from "../db/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";
  const token = bearerToken;

  if (!token) {
    return ApiResponse.error(res, "Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return ApiResponse.error(res, "Unauthorized", "UNAUTHORIZED", 401);
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch {
    return ApiResponse.error(res, "Unauthorized", "UNAUTHORIZED", 401);
  }
};
