import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import type postgres from "postgres";
import {
  AuthenticationError,
  tokenScopes,
  type AuthContext,
} from "./personal-tokens.js";

const scryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
const placeholderHash =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

const derivePassword = (
  password: string,
  salt: Buffer,
  length: number,
  options = scryptOptions,
) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, length, options, (error, derivedKey) =>
      error ? reject(error) : resolve(derivedKey),
    ),
  );

export function normalizeUsername(value: string) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username))
    throw new Error(
      "Username must be 3–30 characters using letters, numbers, underscores, or hyphens",
    );
  return username;
}

export function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address");
  return email;
}

export async function hashPassword(password: string) {
  if (password.length < 10 || password.length > 200)
    throw new Error("Password must be between 10 and 200 characters");
  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt, 32);
  return `scrypt$${scryptOptions.N}$${scryptOptions.r}$${scryptOptions.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, n, r, p, saltValue, hashValue] = stored.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !saltValue || !hashValue)
    return false;
  const expected = Buffer.from(hashValue, "base64");
  const actual = await derivePassword(
    password,
    Buffer.from(saltValue, "base64"),
    expected.length,
    { N: Number(n), r: Number(r), p: Number(p), maxmem: 32 * 1024 * 1024 },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const sessionDigest = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

export class LocalAuthService {
  constructor(private readonly sql: postgres.Sql) {}

  async signup(input: { username: string; email: string; password: string }) {
    const username = normalizeUsername(input.username);
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const [user] = await this.sql`
      INSERT INTO users
        (id, username, email, password_hash, display_name, status)
      VALUES
        (${randomUUID()}, ${username}, ${email}, ${passwordHash}, ${username}, 'active')
      RETURNING id`;
    return this.createSession(String(user!.id));
  }

  async signin(identifier: string, password: string) {
    const normalized = identifier.trim().toLowerCase();
    const [user] = await this.sql`
      SELECT id, password_hash
      FROM users
      WHERE status = 'active'
        AND (lower(username) = ${normalized} OR lower(email) = ${normalized})`;
    const valid = await verifyPassword(
      password,
      user?.password_hash ? String(user.password_hash) : placeholderHash,
    );
    if (!user || !valid) throw new AuthenticationError("Invalid credentials");
    return this.createSession(String(user.id));
  }

  async authenticate(rawSession: string | undefined): Promise<AuthContext> {
    if (!rawSession) throw new AuthenticationError();
    const [session] = await this.sql`
      SELECT session.id, session.user_id
      FROM web_sessions session
      JOIN users ON users.id = session.user_id
      WHERE session.session_hash = ${sessionDigest(rawSession)}
        AND session.revoked_at IS NULL
        AND session.expires_at > now()
        AND users.status = 'active'`;
    if (!session) throw new AuthenticationError();
    return {
      userId: String(session.user_id),
      tokenId: null,
      scopes: [...tokenScopes],
    };
  }

  async signout(rawSession: string | undefined) {
    if (!rawSession) return;
    await this.sql`
      UPDATE web_sessions SET revoked_at = now()
      WHERE session_hash = ${sessionDigest(rawSession)} AND revoked_at IS NULL`;
  }

  private async createSession(userId: string) {
    const rawSession = randomBytes(32).toString("base64url");
    await this.sql`
      INSERT INTO web_sessions (id, user_id, session_hash, expires_at)
      VALUES (${randomUUID()}, ${userId}, ${sessionDigest(rawSession)}, now() + interval '7 days')`;
    return rawSession;
  }
}
