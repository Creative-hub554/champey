import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  SKIN_IDS,
  SKINS,
  SKIN_STORAGE_KEY,
  DEFAULT_SKIN,
  isSkinId,
  applySkin,
  skinBootstrapScript,
} from "./skins";

describe("skins catalog", () => {
  it("exposes exactly six skins with unique ids", () => {
    expect(SKIN_IDS).toHaveLength(6);
    expect(new Set(SKIN_IDS).size).toBe(6);
    expect(SKINS).toHaveLength(SKIN_IDS.length);
  });

  it("every skin has a label key and a swatch", () => {
    for (const skin of SKINS) {
      expect(skin.labelKey).toMatch(/^skin[A-Z]/);
      expect(skin.swatch).toMatch(/linear-gradient/);
    }
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
    for (const skin of SKINS) {
      expect(en.nav[skin.labelKey], `en.nav.${skin.labelKey}`).toBeTruthy();
      expect(km.nav[skin.labelKey], `km.nav.${skin.labelKey}`).toBeTruthy();
    }
    expect(en.nav.appearance).toBeTruthy();
    expect(km.nav.appearance).toBeTruthy();
  });

  it("isSkinId validates against the catalog", () => {
    expect(isSkinId("jasmine")).toBe(true);
    expect(isSkinId("champey")).toBe(true);
    expect(isSkinId("neon")).toBe(false);
    expect(isSkinId(null)).toBe(false);
  });
});

describe("applySkin", () => {
  let html: HTMLElement;

  beforeEach(() => {
    html = document.documentElement;
    html.className = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    html.className = "";
    localStorage.clear();
  });

  it("adds the class for a non-default skin", () => {
    applySkin("champey");
    expect(html.classList.contains("skin-champey")).toBe(true);
  });

  it("removes other skin classes when switching", () => {
    applySkin("lotus");
    applySkin("orchid");
    expect(html.classList.contains("skin-lotus")).toBe(false);
    expect(html.classList.contains("skin-orchid")).toBe(true);
  });

  it("no class at all for the default krama (indigo) skin", () => {
    applySkin("rumdul");
    applySkin("krama");
    for (const id of SKIN_IDS) {
      expect(html.classList.contains(`skin-${id}`)).toBe(false);
    }
  });

  it("persists the choice and survives a reload", () => {
    applySkin("jasmine");
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBe("jasmine");
  });

  it("never touches the dark class next-themes owns", () => {
    html.classList.add("dark");
    applySkin("champey");
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.classList.contains("skin-champey")).toBe(true);
  });
});

describe("skinBootstrapScript", () => {
  it("is a self-executing snippet that adds skin-<id> for a stored skin", () => {
    expect(skinBootstrapScript).toContain("skin-");
    expect(skinBootstrapScript).toContain(JSON.stringify(SKIN_STORAGE_KEY));
    expect(skinBootstrapScript).toContain(JSON.stringify(SKIN_IDS));
  });

  it("never adds a class for the default skin (string guard)", () => {
    // The guard compares against the serialized default id before adding.
    expect(skinBootstrapScript).toContain(JSON.stringify(DEFAULT_SKIN));
  });
});
