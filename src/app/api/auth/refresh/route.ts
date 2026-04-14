import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { cognitoRefreshAuth } from "~/lib/cognito-utils";
import { rateLimit } from "~/lib/rate-limit";
import { refreshSchema } from "~/lib/schemas";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "auth:refresh", 10);
  if (limited) return limited;

  const refreshToken = req.cookies.get("togeda_refresh")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const parsed = await parseBody(req, refreshSchema);
  if (parsed.error) return parsed.error;
  const { username } = parsed.data;

  try {
    const result = await cognitoRefreshAuth(refreshToken, username);
    const { AccessToken: accessToken, RefreshToken: newRefreshToken } = result.AuthenticationResult;

    const res = NextResponse.json({ token: accessToken });

    // Cognito only returns a new refresh token occasionally — update cookie if provided
    if (newRefreshToken) {
      res.cookies.set("togeda_refresh", newRefreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 400,
      });
    }
    return res;
  } catch {
    // Refresh token expired or invalid — force re-login
    const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
    res.cookies.delete("togeda_refresh");
    return res;
  }
}
