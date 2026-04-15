import { type NextRequest, NextResponse } from "next/server";
import { backendError } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { verifyAuth } from "~/lib/verify-jwt";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;

  const res = await fetch(`${env.BACKEND_URL}/users/${auth.user.sub}`, {
    headers: { Authorization: auth.authorization },
    cache: "no-store",
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Not found", needsProfile: true }, { status: 404 });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return backendError("Failed to fetch user", res.status, body);
  }

  return NextResponse.json(await res.json());
}
