import { clerkMiddleware } from "@clerk/nextjs/server";

// All routes are public by default — Clerk is used only for identity,
// not to gate any page. Auth state is checked per-feature in client hooks.
export default clerkMiddleware({
  // Tolerate up to 60s of clock drift between Vercel edge nodes and Clerk
  clockSkewInMs: 60_000,
});

export const config = {
  // Must cover all routes where auth() is called (including server actions, which POST to page URLs).
  // Skips static assets and Next.js internals. No page is gated — everything is public by default.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
