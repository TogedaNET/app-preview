import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { cognitoInitiateAuth } from "~/lib/cognito-utils";
import { rateLimit } from "~/lib/rate-limit";
import { loginSchema } from "~/lib/schemas";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "auth:login", 5);
  if (limited) return limited;

  try {
    const parsed = await parseBody(req, loginSchema);
    if (parsed.error) return parsed.error;
    const { email, password } = parsed.data;

    const authResult = await cognitoInitiateAuth(email, password);
    const { AccessToken: accessToken, RefreshToken: refreshToken } = authResult.AuthenticationResult;

    const res = NextResponse.json({ success: true, token: accessToken });
    if (refreshToken) {
      res.cookies.set("togeda_refresh", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 400, // upper bound; actual expiry governed by Cognito
      });
    }
    return res;
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { message: string };
    const message =
      error.code === "NotAuthorizedException"
        ? "Incorrect email or password"
        : error.message;
    return NextResponse.json({ error: message, code: error.code }, { status: 400 });
  }
}
