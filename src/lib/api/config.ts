/**
 * Runtime config for the API layer.
 *
 * Frontend-only mode: there is no backend yet, so the app runs entirely on the
 * local mock data in src/lib/api/mocks. When a real backend exists, set
 * NEXT_PUBLIC_API_BASE_URL to its origin and the API layer will call it, still
 * falling back to mocks if a call fails.
 *
 * Mock mode is the DEFAULT (no base URL configured). You can force it on even
 * when a base URL is set with NEXT_PUBLIC_USE_MOCKS=true.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const USE_MOCKS = !API_BASE || process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Refuses to run a PRODUCTION build with no backend configured.
 *
 * Mock mode defaulting to on is right for local development and dangerous in
 * a deploy: forgetting NEXT_PUBLIC_API_BASE_URL silently runs the entire app
 * — sign-in, payments, creator gates — against in-memory fixtures, and
 * everything looks like it works.
 */
if (USE_MOCKS && process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
  // Fail closed. In mock mode sign-in accepts ANY password and content
  // unlocks are granted without payment — an app that silently behaves that
  // way in production is far more dangerous than one that visibly refuses to
  // start. A deliberate NEXT_PUBLIC_USE_MOCKS=true is still honoured (that is
  // someone choosing a fixture build on purpose); a merely missing base URL
  // is not.
  throw new Error(
    "[WAWU] NEXT_PUBLIC_API_BASE_URL is not set in a production build. Refusing to run on mock data: " +
      "sign-in would accept any password and paid content would unlock for free. " +
      "Set the API base URL, or set NEXT_PUBLIC_USE_MOCKS=true to acknowledge a deliberate fixture build.",
  );
}

/**
 * WAWU ID (the separate identity service — owns signup/login/OTP/password
 * reset, see .pipeline/supersedes.json S-4) is called directly, never proxied
 * through this backend. Defaults to its local dev port (confirmed via
 * WAWU-ID's own src/main.ts — no global route prefix, routes mounted at
 * /auth/* directly). Deployed base: https://wawu-id-production.up.railway.app
 * (per WAWU-ID's .env.example APP_URL) — set NEXT_PUBLIC_WAWU_ID_BASE_URL to
 * that in the real environment.
 */
export const WAWU_ID_BASE = process.env.NEXT_PUBLIC_WAWU_ID_BASE_URL ?? "http://localhost:3000";