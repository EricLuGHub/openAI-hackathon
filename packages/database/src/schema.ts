import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  task: text("task").notNull(),
  revision: text("revision").notNull(),
  branch: text("branch"),
  worktree: text("worktree"),
  status: text("status").notNull().default("active"),
  currentState: text("current_state"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  repository: text("repository").notNull().default("local/repository"),
  taskSummary: text("task_summary").notNull(),
  summary: text("summary").notNull(),
  detail: text("detail"),
  steps: text("steps").array().notNull().default([]),
  paths: text("paths").array().notNull().default([]),
  services: text("services").array().notNull().default([]),
  tools: text("tools").array().notNull().default([]),
  errorSignatures: text("error_signatures").array().notNull().default([]),
  keywords: text("keywords").array().notNull().default([]),
  relatedTerms: text("related_terms").array().notNull().default([]),
  aliases: text("aliases").array().notNull().default([]),
  evidence: jsonb("evidence").notNull().default([]),
  outcomeStatus: text("outcome_status").notNull().default("unknown"),
  tests: text("tests").array().notNull().default([]),
  revision: text("revision").notNull(),
  confidence: text("confidence").notNull().default("observed"),
  status: text("status").notNull().default("current"),
  successfulUses: integer("successful_uses").notNull().default(0),
  failedUses: integer("failed_uses").notNull().default(0),
  usefulnessScore: doublePrecision("usefulness_score").notNull().default(0.5),
  rankingScore: doublePrecision("ranking_score").notNull().default(0.5),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastRevisedAt: timestamp("last_revised_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastValidatedAt: timestamp("last_validated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  rankingCalculatedAt: timestamp("ranking_calculated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const experienceFeedback = pgTable("experience_feedback", {
  id: uuid("id").primaryKey(),
  experienceId: uuid("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  relevant: boolean("relevant").notNull(),
  stillValid: boolean("still_valid").notNull(),
  outcome: text("outcome").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
