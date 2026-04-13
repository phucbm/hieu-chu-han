/**
 * pwa.ts — Visit and install tracking via counterapi.dev v2
 * All functions are fire-and-forget or parallel-fetch; they never throw.
 */

const BASE = "https://api.counterapi.dev/v2/phucbm";
const KEY = process.env.NEXT_PUBLIC_COUNTERAPI_KEY ?? "";

const headers: HeadersInit = {
  Authorization: `Bearer ${KEY}`,
};

const isProd = process.env.NODE_ENV === "production";

/** Increment the visit counter. Fire-and-forget; silent on failure. No-op in development. */
export async function trackPageVisit(): Promise<void> {
  if (!isProd) return;
  try {
    await fetch(`${BASE}/hieuchuhan-visits/up`, { headers });
  } catch {
    // silent fail
  }
}

/** Increment the install counter. Fire-and-forget; silent on failure. No-op in development. */
export async function trackInstall(): Promise<void> {
  if (!isProd) return;
  try {
    await fetch(`${BASE}/hieuchuhan-installs/up`, { headers });
  } catch {
    // silent fail
  }
}

export interface Stats {
  visits: number;
  installs: number;
}

/** Fetch both counters in parallel. Returns zeroes on any error. */
export async function getStats(): Promise<Stats> {
  try {
    const [visitsRes, installsRes] = await Promise.all([
      fetch(`${BASE}/hieuchuhan-visits`, { headers }),
      fetch(`${BASE}/hieuchuhan-installs`, { headers }),
    ]);
    const [visitsData, installsData] = await Promise.all([
      visitsRes.json() as Promise<{ count: number }>,
      installsRes.json() as Promise<{ count: number }>,
    ]);
    return { visits: visitsData.count, installs: installsData.count };
  } catch {
    return { visits: 0, installs: 0 };
  }
}
