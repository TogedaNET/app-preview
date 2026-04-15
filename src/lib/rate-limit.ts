import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface SlidingWindow {
  timestamps: number[];
}

const windows = new Map<string, SlidingWindow>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, window] of windows) {
    window.timestamps = window.timestamps.filter((t) => t > cutoff);
    if (window.timestamps.length === 0) windows.delete(key);
  }
}

/**
 * In-memory sliding-window rate limiter.
 * Returns a 429 NextResponse if limit is exceeded, or null if allowed.
 */
export function rateLimit(
  req: NextRequest,
  key: string,
  maxRequests: number,
  windowMs = 60_000,
): NextResponse | null {
  cleanup(windowMs);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const fullKey = `${key}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  let window = windows.get(fullKey);
  if (!window) {
    window = { timestamps: [] };
    windows.set(fullKey, window);
  }

  window.timestamps = window.timestamps.filter((t) => t > cutoff);

  if (window.timestamps.length >= maxRequests) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  window.timestamps.push(now);
  return null;
}
