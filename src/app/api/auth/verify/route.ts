import { type NextRequest, NextResponse } from "next/server";
import { cognitoConfirmSignUp, cognitoInitiateAuth } from "~/lib/cognito-utils";

export async function POST(req: NextRequest) {
  try {
    const { email, password, code } = (await req.json()) as {
      email: string;
      password: string;
      code: string;
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

    return NextResponse.json({ success: true, token: accessToken });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
