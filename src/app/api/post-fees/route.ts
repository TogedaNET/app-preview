import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  try {
    const res = await fetch(`${env.BACKEND_URL}/posts/${postId}/fees`, {
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to fetch fees";
      try {
        const parsed = JSON.parse(body) as { message?: string; error?: string };
        errorMessage = parsed.message ?? parsed.error ?? errorMessage;
      } catch {
        // ignore parse error
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
