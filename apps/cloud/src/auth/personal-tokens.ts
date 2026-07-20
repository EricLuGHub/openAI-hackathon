import { createHash, randomBytes, randomUUID } from "node:crypto";
import type postgres from "postgres";

export const tokenScopes = [
  "experience:read",
  "experience:write",
  "feedback:write",
  "collaboration:read",
  "collaboration:write",
] as const;

export type TokenScope = (typeof tokenScopes)[number];

export type AuthContext = {
  userId: string;
  tokenId: string | null;
  scopes: TokenScope[];
};

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function hashPersonalToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generatePersonalToken() {
  const secret = randomBytes(32).toString("base64url");
  const token = `ahd_pat_${secret}`;
  return {
    token,
    hash: hashPersonalToken(token),
    prefix: token.slice(0, 16),
    lastFour: token.slice(-4),
  };
}

export function readBearerToken(authorization: string | undefined) {
  if (!authorization) throw new AuthenticationError();
  const match = /^Bearer\s+(ahd_pat_[A-Za-z0-9_-]+)$/i.exec(
    authorization.trim(),
  );
  if (!match) throw new AuthenticationError();
  return match[1]!;
}

function validScopes(value: unknown): TokenScope[] {
  if (!Array.isArray(value)) throw new AuthenticationError();
  const allowed = new Set<string>(tokenScopes);
  if (value.some((scope) => typeof scope !== "string" || !allowed.has(scope)))
    throw new AuthenticationError();
  return value as TokenScope[];
}

export class PersonalTokenService {
  constructor(private readonly sql: postgres.Sql) {}

  async create(
    userId: string,
    name: string,
    scopes: TokenScope[] = [...tokenScopes],
  ) {
    const id = randomUUID();
    const generated = generatePersonalToken();
    await this.sql.begin(async (transaction) => {
      await transaction`
        INSERT INTO personal_access_tokens
          (id, user_id, token_hash, token_prefix, token_last_four, name, scopes)
        VALUES
          (${id}, ${userId}, ${generated.hash}, ${generated.prefix},
           ${generated.lastFour}, ${name}, ${transaction.array(scopes, 25)})`;
      await transaction`
        INSERT INTO audit_events
          (id, actor_user_id, token_id, action, target_type, target_id)
        VALUES
          (${randomUUID()}, ${userId}, ${id}, 'token.created', 'personal_access_token', ${id})`;
    });
    return { id, token: generated.token, name, scopes };
  }

  async authenticate(authorization: string | undefined): Promise<AuthContext> {
    const rawToken = readBearerToken(authorization);
    const digest = hashPersonalToken(rawToken);
    const [record] = await this.sql`
      SELECT token.id, token.user_id, token.scopes
      FROM personal_access_tokens token
      JOIN users ON users.id = token.user_id
      WHERE token.token_hash = ${digest}
        AND token.revoked_at IS NULL
        AND users.status = 'active'`;
    if (!record) throw new AuthenticationError();
    void this.sql`
      UPDATE personal_access_tokens
      SET last_used_at = now()
      WHERE id = ${record.id as string}
        AND (last_used_at IS NULL OR last_used_at < now() - interval '5 minutes')
    `.catch(() => undefined);
    return {
      userId: String(record.user_id),
      tokenId: String(record.id),
      scopes: validScopes(record.scopes),
    };
  }

  async list(userId: string) {
    return this.sql`
      SELECT id, token_prefix, token_last_four, name, scopes, revoked_at,
        last_used_at, created_at
      FROM personal_access_tokens
      WHERE user_id = ${userId}
      ORDER BY created_at DESC`;
  }

  async revoke(userId: string, tokenId: string) {
    const [token] = await this.sql`
      UPDATE personal_access_tokens SET revoked_at = now()
      WHERE id = ${tokenId} AND user_id = ${userId} AND revoked_at IS NULL
      RETURNING id, revoked_at`;
    if (!token) throw new Error("Token not found");
    await this.sql`
      INSERT INTO audit_events
        (id, actor_user_id, action, target_type, target_id)
      VALUES
        (${randomUUID()}, ${userId}, 'token.revoked', 'personal_access_token', ${tokenId})`;
    return token;
  }
}
