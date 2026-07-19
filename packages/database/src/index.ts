import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type {
  ExperienceInput,
  FeedbackInput,
  FindExperienceInput,
  SessionInput,
} from "@haderach/schemas";
import * as schema from "./schema.js";

export type ExperienceCard = {
  id: string;
  type: string;
  summary: string;
  outcomeStatus: string;
  confidence: string;
  status: string;
  revision: string;
  successfulUses: number;
  failedUses: number;
  rankingScore: number;
  relevanceScore: number;
  lastValidatedAt: string;
  estimatedTokens: number;
};

const confidenceWeight: Record<string, number> = {
  candidate: 0.25,
  observed: 0.55,
  verified: 0.9,
};
const statusWeight: Record<string, number> = {
  current: 1,
  partially_stale: 0.65,
  stale: 0.15,
  contradicted: 0.05,
  superseded: 0,
};

export function calculateRanking(input: {
  successfulUses: number;
  failedUses: number;
  confidence: string;
  status: string;
  ageDays: number;
}) {
  const outcomes =
    (input.successfulUses + 1) / (input.successfulUses + input.failedUses + 2);
  const freshness = Math.max(0.2, Math.exp(-input.ageDays / 180));
  return Number(
    (
      outcomes * 0.35 +
      (confidenceWeight[input.confidence] ?? 0.4) * 0.25 +
      (statusWeight[input.status] ?? 0.3) * 0.25 +
      freshness * 0.15
    ).toFixed(4),
  );
}

export class ExperienceRepository {
  readonly client: postgres.Sql;
  readonly db;

  constructor(databaseUrl = process.env.DATABASE_URL) {
    if (!databaseUrl) throw new Error("DATABASE_URL is required");
    this.client = postgres(databaseUrl, { max: 10 });
    this.db = drizzle(this.client, { schema });
  }

  async close() {
    await this.client.end();
  }

  async startSession(input: SessionInput) {
    const id = input.sessionId ?? randomUUID();
    const [row] = await this.client`
      INSERT INTO sessions (id, task, revision, branch, worktree)
      VALUES (${id}, ${input.task}, ${input.revision}, ${input.branch ?? null}, ${input.worktree ?? null})
      ON CONFLICT (id) DO UPDATE SET
        task = EXCLUDED.task, revision = EXCLUDED.revision, branch = EXCLUDED.branch,
        worktree = EXCLUDED.worktree, updated_at = now()
      RETURNING *`;
    return row;
  }

  async updateSession(
    id: string,
    state: {
      status?: string;
      currentState?: string;
      outcome?: string;
      finished?: boolean;
    },
  ) {
    const [row] = await this.client`
      UPDATE sessions SET
        status = COALESCE(${state.status ?? null}, status),
        current_state = COALESCE(${state.currentState ?? null}, current_state),
        outcome = COALESCE(${state.outcome ?? null}, outcome),
        finished_at = CASE WHEN ${state.finished ?? false} THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING *`;
    return row;
  }

  async createExperience(
    input: ExperienceInput,
    repository = "local/repository",
  ) {
    const id = randomUUID();
    const ranking = calculateRanking({
      successfulUses: 0,
      failedUses: 0,
      confidence: input.confidence,
      status: input.status,
      ageDays: 0,
    });
    const textArray = (values: string[]) => this.client.array(values, 25);
    const [row] = await this.client`
      INSERT INTO experiences (
        id, session_id, type, repository, task_summary, summary, detail, steps,
        paths, services, tools, error_signatures, keywords, related_terms, aliases,
        evidence, outcome_status, tests, revision, confidence, status, ranking_score
      ) VALUES (
        ${id}, ${input.sessionId ?? null}, ${input.type}, ${repository}, ${input.taskSummary},
        ${input.content.summary}, ${input.content.detail ?? null}, ${textArray(input.content.steps)},
        ${textArray(input.scope.paths)}, ${textArray(input.scope.services)},
        ${textArray(input.scope.tools)}, ${textArray(input.scope.errorSignatures)},
        ${textArray(input.retrieval.keywords)}, ${textArray(input.retrieval.relatedTerms)},
        ${textArray(input.retrieval.aliases)}, ${JSON.stringify(input.evidence)}::jsonb,
        ${input.outcomeStatus}, ${textArray(input.tests)}, ${input.revision},
        ${input.confidence}, ${input.status}, ${ranking}
      ) RETURNING *`;
    return row;
  }

  async getExperience(id: string, full = false) {
    const [row] = await this.client`
      SELECT id, type, repository, task_summary, summary,
        ${full ? this.client`detail` : this.client`NULL::text AS detail`},
        steps, paths, services, tools, error_signatures, keywords, related_terms,
        aliases, evidence, outcome_status, tests, revision, confidence, status,
        successful_uses, failed_uses, usefulness_score, ranking_score,
        created_at, last_revised_at, last_validated_at
      FROM experiences WHERE id = ${id}`;
    return row;
  }

  async findExperience(input: FindExperienceInput): Promise<ExperienceCard[]> {
    const queryText = [input.task, input.error, ...input.keywords]
      .filter(Boolean)
      .join(" ");
    const textArray = (values: string[]) => this.client.array(values, 25);
    const rows = await this.client`
      SELECT id, type, summary, outcome_status, confidence, status, revision,
        successful_uses, failed_uses, ranking_score, last_validated_at,
        (
          ts_rank_cd(
            to_tsvector('english', coalesce(task_summary, '') || ' ' || coalesce(summary, '') || ' ' ||
              array_to_string(keywords, ' ') || ' ' || array_to_string(related_terms, ' ') || ' ' ||
              array_to_string(aliases, ' ') || ' ' || array_to_string(error_signatures, ' ')),
            websearch_to_tsquery('english', ${queryText})
          ) * 3 +
          CASE WHEN ${input.error ?? ""} <> '' AND EXISTS (
            SELECT 1 FROM unnest(error_signatures) e WHERE lower(${input.error ?? ""}) LIKE '%' || lower(e) || '%'
          ) THEN 5 ELSE 0 END +
          CASE WHEN services && ${textArray(input.services)}::text[] THEN 2 ELSE 0 END +
          CASE WHEN keywords && ${textArray(input.keywords)}::text[] THEN 2 ELSE 0 END +
          CASE WHEN paths && ${textArray(input.paths)}::text[] THEN 2 ELSE 0 END +
          ranking_score * 2
        ) AS relevance_score
      FROM experiences
      WHERE status IN ('current', 'partially_stale')
        AND (${input.types.length === 0} OR type = ANY(${textArray(input.types)}::text[]))
      ORDER BY relevance_score DESC, last_validated_at DESC
      LIMIT ${Math.max(input.limit * 3, 10)}`;

    const cards: ExperienceCard[] = [];
    let tokens = 0;
    for (const row of rows) {
      const estimatedTokens = Math.ceil(String(row.summary).length / 4) + 35;
      if (tokens + estimatedTokens > input.tokenBudget && cards.length > 0)
        continue;
      cards.push({
        id: String(row.id),
        type: String(row.type),
        summary: String(row.summary),
        outcomeStatus: String(row.outcome_status),
        confidence: String(row.confidence),
        status: String(row.status),
        revision: String(row.revision),
        successfulUses: Number(row.successful_uses),
        failedUses: Number(row.failed_uses),
        rankingScore: Number(row.ranking_score),
        relevanceScore: Number(row.relevance_score),
        lastValidatedAt: new Date(
          row.last_validated_at as string,
        ).toISOString(),
        estimatedTokens,
      });
      tokens += estimatedTokens;
      if (cards.length >= input.limit) break;
    }
    return cards;
  }

  async recordFeedback(input: FeedbackInput) {
    await this.client.begin(async (tx) => {
      await tx`INSERT INTO experience_feedback
        (id, experience_id, session_id, relevant, still_valid, outcome, evidence)
        VALUES (${randomUUID()}, ${input.experienceId}, ${input.sessionId ?? null},
          ${input.relevant}, ${input.stillValid}, ${input.outcome}, ${input.evidence ?? null})`;
      const [current] =
        await tx`SELECT * FROM experiences WHERE id = ${input.experienceId} FOR UPDATE`;
      if (!current) throw new Error("Experience not found");
      const success =
        input.relevant && input.stillValid && input.outcome === "successful";
      const failure =
        !input.relevant || !input.stillValid || input.outcome === "failed";
      const successfulUses =
        Number(current.successful_uses) + (success ? 1 : 0);
      const failedUses = Number(current.failed_uses) + (failure ? 1 : 0);
      const total = successfulUses + failedUses;
      const usefulness = total === 0 ? 0.5 : successfulUses / total;
      const status = input.stillValid
        ? String(current.status)
        : "partially_stale";
      const ageDays =
        (Date.now() - new Date(current.last_revised_at as string).getTime()) /
        86_400_000;
      const ranking = calculateRanking({
        successfulUses,
        failedUses,
        confidence: String(current.confidence),
        status,
        ageDays,
      });
      await tx`UPDATE experiences SET successful_uses=${successfulUses}, failed_uses=${failedUses},
        usefulness_score=${usefulness}, ranking_score=${ranking}, status=${status},
        last_validated_at=now(), ranking_calculated_at=now() WHERE id=${input.experienceId}`;
    });
    return this.getExperience(input.experienceId);
  }

  async listExperiences(limit = 50) {
    return this
      .client`SELECT * FROM experiences ORDER BY created_at DESC LIMIT ${limit}`;
  }

  async listSessions(limit = 50) {
    return this
      .client`SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ${limit}`;
  }
}

export * from "./schema.js";
