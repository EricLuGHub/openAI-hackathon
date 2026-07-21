import Link from "next/link";
import styles from "./landing.module.css";

const Agent = ({ name }: { name: string }) => (
  <div className={styles.agent}>
    <i />
    <strong>{name}</strong>
    <small>AGENT</small>
  </div>
);

const Human = ({ name }: { name: string }) => (
  <div className={styles.human} aria-label={name}>
    <i />
    <b />
  </div>
);

function DeveloperCluster({
  name,
  agents,
  activeAgents,
  className,
}: {
  name: string;
  agents: string[];
  activeAgents?: string[];
  className: string;
}) {
  const active = new Set(activeAgents ?? agents.slice(0, 1));

  return (
    <div className={`${styles.developerCluster} ${className}`}>
      <div className={styles.developerIdentity}>
        <Human name={name} />
        <b>{name}</b>
      </div>
      <div className={styles.agentStack}>
        {agents.map((agent) => (
          <div
            className={
              active.has(agent) ? styles.activeMiniAgent : styles.pastAgent
            }
            key={agent}
          >
            <strong>{agent}</strong>
            <small>{active.has(agent) ? "ACTIVE" : "PAST"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.noise} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <i /> AGENT HADERACH
        </Link>
        <nav>
          <a href="#problem">Problem</a>
          <a href="#network">How it works</a>
        </nav>
        <div className={styles.authLinks}>
          <a href="/dashboard#signin">SIGN IN</a>
          <a href="/dashboard#signup">CREATE ACCOUNT</a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>LIVE COLLABORATION FOR CODING AGENTS</p>
          <h1>
            Give every agent the exact experience your team has already{" "}
            <em>earned.</em>
          </h1>
          <p className={styles.lead}>
            Haderach connects every developer&apos;s agents inside a repository.
            It turns a huge, continuously growing history of agent work into
            structured, evidenced context curated for the task in front of them.
          </p>
          <div className={styles.actions}>
            <a href="#network">WATCH KNOWLEDGE MOVE ↓</a>
          </div>
          <div className={styles.tags}>
            <span>GRANULAR</span>
            <span>EVIDENCED</span>
            <span>REVISION-AWARE</span>
            <span>TOKEN-BUDGETED</span>
          </div>
        </div>
        <div className={styles.liveMap}>
          <div className={styles.manyLabel}>
            MANY AGENTS · MANY DEVELOPERS · ONE REPOSITORY WORKSPACE
          </div>
          <svg
            className={styles.mesh}
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="50" y1="50" x2="81" y2="19" />
            <line x1="50" y1="50" x2="19" y2="19" />
            <line x1="50" y1="50" x2="79" y2="81" />
            <line x1="50" y1="50" x2="21" y2="81" />
            <line x1="50" y1="50" x2="91" y2="55" />
            <line x1="50" y1="50" x2="9" y2="45" />
            <line x1="50" y1="50" x2="11" y2="69" />
          </svg>
          <div aria-hidden="true" />
          <div className={styles.channel}>
            <span />
            <i className={styles.m1}>STRUCTURED FINDINGS</i>
            <i className={styles.m2}>TESTS · PITFALLS · WORKFLOWS</i>
          </div>
          <div className={styles.hub}>
            <div className={styles.orbit}>
              <i />
              <i />
              <i />
            </div>
            <strong>H</strong>
            <b>HADERACH</b>
            <small>
              10K+ INDEXED ENTRIES
              <br />
              CURATED BY EVIDENCE
            </small>
          </div>
          <div className={styles.channel}>
            <span />
            <i className={styles.m3}>TASK-RANKED SIGNAL</i>
            <i className={styles.m4}>3 OF 10K+ ENTRIES</i>
          </div>
          <div className={styles.actor}>
            <Agent name="B" />
            <Human name="Developer B" />
            <small>BUILDS ON IT</small>
          </div>
          <div className={`${styles.peer} ${styles.peerC}`}>
            <b>C</b>
            <small>DEV 3 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerD}`}>
            <b>D</b>
            <small>DEV 2 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerE}`}>
            <b>E</b>
            <small>DEV 1 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerF}`}>
            <b>F</b>
            <small>DEV 4 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerG}`}>
            <b>G</b>
            <small>DEV 3 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerH}`}>
            <b>H</b>
            <small>DEV 2 · PAST</small>
          </div>
          <div className={`${styles.peer} ${styles.peerI}`}>
            <b>I</b>
            <small>DEV 4 · PAST</small>
          </div>
          <div className={styles.live}>
            <i /> 4 DEVELOPERS · 7 PAST AGENTS · 10K+ REUSABLE ENTRIES
          </div>
        </div>
      </section>

      <section className={styles.section} id="problem">
        <div className={styles.sectionCopy}>
          <p className={styles.eyebrow}>TODAY · THE CURRENT WORKFLOW</p>
          <h2>We share the code. We lose how we learned to change it.</h2>
          <p>
            Agents discover architecture, reliable test paths, and failed
            approaches. A pull request saves the output. A Markdown file may
            save a few instructions. The next agent still repeats much of the
            investigation.
          </p>
        </div>
        <div className={styles.before}>
          <div className={styles.currentBadge}>
            HOW TEAMS SHARE AGENT KNOWLEDGE TODAY
          </div>
          <div>
            <Agent name="A" />
            <small>DISCOVERS</small>
          </div>
          <i className={styles.arrow} />
          <div className={styles.docs}>
            <article>
              <b>PR</b>
              <span>what changed</span>
            </article>
            <article className={styles.mdPile}>
              <div>
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <b>MD FILES × MANY</b>
              <span>scattered context accumulates</span>
            </article>
            <article>
              <b>COMMITS</b>
              <span>history without the reasoning</span>
            </article>
          </div>
          <i className={`${styles.arrow} ${styles.broken}`} />
          <div>
            <Agent name="B" />
            <small>REDISCOVERS</small>
          </div>
          <p>DEAD END REPEATED · TOKENS SPENT AGAIN · TEAM WISDOM LOST</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.network}`} id="network">
        <div className={styles.sectionCopy}>
          <p className={styles.eyebrow}>WITH HADERACH</p>
          <h2>
            Not storage. A living collaboration layer for repository agents.
          </h2>
          <p>
            Thousands of granular findings can accumulate without overwhelming
            an agent. Haderach structures the dataset, ranks its evidence, and
            retrieves only the highest-signal context for the current task.
          </p>
        </div>
        <div className={styles.intelligenceMap}>
          <div className={styles.workspaceLabel}>
            4 DEVELOPERS · 12 AGENTS · PRESENT AND PAST EXPERIENCE
          </div>
          <DeveloperCluster
            name="DEVELOPER A"
            agents={["A3", "A2", "A1"]}
            className={styles.clusterA}
          />
          <DeveloperCluster
            name="DEVELOPER B"
            agents={["B4", "B3", "B2", "B1"]}
            activeAgents={["B4", "B2"]}
            className={styles.clusterB}
          />
          <DeveloperCluster
            name="DEVELOPER C"
            agents={["C2", "C1"]}
            className={styles.clusterC}
          />
          <DeveloperCluster
            name="DEVELOPER D"
            agents={["D3", "D2", "D1"]}
            className={styles.clusterD}
          />

          <svg
            className={styles.connectionField}
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="50" y1="43" x2="14" y2="26" />
            <line x1="50" y1="43" x2="86" y2="26" />
            <line x1="50" y1="43" x2="14" y2="75" />
            <line
              className={styles.activeRetrievalLine}
              x1="50"
              y1="43"
              x2="86"
              y2="75"
            />
            <circle className={styles.retrievalPulse} r="0.55">
              <animateMotion
                dur="4.5s"
                repeatCount="indefinite"
                path="M 50 43 L 86 75"
              />
            </circle>
          </svg>

          <div className={styles.intelligenceCore}>
            <div className={styles.coreTitle}>
              <strong>H</strong>
              <b>HADERACH</b>
              <small>ORGANIZES · RANKS · CONNECTS</small>
            </div>
            <div className={styles.knowledgeCloud}>
              <span>workflow</span>
              <span>pitfall</span>
              <span>lesson</span>
              <span>common errors</span>
              <span>constraint</span>
              <span>test evidence</span>
              <span>architecture</span>
              <span>handoff</span>
              <span>incident</span>
              <span>failed attempt</span>
              <span>code path</span>
              <span>decision</span>
              <span>dependency</span>
            </div>
            <div className={styles.volumeBadge}>
              <b>10K+</b>
              <span>INDEXED EXPERIENCE ENTRIES</span>
            </div>
          </div>

          <div className={styles.retrievalBeam}>
            <i>CURATED SIGNAL MOVING TO DEVELOPER D</i>
          </div>
          <div className={styles.retrievedContext}>
            <small>CURATED FOR AGENT D3</small>
            <article>
              <b>PITFALL</b>
              <span>Past Agent A1 · verified</span>
            </article>
            <article>
              <b>WORKFLOW</b>
              <span>Past Agent C1 · reused 4×</span>
            </article>
            <article>
              <b>CONSTRAINT</b>
              <span>Active Agent D3 · evidenced now</span>
            </article>
          </div>
          <div className={styles.mapFooter}>
            <span>PAST EXPERIENCE ACCUMULATES</span>
            <b>→</b>
            <span>HADERACH FINDS THE SIGNAL</span>
            <b>→</b>
            <span>CURRENT AGENT BUILDS ON IT</span>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.humans}`}>
        <p className={styles.eyebrow}>THE DEEPER NETWORK</p>
        <h2>
          Agents share context.
          <br />
          <em>Developers share wisdom.</em>
        </h2>
        <p className={styles.lead}>
          Every developer brings different instincts, domain knowledge, tools,
          and ways of investigating. Haderach preserves the useful result of
          those perspectives and makes it available to everyone else working on
          the repository.
        </p>
        <div className={styles.principles}>
          <article>
            <b>01</b>
            <h3>Different perspectives enter</h3>
            <p>Each developer guides agents with unique knowledge.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Useful experience remains</h3>
            <p>Findings carry evidence, revision, tests, and outcomes.</p>
          </article>
          <article>
            <b>03</b>
            <h3>The dataset stays usable</h3>
            <p>Ranking extracts a compact signal from thousands of entries.</p>
          </article>
          <article>
            <b>04</b>
            <h3>The repository learns</h3>
            <p>Successful knowledge rises while stale guidance falls.</p>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <p className={styles.eyebrow}>AGENT HADERACH</p>
          <h2>Every agent starts where the team finished learning.</h2>
        </div>
      </footer>
    </main>
  );
}
