import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  verifyPassword,
} from "./local-auth.js";

describe("local accounts", () => {
  it("normalizes usernames and email addresses", () => {
    expect(normalizeUsername(" Agent_User ")).toBe("agent_user");
    expect(normalizeEmail(" Developer@Example.COM ")).toBe(
      "developer@example.com",
    );
  });

  it("rejects invalid usernames and email addresses", () => {
    expect(() => normalizeUsername("a")).toThrow();
    expect(() => normalizeEmail("not-an-email")).toThrow();
  });

  it("hashes and verifies passwords without storing plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
