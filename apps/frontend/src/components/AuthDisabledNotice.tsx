"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/session-client";
import { isClerkEnabled } from "@/lib/clerk-flag";

/**
 * Guest mode (no Clerk publishable key): auth surfaces can't function, so
 * show a friendly notice instead of the Clerk component (which would throw).
 * Wrap the real component as children so Clerk renders unchanged once a key
 * is configured.
 */
export function AuthDisabledNotice({ children }: { children: React.ReactNode }) {
  const t = useTranslations("authDisabled");
  const { status } = useSession();

  if (isClerkEnabled() || status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-[var(--lx-line, #e7e8f0)] bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
        {t("description")}
      </p>
      <Link
        href="/"
        className="btn-primary mt-6 inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
      >
        {t("backToStore")}
      </Link>
    </div>
  );
}
