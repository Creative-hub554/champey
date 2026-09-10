"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session-client";
import { markIntroSeen } from "./IntroOnboarding";

/**
 * First-entry router for the authenticated home experience.
 *
 * A signed-in user opening the app HOME ("/" or its locale-prefixed form) is
 * redirected ONCE per browser:
 *  - profile not yet set up (no username AND no bio) → own profile setup
 *    (`/profile/edit`) so their first screen is "make it yours";
 *  - profile already set up → the feed.
 *
 * Scoped to the home path only: deep links (a post, a group, a product) must
 * land where they point, never get hijacked to /feed. Subsequent entries go
 * straight to the feed — the decision is cached in localStorage so we don't
 * re-check the profile API on every landing. Guests are left alone (the
 * landing page itself is the guest experience).
 */

const ENTRY_DONE_KEY = "champey-first-entry-done";

export function isEntryDone(): boolean {
  try {
    return localStorage.getItem(ENTRY_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markEntryDone(): void {
  try {
    localStorage.setItem(ENTRY_DONE_KEY, "1");
  } catch {
    /* private mode — the check just re-runs next time, harmless */
  }
}

export function FirstEntryRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [ran, setRan] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    if (ran || status === "loading" || !isHome) return;
    setRan(true);
    if (status !== "authenticated" || !session?.user?.id) return;
    if (isEntryDone()) return;

    markIntroSeen(); // intro tour is moot once they're in the app
    markEntryDone();
    const userId = session.user.id;

    // Decide by profile completeness: fresh accounts have no username/bio.
    // Anything other than a definitive 200 with an empty profile (network
    // failure, backend down) falls back to the feed — never trap a user in
    // setup because an API call hiccuped.
    fetch(`/api/profiles/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        const needsSetup = Boolean(profile) && !profile.username && !profile.bio;
        router.replace(needsSetup ? "/profile/edit" : "/feed");
      })
      .catch(() => router.replace("/feed"));
  }, [ran, isHome, status, session?.user?.id, router]);

  return null;
}
