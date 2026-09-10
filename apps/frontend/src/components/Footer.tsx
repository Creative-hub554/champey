"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChampeyCMarkIcon } from "./icons/khmer-flora";

/*
 * Champey Social footer: warm surface card matching the Facebook-style
 * chrome, with the flower-gradient mark lockup.
 */
export function Footer() {
  const t = useTranslations("nav");

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("social"),
      links: [
        { href: "/feed", label: t("feed") },
        { href: "/community", label: t("community") },
        { href: "/messages", label: t("messages") },
      ],
    },
    {
      title: t("shop"),
      links: [
        { href: "/shop", label: t("shop") },
        { href: "/orders", label: t("orders") },
        { href: "/seller/dashboard", label: t("seller") },
      ],
    },
    {
      title: t("jobs"),
      links: [
        { href: "/jobs", label: t("jobBoard") },
        { href: "/jobs/post", label: t("postJob") },
        { href: "/community/resume", label: t("resume") },
      ],
    },
  ];

  return (
    <footer
      className="border-t bg-[var(--chrome-bg)] text-[var(--chrome-text)]"
      style={{ borderColor: "var(--chrome-line)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <ChampeyCMarkIcon width={30} height={30} />
              <span
                className="text-lg tracking-tight"
                style={{ fontFamily: "var(--font-serif-display)", letterSpacing: "-0.01em" }}
              >
                champey
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-[var(--chrome-muted)]">
              Social · Market · Careers
            </p>
            <p
              className="mt-1.5 text-xs uppercase tracking-[0.28em]"
              style={{
                background: "var(--cp-flower-grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              bytheo
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-flower-deep)] dark:text-[var(--cp-flower)]">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[var(--chrome-muted)] transition-colors hover:text-[var(--cp-flower)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-[var(--chrome-muted)] sm:flex-row"
          style={{ borderColor: "var(--chrome-line)" }}
        >
          <p>
            © {new Date().getFullYear()} Champey. {t("footerRights")}
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/terms/buyer" className="transition-colors hover:text-[var(--cp-flower)]">
              {t("buyerTerms")}
            </Link>
            <Link href="/terms/seller" className="transition-colors hover:text-[var(--cp-flower)]">
              {t("sellerTerms")}
            </Link>
            <Link href="/support" className="transition-colors hover:text-[var(--cp-flower)]">
              {t("helpSupport")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
