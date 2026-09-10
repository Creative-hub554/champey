import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { createElement } from "react";

/*
 * Intro onboarding: shows once for signed-out first-timers, never for
 * signed-in users, and its CTAs route to profile setup / feed.
 */

const state = vi.hoisted(() => ({
  sessionStatus: "unauthenticated" as string,
  push: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string): string =>
      `intro.${key}`,
}));

vi.mock("@/lib/session-client", () => ({
  useSession: () => ({ status: state.sessionStatus }),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: state.push }),
}));

import { IntroOnboarding, markIntroSeen } from "./IntroOnboarding";

describe("markIntroSeen", () => {
  beforeEach(() => localStorage.clear());

  it("persists the seen flag", () => {
    expect(localStorage.getItem("champey-intro-seen")).toBeNull();
    markIntroSeen();
    expect(localStorage.getItem("champey-intro-seen")).toBe("1");
  });
});

describe("IntroOnboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    state.push.mockClear();
    state.sessionStatus = "unauthenticated";
  });

  it("renders null for users who have already seen the intro", async () => {
    localStorage.setItem("champey-intro-seen", "1");
    const { render } = await import("@testing-library/react");
    const { container } = render(createElement(IntroOnboarding));
    expect(container.querySelector(".intro-card")).toBeNull();
  });

  it("renders null for signed-in users (and marks the intro seen)", async () => {
    state.sessionStatus = "authenticated";
    const { render } = await import("@testing-library/react");
    const { container } = render(createElement(IntroOnboarding));
    expect(container.querySelector(".intro-card")).toBeNull();
    expect(localStorage.getItem("champey-intro-seen")).toBe("1");
  });

  it("advances past the boot splash to the welcome card for first-timers", async () => {
    vi.useFakeTimers();
    try {
      const { render, act } = await import("@testing-library/react");
      const { container } = render(createElement(IntroOnboarding));
      expect(container.querySelector(".intro-boot")).not.toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      expect(container.querySelector(".intro-boot")).toBeNull();
      expect(container.querySelector(".intro-card")).not.toBeNull();
      // Profile-first funnel: setup CTA + guest browse + skip.
      expect(container.textContent).toContain("intro.setupProfile");
      expect(container.textContent).toContain("intro.browseFirst");
      expect(container.textContent).toContain("intro.skip");
    } finally {
      vi.useRealTimers();
    }
  });

  it("setupProfile routes guests to /login", async () => {
    vi.useFakeTimers();
    try {
      const { render, act, cleanup } = await import("@testing-library/react");
      const { container } = render(createElement(IntroOnboarding));
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      const btn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("intro.setupProfile")
      );
      expect(btn).toBeTruthy();
      await act(async () => {
        btn!.click();
      });
      expect(state.push).toHaveBeenCalledWith("/login");
      expect(localStorage.getItem("champey-intro-seen")).toBe("1");
      cleanup();
    } finally {
      vi.useRealTimers();
    }
  });
});
