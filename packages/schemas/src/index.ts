import { z } from "zod";

export const experienceTypes = [
  "workflow",
  "lesson",
  "pitfall",
  "summary",
  "handoff",
  "incident",
  "question",
  "answer",
] as const;

export const experienceStatuses = [
  "current",
  "partially_stale",
  "stale",
  "contradicted",
  "superseded",
] as const;

const optionalStringArray = z.array(z.string().min(1)).default([]);

export const experienceContentSchema = z.object({
  summary: z.string().min(1).max(2_000),
  detail: z.string().max(50_000).optional(),
  steps: optionalStringArray,
});

export const experienceScopeSchema = z.object({
  paths: optionalStringArray,
  services: optionalStringArray,
  tools: optionalStringArray,
  errorSignatures: optionalStringArray,
});

export const retrievalMetadataSchema = z.object({
  keywords: optionalStringArray,
  relatedTerms: optionalStringArray,
  aliases: optionalStringArray,
});

export const evidenceSchema = z.object({
  label: z.string().min(1),
  uri: z.string().url().optional(),
});

export const experienceInputSchema = z.object({
  type: z.enum(experienceTypes),
  taskSummary: z.string().min(1).max(2_000),
  content: experienceContentSchema,
  scope: experienceScopeSchema.default({}),
  retrieval: retrievalMetadataSchema.default({}),
  evidence: z.array(evidenceSchema).default([]),
  outcomeStatus: z
    .enum(["successful", "failed", "partial", "unknown"])
    .default("unknown"),
  tests: optionalStringArray,
  revision: z.string().min(1),
  confidence: z.enum(["candidate", "observed", "verified"]).default("observed"),
  status: z.enum(experienceStatuses).default("current"),
  sessionId: z.string().uuid().optional(),
});

export const findExperienceSchema = z.object({
  task: z.string().min(1),
  revision: z.string().min(1),
  paths: optionalStringArray,
  services: optionalStringArray,
  error: z.string().optional(),
  keywords: optionalStringArray,
  types: z.array(z.enum(experienceTypes)).default([]),
  tokenBudget: z.number().int().min(100).max(8_000).default(800),
  limit: z.number().int().min(1).max(20).default(5),
});

export const feedbackInputSchema = z.object({
  experienceId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  relevant: z.boolean(),
  stillValid: z.boolean(),
  outcome: z.enum(["successful", "failed", "partial", "unknown"]),
  evidence: z.string().max(5_000).optional(),
});

export const sessionInputSchema = z.object({
  sessionId: z.string().uuid().optional(),
  task: z.string().min(1),
  revision: z.string().min(1),
  branch: z.string().optional(),
  worktree: z.string().optional(),
});

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
export type FindExperienceInput = z.infer<typeof findExperienceSchema>;
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export type SessionInput = z.infer<typeof sessionInputSchema>;
