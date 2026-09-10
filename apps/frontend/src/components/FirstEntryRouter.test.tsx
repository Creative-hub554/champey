import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { createElement } from "react";

/*
 * FirstEntryRouter: a signed-in user's FIRST entry routes to their own
 * profile setup when the profile is fresh (no username/bio), to the feed
 * otherwise, runs once per browser, and leaves guests untouched.
 */

const state = vi.hoisted(() => ({
  sessionStatus: "unauthenticated" as string,
  userId: null as string | null,
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/" as string,
  profileJson: null as string | null,
  profileOk: true,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: state.push, replace: state.replace }),
  usePathname: () => state.pathname,
}));

vi.mock("@/lib/session-client", () => ({
  useSession: () => ({
    status: state.sessionStatus,
    data: state.userId ? { user: { id: state.userId } } : null,
  }),
}));

import { FirstEntryRouter, isEntryDone, markEntryDone } from "./FirstEntryRouter";

function stubProfileFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(state.profileJson, {
          status: state.profileOk ? 200 : 500,
        })
      )
    )
  );
}

const ENTRY_KEY = "champey-first-entry-done";

describe("entry flag", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to not-done and persists marking", () => {
    expect(isEntryDone()).toBe(false);
    markEntryDone();
    expect(isEntryDone()).toBe(true);
  });
});

describe("FirstEntryRouter", () => {
  beforeEach(() => {
    localStorage.clear();
    state.push.mockClear();
    state.replace.mockClear();
    state.sessionStatus = "unauthenticated";
    state.userId = null;
    state.profileOk = true;
    state.profileJson = null;
    state.pathname = "/";
    vi.unstubAllGlobals();
  });

  it("guests are never routed", async () => {
    const { render } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("fresh profile (no username, no bio) routes to own profile setup", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u1";
    state.profileJson = JSON.stringify({ id: "u1", username: null, bio: null });
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/profile/edit");
    expect(isEntryDone()).toBe(true);
  });

  it("set-up profile routes to the feed", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u2";
    state.profileJson = JSON.stringify({ id: "u2", username: "sokha", bio: "Designer" });
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/feed");
    expect(isEntryDone()).toBe(true);
  });

  it("skips the profile check on subsequent entries", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u3";
    localStorage.setItem(ENTRY_KEY, "1");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { render, act } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    await act(async () => {});
    expect(state.replace).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("profile fetch failure falls back to the feed (never blocks entry)", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u4";
    state.profileOk = false;
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/feed");
  });

  it("deep links (non-home paths) are never hijacked", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u5";
    state.pathname = "/feed/post/abc";
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(FirstEntryRouter));
    await act(async () => {});
    expect(state.replace).not.toHaveBeenCalled();
    expect(state.push).not.toHaveBeenCalled();
    expect(isEntryDone()).toBe(false); // nothing consumed — first entry still pending
  });
});
