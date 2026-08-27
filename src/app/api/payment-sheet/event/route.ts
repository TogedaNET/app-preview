import { type NextRequest, NextResponse } from "next/server";
import { parseParams } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { postIdParamSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  const searchParams = new URL(req.url).searchParams;
  const params = parseParams(searchParams, postIdParamSchema);
  if (params.error) return params.error;
  const { postId } = params.data;
  const promoCode = searchParams.get("promoCode");

  try {
    const backendUrl = new URL(
      `${env.BACKEND_URL}/stripe/connect/get-payment-sheet/${postId}`,
    );
    if (promoCode) backendUrl.searchParams.set("promoCode", promoCode);
    const res = await fetch(backendUrl, {
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let errorMessage = "Failed to initialize payment";
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
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
