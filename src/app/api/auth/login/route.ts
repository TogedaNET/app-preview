import { type NextRequest, NextResponse } from "next/server";
import { cognitoInitiateAuth } from "~/lib/cognito-utils";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email: string;
      password: string;
    };

    const authResult = await cognitoInitiateAuth(email, password);
    const accessToken = authResult.AuthenticationResult.AccessToken;

    return NextResponse.json({ success: true, token: accessToken });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { message: string };
    const message =
      error.code === "NotAuthorizedException"
        ? "Incorrect email or password"
        : error.message;
    return NextResponse.json({ error: message, code: error.code }, { status: 400 });
  }
}
