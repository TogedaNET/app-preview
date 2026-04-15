import { type NextRequest, NextResponse } from "next/server";
import { backendError, parseBody } from "~/lib/api-helpers";
import { createUserProfile } from "~/lib/cognito-utils";
import { env } from "~/env.js";
import { profileSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) return authResult.error;

  try {
    const parsed = await parseBody(req, profileSchema);
    if (parsed.error) return parsed.error;
    const profileData = parsed.data;
    const token = authResult.token;

    const res = await createUserProfile(token, profileData, env.BACKEND_URL);

    if (!res.ok && res.status !== 409) {
      const body = await res.text().catch(() => "");
      return backendError("Failed to create profile", res.status, body);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 400 });
  }
}
