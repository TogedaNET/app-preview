import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

interface EventDetails {
  status: string;
  allowJoinAfterStart: boolean;
  participantsCount: number;
  maximumPeople: number;
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

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
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
