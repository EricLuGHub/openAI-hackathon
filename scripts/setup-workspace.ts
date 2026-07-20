import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Options = {
  target: string;
  repository: string;
  repositoryPath: string;
  apiUrl: string;
  force: boolean;
};

function usage() {
  console.log(`Set up a local Agent Haderach workspace.

Usage:
  pnpm workspace:setup -- [options]

Options:
  --target <path>           Workspace directory (default: workspace)
  --repository <owner/repo> Repository identity (default: local/repository)
  --repository-path <path>  Stable checkout path (default: repos/<repo>/main)
  --api-url <url>           Haderach MCP URL (default: http://127.0.0.1:3001/mcp)
  --force                   Replace generated files; never removes task data
  --help                    Show this help
`);
}

function parseArgs(argv: string[]): Options {
  const values = new Map<string, string>();
  let force = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === "--help") {
      usage();
      process.exit(0);
    }
    if (argument === "--force") {
      force = true;
      continue;
    }
    if (!argument.startsWith("--"))
      throw new Error(`Unexpected argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--"))
      throw new Error(`Missing value for ${argument}`);
    values.set(argument, value);
    index += 1;
  }
  const repository = values.get("--repository") ?? "local/repository";
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository))
    throw new Error("--repository must use owner/repository format");
  const repositoryName = repository.split("/")[1]!;
  return {
    target: values.get("--target") ?? "workspace",
    repository,
    repositoryPath:
      values.get("--repository-path") ?? `repos/${repositoryName}/main`,
    apiUrl: values.get("--api-url") ?? "http://127.0.0.1:3001/mcp",
    force,
  };
}

(async () => {
  const options = parseArgs(
    process.argv.slice(2).filter((argument) => argument !== "--"),
  );
  const root = path.resolve(options.target);
  const directories = [
    "hooks",
    "repos",
    "sessions",
    "tasks/archive",
    "tasks/backlog",
    "tasks/blocked",
    "tasks/deleted",
    "tasks/done",
    "tasks/in-progress",
    "templates",
    "workflows",
    "worktrees",
  ];
  await Promise.all(
    [root, ...directories.map((directory) => path.join(root, directory))].map(
      (directory) => mkdir(directory, { recursive: true }),
    ),
  );

  const files: Record<string, string> = {
    "AGENTS.md": `# Agent Haderach workspace

Before meaningful work:

1. Read the relevant task file and repository instructions.
2. Search Haderach for related workflows, lessons, pitfalls, and questions.
3. Create an isolated worktree when parallel or risky work requires it.

During work, save evidence-backed findings and publish blockers as questions.
When reusing experience, verify it against the current revision before recording
feedback. Never store raw chain-of-thought, credentials, or MCP tokens here.

Before completion, run the relevant checks, update the task outcome, record
usefulness feedback, and save only genuinely reusable experience.
`,
    "config.yaml": `workspace: agent-haderach
repository: ${options.repository}
repository_path: ${options.repositoryPath}
experience_service:
  transport: http
  url: ${options.apiUrl}
defaults:
  token_budget: 800
  result_limit: 5
  grooming_interval_minutes: 60
directories:
  repositories: repos
  worktrees: worktrees
  tasks: tasks
  sessions: sessions
`,
    "templates/task.md": `---
id: task_ID
title: Replace with a concise task title
status: backlog
worktree: null
created_at: YYYY-MM-DDTHH:MM:SSZ
updated_at: YYYY-MM-DDTHH:MM:SSZ
blocked_by: []
---

## Human description

## Goal

## Current state

## Evidence

## Next step
`,
    "templates/handoff.md": `# Handoff

## Current understanding

## Actions attempted

## Evidence

## Changed files or worktree

## Blockers and unanswered questions

## Recommended next step
`,
    "hooks/README.md": `# Agent notification hooks

The Haderach MCP tool \`wait_for_answer\` can keep an active agent request open
and return shortly after another agent links an answer to its question. MCP alone
cannot wake an agent process after its turn has ended.

For background wake-ups, connect a future Haderach webhook to a trusted local
supervisor or Codex automation. Keep \`AGENT_HADERACH_TOKEN\` in the environment;
never write it into this directory.
`,
  };

  async function writeGenerated(relativePath: string, content: string) {
    const destination = path.join(root, relativePath);
    if (!options.force) {
      try {
        await readFile(destination);
        return "kept";
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf8");
    return "written";
  }

  let written = 0;
  let kept = 0;
  for (const [relativePath, content] of Object.entries(files)) {
    const result = await writeGenerated(relativePath, content);
    if (result === "written") written += 1;
    else kept += 1;
  }
  for (const directory of directories.filter((value) =>
    value.startsWith("tasks/"),
  )) {
    await writeGenerated(path.join(directory, ".gitkeep"), "");
  }

  console.log(`Agent Haderach workspace ready at ${root}`);
  console.log(
    `Generated ${written} file(s); preserved ${kept} existing file(s).`,
  );
  console.log(
    "Set AGENT_HADERACH_TOKEN in your environment before connecting an agent.",
  );
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
