import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  generatePersonalToken,
  hashPersonalToken,
  readBearerToken,
} from "./personal-tokens.js";

describe("personal MCP tokens", () => {
  it("generates a high-entropy token and stores only its digest metadata", () => {
    const generated = generatePersonalToken();
    expect(generated.token).toMatch(/^ahd_pat_[A-Za-z0-9_-]{43}$/);
    expect(generated.hash).toHaveLength(64);
    expect(generated.hash).toBe(hashPersonalToken(generated.token));
    expect(generated.hash).not.toContain(generated.token);
    expect(generated.lastFour).toBe(generated.token.slice(-4));
  });

  it("generates unique tokens", () => {
    expect(generatePersonalToken().token).not.toBe(
      generatePersonalToken().token,
    );
  });

  it("accepts only Haderach bearer tokens", () => {
    const token = generatePersonalToken().token;
    expect(readBearerToken(`Bearer ${token}`)).toBe(token);
    expect(() => readBearerToken(undefined)).toThrow(AuthenticationError);
    expect(() => readBearerToken("Basic abc")).toThrow(AuthenticationError);
    expect(() => readBearerToken("Bearer unrelated-secret")).toThrow(
      AuthenticationError,
    );
  });
});
