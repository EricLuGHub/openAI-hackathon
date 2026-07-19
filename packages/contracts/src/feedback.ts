import { z } from "zod";

export const feedbackInputSchema = z.object({
  experienceId: z.string().uuid(),
  relevant: z.boolean(),
  stillValid: z.boolean(),
  outcome: z.enum(["successful", "failed", "partial", "unknown"]),
  evidence: z.string().max(5_000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
