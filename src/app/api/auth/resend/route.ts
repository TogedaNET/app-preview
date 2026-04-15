import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { cognitoResendCode } from "~/lib/cognito-utils";
import { rateLimit } from "~/lib/rate-limit";
import { resendSchema } from "~/lib/schemas";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "auth:resend", 3);
  if (limited) return limited;

  try {
    const parsed = await parseBody(req, resendSchema);
    if (parsed.error) return parsed.error;
    const { email } = parsed.data;

    await cognitoResendCode(email);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { message: string };
    return NextResponse.json(
      { error: error.message, code: error.code ?? "UnknownError" },
      { status: 400 }
    );
  }
}
