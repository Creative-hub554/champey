"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/session-client";
import { ChampeyIcon, ChampeyCMarkIcon } from "./icons/khmer-flora";

/**
 * First-visit intro: a blooming splash while the app boots, then a short
 * welcome that funnels the visitor toward their profile — sign in to set it
 * up, or preview the public profile experience as a guest.
 *
 * Shows once per browser (localStorage flag), never for signed-in users with
 * an existing session, and is fully skippable. Rendered as a fixed overlay
 * in the locale layout; null when inactive so it costs nothing afterwards.
 */

const INTRO_STORAGE_KEY = "champey-intro-seen";
const BOOT_MS = 1100;

type Phase = "boot" | "welcome";

function hasSeenIntro(): boolean {
  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    /* private mode — intro will show again, harmless */
  }
}

export function IntroOnboarding() {
  const t = useTranslations("intro");
  const router = useRouter();
  const { status } = useSession();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [booted, setBooted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Decide visibility after hydration: only first-time, signed-out visitors.
  useEffect(() => {
    const alreadyAuthed = status === "authenticated";
    const seen = hasSeenIntro();
    if (alreadyAuthed) {
      markIntroSeen(); // they clearly don't need the tour anymore
      return;
    }
    if (!seen) setPhase("boot");
    setLoaded(true);
  }, [status]);

  // Boot phase auto-advances to the welcome card.
  useEffect(() => {
    if (phase !== "boot") return;
    const timer = setTimeout(() => {
      setBooted(true);
      setPhase("welcome");
    }, BOOT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Lock body scroll while visible.
  useEffect(() => {
    if (!phase) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const dismiss = useCallback(() => {
    markIntroSeen();
    setPhase(null);
  }, []);

  const goProfile = useCallback(() => {
    markIntroSeen();
    setPhase(null);
    router.push(status === "authenticated" ? "/profile/edit" : "/login");
  }, [router, status]);

  const goFeed = useCallback(() => {
    markIntroSeen();
    setPhase(null);
    router.push("/feed");
  }, [router]);

  const steps = useMemo(
    () => [
      { icon: "🌸", key: "step1" as const },
      { icon: "👥", key: "step2" as const },
      { icon: "🧺", key: "step3" as const },
    ],
    []
  );

  if (!phase || (loaded && status === "loading")) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(20, 14, 24, 0.72)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      {phase === "boot" ? (
        /* ---- Boot splash: blooming champey mark ---- */
        <div className="intro-boot flex flex-col items-center" aria-live="polite">
          <span className="intro-bloom inline-flex">
            <ChampeyCMarkIcon width={72} height={72} />
          </span>
          <span
            className="intro-word mt-5 text-2xl tracking-tight text-white"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            champey
          </span>
        </div>
      ) : (
        /* ---- Welcome card → profile setup ---- */
        <div
          className="intro-card w-full max-w-md overflow-hidden rounded-[26px] border bg-[var(--chrome-surface)] p-7 text-center shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)]"
          style={{ borderColor: "var(--chrome-line)" }}
        >
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]"
            style={{ background: "var(--cp-flower-grad)" }}
          >
            <ChampeyIcon size={34} className="text-white" />
          </span>

          <h2 className="mt-5 text-2xl font-semibold" style={{ fontFamily: "var(--font-serif-display)", color: "var(--chrome-text)" }}>
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--chrome-muted)" }}>
            {t("subtitle")}
          </p>

          <div className="mt-6 space-y-2.5 text-left">
            {steps.map(({ icon, key }, i) => (
              <div
                key={key}
                className="intro-step flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "var(--cp-flower-soft)", animationDelay: `${i * 90}ms` }}
              >
                <span className="text-lg" aria-hidden>
                  {icon}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--chrome-text)" }}>
                  {t(key)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={goProfile}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-[0_10px_26px_-10px_rgba(194,73,127,0.8)] transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--cp-flower-grad)" }}
          >
            🌸 {t("setupProfile")}
          </button>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <button
              onClick={goFeed}
              className="font-medium transition-colors"
              style={{ color: "var(--cp-flower)" }}
            >
              {t("browseFirst")}
            </button>
            <button
              onClick={dismiss}
              className="font-medium transition-colors"
              style={{ color: "var(--chrome-muted)" }}
            >
              {t("skip")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
