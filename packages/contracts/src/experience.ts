import { z } from "zod";
import { optionalStringArray } from "./common.js";

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

export type ExperienceInput = z.infer<typeof experienceInputSchema>;
