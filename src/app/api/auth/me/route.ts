import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${env.BACKEND_URL}/users/me`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  if (res.status === 404) {
    return NextResponse.json(
      { error: "Not found", needsProfile: true },
      { status: 404 }
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: body }, { status: res.status });
  }

  const data = (await res.json()) as unknown;
  return NextResponse.json(data);
}
