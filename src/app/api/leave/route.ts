import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { leaveSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  try {
    const parsed = await parseBody(req, leaveSchema);
    if (parsed.error) return parsed.error;
    const { type, id } = parsed.data;

    const url =
      type === "event"
        ? `${env.BACKEND_URL}/posts/${id}/leave`
        : `${env.BACKEND_URL}/clubs/${id}/leave`;

    const res = await fetch(url, {
      method: type === "club" ? "POST" : "DELETE",
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to leave";
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
    return NextResponse.json({ error: "Failed to leave" }, { status: 500 });
  }
}
