import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import type { AuthContext } from "../auth/personal-tokens.js";

export type GitHubRepository = {
  owner: string;
  name: string;
  canonicalKey: string;
  remoteUrl: string;
};

export function parseGitHubRepositoryUrl(value: string): GitHubRepository {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid GitHub repository URL");
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com")
    throw new Error("Only public HTTPS GitHub repository URLs are supported");
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts.length !== 2)
    throw new Error("Enter a GitHub repository URL in owner/name form");
  const owner = parts[0]!;
  const name = parts[1]!.replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name))
    throw new Error("GitHub repository owner or name is invalid");
  return {
    owner,
    name,
    canonicalKey: `github:${owner.toLowerCase()}/${name.toLowerCase()}`,
    remoteUrl: `https://github.com/${owner}/${name}`,
  };
}

export class WorkspaceService {
  constructor(
    private readonly sql: postgres.Sql,
    private readonly request: typeof fetch = fetch,
  ) {}

  async create(auth: AuthContext, repositoryUrl: string) {
    const repository = parseGitHubRepositoryUrl(repositoryUrl);
    const response = await this.request(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "agent-haderach",
        },
      },
    );
    if (!response.ok) throw new Error("Public GitHub repository was not found");
    const metadata = (await response.json()) as { default_branch?: string };
    const workspaceId = randomUUID();
    await this.sql.begin(async (transaction) => {
      await transaction`
        INSERT INTO workspaces
          (id, created_by_user_id, owner_user_id, canonical_key, provider,
           repository_owner, repository_name, remote_url, default_branch, visibility)
        VALUES
          (${workspaceId}, ${auth.userId}, ${auth.userId}, ${repository.canonicalKey}, 'github',
           ${repository.owner}, ${repository.name}, ${repository.remoteUrl},
           ${metadata.default_branch ?? null}, 'discoverable')`;
      await transaction`
        INSERT INTO workspace_memberships
          (id, workspace_id, user_id, role, granted_by_user_id)
        VALUES (${randomUUID()}, ${workspaceId}, ${auth.userId}, 'owner', ${auth.userId})`;
      await transaction`
        INSERT INTO audit_events
          (id, workspace_id, actor_user_id, token_id, action, target_type, target_id)
        VALUES
          (${randomUUID()}, ${workspaceId}, ${auth.userId}, ${auth.tokenId},
           'workspace.created', 'workspace', ${workspaceId})`;
    });
    return this.get(auth, workspaceId);
  }

  async list(auth: AuthContext, query = "") {
    const pattern = `%${query.trim()}%`;
    return this.sql`
      SELECT workspace.id, workspace.canonical_key, workspace.repository_owner,
        workspace.repository_name, workspace.remote_url, workspace.default_branch,
        workspace.visibility, workspace.status, membership.role,
        (SELECT request.status FROM workspace_access_requests request
         WHERE request.workspace_id = workspace.id
           AND request.requester_user_id = ${auth.userId}
         ORDER BY request.created_at DESC LIMIT 1) AS request_status,
        (SELECT request.decision_reason FROM workspace_access_requests request
         WHERE request.workspace_id = workspace.id
           AND request.requester_user_id = ${auth.userId}
         ORDER BY request.created_at DESC LIMIT 1) AS request_reason
      FROM workspaces workspace
      LEFT JOIN workspace_memberships membership
        ON membership.workspace_id = workspace.id
       AND membership.user_id = ${auth.userId}
       AND membership.status = 'active'
      WHERE workspace.status = 'active'
        AND (workspace.visibility = 'discoverable' OR membership.id IS NOT NULL)
        AND (${query.trim() === ""} OR workspace.canonical_key ILIKE ${pattern})
      ORDER BY (membership.id IS NOT NULL) DESC, workspace.repository_owner, workspace.repository_name`;
  }

  async get(auth: AuthContext, workspaceId: string) {
    const [workspace] = await this.sql`
      SELECT workspace.id, workspace.canonical_key, workspace.repository_owner,
        workspace.repository_name, workspace.remote_url, workspace.default_branch,
        workspace.visibility, workspace.status, membership.role
      FROM workspaces workspace
      LEFT JOIN workspace_memberships membership
        ON membership.workspace_id = workspace.id
       AND membership.user_id = ${auth.userId}
       AND membership.status = 'active'
      WHERE workspace.id = ${workspaceId}
        AND (workspace.visibility = 'discoverable' OR membership.id IS NOT NULL)`;
    if (!workspace) throw new Error("Workspace not found");
    return workspace;
  }

  async requestAccess(
    auth: AuthContext,
    workspaceId: string,
    role: "reader" | "writer",
    message?: string,
  ) {
    const [request] = await this.sql`
      INSERT INTO workspace_access_requests
        (id, workspace_id, requester_user_id, requested_role, message)
      SELECT ${randomUUID()}, workspace.id, ${auth.userId}, ${role}, ${message ?? null}
      FROM workspaces workspace
      WHERE workspace.id = ${workspaceId}
        AND workspace.status = 'active'
        AND workspace.visibility = 'discoverable'
        AND NOT EXISTS (
          SELECT 1 FROM workspace_memberships membership
          WHERE membership.workspace_id = workspace.id
            AND membership.user_id = ${auth.userId}
            AND membership.status = 'active'
        )
      ON CONFLICT (workspace_id, requester_user_id) WHERE status = 'pending'
      DO UPDATE SET updated_at = workspace_access_requests.updated_at
      RETURNING *`;
    if (!request)
      throw new Error("Workspace not found or access already granted");
    return request;
  }

  async listRequests(auth: AuthContext, workspaceId: string) {
    return this.sql`
      SELECT request.*, users.username, users.display_name, users.avatar_url
      FROM workspace_access_requests request
      JOIN users ON users.id = request.requester_user_id
      WHERE request.workspace_id = ${workspaceId}
        AND EXISTS (
          SELECT 1 FROM workspace_memberships reviewer
          WHERE reviewer.workspace_id = request.workspace_id
            AND reviewer.user_id = ${auth.userId}
            AND reviewer.status = 'active'
            AND reviewer.role IN ('owner', 'admin')
        )
      ORDER BY (request.status = 'pending') DESC, request.created_at`;
  }

  async decideRequest(
    auth: AuthContext,
    workspaceId: string,
    requestId: string,
    decision: "approved" | "rejected",
    reason?: string,
  ) {
    return this.sql.begin(async (transaction) => {
      const [request] = await transaction`
        SELECT request.*
        FROM workspace_access_requests request
        JOIN workspace_memberships reviewer ON reviewer.workspace_id = request.workspace_id
        WHERE request.id = ${requestId}
          AND request.workspace_id = ${workspaceId}
          AND request.status = 'pending'
          AND request.expires_at > now()
          AND reviewer.user_id = ${auth.userId}
          AND reviewer.status = 'active'
          AND reviewer.role IN ('owner', 'admin')
        FOR UPDATE OF request`;
      if (!request) throw new Error("Pending access request not found");
      let membershipId: string | null = null;
      if (decision === "approved") {
        const proposedMembershipId = randomUUID();
        const [membership] = await transaction`
          INSERT INTO workspace_memberships
            (id, workspace_id, user_id, role, granted_by_user_id)
          VALUES
            (${proposedMembershipId}, ${workspaceId}, ${request.requester_user_id as string},
             ${request.requested_role as string}, ${auth.userId})
          ON CONFLICT (workspace_id, user_id) DO UPDATE SET
            role = EXCLUDED.role, status = 'active', removed_at = NULL,
            granted_by_user_id = EXCLUDED.granted_by_user_id, updated_at = now()
          RETURNING id`;
        membershipId = String(membership!.id);
      }
      const [updated] = await transaction`
        UPDATE workspace_access_requests SET
          status = ${decision}, decision_reason = ${reason ?? null},
          decided_by_user_id = ${auth.userId}, decided_at = now(),
          resulting_membership_id = ${membershipId}, updated_at = now()
        WHERE id = ${requestId}
        RETURNING *`;
      await transaction`
        INSERT INTO audit_events
          (id, workspace_id, actor_user_id, token_id, action, target_type, target_id)
        VALUES
          (${randomUUID()}, ${workspaceId}, ${auth.userId}, ${auth.tokenId},
           ${`access_request.${decision}`}, 'workspace_access_request', ${requestId})`;
      return updated;
    });
  }

  async listMembers(auth: AuthContext, workspaceId: string) {
    return this.sql`
      SELECT users.id, users.username, users.display_name, users.avatar_url,
        membership.role, membership.created_at
      FROM workspace_memberships membership
      JOIN users ON users.id = membership.user_id
      WHERE membership.workspace_id = ${workspaceId}
        AND membership.status = 'active'
        AND EXISTS (
          SELECT 1 FROM workspace_memberships viewer
          WHERE viewer.workspace_id = membership.workspace_id
            AND viewer.user_id = ${auth.userId} AND viewer.status = 'active'
        )
      ORDER BY CASE membership.role
        WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'writer' THEN 3 ELSE 4 END,
        users.display_name`;
  }

  async changeMemberRole(
    auth: AuthContext,
    workspaceId: string,
    userId: string,
    role: "admin" | "writer" | "reader",
  ) {
    const [actor] = await this.sql`
      SELECT role FROM workspace_memberships
      WHERE workspace_id = ${workspaceId} AND user_id = ${auth.userId}
        AND status = 'active' AND role IN ('owner', 'admin')`;
    if (!actor || (actor.role === "admin" && role === "admin"))
      throw new Error("Only the owner can grant the admin role");
    const [member] = await this.sql`
      UPDATE workspace_memberships SET role = ${role}, updated_at = now()
      WHERE workspace_id = ${workspaceId} AND user_id = ${userId}
        AND status = 'active' AND role <> 'owner'
      RETURNING *`;
    if (!member) throw new Error("Member not found or role cannot be changed");
    return member;
  }

  async transferOwnership(
    auth: AuthContext,
    workspaceId: string,
    userId: string,
  ) {
    return this.sql.begin(async (transaction) => {
      const [owner] = await transaction`
        SELECT id FROM workspace_memberships
        WHERE workspace_id = ${workspaceId} AND user_id = ${auth.userId}
          AND status = 'active' AND role = 'owner' FOR UPDATE`;
      const [recipient] = await transaction`
        SELECT id FROM workspace_memberships
        WHERE workspace_id = ${workspaceId} AND user_id = ${userId}
          AND status = 'active' AND role IN ('admin', 'writer') FOR UPDATE`;
      if (!owner || !recipient)
        throw new Error("Ownership transfer is not allowed");
      await transaction`UPDATE workspace_memberships SET role = 'admin', updated_at = now() WHERE id = ${owner.id as string}`;
      await transaction`UPDATE workspace_memberships SET role = 'owner', updated_at = now() WHERE id = ${recipient.id as string}`;
      const [workspace] = await transaction`
        UPDATE workspaces SET owner_user_id = ${userId}, updated_at = now()
        WHERE id = ${workspaceId} RETURNING *`;
      return workspace;
    });
  }

  async cancelRequest(
    auth: AuthContext,
    workspaceId: string,
    requestId: string,
  ) {
    const [request] = await this.sql`
      UPDATE workspace_access_requests
      SET status = 'cancelled', updated_at = now()
      WHERE id = ${requestId} AND workspace_id = ${workspaceId}
        AND requester_user_id = ${auth.userId} AND status = 'pending'
      RETURNING *`;
    if (!request) throw new Error("Pending access request not found");
    return request;
  }
}
