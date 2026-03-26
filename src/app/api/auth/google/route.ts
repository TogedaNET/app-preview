import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

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
    const { code } = (await req.json()) as { code?: string };

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

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
        { error: tokenData.error_description ?? "Failed to exchange Google code" },
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
      return NextResponse.json({ error: `Sign-in failed: ${body}` }, { status: backendRes.status });
    }

    const data = (await backendRes.json()) as BackendLoginResponse;
    return NextResponse.json({ token: data.accessToken });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
