import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { cognitoConfirmSignUp, cognitoInitiateAuth } from "~/lib/cognito-utils";
import { rateLimit } from "~/lib/rate-limit";
import { verifySchema } from "~/lib/schemas";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "auth:verify", 5);
  if (limited) return limited;

  try {
    const parsed = await parseBody(req, verifySchema);
    if (parsed.error) return parsed.error;
    const { email, password, code } = parsed.data;

    try {
      await cognitoConfirmSignUp(email, code);
    } catch (err) {
      const error = err as NodeJS.ErrnoException & { message: string };
      return NextResponse.json(
        { error: error.message, code: error.code ?? "UnknownError" },
        { status: 400 }
      );
    }

    // If password was provided (same-session flow), auto-login after confirmation
    if (password) {
      let accessToken: string;
      try {
        const authResult = await cognitoInitiateAuth(email, password);
        accessToken = authResult.AuthenticationResult.AccessToken;
      } catch (err) {
        const error = err as Error;
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, token: accessToken });
    }

    // No password (page was refreshed) — confirm succeeded, user must log in manually
    return NextResponse.json({ success: true, token: null });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
