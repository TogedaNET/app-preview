import { type NextRequest, NextResponse } from "next/server";
import { cognitoConfirmSignUp, cognitoInitiateAuth, createUserProfile, type ProfileData } from "~/lib/cognito-utils";
import { env } from "~/env.js";

export async function POST(req: NextRequest) {
  try {
    const { email, password, code, profile } = (await req.json()) as {
      email: string;
      password: string;
      code: string;
      profile: ProfileData;
    };

    try {
      await cognitoConfirmSignUp(email, code);
    } catch (err) {
      const error = err as NodeJS.ErrnoException & { message: string };
      return NextResponse.json(
        { error: error.message, code: error.code ?? "UnknownError" },
        { status: 400 }
      );
    }

    let accessToken: string;
    try {
      const authResult = await cognitoInitiateAuth(email, password);
      accessToken = authResult.AuthenticationResult.AccessToken;
    } catch (err) {
      const error = err as Error;
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const profileRes = await createUserProfile(accessToken, profile, env.BACKEND_URL);
    if (!profileRes.ok && profileRes.status !== 409) {
      const body = await profileRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to create profile: ${body}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, token: accessToken });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
