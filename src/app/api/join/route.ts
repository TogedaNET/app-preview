import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { joinSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  try {
    const parsed = await parseBody(req, joinSchema);
    if (parsed.error) return parsed.error;
    const { type, id } = parsed.data;

    let url: string;
    if (type === "event") {
      url = `${env.BACKEND_URL}/posts/${id}/tryToJoinPost`;
    } else {
      url = `${env.BACKEND_URL}/clubs/${id}/members`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authorization },
    });

    if (!res.ok && res.status !== 409) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to join";
      try {
        const parsed = JSON.parse(body) as { message?: string; error?: string };
        errorMessage = parsed.message ?? parsed.error ?? errorMessage;
      } catch {
        // ignore parse error
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    return NextResponse.json({ success: true }, { status: res.status === 409 ? 409 : 200 });
  } catch {
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }
}
