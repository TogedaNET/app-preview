import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "~/lib/api-helpers";
import { cognitoSignUp } from "~/lib/cognito-utils";
import { rateLimit } from "~/lib/rate-limit";
import { registerSchema } from "~/lib/schemas";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "auth:register", 5);
  if (limited) return limited;

  try {
    const parsed = await parseBody(req, registerSchema);
    if (parsed.error) return parsed.error;
    const { email, password } = parsed.data;

    await cognitoSignUp(email, password);
    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { message: string };
    return NextResponse.json(
      { error: error.message, code: error.code ?? "UnknownError" },
      { status: 400 }
    );
  }
}
