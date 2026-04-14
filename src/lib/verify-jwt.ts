import { createRemoteJWKSet, jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

const region = env.COGNITO_USER_POOL_ID.split("_")[0]!;
const issuer = `https://cognito-idp.${region}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`;
const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(jwksUrl);

export interface VerifiedUser {
  sub: string;
  email?: string;
}

/**
 * Extract Bearer token from Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/.exec(header);
  return match?.[1] ?? null;
}

/**
 * Verify a Cognito JWT and return decoded claims.
 */
export async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });
    const sub = payload.sub;
    if (!sub) return null;
    const email = (payload.email ?? payload.username) as string | undefined;
    return { sub, email };
  } catch {
    return null;
  }
}

/**
 * Verify the Authorization header on a request.
 * Returns { user, token, authorization } on success, or a 401 NextResponse on failure.
 */
export async function verifyAuth(
  req: NextRequest,
): Promise<
  | { user: VerifiedUser; token: string; authorization: string; error?: never }
  | { error: NextResponse; user?: never; token?: never; authorization?: never }
> {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await verifyToken(token);
  if (!user) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }

  return { user, token, authorization: `Bearer ${token}` };
}
