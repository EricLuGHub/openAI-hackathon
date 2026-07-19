"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

type Experience = {
  id: string;
  type: string;
  taskSummary: string;
  summary: string;
  detail?: string;
  rankingScore: number;
  usefulnessScore: number;
  successfulUses: number;
  failedUses: number;
  confidence: string;
  status: string;
  outcomeStatus: string;
  keywords: string[];
  paths: string[];
  services: string[];
  revision: string;
  createdAt: string;
  lastValidatedAt?: string;
};
type View = "memory" | "signals" | "access";
type Workspace = {
  id: string;
  canonical_key: string;
  repository_owner: string;
  repository_name: string;
  role: "owner" | "admin" | "writer" | "reader" | null;
  request_status?: string;
  request_reason?: string;
};
type AccessRequest = {
  id: string;
  username?: string;
  display_name: string;
  requested_role: "reader" | "writer";
  status: string;
  message?: string;
};
type PersonalToken = {
  id: string;
  name: string;
  token_prefix: string;
  token_last_four: string;
  revoked_at?: string;
};
type WorkspaceMember = {
  id: string;
  username?: string;
  display_name: string;
  role: "owner" | "admin" | "writer" | "reader";
};

const API =
  process.env.NEXT_PUBLIC_AGENT_HADERACH_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "/backend"
    : typeof window === "undefined"
      ? "http://127.0.0.1:3001"
      : `${window.location.protocol}//${window.location.hostname}:3001`);
const icons: Record<string, string> = {
  workflow: "↗",
  lesson: "◇",
  pitfall: "!",
  summary: "≡",
  handoff: "→",
  incident: "●",
  question: "?",
  answer: "✓",
};

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-logo brand-symbol" : "brand-logo"}>
      <Image
        src="/brand/agent-haderach-logo-acid.png"
        alt={compact ? "" : "Agent Haderach"}
        width={1774}
        height={887}
        priority={!compact}
      />
    </span>
  );
}

export default function Dashboard() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selected, setSelected] = useState<Experience | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [live, setLive] = useState(false);
  const [view, setView] = useState<View>("memory");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [tokens, setTokens] = useState<PersonalToken[]>([]);
  const [newToken, setNewToken] = useState("");
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    identifier: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  const load = useCallback(async () => {
    try {
      const me = await fetch(`${API}/api/me`, { credentials: "include" });
      if (me.status === 401) {
        setSignedIn(false);
        setLive(false);
        return;
      }
      if (!me.ok) throw new Error("offline");
      setSignedIn(true);
      const workspaceResponse = await fetch(`${API}/api/workspaces`, {
        credentials: "include",
      });
      if (!workspaceResponse.ok) throw new Error("offline");
      const workspaceRows = (await workspaceResponse.json()) as Workspace[];
      setWorkspaces(workspaceRows);
      const selected =
        workspaceRows.find((workspace) => workspace.id === workspaceId) ??
        workspaceRows.find((workspace) => workspace.role);
      if (!selected?.role) {
        setExperiences([]);
        setLive(true);
        return;
      }
      if (!workspaceId) setWorkspaceId(selected.id);
      const tokenResponse = await fetch(`${API}/api/tokens`, {
        credentials: "include",
      });
      if (tokenResponse.ok) setTokens(await tokenResponse.json());
      if (selected.role === "owner" || selected.role === "admin") {
        const requestResponse = await fetch(
          `${API}/api/workspaces/${selected.id}/access-requests`,
          { credentials: "include" },
        );
        if (requestResponse.ok) setAccessRequests(await requestResponse.json());
      } else {
        setAccessRequests([]);
      }
      const membersResponse = await fetch(
        `${API}/api/workspaces/${selected.id}/members`,
        { credentials: "include" },
      );
      if (membersResponse.ok) setMembers(await membersResponse.json());
      const repository = encodeURIComponent(selected.canonical_key);
      const e = await fetch(`${API}/api/experiences?repository=${repository}`, {
        credentials: "include",
      });
      if (!e.ok) throw new Error("offline");
      const experienceRows = await e.json();
      setExperiences(
        experienceRows.map((row: Record<string, unknown>) => ({
          ...row,
          taskSummary: row.taskSummary ?? row.task_summary,
          rankingScore: row.rankingScore ?? row.ranking_score,
          usefulnessScore: row.usefulnessScore ?? row.usefulness_score,
          successfulUses: row.successfulUses ?? row.successful_uses,
          failedUses: row.failedUses ?? row.failed_uses,
          outcomeStatus: row.outcomeStatus ?? row.outcome_status,
          keywords: row.keywords ?? [],
          paths: row.paths ?? [],
          services: row.services ?? [],
          createdAt: row.createdAt ?? row.created_at,
          lastValidatedAt: row.lastValidatedAt ?? row.last_validated_at,
        })),
      );
      setLive(true);
    } catch {
      setLive(false);
      setSignedIn(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);
  const filtered = useMemo(
    () =>
      experiences.filter(
        (x) =>
          (type === "all" || x.type === type) &&
          `${x.taskSummary} ${x.summary} ${x.keywords.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [experiences, query, type],
  );
  const types = [...new Set(experiences.map((x) => x.type))];
  const verified = experiences.filter(
    (x) => x.confidence === "verified",
  ).length;
  const reuse = experiences.reduce((n, x) => n + x.successfulUses, 0);

  async function open(entry: Experience) {
    setSelected(entry);
    const response = await fetch(
      `${API}/api/experiences/${entry.id}?detail=full`,
      {
        credentials: "include",
      },
    );
    if (response.ok) setSelected(await response.json());
  }

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/api/workspaces`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositoryUrl }),
    });
    if (!response.ok) return;
    const workspace = (await response.json()) as Workspace;
    setRepositoryUrl("");
    setWorkspaceId(workspace.id);
    await load();
  }

  async function requestAccess(workspace: Workspace) {
    const response = await fetch(
      `${API}/api/workspaces/${workspace.id}/access-requests`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reader" }),
      },
    );
    if (response.ok) await load();
  }

  async function decideAccess(
    requestId: string,
    decision: "approved" | "rejected",
  ) {
    const reason =
      decision === "rejected"
        ? window.prompt("Reason visible to the requester (optional)") ||
          undefined
        : undefined;
    const response = await fetch(
      `${API}/api/workspaces/${workspaceId}/access-requests/${requestId}/decision`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      },
    );
    if (response.ok) await load();
  }

  async function createToken() {
    const response = await fetch(`${API}/api/tokens`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Codex" }),
    });
    if (!response.ok) return;
    const created = (await response.json()) as { token: string };
    setNewToken(created.token);
    await load();
  }

  async function revokeToken(tokenId: string) {
    const response = await fetch(`${API}/api/tokens/${tokenId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) await load();
  }

  async function submitAuthentication(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    const response = await fetch(`${API}/auth/${authMode}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        authMode === "signup"
          ? {
              username: authForm.username,
              email: authForm.email,
              password: authForm.password,
            }
          : {
              identifier: authForm.identifier,
              password: authForm.password,
            },
      ),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setAuthError(result.error ?? "Authentication failed");
      return;
    }
    setSignedIn(true);
    await load();
  }

  async function signOut() {
    await fetch(`${API}/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    setExperiences([]);
    setWorkspaces([]);
    setWorkspaceId("");
    setSignedIn(false);
    setView("memory");
  }

  if (signedIn === null) {
    return (
      <main className="auth-screen">
        <BrandLogo />
        <p>Checking authentication…</p>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="auth-screen">
        <BrandLogo />
        <p>Shared repository intelligence for coding agents.</p>
        <div className="auth-tabs">
          <button
            className={authMode === "signin" ? "active" : ""}
            onClick={() => setAuthMode("signin")}
          >
            SIGN IN
          </button>
          <button
            className={authMode === "signup" ? "active" : ""}
            onClick={() => setAuthMode("signup")}
          >
            CREATE ACCOUNT
          </button>
        </div>
        <form className="auth-form" onSubmit={submitAuthentication}>
          {authMode === "signup" ? (
            <>
              <input
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                placeholder="Username"
                value={authForm.username}
                onChange={(event) =>
                  setAuthForm({ ...authForm, username: event.target.value })
                }
              />
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
              />
            </>
          ) : (
            <input
              required
              autoComplete="username"
              placeholder="Username or email"
              value={authForm.identifier}
              onChange={(event) =>
                setAuthForm({ ...authForm, identifier: event.target.value })
              }
            />
          )}
          <input
            required
            type="password"
            minLength={10}
            maxLength={200}
            autoComplete={
              authMode === "signup" ? "new-password" : "current-password"
            }
            placeholder="Password (10+ characters)"
            value={authForm.password}
            onChange={(event) =>
              setAuthForm({ ...authForm, password: event.target.value })
            }
          />
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit">
            {authMode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <div className="noise" />
      <aside>
        <div className="mark">
          <BrandLogo compact />
        </div>
        <nav>
          <button
            className={view === "memory" ? "active" : ""}
            onClick={() => setView("memory")}
            aria-label="Experience memory"
          >
            ⌁<small>Memory</small>
          </button>
          <button
            className={view === "signals" ? "active" : ""}
            onClick={() => setView("signals")}
            aria-label="Questions and incidents"
          >
            ◎<small>Signals</small>
          </button>
          <button
            className={view === "access" ? "active" : ""}
            onClick={() => setView("access")}
            aria-label="Workspace access and MCP tokens"
          >
            ◈<small>Access</small>
          </button>
        </nav>
        <div className="pulse" title={live ? "API connected" : "API offline"}>
          <i className={live ? "online" : ""} />
        </div>
      </aside>
      <section className="shell">
        <header>
          <div className="brand-heading">
            <p className="eyebrow">COLLECTIVE REPOSITORY INTELLIGENCE</p>
            <BrandLogo />
          </div>
          <select
            className="repo"
            aria-label="Workspace"
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
          >
            <option value="">Select workspace</option>
            {workspaces
              .filter((workspace) => workspace.role)
              .map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.repository_owner} / {workspace.repository_name}
                </option>
              ))}
          </select>
        </header>
        <form className="workspace-create" onSubmit={createWorkspace}>
          <input
            type="url"
            required
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            placeholder="https://github.com/owner/repository"
            aria-label="Public GitHub repository URL"
          />
          <button type="submit">CREATE WORKSPACE</button>
        </form>
        {workspaces.some((workspace) => !workspace.role) && (
          <div className="workspace-discovery">
            <input
              value={workspaceQuery}
              onChange={(event) => setWorkspaceQuery(event.target.value)}
              placeholder="Find a repository workspace…"
              aria-label="Find a repository workspace"
            />
            {workspaces
              .filter(
                (workspace) =>
                  !workspace.role &&
                  workspace.canonical_key
                    .toLowerCase()
                    .includes(workspaceQuery.toLowerCase()),
              )
              .slice(0, 4)
              .map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => requestAccess(workspace)}
                  disabled={workspace.request_status === "pending"}
                >
                  {workspace.request_status === "pending"
                    ? "Request pending for "
                    : workspace.request_status === "rejected"
                      ? `Rejected${workspace.request_reason ? `: ${workspace.request_reason}` : ""} · Request again for `
                      : "Request access to "}
                  {workspace.repository_owner}/{workspace.repository_name}
                </button>
              ))}
          </div>
        )}
        <div className="metrics">
          <article>
            <label>EXPERIENCES</label>
            <strong>{experiences.length}</strong>
            <small>shared knowledge units</small>
          </article>
          <article>
            <label>VERIFIED</label>
            <strong>{verified}</strong>
            <small>evidence-backed findings</small>
          </article>
          <article>
            <label>SUCCESSFUL REUSE</label>
            <strong>{reuse}</strong>
            <small>investigations avoided</small>
          </article>
          <article className="signal">
            <label>NETWORK</label>
            <strong>{live ? "LIVE" : "OFFLINE"}</strong>
            <small>{experiences.length} repository-scoped entries</small>
          </article>
        </div>
        {view === "memory" && (
          <div className="toolbar">
            <div className="search">
              <span>⌕</span>
              <input
                aria-label="Search experiences"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search errors, paths, workflows, findings…"
              />
            </div>
            <div className="filters">
              <button
                className={type === "all" ? "on" : ""}
                onClick={() => setType("all")}
              >
                ALL
              </button>
              {types.map((t) => (
                <button
                  key={t}
                  className={type === t ? "on" : ""}
                  onClick={() => setType(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
        {view === "memory" && (
          <div className="grid">
            <section className="feed">
              <div className="section-title">
                <span>RANKED EXPERIENCE</span>
                <small>{filtered.length} RESULTS · BEST SIGNAL FIRST</small>
              </div>
              {filtered.map((x, i) => (
                <button
                  className="card"
                  onClick={() => open(x)}
                  key={x.id}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className={`kind ${x.type}`}>{icons[x.type] ?? "·"}</div>
                  <div className="card-body">
                    <div>
                      <span className="tag">{x.type}</span>
                      <span className={`state ${x.confidence}`}>
                        {x.confidence}
                      </span>
                    </div>
                    <h3>{x.taskSummary}</h3>
                    <p>{x.summary}</p>
                    <div className="chips">
                      {x.keywords.slice(0, 4).map((k) => (
                        <span key={k}>{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="score">
                    <svg viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="17" />
                      <circle
                        className="fill"
                        cx="21"
                        cy="21"
                        r="17"
                        style={{
                          strokeDashoffset: 107 - 107 * Number(x.rankingScore),
                        }}
                      />
                    </svg>
                    <b>{Math.round(Number(x.rankingScore) * 100)}</b>
                    <small>RANK</small>
                  </div>
                </button>
              ))}
              {!filtered.length && (
                <div className="empty">
                  No shared experience matches this signal.
                </div>
              )}
            </section>
            <section className="activity">
              <div className="section-title">
                <span>AGENT ACTIVITY</span>
                <i className={live ? "online" : ""} />
              </div>
              {experiences.slice(0, 6).map((entry) => (
                <article key={entry.id}>
                  <div className="agent">A</div>
                  <div>
                    <b>{entry.taskSummary}</b>
                    <p>
                      {entry.type} · {entry.revision.slice(0, 8)}
                    </p>
                  </div>
                  <time>
                    {new Date(entry.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </article>
              ))}
              {!experiences.length && (
                <div className="empty small">
                  Agent contributions appear as experiences are saved.
                </div>
              )}
              <div className="flow">
                <p>EXPERIENCE FLYWHEEL</p>
                <div>
                  <span>DISCOVER</span>
                  <b>→</b>
                  <span>APPLY</span>
                  <b>→</b>
                  <span>VERIFY</span>
                  <b>→</b>
                  <span>REINFORCE</span>
                </div>
              </div>
            </section>
          </div>
        )}
        {view === "signals" && (
          <section className="view-panel">
            <div className="section-title">
              <span>COLLABORATION SIGNALS</span>
              <small>QUESTIONS · ANSWERS · INCIDENTS</small>
            </div>
            <div className="signal-grid">
              {experiences
                .filter((x) =>
                  ["question", "answer", "incident"].includes(x.type),
                )
                .map((x, i) => (
                  <button
                    className="signal-card"
                    key={x.id}
                    onClick={() => open(x)}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className={`kind ${x.type}`}>{icons[x.type]}</div>
                    <span className="tag">{x.type}</span>
                    <h3>{x.taskSummary}</h3>
                    <p>{x.summary}</p>
                  </button>
                ))}
              {!experiences.some((x) =>
                ["question", "answer", "incident"].includes(x.type),
              ) && (
                <div className="empty">
                  No open questions or incidents. The repository network is
                  quiet.
                </div>
              )}
            </div>
          </section>
        )}
        {view === "access" && (
          <section className="view-panel access-panel">
            <div className="section-title">
              <span>ACCESS REQUESTS</span>
              <div>
                <small>
                  {
                    accessRequests.filter(
                      (request) => request.status === "pending",
                    ).length
                  }{" "}
                  PENDING
                </small>
                <button className="sign-out" onClick={signOut}>
                  SIGN OUT
                </button>
              </div>
            </div>
            {accessRequests.map((request) => (
              <article className="access-row" key={request.id}>
                <div>
                  <b>@{request.username ?? request.display_name}</b>
                  <p>
                    {request.requested_role} · {request.message || "No message"}
                  </p>
                </div>
                <span>{request.status}</span>
                {request.status === "pending" && (
                  <div>
                    <button
                      onClick={() => decideAccess(request.id, "approved")}
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => decideAccess(request.id, "rejected")}
                    >
                      REJECT
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!accessRequests.length && (
              <div className="empty">
                No access requests for this workspace.
              </div>
            )}
            <div className="section-title token-title">
              <span>MEMBERS</span>
              <small>{members.length} ACTIVE</small>
            </div>
            {members.map((member) => (
              <article className="access-row" key={member.id}>
                <div>
                  <b>@{member.username ?? member.display_name}</b>
                  <p>{member.display_name}</p>
                </div>
                <span>{member.role}</span>
              </article>
            ))}
            <div className="section-title token-title">
              <span>MCP TOKENS</span>
              <button onClick={createToken}>CREATE TOKEN</button>
            </div>
            {newToken && (
              <div className="token-once">
                <b>Copy this token now. It will not be shown again.</b>
                <code>{newToken}</code>
              </div>
            )}
            {tokens.map((token) => (
              <article className="access-row" key={token.id}>
                <div>
                  <b>{token.name}</b>
                  <p>
                    {token.token_prefix}…{token.token_last_four}
                  </p>
                </div>
                <span>{token.revoked_at ? "revoked" : "active"}</span>
                {!token.revoked_at && (
                  <button onClick={() => revokeToken(token.id)}>REVOKE</button>
                )}
              </article>
            ))}
          </section>
        )}
      </section>
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <article className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>
            <p className="eyebrow">
              {selected.type} · {selected.confidence}
            </p>
            <h2>{selected.taskSummary}</h2>
            <p className="lead">{selected.summary}</p>
            {selected.detail && (
              <>
                <h4>FULL EXPERIENCE</h4>
                <pre>{selected.detail}</pre>
              </>
            )}
            <h4>RETRIEVAL SIGNALS</h4>
            <div className="chips">
              {selected.keywords.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            <dl>
              <dt>REVISION</dt>
              <dd>{selected.revision}</dd>
              <dt>SUCCESSFUL USES</dt>
              <dd>{selected.successfulUses}</dd>
              <dt>STATUS</dt>
              <dd>{selected.status}</dd>
            </dl>
          </article>
        </div>
      )}
    </main>
  );
}
