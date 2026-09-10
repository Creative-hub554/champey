import { describe, expect, it } from "vitest";
import { FLORA_REACTIONS, isFloraReactionKey, floraReactionLabel } from "./flora-reactions";

/*
 * Flora reaction set invariants: keys stay within the backend ReactDto
 * contract (1–8 chars emoji string) and every reaction is labeled in both
 * catalogs so the picker is accessible.
 */

describe("flora reactions", () => {
  it("has five flower-styled reactions including love and disgust", () => {
    expect(FLORA_REACTIONS).toHaveLength(5);
    const keys = FLORA_REACTIONS.map((r) => r.key);
    expect(keys).toContain("💗"); // love
    expect(keys).toContain("🤢"); // disgusting
    expect(keys).toContain("🌸"); // bloom
    expect(new Set(keys).size).toBe(5);
  });

  it("keys fit the backend ReactDto contract (1–8 chars)", () => {
    for (const r of FLORA_REACTIONS) {
      expect(r.key.length, r.key).toBeGreaterThanOrEqual(1);
      expect(r.key.length, r.key).toBeLessThanOrEqual(8);
    }
  });

  it("validates keys and falls back to the raw emoji for unknown ones", () => {
    expect(isFloraReactionKey("🌸")).toBe(true);
    expect(isFloraReactionKey("👍")).toBe(false);
    expect(floraReactionLabel("🌸")).toBe("Love this bloom");
    expect(floraReactionLabel("👍")).toBe("👍");
  });

  it("labels exist in both message catalogs", async () => {
    const en = (await import("../../messages/en.json")).default as Record<
      string,
      Record<string, string>
    >;
    const km = (await import("../../messages/km.json")).default as Record<
      string,
      Record<string, string>
    >;
    expect(en.floraReactions.react).toBeTruthy();
    expect(km.floraReactions.react).toBeTruthy();
    for (const r of FLORA_REACTIONS) {
      expect(en.floraReactions[r.labelKey], `en.${r.labelKey}`).toBeTruthy();
      expect(km.floraReactions[r.labelKey], `km.${r.labelKey}`).toBeTruthy();
    }
  });
});
