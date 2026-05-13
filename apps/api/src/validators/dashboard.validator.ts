import { z } from "zod";

export const createAnalysisSchema = z.object({
  inputUrl: z.string().url(),
  pageTitle: z.string().optional(),
  content: z.string().optional(),
  aiResponse: z.string().optional(),
  proof: z.string().optional(),
  biasScore: z.number().optional(),
  claimsData: z.array(z.any()).optional(),
  biasData: z.record(z.any()).optional(),
  chatHistory: z.array(z.any()).optional(),
  vouchHistory: z.array(z.any()).optional(),
});

export const updateAnalysisSchema = z.object({
  chatHistory: z.array(z.any()).optional(),
  vouchHistory: z.array(z.any()).optional(),
  claimsData: z.array(z.any()).optional(),
  biasData: z.record(z.any()).optional(),
});
