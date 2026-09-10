import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/*
 * Guest mode (no Clerk publishable key): the session bridge must report a
 * permanent unauthenticated session without ever touching @clerk/nextjs,
 * which would throw "Missing publishableKey" outside a provider.
 */

const state = vi.hoisted(() => ({ clerkEnabled: false }));

vi.mock("@/lib/clerk-flag", () => ({
  isClerkEnabled: () => state.clerkEnabled,
}));

// If any Clerk hook is invoked in guest mode, fail loudly — that would crash
// at runtime with "Missing publishableKey".
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => {
    throw new Error("useAuth must not be called in guest mode");
  },
  useUser: () => {
    throw new Error("useUser must not be called in guest mode");
  },
  useClerk: () => {
    throw new Error("useClerk must not be called in guest mode");
  },
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { SessionBridge, useSession } from "./session-client";

function Probe() {
  const session = useSession();
  return createElement(
    "div",
    {
      "data-status": session.status,
      "data-user": session.data?.user?.id ?? "none",
    },
    "probe"
  );
}

describe("SessionBridge guest mode", () => {
  beforeEach(() => {
    state.clerkEnabled = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports unauthenticated without calling any Clerk hook", async () => {
    let html = "";
    await React.act(async () => {
      html = renderToStaticMarkup(
        createElement(
          SessionBridge,
          null,
          createElement(Probe)
        )
      );
    });
    expect(html).toContain('data-status="unauthenticated"');
    expect(html).toContain('data-user="none"');
  });
});
