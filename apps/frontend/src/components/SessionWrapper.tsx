"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SessionBridge } from "@/lib/session-client";
import { isClerkEnabled } from "@/lib/clerk-flag";

/**
 * Mounts the Clerk provider only when a publishable key is configured.
 * Without one, @clerk/nextjs throws "Missing publishableKey" on first render,
 * which would take down the entire storefront; in that state the app instead
 * runs as a guest-only experience (see SessionBridge's no-Clerk mode).
 */
export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabled()) {
    return <SessionBridge>{children}</SessionBridge>;
  }

  return (
    <ClerkProvider>
      <SessionBridge>{children}</SessionBridge>
    </ClerkProvider>
  );
}
