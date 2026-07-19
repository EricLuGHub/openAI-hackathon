import { z } from "zod";
import { optionalStringArray } from "./common.js";
import { experienceTypes } from "./experience.js";

export const findExperienceSchema = z.object({
  sessionId: z.string().uuid().optional(),
  repository: z.string().min(1).optional(),
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

export type FindExperienceInput = z.infer<typeof findExperienceSchema>;
