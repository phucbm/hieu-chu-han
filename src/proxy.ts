import { clerkMiddleware } from "@clerk/nextjs/server";

// All routes are public by default — Clerk is used only for identity,
// not to gate any page. Auth state is checked per-feature in client hooks.
export default clerkMiddleware({
  // Tolerate up to 60s of clock drift between Vercel edge nodes and Clerk
  clockSkewInMs: 60_000,
});

export const config = {
  // Only run on API routes — no page is gated behind auth, so never intercept page loads.
  // This prevents Clerk handshake failures from breaking the app for users with expired sessions.
  matcher: ["/(api|trpc)(.*)"],
};
