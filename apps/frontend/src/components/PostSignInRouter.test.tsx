import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { createElement } from "react";

/*
 * PostSignInRouter: the moment a user becomes authenticated on a sign-in
 * page, they are routed once — fresh profile → own profile setup, set-up
 * profile → feed. Guests are untouched.
 */

const state = vi.hoisted(() => ({
  sessionStatus: "unauthenticated" as string,
  userId: null as string | null,
  replace: vi.fn(),
  profileJson: null as string | null,
  profileOk: true,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
}));

vi.mock("@/lib/session-client", () => ({
  useSession: () => ({
    status: state.sessionStatus,
    data: state.userId ? { user: { id: state.userId } } : null,
  }),
}));

vi.mock("./FirstEntryRouter", () => ({
  markEntryDone: vi.fn(),
}));

import { PostSignInRouter } from "./PostSignInRouter";

function stubProfileFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(state.profileJson, { status: state.profileOk ? 200 : 500 })
      )
    )
  );
}

describe("PostSignInRouter", () => {
  beforeEach(() => {
    state.replace.mockClear();
    state.sessionStatus = "unauthenticated";
    state.userId = null;
    state.profileOk = true;
    state.profileJson = null;
    vi.unstubAllGlobals();
  });

  it("does nothing for guests", async () => {
    const { render, act } = await import("@testing-library/react");
    render(createElement(PostSignInRouter));
    await act(async () => {});
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("fresh profile routes to own profile setup", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u1";
    state.profileJson = JSON.stringify({ id: "u1", username: null, bio: null });
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(PostSignInRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/profile/edit");
  });

  it("set-up profile routes to the feed", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u2";
    state.profileJson = JSON.stringify({ id: "u2", username: "sokha", bio: "hi" });
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(PostSignInRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/feed");
  });

  it("profile fetch failure falls back to the feed", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u3";
    state.profileOk = false;
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    render(createElement(PostSignInRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledWith("/feed");
  });

  it("runs at most once per mount even if session updates", async () => {
    state.sessionStatus = "authenticated";
    state.userId = "u4";
    state.profileJson = JSON.stringify({ id: "u4", username: null, bio: null });
    stubProfileFetch();
    const { render, act } = await import("@testing-library/react");
    const view = render(createElement(PostSignInRouter));
    await act(async () => {});
    view.rerender(createElement(PostSignInRouter));
    await act(async () => {});
    expect(state.replace).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
