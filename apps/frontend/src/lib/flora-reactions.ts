/**
 * Champey flora reactions — flower-style reaction picker for feed posts.
 *
 * Each reaction is an emoji-string key (matching the stored `Reaction.emoji`
 * and the backend `ReactDto` contract: 1–8 chars, no whitelist) paired with
 * a Khmer-flora label used for aria-labels/notifications. Rendering keeps
 * emoji glyphs so reaction rows stay lightweight and copy/pasteable.
 */

export type FloraReaction = {
  /** Stored emoji key (≤ 8 chars, matches backend ReactDto limits). */
  key: string;
  /** i18n-independent display glyph. */
  glyph: string;
  /** Accessible name (English fallback; UI may localize via key below). */
  label: string;
  /** Message key under the `floraReactions` namespace. */
  labelKey: string;
  /** Hover/bloom accent color. */
  color: string;
};

export const FLORA_REACTIONS: FloraReaction[] = [
  { key: "🌸", glyph: "🌸", label: "Love this bloom", labelKey: "loveBloom", color: "#e879a6" },
  { key: "💗", glyph: "💗", label: "Love", labelKey: "love", color: "#ef8fb4" },
  { key: "🌺", glyph: "🌺", label: "Beautiful", labelKey: "beautiful", color: "#f5a15f" },
  { key: "🤢", glyph: "🤢", label: "Disgusting", labelKey: "disgusting", color: "#7cb342" },
  { key: "🥀", glyph: "🥀", label: "Wilted", labelKey: "wilted", color: "#9c8f86" },
];

export const DEFAULT_FLORA_REACTION = FLORA_REACTIONS[0];

export function isFloraReactionKey(value: string): boolean {
  return FLORA_REACTIONS.some((r) => r.key === value);
}

export function floraReactionLabel(value: string): string {
  const hit = FLORA_REACTIONS.find((r) => r.key === value);
  return hit ? hit.label : value;
}
