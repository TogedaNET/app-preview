import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  if (!clubId) {
    return NextResponse.json({ error: "Missing clubId" }, { status: 400 });
  }

  try {
    const res = await fetch(`${env.BACKEND_URL}/clubs/${clubId}`, {
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch status" }, { status: res.status });
    }

    const data = (await res.json()) as { currentUserStatus?: string; currentUserRole?: string };
    return NextResponse.json({
      currentUserStatus: data.currentUserStatus ?? "NONE",
      currentUserRole: data.currentUserRole ?? "NORMAL",
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
