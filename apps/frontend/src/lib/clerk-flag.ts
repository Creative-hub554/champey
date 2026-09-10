/**
 * Clerk is optional at runtime: when no publishable key is configured the
 * storefront degrades to guest browsing (no provider, no auth gate, no sign-in
 * UI) instead of crashing with "Missing publishableKey". Any real key — test or
 * live — re-enables the full auth surface with no code changes.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so a dev server started before
 * keys exist needs a restart after they are added to pick them up.
 */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return typeof key === "string" && key.length > 0;
}
