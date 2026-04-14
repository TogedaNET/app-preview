import { type NextRequest, NextResponse } from "next/server";
import { parseParams } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { clubIdParamSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  const params = parseParams(new URL(req.url).searchParams, clubIdParamSchema);
  if (params.error) return params.error;
  const { clubId } = params.data;

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
