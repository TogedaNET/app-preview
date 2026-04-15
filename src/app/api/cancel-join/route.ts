import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { cancelJoinSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  try {
    const parsed = await parseBody(req, cancelJoinSchema);
    if (parsed.error) return parsed.error;
    const { type, id } = parsed.data;

    const url = type === "club"
      ? `${env.BACKEND_URL}/clubs/${id}/cancelJoinRequest`
      : `${env.BACKEND_URL}/posts/${id}/cancelJoinRequest`;

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to cancel request";
      try {
        const parsed = JSON.parse(body) as { message?: string; error?: string };
        errorMessage = parsed.message ?? parsed.error ?? errorMessage;
      } catch {
        // ignore parse error
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}
