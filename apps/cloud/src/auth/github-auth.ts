import { createHash, randomBytes, randomUUID } from "node:crypto";
import type postgres from "postgres";
import type { AuthContext } from "./personal-tokens.js";
import { tokenScopes } from "./personal-tokens.js";

const digest = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

export class GitHubAuthService {
  constructor(private readonly sql: postgres.Sql) {}

  async start() {
    const state = randomBytes(32).toString("base64url");
    await this.sql`
      INSERT INTO oauth_states (id, state_hash, expires_at)
      VALUES (${randomUUID()}, ${digest(state)}, now() + interval '10 minutes')`;
    return state;
  }

  authorizationUrl(state: string) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new Error("GITHUB_CLIENT_ID is required");
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", this.callbackUrl());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "read:user");
    return url.toString();
  }

  async callback(code: string, state: string) {
    const [validState] = await this.sql`
      UPDATE oauth_states SET used_at = now()
      WHERE state_hash = ${digest(state)} AND used_at IS NULL AND expires_at > now()
      RETURNING id`;
    if (!validState) throw new Error("Invalid or expired OAuth state");
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret)
      throw new Error("GitHub OAuth is not configured");
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: this.callbackUrl(),
        }),
      },
    );
    const tokenBody = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenResponse.ok || !tokenBody.access_token)
      throw new Error(tokenBody.error ?? "GitHub authentication failed");
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenBody.access_token}`,
        "User-Agent": "agent-haderach",
      },
    });
    if (!profileResponse.ok) throw new Error("Unable to load GitHub profile");
    const profile = (await profileResponse.json()) as {
      id: number;
      login: string;
      name?: string | null;
      avatar_url?: string | null;
    };
    const [user] = await this.sql`
      INSERT INTO users (id, github_id, github_username, display_name, avatar_url)
      VALUES (${randomUUID()}, ${String(profile.id)}, ${profile.login},
        ${profile.name ?? profile.login}, ${profile.avatar_url ?? null})
      ON CONFLICT (github_id) DO UPDATE SET
        github_username = EXCLUDED.github_username,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now()
      RETURNING id`;
    const rawSession = randomBytes(32).toString("base64url");
    await this.sql`
      INSERT INTO web_sessions (id, user_id, session_hash, expires_at)
      VALUES (${randomUUID()}, ${user!.id as string}, ${digest(rawSession)}, now() + interval '7 days')`;
    return rawSession;
  }

  async authenticate(rawSession: string | undefined): Promise<AuthContext> {
    if (!rawSession) throw new Error("Unauthorized");
    const [session] = await this.sql`
      SELECT session.id, session.user_id
      FROM web_sessions session
      JOIN users ON users.id = session.user_id
      WHERE session.session_hash = ${digest(rawSession)}
        AND session.revoked_at IS NULL
        AND session.expires_at > now()
        AND users.status = 'active'`;
    if (!session) throw new Error("Unauthorized");
    return {
      userId: String(session.user_id),
      tokenId: null,
      scopes: [...tokenScopes],
    };
  }

  private callbackUrl() {
    return (
      process.env.GITHUB_CALLBACK_URL ??
      "http://127.0.0.1:3001/auth/github/callback"
    );
  }
}
