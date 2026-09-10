"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SKINS, SKIN_STORAGE_KEY, DEFAULT_SKIN, applySkin, isSkinId, type SkinId } from "@/lib/skins";

/**
 * Skin picker for the nav chrome — a swatch dropdown like the locale/theme
 * toggles. Renders a stable placeholder until mounted so SSR HTML and the
 * first client render match (the stored skin only exists in the browser).
 */
export function SkinSwitcher() {
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SkinId>(DEFAULT_SKIN);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
      if (isSkinId(stored)) setCurrent(stored);
    } catch {
      /* private mode — default skin */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!(e.target instanceof Element) || !e.target.closest("[data-skin-switcher]")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted) {
    return <span className="inline-block h-9 w-9" aria-hidden />;
  }

  return (
    <div className="relative" data-skin-switcher>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("appearance")}
        title={t("appearance")}
        aria-expanded={open}
        className="cp-chromebtn flex h-9 w-9 items-center justify-center rounded-lg p-2"
      >
        <span
          className="block h-4 w-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
          style={{ background: SKINS.find((s) => s.id === current)?.swatch }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-44 overflow-hidden rounded-xl border py-1 shadow-[0_18px_50px_-18px_rgba(28,18,38,0.35)]"
          style={{ background: "var(--chrome-surface)", borderColor: "var(--chrome-line)" }}
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--chrome-muted)]">
            {t("appearance")}
          </p>
          {SKINS.map((skin) => (
            <button
              key={skin.id}
              onClick={() => {
                applySkin(skin.id);
                setCurrent(skin.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                current === skin.id
                  ? "bg-[var(--cp-flower-soft)] font-semibold text-[var(--cp-flower-deep)]"
                  : "text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--chrome-text)]"
              }`}
            >
              <span
                className="block h-3.5 w-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
                style={{ background: skin.swatch }}
              />
              {t(skin.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile variant: a wrap-friendly row of swatch dots for the hamburger
 * drawer, where a hover dropdown would be awkward. Selected dot gets a
 * ring; tapping applies immediately.
 */
export function SkinSwatchRow() {
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState<SkinId>(DEFAULT_SKIN);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
      if (isSkinId(stored)) setCurrent(stored);
    } catch {
      /* private mode — default skin */
    }
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-xs font-semibold text-[var(--chrome-muted)]">{t("appearance")}</span>
      <div className="flex flex-wrap items-center gap-2">
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => {
              applySkin(skin.id);
              setCurrent(skin.id);
            }}
            aria-label={t(skin.labelKey)}
            title={t(skin.labelKey)}
            className={`block h-6 w-6 rounded-full transition-transform ${
              mounted && current === skin.id
                ? "scale-110 ring-2 ring-[var(--cp-flower)] ring-offset-2 ring-offset-[var(--chrome-surface)]"
                : ""
            }`}
            style={{ background: skin.swatch }}
          />
        ))}
      </div>
    </div>
  );
}
