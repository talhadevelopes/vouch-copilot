import { type Context } from "hono";
import { ApiResponse } from "../utils/api-response";
import { createAnalysisSchema, updateAnalysisSchema } from "../validators/dashboard.validator";
import { prisma } from "../db/prisma";
import { analyzeService } from "../services/ai/analyze";

export class DashboardController {
  static async getHistory(c: Context) {
    const userId = c.get("userId");
    const history = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        inputUrl: true,
        pageTitle: true,
        aiResponse: true,
        proof: true,
        biasScore: true,
        shareId: true,
        createdAt: true,
        claimsData: true,
        biasData: true,
      },
    });
    return ApiResponse.success(c, "History fetched", { history });
  }

  static async createAnalysis(c: Context) {
    const userId = c.get("userId");
    const parsed = createAnalysisSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const {
      inputUrl, pageTitle, content,
      aiResponse, proof, biasScore,
      claimsData, biasData, chatHistory, vouchHistory,
    } = parsed.data;

    let finalAiResponse = aiResponse;
    let finalProof = proof;
    let finalBiasScore = biasScore;

    // Only run AI if no data was provided (e.g. from web dashboard URL input)
    if (!aiResponse && !biasScore && !claimsData) {
      const simulated = await analyzeService.analyzeLanguage(
        content
          ? `Content: ${content}`
          : `Analyze source url: ${inputUrl}. Provide concise bias assessment.`,
      );
      finalAiResponse = simulated.overallTone ?? undefined;
      finalProof = simulated.manipulativeLanguage[0]?.reason ?? undefined;
      finalBiasScore = Number.isFinite(simulated.biasScore) ? simulated.biasScore : undefined;
    }

    const item = await prisma.analysis.create({
      data: {
        id: `anl_${crypto.randomUUID()}`,
        userId,
        inputUrl,
        pageTitle: pageTitle ?? null,
        aiResponse: finalAiResponse ?? null,
        proof: finalProof ?? null,
        biasScore: finalBiasScore ?? null,
        claimsData: claimsData ?? undefined,
        biasData: biasData ?? undefined,
        chatHistory: chatHistory ?? undefined,
        vouchHistory: vouchHistory ?? undefined,
      },
    });

    return ApiResponse.success(c, "Analysis created", { item }, 201);
  }

  static async updateAnalysis(c: Context) {
    const userId = c.get("userId");
    const analysisId = c.req.param("id");
    const parsed = updateAnalysisSchema.safeParse(await c.req.json());
    
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const item = await prisma.analysis.findFirst({
      where: { id: analysisId, userId },
    });

    if (!item) {
      return ApiResponse.error(c, "Analysis not found", "NOT_FOUND", 404);
    }

    const updated = await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        chatHistory: parsed.data.chatHistory ?? undefined,
        vouchHistory: parsed.data.vouchHistory ?? undefined,
        claimsData: parsed.data.claimsData ?? undefined,
        biasData: parsed.data.biasData ?? undefined,
      },
    });

    return ApiResponse.success(c, "Analysis updated", { item: updated });
  }

  static async getAnalysisById(c: Context) {
    const userId = c.get("userId");
    const analysisId = c.req.param("id");
    const item = await prisma.analysis.findFirst({
      where: { id: analysisId, userId },
    });
    if (!item) {
      return ApiResponse.error(c, "Analysis not found", "NOT_FOUND", 404);
    }
    return ApiResponse.success(c, "Analysis fetched", { item });
  }

  static async createShareLink(c: Context) {
    const userId = c.get("userId");
    const analysisId = c.req.param("id");
    const item = await prisma.analysis.findFirst({
      where: { id: analysisId, userId },
    });
    if (!item) {
      return ApiResponse.error(c, "Analysis not found", "NOT_FOUND", 404);
    }
    const shareId = item.shareId || `shr_${crypto.randomUUID()}`;
    if (!item.shareId) {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { shareId },
      });
    }
    return ApiResponse.success(c, "Share link created", { shareId });
  }

  static async getPublicAnalysis(c: Context) {
    const shareId = c.req.param("shareId");
    const item = await prisma.analysis.findFirst({ where: { shareId } });
    if (!item) {
      return ApiResponse.error(c, "Shared analysis not found", "NOT_FOUND", 404);
    }
    return ApiResponse.success(c, "Shared analysis fetched", {
      item: {
        id: item.id,
        inputUrl: item.inputUrl,
        pageTitle: item.pageTitle,
        aiResponse: item.aiResponse,
        proof: item.proof,
        biasScore: item.biasScore,
        claimsData: item.claimsData,
        biasData: item.biasData,
        createdAt: item.createdAt,
      },
    });
  }
}