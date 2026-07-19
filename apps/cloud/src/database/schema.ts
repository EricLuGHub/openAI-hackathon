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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  canonicalKey: text("canonical_key").notNull().unique(),
  provider: text("provider").notNull().default("github"),
  repositoryOwner: text("repository_owner").notNull(),
  repositoryName: text("repository_name").notNull(),
  remoteUrl: text("remote_url").notNull(),
  defaultBranch: text("default_branch"),
  visibility: text("visibility").notNull().default("discoverable"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaceMemberships = pgTable("workspace_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  grantedByUserId: uuid("granted_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
});

export const personalAccessTokens = pgTable("personal_access_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  tokenPrefix: text("token_prefix").notNull(),
  tokenLastFour: text("token_last_four").notNull(),
  name: text("name").notNull(),
  scopes: text("scopes").array().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaceAccessRequests = pgTable("workspace_access_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  requesterUserId: uuid("requester_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  requestedRole: text("requested_role").notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  decisionReason: text("decision_reason"),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  resultingMembershipId: uuid("resulting_membership_id").references(
    () => workspaceMemberships.id,
  ),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const oauthStates = pgTable("oauth_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateHash: text("state_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const webSessions = pgTable("web_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionHash: text("session_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  tokenId: uuid("token_id").references(() => personalAccessTokens.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  tokenId: uuid("token_id").references(() => personalAccessTokens.id),
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
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  tokenId: uuid("token_id").references(() => personalAccessTokens.id),
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
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  tokenId: uuid("token_id").references(() => personalAccessTokens.id),
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
