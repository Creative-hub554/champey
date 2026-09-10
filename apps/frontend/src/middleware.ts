import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isClerkEnabled } from "./lib/clerk-flag";

const intlMiddleware = createMiddleware(routing);

/**
 * With Clerk configured, authProto composes clerkMiddleware + next-intl:
 * route handlers under /api are locale-independent — Clerk middleware must
 * still run (lib/auth.ts resolves sessions through it) but next-intl must
 * not — its locale redirect turns client-side fetch("/api/...") into a 307
 * to /en/api/... which matches no route and 404s.
 */
function authProto(auth: unknown, request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

/**
 * Guest mode (no publishable key): run next-intl only. clerkMiddleware
 * hard-requires the publishable key and would throw for every request;
 * without it nothing is authenticated anyway.
 */
function guestProto(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export default isClerkEnabled() ? clerkMiddleware(authProto) : guestProto;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
