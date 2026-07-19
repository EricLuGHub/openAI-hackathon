"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
type Session = {
  id: string;
  task: string;
  status: string;
  revision: string;
  startedAt: string;
  outcome?: string;
};

const API =
  process.env.NEXT_PUBLIC_AGENT_HADERACH_API_URL ?? "http://127.0.0.1:3001";
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

export default function Dashboard() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Experience | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, s] = await Promise.all([
        fetch(`${API}/api/experiences`),
        fetch(`${API}/api/sessions`),
      ]);
      if (!e.ok || !s.ok) throw new Error("offline");
      setExperiences(await e.json());
      setSessions(await s.json());
      setLive(true);
    } catch {
      setLive(false);
    }
  }, []);

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
    );
    if (response.ok) setSelected(await response.json());
  }

  return (
    <main>
      <div className="noise" />
      <aside>
        <div className="mark">
          <span>AH</span>
        </div>
        <nav>
          <button className="active">
            ⌁<small>Memory</small>
          </button>
          <button>
            ◫<small>Sessions</small>
          </button>
          <button>
            ◎<small>Signals</small>
          </button>
        </nav>
        <div className="pulse" title={live ? "API connected" : "API offline"}>
          <i className={live ? "online" : ""} />
        </div>
      </aside>
      <section className="shell">
        <header>
          <div>
            <p className="eyebrow">COLLECTIVE REPOSITORY INTELLIGENCE</p>
            <h1>
              Agent <em>Haderach</em>
            </h1>
          </div>
          <div className="repo">
            <span>acme / checkout</span>
            <b>⌄</b>
          </div>
        </header>
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
            <small>
              {sessions.filter((s) => s.status === "active").length} active
              agent sessions
            </small>
          </article>
        </div>
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
            {sessions.slice(0, 6).map((s) => (
              <article key={s.id}>
                <div className="agent">A</div>
                <div>
                  <b>{s.task}</b>
                  <p>
                    {s.status} · {s.revision.slice(0, 8)}
                  </p>
                </div>
                <time>
                  {new Date(s.startedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </article>
            ))}
            {!sessions.length && (
              <div className="empty small">
                Sessions appear when agents connect.
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
