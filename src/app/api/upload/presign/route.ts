import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

// Accepts the image blob from the client, gets a presigned URL server-side,
// uploads to S3 server-side (avoids CORS), and returns the final S3 URL.
export async function POST(req: NextRequest) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const bucketName = formData.get("bucketName") as string | null;
    const keyName = formData.get("keyName") as string | null;

    if (!file || !bucketName || !keyName) {
      return NextResponse.json({ error: "Missing file, bucketName or keyName" }, { status: 400 });
    }

    // Append .jpeg if not already present (matches iOS behaviour)
    const finalKeyName = keyName.endsWith(".jpeg") ? keyName : `${keyName}.jpeg`;
    const params = new URLSearchParams({ bucketName, keyName: finalKeyName });

    // Step 1: get presigned PUT URL from backend
    const presignRes = await fetch(`${env.BACKEND_URL}/users/generatePresignedPutUrl?${params.toString()}`, {
      method: "GET",
      headers: { Authorization: authorization },
    });

    const presignText = await presignRes.text();
    console.log("[presign] status:", presignRes.status, "body:", presignText);

    if (!presignRes.ok) {
      return NextResponse.json({ error: presignText }, { status: presignRes.status });
    }

    let presignedUrl: string;
    try {
      const parsed = JSON.parse(presignText) as string | { url?: string; presignedUrl?: string };
      presignedUrl = typeof parsed === "string" ? parsed : (parsed.url ?? parsed.presignedUrl ?? presignText);
    } catch {
      presignedUrl = presignText;
    }

    // Step 2: upload to S3 server-side (no CORS)
    const imageBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: imageBuffer,
    });

    console.log("[s3-upload] status:", uploadRes.status);

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text().catch(() => "");
      console.log("[s3-upload] error:", uploadErr);
      return NextResponse.json({ error: "S3 upload failed" }, { status: uploadRes.status });
    }

    const s3Url = `https://${bucketName}.s3.eu-central-1.amazonaws.com/${finalKeyName}`;
    return NextResponse.json({ url: s3Url });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
