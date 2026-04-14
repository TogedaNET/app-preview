import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ZodSchema } from "zod";
import { env } from "~/env.js";

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the validated data or a 400 NextResponse error.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T; error?: never } | { error: NextResponse; data?: never }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }

  return { data: result.data };
}

/**
 * Parse and validate URL search params against a Zod schema.
 * Extracts keys defined in the schema from searchParams.
 */
export function parseParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): { data: T; error?: never } | { error: NextResponse; data?: never } {
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }

  return { data: result.data };
}

/**
 * Create a sanitized error response from a failed backend call.
 * In development, includes the original error for debugging.
 */
export function backendError(
  fallbackMessage: string,
  status: number,
  rawError?: string,
): NextResponse {
  const error =
    env.NODE_ENV === "development" && rawError
      ? `${fallbackMessage}: ${rawError}`
      : fallbackMessage;
  return NextResponse.json({ error }, { status: status >= 500 ? 502 : status });
}
