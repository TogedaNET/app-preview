import { type NextRequest, NextResponse } from "next/server";
import { parseParams } from "~/lib/api-helpers";
import { env } from "~/env.js";
import { postIdParamSchema } from "~/lib/schemas";
import { verifyAuth } from "~/lib/verify-jwt";

interface EventDetails {
  status: string;
  allowJoinAfterStart: boolean;
  participantsCount: number;
  maximumPeople: number;
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  const params = parseParams(new URL(req.url).searchParams, postIdParamSchema);
  if (params.error) return params.error;
  const { postId } = params.data;

  try {
    const res = await fetch(`${env.BACKEND_URL}/posts/${postId}`, {
      headers: { Authorization: authorization },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch event" }, { status: res.status });
    }

    const data = (await res.json()) as EventDetails;
    return NextResponse.json({
      status: data.status,
      allowJoinAfterStart: data.allowJoinAfterStart,
      participantsCount: data.participantsCount,
      maximumPeople: data.maximumPeople,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
