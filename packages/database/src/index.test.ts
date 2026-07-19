import { describe, expect, it } from "vitest";
import { calculateRanking } from "./index.js";

describe("calculateRanking", () => {
  it("rewards verified successful current experience", () => {
    const strong = calculateRanking({
      successfulUses: 5,
      failedUses: 0,
      confidence: "verified",
      status: "current",
      ageDays: 2,
    });
    const weak = calculateRanking({
      successfulUses: 0,
      failedUses: 3,
      confidence: "candidate",
      status: "stale",
      ageDays: 300,
    });
    expect(strong).toBeGreaterThan(weak);
  });
});
