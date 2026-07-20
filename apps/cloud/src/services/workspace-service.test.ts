import { describe, expect, it } from "vitest";
import { parseGitHubRepositoryUrl } from "./workspace-service.js";

describe("parseGitHubRepositoryUrl", () => {
  it("normalizes a public repository URL", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/OpenAI/Codex.git"),
    ).toEqual({
      owner: "OpenAI",
      name: "Codex",
      canonicalKey: "github:openai/codex",
      remoteUrl: "https://github.com/OpenAI/Codex",
    });
  });

  it("rejects non-GitHub and nested URLs", () => {
    expect(() => parseGitHubRepositoryUrl("https://example.com/a/b")).toThrow();
    expect(() =>
      parseGitHubRepositoryUrl("https://github.com/a/b/issues"),
    ).toThrow();
  });
});
