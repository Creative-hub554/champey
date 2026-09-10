import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ShieldCheck,
  Briefcase,
  Users,
  MessagesSquare,
  Store,
  FileText,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { api } from "@/services/api";
import { LxReveal } from "@/components/landing/LxReveal";

export const dynamic = "force-dynamic";

/* --- Champey Social tile gradients (indigo night × flora accents) --- */
const TILE_GRADIENTS = [
  "linear-gradient(150deg, #232c48 0%, #141826 100%)", // indigo night
  "linear-gradient(150deg, #5b7fd4 0%, #3a5cb0 100%)", // krama indigo
  "linear-gradient(150deg, #f0a95f 0%, #d97b3f 100%)", // frangipani amber
  "linear-gradient(150deg, #6f9e7f 0%, #4a7a5c 100%)", // jasmine leaf
  "linear-gradient(150deg, #e879a6 0%, #c2497f 100%)", // champey blossom
  "linear-gradient(150deg, #4a2a4f 0%, #2e1836 100%)", // dusk orchid
  "linear-gradient(150deg, #d9608f 0%, #9c3f68 100%)", // rumdul rose
  "linear-gradient(150deg, #8a5a68 0%, #5c3a46 100%)", // petal mauve
];

export default async function Home() {
  // Social-first: the landing is the guest experience. Signed-in users see it
  // too, but FirstEntryRouter (client) instantly routes them ONCE per browser —
  // own profile setup for fresh accounts, feed for everyone else.

  const t = await getTranslations("home");
  const nav = await getTranslations("nav");
  // Decorative bento: fail fast (no retries) so a sick backend can't stall the
  // landing render for seconds — the section simply hides when the API is down.
  const categories = await api.categories
    .list({ retries: 0, timeoutMs: 2500 })
    .catch(() => []);

  const features = [
    { title: t("feature1Title"), desc: t("feature1Desc"), Icon: Users },
    { title: t("feature2Title"), desc: t("feature2Desc"), Icon: FileText },
    { title: t("feature3Title"), desc: t("feature3Desc"), Icon: ShieldCheck },
  ];
  const tiles = categories.slice(0, 8);
  // Professional-network ordering: connect first, careers second, market third.
  const pillars = [
    {
      href: "/feed",
      label: nav("social"),
      blurb: t("pillarSocial"),
      Icon: MessagesSquare,
    },
    {
      href: "/jobs",
      label: nav("jobs"),
      blurb: t("pillarJobs"),
      Icon: Briefcase,
    },
    {
      href: "/market",
      label: nav("market"),
      blurb: t("pillarMarket"),
      Icon: Store,
    },
  ];

  // Italicize the last word of the headline in gold, language-agnostic.
  const title = t("heroTitle");
  const lastSpace = title.lastIndexOf(" ");
  const titleHead = lastSpace > 0 ? title.slice(0, lastSpace) : title;
  const titleTail = lastSpace > 0 ? title.slice(lastSpace + 1) : "";

  const marqueeItems = [
    t("trust1"),
    t("trust2"),
    t("trust3"),
    t("marqueeMarket"),
    t("marqueeCommunity"),
    t("marqueeJobs"),
  ];

  return (
    <div className="lx-root">
      {/* ============ HERO — night sky, gold lanterns ============ */}
      <section className="lx-hero-bg relative px-4 pb-24 pt-16 md:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <LxReveal>
            <div>
              <span className="lx-eyebrow inline-flex items-center gap-2.5 rounded-full border border-[var(--lx-on-night-line)] px-4 py-2 backdrop-blur-sm">
                <Sparkles size={13} aria-hidden />
                {t("heroEyebrow")}
              </span>
              <h1 className="lx-display mt-6 text-[clamp(2.6rem,6vw,4.6rem)]">
                {titleHead}{" "}
                {titleTail && (
                  <em className="italic text-[color:var(--lx-gold)]">{titleTail}</em>
                )}
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[color:var(--lx-on-night-muted)]">
                {t("heroSubtitle")}
              </p>
              <div className="mt-9 flex flex-wrap gap-3.5">
                <Link href="/login" className="lx-btn lx-btn-gold lx-btn-xl">
                  {t("joinCta")}
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link
                  href="/seller/apply"
                  className="lx-btn lx-btn-xl border border-[var(--lx-on-night-line)] text-[color:var(--lx-on-night)] hover:bg-[rgba(244,240,230,0.08)]"
                >
                  {t("becomeSeller")}
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-2.5 text-sm font-medium text-[color:var(--lx-on-night-muted)]">
                {[t("trust1"), t("trust2"), t("trust3")].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check size={15} className="text-[color:var(--lx-gold)]" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </LxReveal>

          {/* Mock social post + reaction chips (decorative) — sells the feed,
              not a product: this is a professional social platform. */}
          <div className="relative hidden h-[430px] md:block" aria-hidden>
            <div className="lx-float absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-[rgba(244,240,230,0.16)] bg-[rgba(23,20,46,0.55)] p-4 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.7)] backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                  style={{ background: "var(--cp-flower-grad)" }}
                >
                  🌸
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[color:var(--lx-on-night)]">
                    Sokha Chann
                  </p>
                  <p className="text-[11px] text-[color:var(--lx-on-night-muted)]">
                    {t("heroPostRole")}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-[14px] p-3 text-[13px] leading-relaxed text-[color:var(--lx-on-night)]" style={{ background: TILE_GRADIENTS[0] }}>
                {t("heroPostBody")}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[color:var(--lx-on-night-muted)]">
                  🌸 💗 248
                </span>
                <span className="text-[11px] font-medium text-[color:var(--lx-on-night-muted)]">
                  💬 {t("heroPostComments")}
                </span>
              </div>
            </div>
            <span
              className="lx-chip left-0 top-[13%] text-[color:var(--lx-jade)]"
              style={{ animationDelay: "0.9s" }}
            >
              <Check size={15} aria-hidden />
              {t("heroChipVerified")}
            </span>
            <span className="lx-chip bottom-[14%] right-0" style={{ animationDelay: "1.7s" }}>
              <span>🌸💗🥀</span>
              {t("heroChipReactions")}
            </span>
          </div>
        </div>

        {/* Bottom fade into ivory */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--lx-paper)]" />
      </section>

      {/* ============ MARQUEE — promise ticker on ivory ============ */}
      <section className="border-y border-[var(--lx-line)] bg-[var(--lx-paper-2)] py-5">
        <div className="lx-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="lx-marquee-track" aria-hidden={copy === 1}>
              {marqueeItems.map((item) => (
                <span
                  key={item}
                  className="lx-serif flex shrink-0 items-center gap-4 text-lg text-[color:var(--lx-ink-soft)]"
                >
                  <span className="text-[color:var(--lx-gold)]">✦</span>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ PILLARS — three doors into the platform ============ */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <LxReveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="lx-rule mb-6">
              <span className="lx-eyebrow shrink-0 px-2">{t("pillarsKicker")}</span>
            </div>
            <h2 className="lx-display text-3xl md:text-[2.6rem]">
              {t("pillarsTitle")}{" "}
              <em className="italic text-[color:var(--lx-gold-deep)]">
                {t("pillarsTitleTail")}
              </em>
            </h2>
          </div>
        </LxReveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {pillars.map(({ href, label, blurb, Icon }, i) => (
            <LxReveal key={href} delay={i * 90}>
              <Link href={href} className="lx-card group block p-8">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-10px_rgba(138,106,38,0.7)]"
                  style={{ background: "var(--cp-flower-grad)" }}
                >
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="lx-display mt-6 text-[1.35rem]">{label}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--lx-muted)]">
                  {blurb}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--lx-gold-deep)] transition-transform group-hover:translate-x-1 dark:text-[color:var(--lx-gold)]">
                  {t("explore")}
                  <ArrowRight size={15} aria-hidden />
                </span>
              </Link>
            </LxReveal>
          ))}
        </div>
      </section>

      {/* ============ CATEGORIES — lacquer bento ============ */}
      {tiles.length > 0 && (
        <section className="lx-band py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <LxReveal>
                <div>
                  <div className="lx-eyebrow">{nav("shop")}</div>
                  <h2 className="lx-display mt-3 text-3xl md:text-[2.6rem]">{t("tilesTitle")}</h2>
                  <p className="mt-3 max-w-xl text-[15px] text-[color:var(--lx-muted)]">
                    {t("tilesCaption")}
                  </p>
                </div>
              </LxReveal>
              <LxReveal delay={120}>
                <Link href="/shop" className="lx-btn lx-btn-outline h-11 px-5 text-sm">
                  {t("viewAll")}
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </LxReveal>
            </div>
            <div className="lx-bento">
              {tiles.map((cat, i) => {
                const featured = i === 0;
                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className={`lx-tile flex items-end p-5 ${featured ? "col-span-2 row-span-2" : ""}`}
                    style={{ background: TILE_GRADIENTS[i % TILE_GRADIENTS.length] }}
                  >
                    <span className="lx-tile-arrow" aria-hidden>
                      <ArrowRight size={14} />
                    </span>
                    <span className="relative z-10">
                      <span className="lx-display block text-lg text-[color:var(--lx-on-night)] md:text-xl">
                        {cat.name}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-[color:var(--lx-on-night-muted)]">
                        {t("itemsCount", { count: cat._count.products })}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ FEATURES — three graces ============ */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <LxReveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="lx-rule mb-6">
              <span className="lx-eyebrow shrink-0 px-2">{t("whyKicker")}</span>
            </div>
            <h2 className="lx-display text-3xl md:text-[2.6rem]">
              {t("whyTitle")}{" "}
              <em className="italic text-[color:var(--lx-gold-deep)]">{t("whyTitleTail")}</em>
            </h2>
          </div>
        </LxReveal>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, desc, Icon }, i) => (
            <LxReveal key={title} delay={i * 90}>
              <div className="lx-card h-full p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--lx-gold-tint)] text-[color:var(--lx-gold-deep)] dark:text-[color:var(--lx-gold)]">
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="lx-display mt-6 text-xl">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--lx-muted)]">{desc}</p>
              </div>
            </LxReveal>
          ))}
        </div>
      </section>

      {/* ============ CTA — the invitation, in ink and gold ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <LxReveal>
          <div className="lx-hero-bg relative overflow-hidden rounded-[32px] px-6 py-16 text-center md:py-20">
            <div className="relative z-10 mx-auto max-w-xl">
              <div className="lx-rule mb-7">
                <span className="lx-eyebrow shrink-0 px-2">{t("ctaKicker")}</span>
              </div>
              <h2 className="lx-display text-3xl md:text-[2.6rem]">{t("ctaTitle")}</h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-[color:var(--lx-on-night-muted)]">
                {t("ctaDesc")}
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
                <Link href="/login" className="lx-btn lx-btn-white lx-btn-xl">
                  {t("joinCta")}
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link
                  href="/seller/apply"
                  className="lx-btn lx-btn-xl border border-[var(--lx-on-night-line)] text-[color:var(--lx-on-night)] hover:bg-[rgba(244,240,230,0.08)]"
                >
                  {t("becomeSeller")}
                </Link>
              </div>
            </div>
          </div>
        </LxReveal>
      </section>
    </div>
  );
}
