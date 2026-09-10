import { afterEach, describe, expect, it } from "vitest";
import { isClerkEnabled } from "./clerk-flag";

const KEY = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY";

describe("isClerkEnabled", () => {
  const original = process.env[KEY];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[KEY];
    } else {
      process.env[KEY] = original;
    }
  });

  it("is disabled when the publishable key is unset", () => {
    delete process.env[KEY];
    expect(isClerkEnabled()).toBe(false);
  });

  it("is disabled for an empty-string key", () => {
    process.env[KEY] = "";
    expect(isClerkEnabled()).toBe(false);
  });

  it("is enabled for any non-empty key", () => {
    process.env[KEY] = "pk_test_example";
    expect(isClerkEnabled()).toBe(true);
  });
});
