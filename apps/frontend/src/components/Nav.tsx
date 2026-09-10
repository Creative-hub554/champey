"use client";

import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session-client";
import { useTranslations } from "next-intl";
import {
  ChampeyIcon,
  LotusIcon,
  JasmineIcon,
  RumdulIcon,
  BasketIcon,
  LensIcon,
  ProfileIcon,
  ChampeyCMarkIcon,
} from "./icons/khmer-flora";
import { SearchBar } from "./SearchBar";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { SkinSwitcher, SkinSwatchRow } from "./SkinSwitcher";
import { NotificationsBell } from "./social/NotificationsBell";
import { Avatar } from "./social/Avatar";
import { useCartStore } from "@/stores/cart";

type NavItem = { href: string; label: string };

/*
 * Champey Social chrome (Facebook × Instagram hybrid):
 * - Desktop: a clean Facebook-style top bar (surface card, soft shadow,
 *   centered icon tabs) — no more floating night pill.
 * - Mobile: an Instagram-style fixed bottom tab bar with flower icons;
 *   the top bar then carries only logo + search + hamburger.
 * Icons are the Khmer flora set: champey (feed), lotus (shop),
 * jasmine (jobs), rumdul (messages). Values come from the --chrome-* /
 * --cp-* token layer in globals.css.
 */

export function Nav() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  const [accountOpen, setAccountOpen] = useState(false); // avatar menu
  const [msgUnread, setMsgUnread] = useState(0);
  const { data: session, status, signOut } = useSession();
  const cartItems = useCartStore((s) => s.items);
  const initialized = useCartStore((s) => s.initialized);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const signedIn = status === "authenticated";

  useEffect(() => {
    if (!initialized && signedIn) {
      fetchCart();
    } else if (!initialized) {
      useCartStore.setState({ initialized: true });
    }
  }, [initialized, signedIn, fetchCart]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    const poll = () => {
      fetch("/api/threads")
        .then((r) => (r.ok ? r.json() : []))
        .then((threads: { unreadCount: number }[]) => {
          if (active) {
            setMsgUnread(
              Array.isArray(threads)
                ? threads.reduce((sum, th) => sum + (th.unreadCount || 0), 0)
                : 0
            );
          }
        })
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 45000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session?.user?.id]);

  const itemCls =
    "block px-4 py-2 text-sm text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--chrome-text)] transition-colors whitespace-nowrap";
  const iconBtn = "cp-iconbtn p-2";

  /*
   * Core destinations — social-graph first. Feed is home; People (discover
   * and follow) and Groups (communities) sit beside it. Market and Jobs are
   * one tap away in "More" but never crowd the social chrome.
   */
  const tabs = [
    { href: "/feed", label: t("feed"), Icon: ChampeyIcon, isActive: (p: string) => p.startsWith("/feed") },
    { href: "/people", label: t("people"), Icon: LensIcon, isActive: (p: string) => p.startsWith("/people") },
    { href: "/community/groups", label: t("groups"), Icon: LotusIcon, isActive: (p: string) => p.startsWith("/community/groups") },
  ];

  // Secondary links shown in the mobile drawer (desktop uses sidebars).
  // Social-adjacent utilities first; commerce and careers grouped below.
  const moreGroups: { label: string; items: NavItem[] }[] = [
    {
      label: t("social"),
      items: [
        { href: "/community", label: t("community") },
        { href: "/saved", label: t("savedPosts") },
      ],
    },
    {
      label: t("market"),
      items: [
        { href: "/shop", label: t("shop") },
        { href: "/cart", label: t("cart") },
        { href: "/orders", label: t("orders") },
        { href: "/warranties", label: t("warranties") },
      ],
    },
    {
      label: t("selling"),
      items: [
        { href: "/seller/dashboard", label: t("seller") },
        { href: "/seller/products", label: t("products") },
        { href: "/seller/orders", label: t("sellerOrders") },
      ],
    },
    {
      label: t("jobs"),
      items: [
        { href: "/jobs", label: t("jobs") },
        { href: "/jobs/post", label: t("postJob") },
        { href: "/jobs/my-applications", label: t("myApplications") },
        { href: "/community/resume", label: t("resume") },
      ],
    },
  ];

  const accountMenu = (closeDrawer = false) => (
    <>
      <Link
        href="/account"
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
        }}
        className={itemCls}
      >
        {t("dashboard")}
      </Link>
      <Link
        href={`/profile/${session?.user?.id ?? ""}`}
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
        }}
        className={itemCls}
      >
        {t("myProfile")}
      </Link>
      <Link
        href="/profile/edit"
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
        }}
        className={itemCls}
      >
        {t("editProfile")}
      </Link>
      <Link
        href="/saved"
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
        }}
        className={itemCls}
      >
        {t("savedPosts")}
      </Link>
      {session?.user?.role === "ADMIN" && (
        <Link
          href="/admin/users"
          onClick={() => {
            setAccountOpen(false);
            if (closeDrawer) setOpen(false);
          }}
          className={itemCls}
        >
          {t("admin")}
        </Link>
      )}
      <Link
        href="/support"
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
        }}
        className={itemCls}
      >
        {t("helpSupport")}
      </Link>
      <button
        onClick={() => {
          setAccountOpen(false);
          if (closeDrawer) setOpen(false);
          signOut();
        }}
        className="w-full text-left px-4 py-2 text-sm text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--cp-flower-deep)] transition-colors"
      >
        {t("signOut")}
      </button>
    </>
  );

  return (
    <>
      {/* ============ Top bar (Facebook-style) ============ */}
      <nav
        className="sticky top-0 z-40 border-b bg-[var(--chrome-bg)]"
        style={{
          borderColor: "var(--chrome-line)",
          viewTransitionName: "site-header",
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
            <ChampeyCMarkIcon width={30} height={30} />
            <span
              className="hidden text-[19px] tracking-tight text-[var(--chrome-text)] sm:block"
              style={{ fontFamily: "var(--font-serif-display)", letterSpacing: "-0.01em" }}
            >
              champey
            </span>
          </Link>

          <div className="hidden max-w-xs flex-1 md:block">
            <SearchBar />
          </div>

          {/* Center icon tabs (desktop) */}
          <div className="mx-auto hidden items-center gap-1 md:flex">
            {tabs.map(({ href, label, Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className={`relative flex h-11 w-16 items-center justify-center rounded-xl transition-all duration-200 lg:w-20 ${
                    active
                      ? "text-[var(--cp-flower)]"
                      : "text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--chrome-text)]"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-x-2 bottom-0 h-[3px] rounded-full"
                      style={{ background: "var(--cp-flower-grad)" }}
                    />
                  )}
                  <Icon size={24} strokeWidth={active ? 2.1 : 1.8} />
                </Link>
              );
            })}
          </div>

          {/* Right cluster (desktop) */}
          <div className="ml-auto flex items-center gap-1">
            <Link href="/cart" aria-label={t("cart")} title={t("cart")} className={`${iconBtn} relative hidden md:inline-flex`}>
              <BasketIcon className="h-[22px] w-[22px]" />
              {itemCount > 0 && (
                <span className="cp-badge" style={{ position: "absolute", top: 0, right: 0 }}>
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <Link href="/messages" aria-label={t("messages")} title={t("messages")} className={`${iconBtn} relative hidden md:inline-flex`}>
              <RumdulIcon className="h-[22px] w-[22px]" />
              {msgUnread > 0 && (
                <span className="cp-badge" style={{ position: "absolute", top: 0, right: 0 }}>
                  {msgUnread > 99 ? "99+" : msgUnread}
                </span>
              )}
            </Link>

            <span className="hidden md:contents">
              <NotificationsBell />
              <ThemeToggle />
              <SkinSwitcher />
              <LocaleSwitcher />
            </span>

            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="cp-iconbtn p-1"
                  aria-label="Account menu"
                >
                  <Avatar
                    user={{
                      name: session.user.name,
                      image: (session.user as { image?: string | null }).image,
                    }}
                    size={32}
                  />
                </button>
                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 min-w-52 overflow-hidden rounded-xl border py-1 shadow-[0_18px_50px_-18px_rgba(28,18,38,0.35)]"
                    style={{ background: "var(--chrome-surface)", borderColor: "var(--chrome-line)" }}
                  >
                    {accountMenu(false)}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="hidden rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(194,73,127,0.8)] transition-transform hover:-translate-y-0.5 md:block"
                style={{ background: "var(--cp-flower-grad)" }}
              >
                {t("signIn")}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="cp-iconbtn p-2 md:hidden"
              aria-label={t("toggleMenu")}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div
            className="animate-slide-down border-t px-4 py-3 md:hidden"
            style={{ background: "var(--chrome-surface)", borderColor: "var(--chrome-line)" }}
          >
            <SearchBar />

            <SkinSwatchRow />

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[var(--chrome-text)] hover:bg-[var(--chrome-hover)] transition-colors"
            >
              {t("cart")}
              {itemCount > 0 && <span className="cp-badge-inline">{itemCount > 99 ? "99+" : itemCount}</span>}
            </Link>

            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[var(--chrome-text)] hover:bg-[var(--chrome-hover)] transition-colors"
            >
              {t("messages")}
              {msgUnread > 0 && <span className="cp-badge-inline">{msgUnread > 99 ? "99+" : msgUnread}</span>}
            </Link>

            {moreGroups.map((g) => (
              <div key={g.label}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--cp-flower)]">
                  {g.label}
                </p>
                {g.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--chrome-text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--chrome-line)" }}>
              {session?.user ? (
                accountMenu(true)
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 font-semibold text-[var(--cp-flower)] hover:bg-[var(--chrome-hover)] transition-colors"
                >
                  {t("signIn")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ============ Bottom tab bar (Instagram-style, mobile) ============ */}
      <div className="cp-tabbar md:hidden" role="navigation" aria-label={t("toggleMenu")}>
        {tabs.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`cp-tab ${active ? "cp-tab-active" : ""}`}
            >
              <Icon size={25} strokeWidth={active ? 2.1 : 1.8} />
            </Link>
          );
        })}
        <Link href="/cart" aria-label={t("cart")} title={t("cart")} className={`cp-tab ${itemCount > 0 ? "cp-tab-active" : ""}`}>
          <BasketIcon className="h-[25px] w-[25px]" />
          {itemCount > 0 && <span className="cp-badge">{itemCount > 99 ? "99+" : itemCount}</span>}
        </Link>
        <Link href="/messages" aria-label={t("messages")} title={t("messages")} className={`cp-tab ${msgUnread > 0 ? "cp-tab-active" : ""}`}>
          <RumdulIcon className="h-[25px] w-[25px]" />
          {msgUnread > 0 && <span className="cp-badge">{msgUnread > 99 ? "99+" : msgUnread}</span>}
        </Link>
        <Link
          href={session?.user ? "/account" : "/login"}
          aria-label={session?.user ? t("dashboard") : t("signIn")}
          title={session?.user ? t("dashboard") : t("signIn")}
          className="cp-tab"
        >
          {session?.user ? (
            <Avatar
              user={{
                name: session.user.name,
                image: (session.user as { image?: string | null }).image,
              }}
              size={26}
            />
          ) : (
            <ProfileIcon className="h-[25px] w-[25px]" />
          )}
        </Link>
      </div>
    </>
  );
}
