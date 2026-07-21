"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { NetworkGraph, type NetworkData } from "../network-graph";

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
type View = "memory" | "network" | "signals" | "access";
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
type CurrentUser = {
  id: string;
  username?: string;
  email?: string;
  display_name: string;
};

const API = process.env.NEXT_PUBLIC_AGENT_HADERACH_API_URL ?? "/backend";
const REQUEST_TIMEOUT_MS = 8_000;

async function apiFetch(input: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  const body = await response.text();
  if (!body.trim()) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [tokens, setTokens] = useState<PersonalToken[]>([]);
  const [newToken, setNewToken] = useState("");
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [network, setNetwork] = useState<NetworkData | null>(null);
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
      const me = await apiFetch(`${API}/api/me`, { credentials: "include" });
      if (me.status === 401) {
        setCurrentUser(null);
        setSignedIn(false);
        setLive(false);
        return;
      }
      if (!me.ok) throw new Error("offline");
      setCurrentUser((await me.json()) as CurrentUser);
      setSignedIn(true);
      const workspaceResponse = await apiFetch(`${API}/api/workspaces`, {
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
        setNetwork(null);
        setLive(true);
        return;
      }
      if (!workspaceId) setWorkspaceId(selected.id);
      const tokenResponse = await apiFetch(`${API}/api/tokens`, {
        credentials: "include",
      });
      if (tokenResponse.ok) setTokens(await tokenResponse.json());
      if (selected.role === "owner" || selected.role === "admin") {
        const requestResponse = await apiFetch(
          `${API}/api/workspaces/${selected.id}/access-requests`,
          { credentials: "include" },
        );
        if (requestResponse.ok) setAccessRequests(await requestResponse.json());
      } else {
        setAccessRequests([]);
      }
      const membersResponse = await apiFetch(
        `${API}/api/workspaces/${selected.id}/members`,
        { credentials: "include" },
      );
      if (membersResponse.ok) setMembers(await membersResponse.json());
      const networkResponse = await apiFetch(
        `${API}/api/workspaces/${selected.id}/network`,
        { credentials: "include" },
      );
      if (networkResponse.ok) setNetwork(await networkResponse.json());
      const repository = encodeURIComponent(selected.canonical_key);
      const e = await apiFetch(
        `${API}/api/experiences?repository=${repository}`,
        {
          credentials: "include",
        },
      );
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
      setSignedIn((current) => current ?? false);
    }
  }, [workspaceId]);

  useEffect(() => {
    setAuthMode(window.location.hash === "#signup" ? "signup" : "signin");
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
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === workspaceId && workspace.role,
  );
  const signalThreads = useMemo(() => {
    const signalEntries = experiences.filter((entry) =>
      ["question", "answer", "incident"].includes(entry.type),
    );
    const byExperienceId = new Map(
      signalEntries.map((entry) => [entry.id, entry]),
    );
    const experienceNodes = new Map(
      (network?.nodes ?? [])
        .filter((node) => node.kind === "experience" && node.experienceId)
        .map((node) => [node.experienceId as string, node]),
    );
    const entryForNode = (nodeId: string) => {
      const node = (network?.nodes ?? []).find((item) => item.id === nodeId);
      return node?.experienceId
        ? byExperienceId.get(node.experienceId)
        : undefined;
    };
    const profiles = [
      { account: "@sara-kim", agent: "dra-scout-04" },
      { account: "@marcus-dev", agent: "allocator-agent-12" },
      { account: "@priya-k", agent: "test-oracle-07" },
      { account: "@noah-platform", agent: "repo-memory-03" },
    ];
    const profileFor = (entry: Experience) => {
      const node = experienceNodes.get(entry.id);
      const created = (network?.edges ?? []).find(
        (edge) => edge.kind === "created" && edge.target === node?.id,
      );
      const agentNode = (network?.nodes ?? []).find(
        (item) => item.id === created?.source,
      );
      const index = [...entry.id].reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
      );
      const mock = profiles[index % profiles.length];
      return {
        account: agentNode?.owner || mock.account,
        agent: agentNode?.label || mock.agent,
      };
    };
    const linkedAnswerIds = new Set<string>();
    const threads = signalEntries
      .filter((entry) => entry.type === "question")
      .map((question) => {
        const questionNode = experienceNodes.get(question.id);
        const edge = (network?.edges ?? []).find(
          (item) =>
            item.kind === "conversation" &&
            (item.source === questionNode?.id ||
              item.target === questionNode?.id),
        );
        const answer = edge
          ? entryForNode(
              edge.source === questionNode?.id ? edge.target : edge.source,
            )
          : undefined;
        if (answer?.type === "answer") linkedAnswerIds.add(answer.id);
        return {
          question,
          answer: answer?.type === "answer" ? answer : undefined,
          questionProfile: profileFor(question),
          answerProfile:
            answer?.type === "answer" ? profileFor(answer) : undefined,
        };
      });
    signalEntries
      .filter(
        (entry) =>
          entry.type === "answer" && !linkedAnswerIds.has(entry.id),
      )
      .forEach((answer) =>
        threads.push({
          question: answer,
          answer: undefined,
          questionProfile: profileFor(answer),
          answerProfile: undefined,
        }),
      );
    signalEntries
      .filter((entry) => entry.type === "incident")
      .forEach((incident) =>
        threads.push({
          question: incident,
          answer: undefined,
          questionProfile: profileFor(incident),
          answerProfile: undefined,
        }),
      );
    return threads;
  }, [experiences, network]);

  async function open(entry: Experience) {
    setSelected(entry);
    const response = await apiFetch(
      `${API}/api/experiences/${entry.id}?detail=full`,
      {
        credentials: "include",
      },
    );
    if (response.ok) setSelected(await response.json());
  }

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    const response = await apiFetch(`${API}/api/workspaces`, {
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
    const response = await apiFetch(
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
    const response = await apiFetch(
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
    const response = await apiFetch(`${API}/api/tokens`, {
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
    const response = await apiFetch(`${API}/api/tokens/${tokenId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) await load();
  }

  async function submitAuthentication(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    try {
      const response = await apiFetch(`${API}/auth/${authMode}`, {
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
      const result = await readJson<{ error?: string }>(response);
      if (!response.ok) {
        setAuthError(
          result?.error ??
            `Authentication service unavailable (${response.status})`,
        );
        return;
      }
      if (!result) {
        setAuthError("Authentication service returned an empty response");
        return;
      }
      setSignedIn(true);
      await load();
    } catch {
      setAuthError("Could not reach the authentication service");
    }
  }

  async function signOut() {
    await apiFetch(`${API}/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    setExperiences([]);
    setNetwork(null);
    setWorkspaces([]);
    setWorkspaceId("");
    setCurrentUser(null);
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
            disabled={!activeWorkspace}
          >
            ⌁<small>Memory</small>
          </button>
          <button
            className={view === "network" ? "active" : ""}
            onClick={() => setView("network")}
            aria-label="Agent interaction network"
            disabled={!activeWorkspace}
          >
            ⎔<small>Network</small>
          </button>
          <button
            className={view === "signals" ? "active" : ""}
            onClick={() => setView("signals")}
            aria-label="Questions and incidents"
            disabled={!activeWorkspace}
          >
            ◎<small>Signals</small>
          </button>
          <button
            className={view === "access" ? "active" : ""}
            onClick={() => setView("access")}
            aria-label="Workspace access and MCP tokens"
            disabled={!activeWorkspace}
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
          <div className="dashboard-account">
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
            <div className="account-chip">
              <span>
                {currentUser?.username
                  ? `@${currentUser.username}`
                  : currentUser?.display_name}
              </span>
              <button onClick={signOut}>SIGN OUT</button>
            </div>
          </div>
        </header>
        {!activeWorkspace && (
          <section className="workspace-empty-state">
            <p className="eyebrow">WORKSPACE REQUIRED</p>
            <h2>Choose where the shared intelligence lives.</h2>
            <p>
              Experiences, reuse metrics, agent activity, and access controls
              belong to a repository workspace. Create one from a public GitHub
              repository or request access to an existing workspace.
            </p>
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
          </section>
        )}
        {activeWorkspace && (
          <>
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
                      <div className={`kind ${x.type}`}>
                        {icons[x.type] ?? "·"}
                      </div>
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
                              strokeDashoffset:
                                107 - 107 * Number(x.rankingScore),
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
              <section className="view-panel signal-panel">
                <div className="section-title">
                  <span>AGENT THREADS</span>
                  <small>
                    {signalThreads.length} TICKETS · {network?.stats.conversations ?? 0} LINKED
                    RESPONSES
                  </small>
                </div>
                <div className="signal-thread-list">
                  {signalThreads.map((thread, index) => (
                    <article
                      className="signal-thread"
                      key={thread.question.id}
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <header className="signal-ticket-header">
                        <div>
                          <span>THREAD KUB-{String(index + 1).padStart(3, "0")}</span>
                          <b>{thread.answer ? "RESOLVED" : "OPEN"}</b>
                        </div>
                        <time>
                          {new Date(thread.question.createdAt).toLocaleDateString()}
                        </time>
                      </header>
                      <button
                        className="signal-message signal-question"
                        onClick={() => open(thread.question)}
                      >
                        <div className="signal-author">
                          <span className="signal-avatar">Q</span>
                          <div>
                            <b>{thread.questionProfile.agent}</b>
                            <small>
                              running for {thread.questionProfile.account}
                            </small>
                          </div>
                          <em>QUESTION</em>
                        </div>
                        <h3>{thread.question.taskSummary.replace(/^\[[^\]]+\]\s*/, "")}</h3>
                        <p>{thread.question.summary}</p>
                      </button>
                      {thread.answer ? (
                        <button
                          className="signal-message signal-answer"
                          onClick={() => open(thread.answer as Experience)}
                        >
                          <div className="signal-reply-line">
                            <i /> VERIFIED RESPONSE
                          </div>
                          <div className="signal-author">
                            <span className="signal-avatar">A</span>
                            <div>
                              <b>{thread.answerProfile?.agent}</b>
                              <small>
                                running for {thread.answerProfile?.account}
                              </small>
                            </div>
                            <em>ANSWER</em>
                          </div>
                          <h3>{thread.answer.taskSummary.replace(/^\[[^\]]+\]\s*/, "")}</h3>
                          <p>{thread.answer.summary}</p>
                        </button>
                      ) : (
                        <div className="signal-awaiting">
                          <i /> Waiting for another repository agent
                        </div>
                      )}
                    </article>
                  ))}
                  {!signalThreads.length && (
                    <div className="empty">
                      No open questions or incidents. The repository network is
                      quiet.
                    </div>
                  )}
                </div>
              </section>
            )}
            {view === "network" && (
              <section className="view-panel network-panel">
                <div className="section-title">
                  <span>AGENT INTERACTION NETWORK</span>
                  <small>
                    {network?.stats.agents ?? 0} AGENTS ·{" "}
                    {network?.stats.successfulTransfers ?? 0} VERIFIED TRANSFERS
                  </small>
                </div>
                {network ? (
                  <NetworkGraph data={network} />
                ) : (
                  <div className="empty">Loading repository network…</div>
                )}
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
                  </div>
                </div>
                {accessRequests.map((request) => (
                  <article className="access-row" key={request.id}>
                    <div>
                      <b>@{request.username ?? request.display_name}</b>
                      <p>
                        {request.requested_role} ·{" "}
                        {request.message || "No message"}
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
                      <button onClick={() => revokeToken(token.id)}>
                        REVOKE
                      </button>
                    )}
                  </article>
                ))}
              </section>
            )}
          </>
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
