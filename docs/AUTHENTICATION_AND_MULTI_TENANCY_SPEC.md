# Authentication and Multi-Tenancy Specification

## Status

Proposed next milestone. This specification replaces the MVP assumption that one
deployment represents one shared repository context.

## Goal

Turn Agent Haderach into a shared hosted service where:

- developers authenticate as individual users;
- each workspace has an accountable owner and explicit members;
- each workspace maps one-to-one to one connected Git repository;
- users can own or join any number of workspaces;
- users can request reader or writer access to a workspace;
- workspace owners and admins can approve or reject access requests;
- repository experience is isolated by default;
- Codex authenticates to the remote MCP endpoint with revocable tokens;
- every read and write is authorized before repository data is accessed;
- local development remains simple.

The main security invariant is:

> A user, token, session, or experience must never access or influence a
> workspace unless its resolved identity is authorized for that workspace.

## Product model

```text
User
 ├── Workspace A ↔ Repository A
 │    ├── owner / admins / writers / readers
 │    ├── pending access requests
 │    ├── agent sessions
 │    ├── experiences
 │    ├── feedback
 │    └── questions / incidents
 └── Workspace B ↔ Repository B
      └── fully separate experience space
```

A workspace is the tenant, authorization, retrieval, and collaboration boundary.
It maps to exactly one connected Git repository. In this document, "repository"
means the Git repository, while "workspace" means the Haderach membership,
settings, sessions, and shared experience surrounding that repository.

Organizations may later group workspaces for centralized billing, SSO, policy,
and administration. Organization membership must remain optional and must not be
required to create, join, or use a workspace.

Cross-repository retrieval is not part of the first authenticated release. It
may later be introduced as an explicit repository group or opt-in shared
knowledge space; it must never happen accidentally because two repositories use
similar keywords.

## Identity types

### Web user

A human who signs into the dashboard with GitHub. GitHub is the only sign-in
provider in the initial release; email, magic links, and additional identity
providers are deferred.

The web application receives a short-lived, secure, HTTP-only session cookie.
Provider access tokens are not exposed to browser JavaScript or reused as MCP
tokens.

### GitHub sign-in

GitHub is the primary identity provider for the first hosted release because
Haderach workspaces are commonly associated with GitHub repositories.

The website exposes one **Continue with GitHub** flow for both sign-up and sign-in.

#### Continue with GitHub

1. The user selects **Continue with GitHub** on the sign-in page.
2. The server starts an OAuth/OIDC authorization-code flow with PKCE and a
   cryptographically random `state` value.
3. GitHub authenticates the user and returns the authorization response only to
   the server callback.
4. The server resolves the stable GitHub account ID, username, display name,
   avatar, and verified email where available.
5. If that GitHub account is already linked, the existing Haderach user signs in.
6. If it is not linked, a new Haderach user and connected identity are created.
7. The server issues the normal secure Haderach web session cookie.

The stable numeric/provider account ID is the identity key. GitHub usernames
may change and therefore must not be used as foreign keys or authorization IDs.

#### Identity versus repository authorization

Signing in with or linking GitHub proves control of a GitHub account. It does
not automatically grant access to Haderach workspaces.

Haderach authorization still requires one of:

- creator ownership;
- an active workspace membership;
- an approved access request.

For a GitHub-backed workspace, the UI may display the requester's verified
GitHub username and avatar to owners/admins. That is review context, not an
automatic authorization decision.

#### GitHub permissions and repository URLs

GitHub authentication proves identity only. The initial release requests only
the minimum profile scope needed to read the stable account ID, username, display
name, and avatar. Email access is not required. No GitHub App installation or
repository-management permission is required.

To create a workspace, any signed-in Haderach user may paste the URL of an
existing public GitHub repository. The service normalizes the URL, verifies that
the public repository exists, and creates the workspace if its canonical key is
not already registered. The user does not need to own, administer, or contribute
to the GitHub repository. Workspace ownership describes control of the Haderach
workspace only; it does not imply ownership of the underlying repository.

Private-repository verification, GitHub App installation, webhooks, and automatic
repository import are deferred.

#### GitHub session security

- validate `state`, PKCE verifier, issuer, audience, and redirect URI;
- allow only registered callback URLs;
- use secure, HTTP-only, SameSite cookies;
- rotate the Haderach session after authentication and linking;
- do not expose provider access tokens to the browser or MCP client;
- encrypt any provider refresh token that must be retained;
- request the minimum identity scopes needed;
- record sign-in and failed-authentication events without storing OAuth codes;
- rate-limit callback failures.

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
every request; possession of a valid token does not grant access to every
workspace.

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
- support a name, creation time, last-used time, and revocation time;
- issue tokens without an expiry date in the initial release;
- allow multiple tokens per user so developers can rotate without downtime;
- never place tokens in URLs, MCP content, application logs, or analytics;
- use constant-time hash comparison where applicable;
- reject revoked or disabled-user tokens before tool dispatch;
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

| Preset          | Scopes             | Purpose                            |
| --------------- | ------------------ | ---------------------------------- |
| Agent writer    | all initial scopes | Normal Codex workflow              |
| Read-only agent | read scopes only   | Investigation without contribution |

Workspace role and token scopes are both enforced. A token cannot grant an
operation the user does not have permission to perform.

Administrative workspace operations should remain web/API actions and must not
be exposed through the coding-agent MCP token in this milestone.

## Workspaces and access

### Workspace visibility

```text
discoverable — authenticated Haderach users can find the workspace and request access
private      — reserved for a later release
```

Visibility controls discovery, not data access. Discoverable workspaces do not
expose experience, sessions, member lists, or pending requests to non-members.

### Workspace roles

```text
owner  — full workspace control, ownership transfer, deletion, admins, and members
admin  — read/write access plus membership and access-request administration
writer — read access plus sessions, experience, feedback, questions, and answers
reader — retrieve experience, questions, answers, incidents, and session summaries
```

Every workspace has exactly one active owner. Only active workspace owners and
admins perform membership administration. Disabled or removed members
immediately lose access even if one of their tokens has not expired.

### Workspace creation and ownership

When a signed-in user creates or connects a workspace:

1. the user supplies a public GitHub repository URL;
2. the service normalizes the URL and verifies that the repository exists;
3. it verifies that no workspace already exists for the same canonical repository;
4. the workspace and stable repository identity are created in one transaction;
5. the creator becomes the workspace `owner`;
6. an active owner membership is created immediately;
7. the workspace defaults to `discoverable`;
8. an audit event records the workspace, repository, and creator.

Ownership rules:

- a workspace must always have exactly one active owner;
- the owner has read and write access implicitly;
- the owner can promote writers or readers to admin;
- the owner can transfer ownership to one active admin or writer;
- ownership transfer is atomic: the recipient becomes owner and the previous
  owner becomes admin unless the previous owner chooses writer or reader;
- an owner cannot leave, be removed, or be disabled at the workspace level until
  ownership is transferred;
- only the owner can archive or delete the workspace;
- admins cannot transfer ownership, delete the workspace, or demote the owner;
- if the owner loses account access before transferring ownership, a separately
  authorized platform-support recovery process may transfer ownership only after
  repository-control verification and must record an audit reason.

### Workspace access requests

An authenticated Haderach user who can discover a workspace but is not a member
may request access from the workspace page.

The requester chooses one of two access levels:

```text
reader — view and retrieve shared experience
writer — reader access plus contribute sessions, experience, and feedback
```

Users cannot request `admin` or `owner`. Those roles are granted only by the
workspace owner after a user becomes an active member.

The request form contains:

- requested role: reader or writer;
- optional message explaining why access is needed, limited to 500 characters;
- the requester's username and display name, supplied by the authenticated identity;
- creation time.

The username and identity are never accepted from editable client input. The
server derives them from the authenticated user.

Request lifecycle:

```text
pending → approved
        → rejected
        → cancelled
        → expired
```

Rules:

- at most one pending request may exist for the same user and workspace;
- submitting the same request twice returns the existing pending request;
- the requester may cancel a pending request;
- the workspace owner or any active workspace admin may approve or reject it;
- a reviewer may approve the requested role or grant the lower `reader` role;
- granting a higher role than requested requires a separate promotion after approval;
- approval and membership creation happen in one transaction;
- two reviewers acting concurrently cannot create duplicate memberships;
- rejection may include an optional reason visible to the requester and reviewers;
- rejected requests may be submitted again after a configurable cooldown,
  initially 24 hours;
- pending requests expire after 30 days;
- a direct membership grant by an owner automatically closes any pending request;
- removing an existing member does not automatically recreate or reopen an old request.

### Access-request review tab

Every workspace includes an **Access requests** tab.

Visibility:

- owner and admins see all pending and historical requests;
- writers and readers do not see the tab;
- requesters can see only their own request status from the workspace discovery page;
- platform-support recovery does not permit routine request review.

The pending-request table shows:

| Field               | Purpose                               |
| ------------------- | ------------------------------------- |
| Username and avatar | Identify the requesting account       |
| Display name        | Human-friendly identity               |
| Requested role      | Reader or writer                      |
| Message             | Why access is requested               |
| Requested at        | Request age and ordering              |
| Actions             | Approve, approve as reader, or reject |

The tab includes:

- a pending-count badge;
- pending requests first, oldest first by default;
- filters for pending, approved, rejected, cancelled, and expired;
- a confirmation dialog before approval or rejection;
- an optional rejection-reason field;
- reviewer identity and decision timestamp in request history;
- optimistic UI only after the server returns the committed decision;
- accessible keyboard controls and explicit status text in addition to color.

Approving a request updates the Members tab immediately. Rejecting it does not
expose other members or private workspace content to the requester.

### Workspace permission matrix

| Capability                             | Reader | Writer | Admin | Owner |
| -------------------------------------- | :----: | :----: | :---: | :---: |
| Retrieve experience and evidence       |  Yes   |  Yes   |  Yes  |  Yes  |
| View questions, answers, and incidents |  Yes   |  Yes   |  Yes  |  Yes  |
| Start/update agent sessions            |   No   |  Yes   |  Yes  |  Yes  |
| Save experience and feedback           |   No   |  Yes   |  Yes  |  Yes  |
| Ask and answer questions               |   No   |  Yes   |  Yes  |  Yes  |
| View workspace members                 |  Yes   |  Yes   |  Yes  |  Yes  |
| View and decide access requests        |   No   |   No   |  Yes  |  Yes  |
| Add/remove readers and writers         |   No   |   No   |  Yes  |  Yes  |
| Promote or remove admins               |   No   |   No   |  No   |  Yes  |
| Change workspace visibility/settings   |   No   |   No   |  Yes  |  Yes  |
| Transfer ownership                     |   No   |   No   |  No   |  Yes  |
| Archive/delete workspace               |   No   |   No   |  No   |  Yes  |

## Workspace and repository identity

Workspaces use stable IDs rather than free-form repository names as foreign
keys. Each workspace stores the identity of exactly one connected repository:

```yaml
id: UUID
created_by_user_id: UUID
owner_user_id: UUID
provider: github | gitlab | local | other
repository_owner: sindresorhus
repository_name: p-limit
canonical_key: github:sindresorhus/p-limit
remote_url: https://github.com/sindresorhus/p-limit.git
default_branch: main
visibility: discoverable | private
status: active | archived
```

`canonical_key` must be globally unique for official workspaces in one Haderach
deployment. Display names, repository names, and remote URLs may change without
changing the workspace ID.

The current `experiences.repository` text field will be replaced by a required
`workspace_id` foreign key.

## Proposed database schema

### New tables

```text
users
connected_identities
workspaces
workspace_memberships
workspace_access_requests
personal_access_tokens
audit_events
```

Important fields:

```yaml
users:
  id: UUID
  primary_email: text | null
  display_name: text
  avatar_url: text | null
  status: active | disabled

connected_identities:
  id: UUID
  user_id: UUID
  provider: github | future_provider
  provider_subject: text
  provider_username: text
  email: text | null
  email_verified: boolean
  avatar_url: text | null
  linked_at: timestamptz
  last_authenticated_at: timestamptz

workspaces:
  id: UUID
  created_by_user_id: UUID
  owner_user_id: UUID
  canonical_key: text
  provider: text
  repository_owner: text
  repository_name: text
  remote_url: text
  default_branch: text
  visibility: discoverable | private
  status: active | archived

workspace_memberships:
  id: UUID
  workspace_id: UUID
  user_id: UUID
  role: owner | admin | writer | reader
  status: active | removed
  granted_by_user_id: UUID
  created_at: timestamptz
  updated_at: timestamptz
  removed_at: timestamptz | null

workspace_access_requests:
  id: UUID
  workspace_id: UUID
  requester_user_id: UUID
  requested_role: reader | writer
  status: pending | approved | rejected | cancelled | expired
  message: text | null
  decision_reason: text | null
  decided_by_user_id: UUID | null
  decided_at: timestamptz | null
  resulting_membership_id: UUID | null
  expires_at: timestamptz
  created_at: timestamptz
  updated_at: timestamptz

personal_access_tokens:
  id: UUID
  user_id: UUID
  token_hash: text
  token_prefix: text
  token_last_four: text
  name: text
  scopes: text[]
  revoked_at: timestamptz
  last_used_at: timestamptz

audit_events:
  id: UUID
  workspace_id: UUID | null
  actor_user_id: UUID | null
  token_id: UUID | null
  action: text
  target_type: text
  target_id: UUID | null
  metadata: jsonb
  created_at: timestamptz
```

Required constraints:

- unique active membership per `(workspace_id, user_id)`;
- unique connected identity per `(provider, provider_subject)`;
- at least one connected identity or other valid sign-in credential per active user;
- unique pending access request per `(workspace_id, requester_user_id)`;
- `requested_role` restricted to `reader` or `writer`;
- decision fields required for approved or rejected requests;
- `resulting_membership_id` required only for approved requests;
- workspace owner must reference an active owner membership in the same workspace;
- only one active `owner` membership per workspace;
- request, reviewer, resulting membership, and evidence must belong to the same workspace;
- request message length at most 500 characters;
- status transitions enforced by the service and protected with transactional row locking;

### Existing-table changes

```text
sessions
  + workspace_id UUID NOT NULL
  + actor_user_id UUID NOT NULL
  + token_id UUID NULL

experiences
  + workspace_id UUID NOT NULL
  + created_by_user_id UUID NOT NULL
  - repository text

experience_feedback
  + workspace_id UUID NOT NULL
  + actor_user_id UUID NOT NULL
```

Questions, answers, and incidents currently share the `experiences` table and
therefore inherit its workspace scope.

Composite constraints should prevent records from referring to sessions or
experiences in another workspace. Application checks alone are not sufficient
for cross-workspace foreign-key integrity.

## Authorization architecture

Every request resolves an immutable request context before entering business
logic:

```ts
type AuthContext = {
  userId: string;
  tokenId?: string;
  tokenScopes: string[];
};

type WorkspaceContext = AuthContext & {
  workspaceId: string;
  workspaceRole: "reader" | "writer" | "admin" | "owner";
};
```

Authorization uses capability checks rather than scattered role comparisons:

```ts
can(context, "experience:read");
can(context, "experience:write");
can(context, "membership:review_requests");
can(context, "membership:manage_members");
can(context, "repository:transfer_ownership");
```

This prevents assumptions such as `role !== "reader"` from becoming the
authorization model. Platform-support recovery is a separate, audited operational
path and is never represented as an ordinary workspace role.

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
  AND workspace_id = $workspace_id
```

Returning `404` for inaccessible resource IDs is preferred where revealing
their existence would leak information.

PostgreSQL row-level security is deferred to production hardening. The initial
implementation uses mandatory application-level workspace scoping plus
cross-workspace integration tests.

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
session to that workspace. Subsequent session-scoped tools derive the workspace
and repository identity from the session ID.

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

1. Sign up or sign in with GitHub.
2. Create a workspace for a GitHub repository, or discover an existing workspace.
3. If creating it, become its owner; the workspace defaults to discoverable.
4. If discovering it, request reader or writer access and wait for a decision.
5. Create a named MCP token and copy it once after workspace access is granted.
6. Display the exact Codex configuration command using the hosted URL and token
   environment variable.
7. Show the connection status and last token use.

Required dashboard additions:

- sign-in page with a primary **Continue with GitHub** action;
- account settings showing the signed-in GitHub username and avatar;
- workspace creation form with a GitHub repository URL field;
- workspace switcher;
- workspace settings and access list;
- Members tab with roles and owner identity;
- Access requests tab for owners and admins, including a pending-count badge;
- requester-facing status for pending, approved, rejected, cancelled, or expired requests;
- ownership transfer;
- MCP token creation, rotation, and revocation;
- audit activity for sensitive changes;
- empty states that explain how to connect the first agent.

The selected workspace must be represented in the URL so browser refreshes and
shared links preserve scope:

```text
/workspaces/:workspaceId/experiences
```

## API changes

Workspace-scoped REST resources use nested paths:

```text
GET  /api/workspaces
POST /api/workspaces
GET  /api/workspaces/:workspaceId

GET  /api/workspaces/:workspaceId/experiences
POST /api/workspaces/:workspaceId/experiences/search
GET  /api/workspaces/:workspaceId/sessions

GET    /api/workspaces/:workspaceId/members
PATCH  /api/workspaces/:workspaceId/members/:userId
DELETE /api/workspaces/:workspaceId/members/:userId

POST /api/workspaces/:workspaceId/access-requests
GET  /api/workspaces/:workspaceId/access-requests/mine
GET  /api/workspaces/:workspaceId/access-requests
POST /api/workspaces/:workspaceId/access-requests/:requestId/approve
POST /api/workspaces/:workspaceId/access-requests/:requestId/reject
POST /api/workspaces/:workspaceId/access-requests/:requestId/cancel

POST /api/workspaces/:workspaceId/transfer-ownership

GET  /api/auth/github/start
GET  /api/auth/github/callback
GET  /api/account/identities

GET    /api/tokens
POST   /api/tokens
DELETE /api/tokens/:tokenId
```

The server derives workspace membership from the authenticated user and never
trusts a client-supplied `workspace_id` without authorization.

Authentication callbacks are browser navigation endpoints rather than JSON APIs.
The linking endpoint creates a short-lived server-side linking transaction and
then redirects through GitHub. Callback parameters alone are never sufficient to
select which Haderach user receives the identity.

Access-request endpoints return the updated request and, on approval, the
created membership. Decision endpoints require an expected request version or
use row locking so concurrent reviewers receive a deterministic conflict rather
than both succeeding.

## Local development

Authentication should be enabled by default in normal development. Tests may
use a development identity provider or fixtures.

An explicit escape hatch may exist for isolated local demos:

```text
AUTH_MODE=development
```

Development mode must:

- create a clearly labeled local user, workspace, and token;
- use the same authorization code paths after identity resolution;
- refuse to start when `NODE_ENV=production`;
- emit a visible warning;
- never be the default for a public deployment.

This replaces the current behavior where an empty secret disables all
authentication.

## Migration from the MVP

The migration must preserve the existing evaluation data.

1. Create one legacy user.
2. Create workspace rows for every distinct `experiences.repository` value and
   for the repository used by existing sessions.
3. Make the legacy user the owner of every migrated workspace and
   create its active owner membership.
4. Add nullable workspace and actor columns to existing tables.
5. Backfill workspace and actor IDs.
6. Validate that every row has a valid scope and every workspace has one owner.
7. Add foreign keys, composite constraints, indexes, and `NOT NULL` rules.
8. Remove the free-form `experiences.repository` column.
9. Create a development token for local testing and print it once through an
   explicit setup command, not migration logs.

Migration rollback should restore the previous schema until the destructive
column-removal step. A database backup is required before running the final
migration against shared data.

## Indexing and query isolation

All retrieval indexes must begin with or include `workspace_id` where useful.
Search candidates must be repository-filtered before relevance ranking.

Recommended indexes:

```text
experiences(workspace_id, status, type)
experiences(workspace_id, last_validated_at DESC)
sessions(workspace_id, updated_at DESC)
experience_feedback(workspace_id, experience_id)
workspaces(canonical_key) UNIQUE
workspace_memberships(workspace_id, user_id) UNIQUE
workspace_access_requests(workspace_id, status, created_at)
workspace_access_requests(workspace_id, requester_user_id)
personal_access_tokens(token_hash) UNIQUE
```

Use partial unique indexes for active memberships and pending requests if
historical rows remain in the same tables.

Token-budget selection and ranking operate only after tenant filtering. Feedback
from one repository must never affect an experience in another repository.

## Audit and operational requirements

Audit events are required for:

- token creation, revocation, and failed authentication;
- workspace creation or deletion;
- membership and role changes;
- access request submission, cancellation, approval, rejection, and expiry;
- repository ownership transfer and emergency recovery;
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

- add user, workspace, membership, token, and audit tables;
- add workspace owner, membership, and access-request constraints;
- create the legacy-data migration;
- replace repository strings with repository IDs;
- require repository context in every repository method;
- add cross-repository isolation integration tests.

### Phase 2 — MCP token authentication

- implement token generation, hashing, lookup, and revocation;
- authenticate `/mcp` before tool dispatch;
- add scopes and repository authorization;
- bind sessions to repositories;
- update every MCP tool and contract;
- document the bearer-token environment-variable setup for Codex.

### Phase 3 — Web identity and workspace management

- add GitHub OAuth/OIDC sign-in, identity records, and secure web sessions;
- implement workspace membership and repository-URL connection;
- implement workspace creation with transactional creator ownership;
- implement reader/writer access requests and owner/admin decisions;
- add Members and Access requests tabs, pending badges, and request history;
- implement ownership transfer and emergency recovery;
- implement token management and one-time token display;
- add workspace routing and switching to the dashboard.

### Phase 4 — Production hardening

- enable and test PostgreSQL row-level security when preparing for production;
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
│   ├── github.ts
│   ├── permissions.ts
│   ├── tokens.ts
│   └── web-session.ts
├── api/
│   ├── routes.ts
│   ├── workspaces.ts
│   ├── workspace-members.ts
│   ├── access-requests.ts
│   ├── account.ts
│   └── tokens.ts
├── database/
│   ├── schema.ts
│   └── migrations/
├── mcp/
│   ├── tools.ts
│   └── authentication.ts
└── services/
    ├── experience-repository.ts
    ├── access-request-service.ts
    ├── workspace-access.ts
    ├── workspace-membership-service.ts
    └── token-service.ts

packages/contracts/src/
├── auth.ts
├── identity.ts
├── workspace.ts
├── access-request.ts
└── token.ts

apps/web/app/
├── sign-in/
├── auth/github/callback/
├── onboarding/
├── workspaces/[workspaceId]/
│   ├── members/
│   └── access-requests/
└── settings/
    ├── account/
    └── tokens/
```

Exact file grouping may change during implementation, but the ownership
boundaries are fixed: cloud auth resolves identity, services authorize access,
database queries enforce scope, and clients cannot choose their own tenant.

## Required tests

### Token tests

- raw tokens are never stored;
- valid tokens authenticate;
- revoked tokens fail;
- missing scopes fail;
- disabled users fail immediately;
- token rotation does not interrupt the replacement token;
- authentication errors do not echo secrets.

### GitHub identity tests

- Continue with GitHub creates one user and one connected identity for a new GitHub account.
- A returning GitHub account signs into the same Haderach user even after its username changes.
- Invalid, missing, expired, or replayed OAuth state is rejected.
- An invalid PKCE verifier is rejected.
- Callback redirects outside the registered allowlist are rejected.
- Provider authorization codes and tokens never appear in application logs.
- Signing in with GitHub alone does not grant workspace access.
- GitHub sign-in does not request repository-management permissions.
- Any signed-in user can create a workspace from a valid public repository URL.
- Repository ownership or collaborator status is not required for workspace creation.

### Isolation tests

- A member of Workspace A cannot list or access Workspace B unless separately authorized.
- A repository reader cannot write experience.
- A repository writer can contribute experience but cannot view access requests.
- A repository admin can approve reader/writer requests but cannot transfer ownership.
- A repository owner can promote admins and transfer ownership.
- A workspace rejects experience access from non-members even when it is discoverable.
- An experience UUID from another repository returns `404`.
- A session ID cannot be reused across repository boundaries.
- Cross-repository feedback cannot change ranking.
- Search never returns records from another repository.

### Workspace ownership and access-request tests

- The workspace creator becomes its sole owner in the same transaction.
- A failed workspace creation leaves neither a repository nor orphaned membership.
- The owner cannot leave or be removed before transferring ownership.
- Ownership transfer changes both owner reference and membership roles atomically.
- An admin cannot transfer ownership, remove the owner, or promote another admin.
- A discoverable workspace reveals only safe discovery metadata to a non-member.
- A non-member can request only reader or writer access.
- Username and requester ID are derived from authentication, not request payload.
- Duplicate submissions return the existing pending request.
- A requester can cancel only their own pending request.
- Readers and writers cannot list or decide access requests.
- Owners and admins can list pending requests.
- Approval creates exactly one active membership under concurrent review attempts.
- An admin may approve a writer request as reader but not grant admin directly.
- Rejection records reviewer, timestamp, and optional reason.
- Rejected requests respect the configured resubmission cooldown.
- Expired requests cannot be approved.
- A direct membership grant closes an existing pending request.
- Disabled users cannot submit requests or receive approved membership.
- Every decision and ownership change creates an audit event.

### End-to-end test

```text
Developer A signs in
→ signs in with GitHub
→ pastes a public GitHub repository URL and creates Workspace A
→ automatically becomes Workspace A owner
→ creates an MCP token
→ Codex starts a repository-bound session
→ Codex saves experience
→ Developer B discovers Repository A and requests reader access
→ Developer A sees the request in the Access requests tab and approves it
→ Developer B retrieves experience but cannot write it
→ Developer A promotes Developer B to writer
→ Developer B contributes evidenced experience
→ Developer C belongs only to Repository B and cannot discover it
→ Developer A revokes the token
→ the next MCP request is rejected
```

## Acceptance criteria

- no public endpoint accepts the current unauthenticated mode;
- users can sign up and sign in with GitHub;
- GitHub identities are keyed by stable provider ID rather than mutable username;
- identity login does not bypass workspace membership;
- workspace creation accepts and normalizes a valid public GitHub repository URL;
- workspace creation does not require GitHub repository ownership or collaborator status;
- Codex connects using a bearer token stored in an environment variable;
- tokens are named, scoped, non-expiring, revocable, and stored only as hashes;
- one user can belong to multiple workspaces;
- each workspace maps to exactly one repository;
- creating a workspace makes the creator its sole owner atomically;
- workspaces support owner, admin, writer, and reader roles with the
  documented permission matrix;
- discoverable workspaces allow authenticated users to request reader or
  writer access without exposing private workspace data;
- new workspaces default to discoverable;
- joining requires discovering a workspace and submitting an access request;
- direct invitations are deferred;
- owners and admins can review pending access requests from a dedicated tab;
- approval creates an active membership exactly once and rejection records an
  auditable decision;
- owners can transfer ownership and cannot leave before doing so;
- every experience, session, and feedback record has an immutable repository
  scope;
- search, detail retrieval, feedback, and collaboration pass isolation tests;
- the dashboard can switch workspaces without leaking cached data;
- existing MVP data migrates without loss;
- all tests and MCP smoke checks run in CI.

## Locked initial-release decisions

1. GitHub is the only web sign-in provider.
2. Personal MCP tokens do not expire automatically; users can revoke and rotate them.
3. Workspace creation accepts a public GitHub repository URL rather than importing repositories.
4. Any signed-in user can create a workspace; GitHub repository ownership is not required.
5. PostgreSQL row-level security is deferred to production hardening.
6. New workspaces default to `discoverable`.
7. Rejection reasons are visible to the requester.
8. Direct invitations are deferred; users join by finding a workspace and requesting access.
9. GitHub authentication requests only profile identity access. GitHub App and
   repository permissions are not part of the initial release.
