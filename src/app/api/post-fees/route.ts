import { type NextRequest, NextResponse } from "next/server";
import { parseParams } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { postIdParamSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  const params = parseParams(new URL(req.url).searchParams, postIdParamSchema);
  if (params.error) return params.error;
  const { postId } = params.data;

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}
