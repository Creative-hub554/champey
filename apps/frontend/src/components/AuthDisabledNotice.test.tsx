import { afterEach, describe, expect, it, vi } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({
  clerkEnabled: false,
  sessionStatus: "unauthenticated" as string,
}));

vi.mock("@/lib/clerk-flag", () => ({
  isClerkEnabled: () => state.clerkEnabled,
}));

vi.mock("@/lib/session-client", () => ({
  useSession: () => ({ status: state.sessionStatus }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `authDisabled.${key}`,
}));

// The notice uses the i18n Link (locale-prefixed navigation).
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

import { AuthDisabledNotice } from "./AuthDisabledNotice";

function renderUi() {
  return renderToStaticMarkup(
    createElement(AuthDisabledNotice, null, createElement("div", null, "child"))
  );
}

describe("AuthDisabledNotice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the notice instead of children when Clerk is disabled", () => {
    state.clerkEnabled = false;
    const html = renderUi();
    expect(html).toContain("authDisabled.title");
    expect(html).toContain("authDisabled.backToStore");
    expect(html).not.toContain("child");
  });

  it("renders children once a publishable key exists", () => {
    state.clerkEnabled = true;
    const html = renderUi();
    expect(html).toContain("child");
    expect(html).not.toContain("authDisabled.title");
  });
});
