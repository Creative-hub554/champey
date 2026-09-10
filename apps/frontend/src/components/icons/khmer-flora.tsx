import type { SVGProps } from "react";

/**
 * Khmer flora icon set — hand-drawn 24×24 line icons standing in for the
 * usual social-app glyphs (lucide) so the chrome carries a Khmer identity.
 * Stroke-based like lucide (strokeWidth 1.8) so they sit next to the
 * remaining lucide icons without looking foreign.
 */

type IconProps = SVGProps<SVGSVGElement> & {
  /** lucide-style convenience; maps to width/height (className still wins). */
  size?: number;
};

function Svg({ children, size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      width={size}
      height={size}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Five-petal champey (plumeria) — the brand flower. Feed / home. */
export function ChampeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13.1" r="1.6" />
      <ellipse cx="12" cy="6.9" rx="2.3" ry="3.1" />
      <ellipse cx="17.2" cy="10.7" rx="2.3" ry="3.1" transform="rotate(72 17.2 10.7)" />
      <ellipse cx="15.3" cy="16.6" rx="2.3" ry="3.1" transform="rotate(144 15.3 16.6)" />
      <ellipse cx="8.7" cy="16.6" rx="2.3" ry="3.1" transform="rotate(216 8.7 16.6)" />
      <ellipse cx="6.8" cy="10.7" rx="2.3" ry="3.1" transform="rotate(288 6.8 10.7)" />
    </Svg>
  );
}

/** Rumdul — small clustered blooms on a stem (messenger). */
export function RumdulIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.5c0-4.6 1.6-7.6 4.2-10.1" />
      <circle cx="8.6" cy="8.9" r="2.1" />
      <circle cx="12.9" cy="6.4" r="2.1" />
      <circle cx="16.8" cy="10.2" r="2.1" />
      <circle cx="12.2" cy="11.4" r="2.1" />
    </Svg>
  );
}

/** Lotus — market / shop. */
export function LotusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.2c-4.6 0-8.3-2.6-9.4-6.3 1.9-.6 3.9-.4 5.6.6" />
      <path d="M12 20.2c4.6 0 8.3-2.6 9.4-6.3-1.9-.6-3.9-.4-5.6.6" />
      <path d="M12 20.2c-2.2-1.9-3.4-4.4-3.4-7.2C8.6 10.2 10 7.6 12 6c2 1.6 3.4 4.2 3.4 7 0 2.8-1.2 5.3-3.4 7.2Z" />
      <path d="M8.2 14.5C6.4 13.3 5.3 11.4 5 9.2c2.2.2 4.1 1.2 5.4 2.8" />
      <path d="M15.8 14.5c1.8-1.2 2.9-3.1 3.2-5.3-2.2.2-4.1 1.2-5.4 2.8" />
    </Svg>
  );
}

/** Jasmine bud sprig — jobs / careers (growth). */
export function JasmineIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21V9" />
      <path d="M12 13c-2.6-.4-4.4-2-5.1-4.6 2.6.2 4.4 1.6 5.1 4.6Z" />
      <path d="M12 13c2.6-.4 4.4-2 5.1-4.6-2.6.2-4.4 1.6-5.1 4.6Z" />
      <circle cx="12" cy="6.2" r="2.4" />
      <path d="M12 17.4c-2-.3-3.4-1.4-4-3.3 2 .2 3.3 1.2 4 3.3Z" />
      <path d="M12 17.4c2-.3 3.4-1.4 4-3.3-2 .2-3.3 1.2-4 3.3Z" />
    </Svg>
  );
}

/** Krama-wrapped market basket — cart. */
export function BasketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 9.5h15l-1.4 8.2a2.6 2.6 0 0 1-2.6 2.2H8.5a2.6 2.6 0 0 1-2.6-2.2L4.5 9.5Z" />
      <path d="M7.5 9.5C7.5 5.9 9.4 3.5 12 3.5s4.5 2.4 4.5 6" />
      <path d="M8.6 13v3.6M12 13v3.6M15.4 13v3.6" />
    </Svg>
  );
}

/** Frangipani lens — search / explore. */
export function LensIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
      <circle cx="11" cy="11" r="2.2" />
      <path d="M11 6.5v1.4M11 14.1v1.4M6.5 11h1.4M14.1 11h1.4" />
    </Svg>
  );
}

/** Champey heart with petal lobes — reactions / like. */
export function BlossomHeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.4C7.2 16.9 4 13.9 4 10.3 4 7.9 5.9 6 8.2 6c1.5 0 2.9.8 3.8 2.2C12.9 6.8 14.3 6 15.8 6 18.1 6 20 7.9 20 10.3c0 3.6-3.2 6.6-8 10.1Z" />
      <path d="M12 10.6c-.5 1.4-1.4 2.3-2.8 2.8 1.4.5 2.3 1.4 2.8 2.8.5-1.4 1.4-2.3 2.8-2.8-1.4-.5-2.3-1.4-2.8-2.8Z" />
    </Svg>
  );
}

/** Guest profile glyph — blossom bud above shoulders (account tab when signed out). */
export function ProfileIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.2" r="3.4" />
      <circle cx="12" cy="3.6" r="1.1" />
      <path d="M5.5 20.2c.7-3.6 3.3-5.8 6.5-5.8s5.8 2.2 6.5 5.8" />
    </Svg>
  );
}

/**
 * Champey brand mark — letter C with a plumeria nested in its mouth.
 * The C is a thick gradient arc opening to the right; the five-petal
 * frangipani sits in that opening, echoing the standalone blossom mark.
 * Use for logo lockups (nav, footer, boot splash).
 */
export function ChampeyCMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="champey-c-grad" x1="4" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#f5b8c4" />
          <stop offset="50%" stopColor="#e879a6" />
          <stop offset="100%" stopColor="#c2497f" />
        </linearGradient>
      </defs>
      {/* The C — 300° arc, round caps, opening to the right */}
      <path
        d="M16.8 6.3 A 7.5 7.5 0 1 0 16.8 17.7"
        stroke="url(#champey-c-grad)"
        strokeWidth={4.2}
        strokeLinecap="round"
      />
      {/* Plumeria in the C's mouth */}
      <g fill="url(#champey-c-grad)">
        <circle cx="17.6" cy="12.2" r="0.9" fill="#ffd9a8" />
        <ellipse cx="17.6" cy="9.8" rx="1.15" ry="1.6" />
        <ellipse cx="19.9" cy="11.5" rx="1.15" ry="1.6" transform="rotate(72 19.9 11.5)" />
        <ellipse cx="19" cy="14.1" rx="1.15" ry="1.6" transform="rotate(144 19 14.1)" />
        <ellipse cx="16.2" cy="14.1" rx="1.15" ry="1.6" transform="rotate(216 16.2 14.1)" />
        <ellipse cx="15.3" cy="11.5" rx="1.15" ry="1.6" transform="rotate(288 15.3 11.5)" />
      </g>
    </svg>
  );
}

/** Champey standalone blossom mark — filled gradient flower for compact spots. */
export function ChampeyMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="champey-mark-grad" x1="4" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#f5b8c4" />
          <stop offset="50%" stopColor="#e879a6" />
          <stop offset="100%" stopColor="#c2497f" />
        </linearGradient>
      </defs>
      <g fill="url(#champey-mark-grad)">
        <circle cx="12" cy="13.2" r="1.7" fill="#ffd9a8" />
        <ellipse cx="12" cy="7.2" rx="2.2" ry="3" />
        <ellipse cx="16.9" cy="10.8" rx="2.2" ry="3" transform="rotate(72 16.9 10.8)" />
        <ellipse cx="15.1" cy="16.5" rx="2.2" ry="3" transform="rotate(144 15.1 16.5)" />
        <ellipse cx="8.9" cy="16.5" rx="2.2" ry="3" transform="rotate(216 8.9 16.5)" />
        <ellipse cx="7.1" cy="10.8" rx="2.2" ry="3" transform="rotate(288 7.1 10.8)" />
      </g>
    </svg>
  );
}
