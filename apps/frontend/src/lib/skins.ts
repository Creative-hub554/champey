/**
 * Champey UI skins — user-selectable accent styles for the chrome.
 *
 * A skin is a `skin-<id>` class on <html> that overrides the --chrome-* /
 * --cp-* accent tokens (and the legacy gold scale) defined in globals.css.
 * "krama" (indigo) is the neutral professional default and needs no class —
 * the base :root tokens are already indigo. The signature pink look is the
 * optional "champey" skin; the rest are the Khmer-flora palettes. Applied
 * pre-hydration by skinBootstrapScript so the chosen style paints with the
 * first frame (no flash of the default skin).
 */

export const SKIN_STORAGE_KEY = "champey-skin";

export const SKIN_IDS = [
  "krama",
  "champey",
  "jasmine",
  "lotus",
  "rumdul",
  "orchid",
] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export type Skin = {
  id: SkinId;
  /** Key into the `nav` message namespace. */
  labelKey: string;
  /** CSS gradient approximating the skin's accent, for swatch dots. */
  swatch: string;
};

export const SKINS: Skin[] = [
  {
    id: "krama",
    labelKey: "skinKrama",
    swatch: "linear-gradient(120deg, #a9bff0, #5b7fd4, #f0a95f)",
  },
  {
    id: "champey",
    labelKey: "skinChampey",
    swatch: "linear-gradient(120deg, #f5b8c4, #e879a6, #f5a15f)",
  },
  {
    id: "jasmine",
    labelKey: "skinJasmine",
    swatch: "linear-gradient(120deg, #a8d8b9, #5fa777, #8fc7a0)",
  },
  {
    id: "lotus",
    labelKey: "skinLotus",
    swatch: "linear-gradient(120deg, #f2e6bd, #c9a227, #e8cc6e)",
  },
  {
    id: "rumdul",
    labelKey: "skinRumdul",
    swatch: "linear-gradient(120deg, #f7c08a, #e8823f, #f2b25f)",
  },
  {
    id: "orchid",
    labelKey: "skinOrchid",
    swatch: "linear-gradient(120deg, #d3b8f2, #9b6fd0, #c49af0)",
  },
];

export const DEFAULT_SKIN: SkinId = "krama";

export function isSkinId(value: string | null): value is SkinId {
  return typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value);
}

/**
 * Swap the active skin on <html> and persist it. Safe to call from any
 * client component; never touches the `dark` class next-themes owns.
 */
export function applySkin(id: SkinId): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const skin of SKIN_IDS) {
    if (skin !== id) el.classList.remove(`skin-${skin}`);
  }
  // The default skin needs no class — :root already carries its tokens.
  if (id === DEFAULT_SKIN) {
    el.classList.remove(`skin-${DEFAULT_SKIN}`);
  } else {
    el.classList.add(`skin-${id}`);
  }
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, id);
  } catch {
    /* private mode — skin just won't persist */
  }
}

/**
 * Inlined as the first child of <body> so the stored skin is on <html>
 * before any paint. Kept tiny and dependency-free.
 */
export const skinBootstrapScript = `(function(){try{var s=window.localStorage.getItem(${JSON.stringify(
  SKIN_STORAGE_KEY
)});var d=${JSON.stringify(DEFAULT_SKIN)};if(s&&s!==d&&${JSON.stringify(
  SKIN_IDS
)}.indexOf(s)>-1){document.documentElement.classList.add("skin-"+s)}}catch(e){}})()`;
