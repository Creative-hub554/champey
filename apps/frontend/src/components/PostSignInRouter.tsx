"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session-client";
import { markEntryDone } from "./FirstEntryRouter";

/**
 * Post-sign-in routing: the moment a user becomes authenticated while sitting
 * on a sign-in/sign-up page, send them ONCE to the right first destination:
 *  - profile fresh (no username AND no bio) → own profile setup (/profile/edit)
 *  - profile already set up → the feed
 *
 * Mounted by the auth pages themselves (login / sign-in / sign-up), so it can
 * never hijack other routes. markEntryDone() also arms the home-page first
 * entry flag — the person just finished onboarding, so their next home visit
 * goes straight to the feed.
 */
export function PostSignInRouter() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (ran || status !== "authenticated" || !session?.user?.id) return;
    setRan(true);

    markEntryDone();
    const userId = session.user.id;

    // Same completeness rule as FirstEntryRouter; same failure stance —
    // an API hiccup must never strand a returning user on a broken page,
    // so anything but a definitive fresh profile goes to the feed.
    fetch(`/api/profiles/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        const needsSetup = Boolean(profile) && !profile.username && !profile.bio;
        router.replace(needsSetup ? "/profile/edit" : "/feed");
      })
      .catch(() => router.replace("/feed"));
  }, [ran, status, session?.user?.id, router]);

  return null;
}
