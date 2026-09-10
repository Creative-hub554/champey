import { describe, expect, it, vi, beforeEach } from "vitest";

/*
 * Guest mode (no Clerk publishable key): server-side session resolution must
 * short-circuit to null without calling Clerk's auth(), which would throw
 * without middleware-provided request context.
 */

const state = vi.hoisted(() => ({ clerkEnabled: false }));

vi.mock("@/lib/clerk-flag", () => ({
  isClerkEnabled: () => state.clerkEnabled,
}));

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: vi.fn(),
}));

vi.mock("@theo/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getToken, getServerSession, isAuthed } from "./auth";

describe("auth resolution in guest mode", () => {
  beforeEach(() => {
    authMock.mockReset();
    state.clerkEnabled = false;
  });

  it("getToken resolves null without touching Clerk", async () => {
    authMock.mockRejectedValue(new Error("auth() must not run in guest mode"));
    await expect(getToken()).resolves.toBeNull();
    expect(authMock).not.toHaveBeenCalled();
  });

  it("getServerSession resolves null without touching Clerk", async () => {
    await expect(getServerSession()).resolves.toBeNull();
    expect(authMock).not.toHaveBeenCalled();
  });

  it("isAuthed is false without touching Clerk", async () => {
    await expect(isAuthed()).resolves.toBe(false);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("still consults Clerk when a publishable key is configured", async () => {
    state.clerkEnabled = true;
    authMock.mockResolvedValue({ userId: null });
    await expect(getToken()).resolves.toBeNull();
    expect(authMock).toHaveBeenCalledTimes(1);
  });
});
