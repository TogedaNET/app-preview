import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = (await req.json()) as { postId: string };

    const res = await fetch(`${env.BACKEND_URL}/posts/${postId}/arrival`, {
      method: "POST",
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to confirm arrival";
      try {
        const parsed = JSON.parse(body) as { message?: string; error?: string };
        errorMessage = parsed.message ?? parsed.error ?? errorMessage;
      } catch {
        // ignore parse error
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
