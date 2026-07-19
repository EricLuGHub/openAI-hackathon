import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ExperienceRepository } from "../services/experience-repository.js";
import {
  experienceInputSchema,
  feedbackInputSchema,
  findExperienceSchema,
  sessionInputSchema,
} from "@haderach/contracts";

const jsonResult = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

export function createMcpServer(repository: ExperienceRepository) {
  const server = new McpServer({ name: "agent-haderach", version: "0.1.0" });

  server.registerTool(
    "start_session",
    {
      title: "Start Agent Haderach session",
      description:
        "Register a repository task session before beginning meaningful work.",
      inputSchema: sessionInputSchema.shape,
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (input) =>
      jsonResult(
        await repository.startSession(sessionInputSchema.parse(input)),
      ),
  );

  server.registerTool(
    "find_experience",
    {
      title: "Find shared agent experience",
      description:
        "Find compact prior workflows, lessons, pitfalls, summaries, handoffs, incidents, questions, or answers relevant to a task.",
      inputSchema: findExperienceSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) =>
      jsonResult(
        await repository.findExperience(findExperienceSchema.parse(input)),
      ),
  );

  server.registerTool(
    "get_experience",
    {
      title: "Inspect experience",
      description:
        "Retrieve the summary or full cleaned detail for one selected experience.",
      inputSchema: {
        experienceId: z.string().uuid(),
        detail: z.enum(["summary", "full"]).default("summary"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ experienceId, detail }) =>
      jsonResult(
        await repository.getExperience(experienceId, detail === "full"),
      ),
  );

  server.registerTool(
    "save_experience",
    {
      title: "Save reusable experience",
      description:
        "Save one structured experience after checking for existing duplicates. A session may save many entries, one, or none.",
      inputSchema: experienceInputSchema.shape,
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async (input) =>
      jsonResult(
        await repository.createExperience(experienceInputSchema.parse(input)),
      ),
  );

  server.registerTool(
    "record_experience_feedback",
    {
      title: "Record experience outcome",
      description:
        "Report whether retrieved experience was relevant, current, and successful. Mere retrieval does not reinforce an entry.",
      inputSchema: feedbackInputSchema.shape,
      annotations: { readOnlyHint: false, idempotentHint: false },
    },
    async (input) =>
      jsonResult(
        await repository.recordFeedback(feedbackInputSchema.parse(input)),
      ),
  );

  server.registerTool(
    "update_session",
    {
      title: "Update session",
      description:
        "Persist current task status, findings, blocker, or outcome.",
      inputSchema: {
        sessionId: z.string().uuid(),
        status: z.string().optional(),
        currentState: z.string().max(10_000).optional(),
        outcome: z.string().max(5_000).optional(),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async ({ sessionId, ...state }) =>
      jsonResult(await repository.updateSession(sessionId, state)),
  );

  server.registerTool(
    "finish_session",
    {
      title: "Finish or hand off session",
      description:
        "Close a completed session or persist its final handoff state.",
      inputSchema: {
        sessionId: z.string().uuid(),
        status: z.enum(["completed", "blocked", "handed_off"]),
        outcome: z.string().max(10_000),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async ({ sessionId, status, outcome }) =>
      jsonResult(
        await repository.updateSession(sessionId, {
          status,
          outcome,
          finished: true,
        }),
      ),
  );

  const collaborationSchema = {
    sessionId: z.string().uuid().optional(),
    taskSummary: z.string().min(1),
    summary: z.string().min(1),
    detail: z.string().optional(),
    revision: z.string().min(1),
    paths: z.array(z.string()).default([]),
    services: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    evidence: z
      .array(z.object({ label: z.string(), uri: z.string().url().optional() }))
      .default([]),
  };

  const saveCollaboration = async (
    type: "question" | "answer" | "incident",
    input: z.infer<z.ZodObject<typeof collaborationSchema>>,
  ) =>
    repository.createExperience({
      type,
      sessionId: input.sessionId,
      taskSummary: input.taskSummary,
      content: { summary: input.summary, detail: input.detail, steps: [] },
      scope: {
        paths: input.paths,
        services: input.services,
        tools: [],
        errorSignatures: [],
      },
      retrieval: { keywords: input.keywords, relatedTerms: [], aliases: [] },
      evidence: input.evidence,
      outcomeStatus: "unknown",
      tests: [],
      revision: input.revision,
      confidence: "observed",
      status: "current",
    });

  server.registerTool(
    "publish_question",
    {
      title: "Publish agent question",
      description:
        "Publish a repository-scoped question or blocker for other agents.",
      inputSchema: collaborationSchema,
      annotations: { readOnlyHint: false },
    },
    async (input) => jsonResult(await saveCollaboration("question", input)),
  );

  server.registerTool(
    "find_questions",
    {
      title: "Find relevant questions",
      description: "Find current questions relevant to the agent's task.",
      inputSchema: findExperienceSchema.omit({ types: true }).shape,
      annotations: { readOnlyHint: true },
    },
    async (input) =>
      jsonResult(
        await repository.findExperience({
          ...findExperienceSchema.omit({ types: true }).parse(input),
          types: ["question"],
        }),
      ),
  );

  server.registerTool(
    "answer_question",
    {
      title: "Answer agent question",
      description:
        "Publish an evidenced answer to another agent's question. Include the question ID in keywords.",
      inputSchema: collaborationSchema,
      annotations: { readOnlyHint: false },
    },
    async (input) => jsonResult(await saveCollaboration("answer", input)),
  );

  server.registerTool(
    "report_incident",
    {
      title: "Report service incident or recovery",
      description:
        "Share recent evidence that a platform is broken or has recovered.",
      inputSchema: collaborationSchema,
      annotations: { readOnlyHint: false },
    },
    async (input) => jsonResult(await saveCollaboration("incident", input)),
  );

  return server;
}
