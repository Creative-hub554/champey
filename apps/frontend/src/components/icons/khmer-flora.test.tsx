import { describe, expect, it } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ChampeyIcon,
  RumdulIcon,
  LotusIcon,
  JasmineIcon,
  BasketIcon,
  LensIcon,
  BlossomHeartIcon,
  ProfileIcon,
  ChampeyMarkIcon,
  ChampeyCMarkIcon,
} from "./khmer-flora";

/*
 * Khmer flora icon set smoke tests: every icon renders an accessible SVG
 * that inherits currentColor (stroke icons) or carries the gradient mark.
 */

const STROKE_ICONS = [
  ["ChampeyIcon", ChampeyIcon],
  ["RumdulIcon", RumdulIcon],
  ["LotusIcon", LotusIcon],
  ["JasmineIcon", JasmineIcon],
  ["BasketIcon", BasketIcon],
  ["LensIcon", LensIcon],
  ["BlossomHeartIcon", BlossomHeartIcon],
  ["ProfileIcon", ProfileIcon],
] as const;

describe("khmer-flora icons", () => {
  it.each(STROKE_ICONS)("%s renders a stroke SVG inheriting currentColor", (_name, Icon) => {
    const html = renderToStaticMarkup(createElement(Icon, { "data-testid": "icon" }));
    expect(html).toContain("<svg");
    expect(html).toContain('stroke="currentColor"');
    // Some glyphs are pure circles/ellipses (champey), others are paths —
    // the invariant is that the blossom actually has drawn geometry.
    expect(html).toMatch(/<(path|circle|ellipse)/);
  });

  it("ChampeyMarkIcon renders the gradient blossom mark", () => {
    const html = renderToStaticMarkup(createElement(ChampeyMarkIcon));
    expect(html).toContain("<svg");
    expect(html).toContain("champey-mark-grad");
    expect(html).toContain("url(#champey-mark-grad)");
  });

  it("ChampeyCMarkIcon renders the C + plumeria lockup", () => {
    const html = renderToStaticMarkup(createElement(ChampeyCMarkIcon));
    expect(html).toContain("<svg");
    expect(html).toContain("champey-c-grad");
    // The C arc + the five-petal plumeria (5 ellipses + gold center).
    expect((html.match(/<ellipse/g) ?? []).length).toBe(5);
    expect(html).toContain('#ffd9a8');
  });

  it("accepts className and size props", () => {
    const html = renderToStaticMarkup(
      createElement(ChampeyIcon, { className: "w-6 h-6", width: 24, height: 24 })
    );
    expect(html).toContain('class="w-6 h-6"');
  });

  it("icons are hidden from screen readers by default", () => {
    const html = renderToStaticMarkup(createElement(LotusIcon));
    expect(html).toContain('aria-hidden');
  });
});
