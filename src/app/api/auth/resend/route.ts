import { type NextRequest, NextResponse } from "next/server";
import { cognitoResendCode } from "~/lib/cognito-utils";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string };

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
