import type { Response } from "express";
import { analyzeService } from "../services/ai/analyze";
import { chatService } from "../services/ai/chat";
import { verifyService } from "../services/ai/verify";
import { cacheService } from "../services/cache";
import { ApiResponse } from "../utils/api-response";
import { analyzeSchema, chatSchema, scanSchema, verifySchema } from "../validators/ai.validator";
import type { AuthRequest } from "../middleware/auth";

export class AIController {
  static async scan(req: AuthRequest, res: Response) {
    const parsed = scanSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { pageContent, pageUrl } = parsed.data;

    try {
      const [claims, analysis] = await Promise.all([
        verifyService.extractAndVerifyClaims(pageContent),
        analyzeService.analyzeLanguage(pageContent)
      ]);

      return ApiResponse.success(res, "Scan completed", {
        claims,
        analysis
      });
    } catch (error: any) {
      console.error("[Vouch] Full scan failed:", error);
      return ApiResponse.error(res, error?.message || "Scan failed", "SCAN_ERROR", 500);
    }
  }

  static async analyze(req: AuthRequest, res: Response) {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { pageContent, pageUrl } = parsed.data;
    const cacheKey = pageUrl ? `analyze:${pageUrl}` : null;

    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return ApiResponse.success(res, "Analysis fetched from cache", cached);
      }
    }

    try {
      const analysis = await analyzeService.analyzeLanguage(pageContent);
      if (cacheKey) await cacheService.set(cacheKey, analysis);
      return ApiResponse.success(res, "Analysis completed", analysis);
    } catch (error: any) {
      return ApiResponse.error(res, error?.message || "Analysis failed", "ANALYZE_ERROR", 500);
    }
  }

  static async verify(req: AuthRequest, res: Response) {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { pageContent, pageUrl, claim, streamResponse } = parsed.data;

    if (typeof claim === "string" && claim.trim().length > 0 && streamResponse) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const fullText = await verifyService.verifyClaimStream(claim.trim(), (token) =>
          res.write(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`)
        );
        res.write(`data: ${JSON.stringify({ type: "final", text: fullText })}\n\n`);
        res.end();
      } catch (error) {
        console.error('[SSE] Stream handler error:', error);
        res.end();
      }
      return;
    }

    if (typeof claim === "string" && claim.trim().length > 0) {
      const result = await verifyService.verifyClaim(claim.trim());
      res.write(JSON.stringify(result) + "\n");
      return res.end();
    }

    if (!pageContent) {
      return ApiResponse.error(res, "pageContent is required", "VALIDATION_ERROR", 400);
    }

    const cacheKey = pageUrl ? `verify:${pageUrl}` : null;
    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        const results = Array.isArray(cached) ? cached : [cached];
        for (const r of results) {
          res.write(JSON.stringify(r) + "\n");
        }
        return res.end();
      }
    }

    const results = await verifyService.extractAndVerifyClaims(pageContent);
    for (const result of results) {
      res.write(JSON.stringify(result) + "\n");
    }
    if (cacheKey && results.length > 0) {
      await cacheService.set(cacheKey, results);
    }
    res.end();
  }

  static async chat(req: AuthRequest, res: Response) {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponse.error(res, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { message, pageContent, messages, computeSourceSentence } = parsed.data;
    const chatMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : typeof message === "string" && message.trim().length > 0
          ? [{ sender: "user" as const, text: message }]
          : [];

    if (chatMessages.length === 0) {
      return ApiResponse.error(res, "message or messages are required", "VALIDATION_ERROR", 400);
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const { answer, sourceSentence } = await chatService.chatStream(
        chatMessages,
        pageContent,
        (token) => res.write(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`),
        computeSourceSentence !== false,
      );
      res.write(`data: ${JSON.stringify({ type: "final", answer, sourceSentence })}\n\n`);
      res.end();
    } catch (error) {
      console.error('[SSE] Stream handler error:', error);
      res.end();
    }
  }
}