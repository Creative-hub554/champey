import { describe, expect, it, vi } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string): string =>
      `nav.${key}`,
}));

vi.mock("@/lib/skins", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/skins")>();
  return { ...actual };
});

import { SkinSwitcher, SkinSwatchRow } from "./SkinSwitcher";

describe("SkinSwitcher", () => {
  it("renders a stable placeholder before mount (SSR-safe)", () => {
    const html = renderToStaticMarkup(createElement(SkinSwitcher));
    expect(html).toContain("aria-hidden");
    expect(html).not.toContain("nav.appearance");
  });

  it("SkinSwatchRow renders six labeled swatches", () => {
    const html = renderToStaticMarkup(createElement(SkinSwatchRow));
    // Six swatch buttons = six aria-labels.
    const labels = html.match(/aria-label="nav\.skin[A-Z][a-zA-Z]*"/g) ?? [];
    expect(labels).toHaveLength(6);
    expect(html).toContain("nav.appearance");
  });
});
