import { z } from "zod";

export const sessionInputSchema = z.object({
  sessionId: z.string().uuid().optional(),
  repository: z.string().min(1),
  task: z.string().min(1),
  revision: z.string().min(1),
  branch: z.string().optional(),
  worktree: z.string().optional(),
});

export type SessionInput = z.infer<typeof sessionInputSchema>;
