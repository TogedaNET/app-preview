import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

function extractSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
    ) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = extractSub(authorization.replace("Bearer ", ""));
  if (!sub) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = await fetch(`${env.BACKEND_URL}/users/${sub}`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Not found", needsProfile: true }, { status: 404 });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: body }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}
