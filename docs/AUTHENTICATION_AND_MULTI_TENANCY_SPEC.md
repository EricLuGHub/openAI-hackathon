# Authentication and Multi-Tenancy Specification

## Status

Proposed next milestone. This specification replaces the MVP assumption that one
deployment represents one team and one repository.

## Goal

Turn Agent Haderach into a shared hosted service where:

- developers authenticate as individual users;
- developers collaborate inside teams;
- each team can connect multiple repositories;
- repository experience is isolated by default;
- Codex authenticates to the remote MCP endpoint with revocable tokens;
- every read and write is authorized before repository data is accessed;
- local development remains simple.

The main security invariant is:

> A user, token, session, or experience must never access or influence a
> repository unless its resolved identity is authorized for that repository.

## Product model

```text
User
 └── Team membership
      ├── Repository A
      │    ├── agent sessions
      │    ├── experiences
      │    ├── feedback
      │    └── questions / incidents
      └── Repository B
           └── fully separate experience space
```

A team is the tenant boundary. A repository is the default retrieval and
collaboration boundary inside that tenant.

Cross-repository retrieval is not part of the first authenticated release. It
may later be introduced as an explicit repository group or opt-in shared
knowledge space; it must never happen accidentally because two repositories use
similar keywords.

## Identity types

### Web user

A human who signs into the dashboard. The cloud service should use an external
OIDC-compatible identity provider behind a small adapter. The initial provider
may be selected later without changing the domain schema.

The web application receives a short-lived, secure, HTTP-only session cookie.
Provider access tokens are not exposed to browser JavaScript or reused as MCP
tokens.

### Personal MCP token

A long-lived, revocable token created by a signed-in developer for Codex or
another trusted coding agent client.

Example onboarding:

```bash
export AGENT_HADERACH_TOKEN="ahd_pat_..."

codex mcp add haderach \
  --url https://api.agent-haderach.dev/mcp \
  --bearer-token-env-var AGENT_HADERACH_TOKEN
```

The token represents the user. Repository authorization is still evaluated for
every request; possession of a valid token does not grant access to every team
or repository.

### Future automation token

CI systems or non-human agents may eventually use repository-scoped service
tokens. They are not required for the first authenticated release. When added,
they must have narrower repository and scope grants than personal tokens.

## Token format and storage

Personal token format:

```text
ahd_pat_<random secret>
```

Requirements:

- generate at least 256 bits of cryptographically secure random material;
- display the full token once at creation;
- store only a one-way hash, never the raw token;
- store a non-secret prefix and final four characters for identification;
- support a name, creation time, last-used time, expiry, and revocation time;
- allow multiple tokens per user so developers can rotate without downtime;
- never place tokens in URLs, MCP content, application logs, or analytics;
- use constant-time hash comparison where applicable;
- reject revoked, expired, or disabled-user tokens before tool dispatch;
- update `last_used_at` asynchronously or with write throttling.

Because the token contains high-entropy random material rather than a human
password, a SHA-256 token digest is acceptable. A server-side pepper may be
added through the secret manager as defense in depth.

## Token scopes

Initial scopes:

```text
experience:read
experience:write
feedback:write
session:write
collaboration:read
collaboration:write
```

Recommended presets:

| Preset            | Scopes             | Purpose                            |
| ----------------- | ------------------ | ---------------------------------- |
| Agent contributor | all initial scopes | Normal Codex workflow              |
| Read-only agent   | read scopes only   | Investigation without contribution |

Team and token scopes are both enforced. A token cannot grant an operation the
user does not have permission to perform.

Administrative team and repository operations should remain web/API actions and
must not be exposed through the coding-agent MCP token in this milestone.

## Teams, roles, and repository access

### Team roles

```text
owner  — billing, deletion, members, repositories, tokens, and all data
admin  — members, repositories, and all repository data
member — access determined by repository visibility and membership
```

### Repository visibility

```text
team       — every active team member can access the repository
restricted — only explicit repository members can access it
```

### Repository roles

```text
reader      — retrieve experience, questions, answers, and incidents
contributor — reader permissions plus sessions, experience, and feedback writes
admin       — contributor permissions plus repository settings and membership
```

Owners and team admins inherit repository admin access. Disabled or removed
members immediately lose access even if one of their tokens has not expired.

## Repository identity

Repositories must use stable IDs rather than free-form names as foreign keys.

Each repository stores:

```yaml
id: UUID
team_id: UUID
provider: github | gitlab | local | other
owner: sindresorhus
name: p-limit
canonical_key: github:sindresorhus/p-limit
remote_url: https://github.com/sindresorhus/p-limit.git
default_branch: main
visibility: team | restricted
status: active | archived
```

Within a team, `canonical_key` must be unique. Display names and remote URLs may
change without changing the repository ID.

The current `experiences.repository` text field will be replaced by a required
`repository_id` foreign key.

## Proposed database schema

### New tables

```text
users
teams
team_memberships
repositories
repository_memberships
personal_access_tokens
audit_events
```

Important fields:

```yaml
users:
  id: UUID
  identity_provider: text
  provider_subject: text
  email: text
  display_name: text
  status: active | disabled

teams:
  id: UUID
  slug: text
  name: text
  created_by: UUID

team_memberships:
  team_id: UUID
  user_id: UUID
  role: owner | admin | member
  status: active | invited | disabled

repositories:
  id: UUID
  team_id: UUID
  canonical_key: text
  provider: text
  owner: text
  name: text
  remote_url: text
  default_branch: text
  visibility: team | restricted
  status: active | archived

repository_memberships:
  repository_id: UUID
  user_id: UUID
  role: reader | contributor | admin

personal_access_tokens:
  id: UUID
  user_id: UUID
  token_hash: text
  token_prefix: text
  token_last_four: text
  name: text
  scopes: text[]
  expires_at: timestamptz
  revoked_at: timestamptz
  last_used_at: timestamptz

audit_events:
  id: UUID
  team_id: UUID
  repository_id: UUID | null
  actor_user_id: UUID | null
  token_id: UUID | null
  action: text
  target_type: text
  target_id: UUID | null
  metadata: jsonb
  created_at: timestamptz
```

### Existing-table changes

```text
sessions
  + team_id UUID NOT NULL
  + repository_id UUID NOT NULL
  + actor_user_id UUID NOT NULL
  + token_id UUID NULL

experiences
  + team_id UUID NOT NULL
  + repository_id UUID NOT NULL
  + created_by_user_id UUID NOT NULL
  - repository text

experience_feedback
  + team_id UUID NOT NULL
  + repository_id UUID NOT NULL
  + actor_user_id UUID NOT NULL
```

Questions, answers, and incidents currently share the `experiences` table and
therefore inherit its tenant and repository columns.

Composite constraints should prevent records from referring to sessions or
experiences in another repository. Application checks alone are not sufficient
for cross-tenant foreign-key integrity.

## Authorization architecture

Every request resolves an immutable request context before entering business
logic:

```ts
type AuthContext = {
  userId: string;
  tokenId?: string;
  tokenScopes: string[];
};

type RepositoryContext = AuthContext & {
  teamId: string;
  repositoryId: string;
  teamRole: "owner" | "admin" | "member";
  repositoryRole: "reader" | "contributor" | "admin";
};
```

The controller or MCP handler resolves this context once. Services and
repositories receive the context explicitly and must not accept an unscoped
database query.

Forbidden pattern:

```ts
repository.getExperience(experienceId);
```

Required pattern:

```ts
repository.getExperience(context, experienceId);
```

The query must constrain both identity and resource:

```sql
WHERE id = $experience_id
  AND team_id = $team_id
  AND repository_id = $repository_id
```

Returning `404` for inaccessible resource IDs is preferred where revealing
their existence would leak information.

PostgreSQL row-level security should be added before public production as a
defense-in-depth layer. The first implementation may begin with mandatory
application scoping plus integration tests, but public deployment is blocked
until RLS or an equivalent database boundary is verified.

## MCP authentication and repository selection

The remote `/mcp` endpoint requires:

```http
Authorization: Bearer ahd_pat_...
```

Authentication occurs before creating the MCP server or dispatching a tool.
The resolved user and token are injected into every handler; tool input can
never override the authenticated user.

### Session binding

`start_session` gains a repository selector:

```yaml
repository: github:sindresorhus/p-limit
task: Implement limit.onIdle()
revision: 42599eb
branch: feature/on-idle
```

The server resolves the canonical key, authorizes access, and binds the new
session to that repository. Subsequent session-scoped tools derive the team and
repository from the session ID.

`find_experience` should require either:

- a valid `session_id`; or
- an explicit repository canonical key.

Using `session_id` is preferred because it reduces repeated tool arguments and
prevents accidental repository drift during a conversation.

`get_experience`, feedback, questions, answers, and incidents must verify that
the target belongs to the authorized repository even when the caller knows its
UUID.

## Web authentication and onboarding

Required user journey:

1. Sign in.
2. Create or join a team.
3. Add a repository.
4. Choose whether it is team-visible or restricted.
5. Create a named MCP token and copy it once.
6. Display the exact Codex configuration command using the hosted URL and token
   environment variable.
7. Show the connection status and last token use.

Required dashboard additions:

- team switcher;
- repository switcher;
- repository settings and access list;
- members and invitations;
- MCP token creation, expiry, rotation, and revocation;
- audit activity for sensitive changes;
- empty states that explain how to connect the first agent.

The selected team and repository must be represented in the URL so browser
refreshes and shared links preserve scope:

```text
/teams/:teamSlug/repositories/:repositoryId/experiences
```

## API changes

Repository-scoped REST resources use nested paths:

```text
GET  /api/teams
POST /api/teams
GET  /api/teams/:teamId/repositories
POST /api/teams/:teamId/repositories

GET  /api/repositories/:repositoryId/experiences
POST /api/repositories/:repositoryId/experiences/search
GET  /api/repositories/:repositoryId/sessions

GET    /api/tokens
POST   /api/tokens
DELETE /api/tokens/:tokenId
```

The server derives team membership from the authenticated user and never trusts
a client-supplied `team_id` without authorization.

## Local development

Authentication should be enabled by default in normal development. Tests may
use a development identity provider or fixtures.

An explicit escape hatch may exist for isolated local demos:

```text
AUTH_MODE=development
```

Development mode must:

- create a clearly labeled local user, team, repository, and token;
- use the same authorization code paths after identity resolution;
- refuse to start when `NODE_ENV=production`;
- emit a visible warning;
- never be the default for a public deployment.

This replaces the current behavior where an empty secret disables all
authentication.

## Migration from the MVP

The migration must preserve the existing evaluation data.

1. Create one legacy user.
2. Create one legacy team owned by that user.
3. Create repository rows for every distinct `experiences.repository` value and
   for the repository used by existing sessions.
4. Add nullable tenant columns to existing tables.
5. Backfill team, repository, and actor IDs.
6. Validate that every row has a valid scope.
7. Add foreign keys, composite constraints, indexes, and `NOT NULL` rules.
8. Remove the free-form `experiences.repository` column.
9. Create a development token for local testing and print it once through an
   explicit setup command, not migration logs.

Migration rollback should restore the previous schema until the destructive
column-removal step. A database backup is required before running the final
migration against shared data.

## Indexing and query isolation

All retrieval indexes must begin with or include `repository_id` where useful.
Search candidates must be repository-filtered before relevance ranking.

Recommended indexes:

```text
experiences(repository_id, status, type)
experiences(repository_id, last_validated_at DESC)
sessions(repository_id, updated_at DESC)
experience_feedback(repository_id, experience_id)
repositories(team_id, canonical_key) UNIQUE
team_memberships(team_id, user_id) UNIQUE
repository_memberships(repository_id, user_id) UNIQUE
personal_access_tokens(token_hash) UNIQUE
```

Token-budget selection and ranking operate only after tenant filtering. Feedback
from one repository must never affect an experience in another repository.

## Audit and operational requirements

Audit events are required for:

- token creation, revocation, and failed authentication;
- team and repository creation or deletion;
- membership and role changes;
- repository visibility changes;
- experience deletion, contradiction, or administrative edits.

Additional controls:

- rate-limit failed token authentication by IP and token prefix;
- rate-limit write-heavy MCP tools per token;
- cap request and detail sizes before parsing;
- redact authorization headers and token-shaped strings from logs;
- use structured request IDs without including task content;
- support immediate user and token disablement;
- retain minimal audit metadata without storing agent chain-of-thought.

## Implementation plan

### Phase 1 — Tenant-aware schema

- add user, team, membership, repository, token, and audit tables;
- create the legacy-data migration;
- replace repository strings with repository IDs;
- require repository context in every repository method;
- add cross-repository isolation integration tests.

### Phase 2 — MCP token authentication

- implement token generation, hashing, lookup, expiry, and revocation;
- authenticate `/mcp` before tool dispatch;
- add scopes and repository authorization;
- bind sessions to repositories;
- update every MCP tool and contract;
- document the bearer-token environment-variable setup for Codex.

### Phase 3 — Web identity and team management

- add the OIDC provider adapter and secure web sessions;
- implement teams, membership, repository management, and invitations;
- implement token management and one-time token display;
- add team/repository routing and switchers to the dashboard.

### Phase 4 — Production hardening

- enable and test PostgreSQL row-level security;
- add rate limits, audit logs, redaction, and security headers;
- test revocation while an agent is active;
- perform dependency and secret scanning in CI;
- run adversarial cross-tenant tests before deployment.

## Planned files

```text
apps/cloud/src/
├── auth/
│   ├── context.ts
│   ├── middleware.ts
│   ├── permissions.ts
│   ├── tokens.ts
│   └── web-session.ts
├── api/
│   ├── routes.ts
│   ├── teams.ts
│   ├── repositories.ts
│   └── tokens.ts
├── database/
│   ├── schema.ts
│   └── migrations/
├── mcp/
│   ├── tools.ts
│   └── authentication.ts
└── services/
    ├── experience-repository.ts
    ├── repository-access.ts
    └── token-service.ts

packages/contracts/src/
├── auth.ts
├── repository.ts
├── team.ts
└── token.ts

apps/web/app/
├── sign-in/
├── onboarding/
├── teams/[teamSlug]/repositories/[repositoryId]/
└── settings/tokens/
```

Exact file grouping may change during implementation, but the ownership
boundaries are fixed: cloud auth resolves identity, services authorize access,
database queries enforce scope, and clients cannot choose their own tenant.

## Required tests

### Token tests

- raw tokens are never stored;
- valid tokens authenticate;
- expired and revoked tokens fail;
- missing scopes fail;
- disabled users fail immediately;
- token rotation does not interrupt the replacement token;
- authentication errors do not echo secrets.

### Isolation tests

- Team A cannot list Team B repositories.
- A repository reader cannot write experience.
- A restricted repository rejects non-members.
- An experience UUID from another repository returns `404`.
- A session ID cannot be reused across repository boundaries.
- Cross-repository feedback cannot change ranking.
- Search never returns records from another repository.
- Team admins and owners receive the documented inherited access.

### End-to-end test

```text
Developer A signs in
→ creates Team A and Repository A
→ creates an MCP token
→ Codex starts a repository-bound session
→ Codex saves experience
→ Developer B joins Repository A and retrieves it
→ Developer C belongs only to Repository B and cannot discover it
→ Developer A revokes the token
→ the next MCP request is rejected
```

## Acceptance criteria

- no public endpoint accepts the current unauthenticated mode;
- Codex connects using a bearer token stored in an environment variable;
- tokens are named, scoped, expiring, revocable, and stored only as hashes;
- one user can belong to multiple teams;
- one team can contain multiple repositories;
- restricted repositories support explicit membership;
- every experience, session, and feedback record has an immutable repository
  scope;
- search, detail retrieval, feedback, and collaboration pass isolation tests;
- the dashboard can switch teams and repositories without leaking cached data;
- existing MVP data migrates without loss;
- all tests and MCP smoke checks run in CI.

## Decisions still required

1. Which OIDC provider should power the first hosted deployment?
2. Should team-visible repositories be the default, or should all repositories
   begin restricted?
3. What default MCP token lifetime balances onboarding and safety?
4. Should repository creation initially be manual or imported from GitHub?
5. Is PostgreSQL row-level security required in the first implementation PR or
   in the production-hardening phase immediately afterward?
