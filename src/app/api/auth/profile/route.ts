import { type NextRequest, NextResponse } from "next/server";
import { createUserProfile, type ProfileData } from "~/lib/cognito-utils";
import { env } from "~/env.js";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profileData = (await req.json()) as ProfileData;
    const token = authorization.replace(/^Bearer\s+/i, "");

    const res = await createUserProfile(token, profileData, env.BACKEND_URL);

    if (!res.ok && res.status !== 409) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to create profile: ${body}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
