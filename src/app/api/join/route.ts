import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, id } = (await req.json()) as { type: "event" | "club"; id: string };

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
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
