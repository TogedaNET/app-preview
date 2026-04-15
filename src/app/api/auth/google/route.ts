import { type NextRequest, NextResponse } from "next/server";
import { backendError, parseBody } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { googleAuthSchema } from "~/lib/schemas";

interface GoogleTokenResponse {
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface BackendLoginResponse {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, googleAuthSchema);
    if (parsed.error) return parsed.error;
    const { code } = parsed.data;

    if (!env.GOOGLE_CLIENT_SECRET || !env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
    }

    // Exchange the authorization code for an id_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok || !tokenData.id_token) {
      return NextResponse.json(
        { error: "Failed to exchange Google code" },
        { status: 400 }
      );
    }

    // Pass the Google id_token to our backend
    const backendRes = await fetch(
      `${env.BACKEND_URL}/cognito/googleSignIn?googleIdToken=${encodeURIComponent(tokenData.id_token)}`,
      { method: "POST" }
    );

    if (!backendRes.ok) {
      const body = await backendRes.text().catch(() => "");
      return backendError("Google sign-in failed", backendRes.status, body);
    }

    const data = (await backendRes.json()) as BackendLoginResponse;
    const res = NextResponse.json({ token: data.accessToken });
    if (data.refreshToken) {
      res.cookies.set("togeda_refresh", data.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 400,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ error: "Google sign-in failed" }, { status: 500 });
  }
}
