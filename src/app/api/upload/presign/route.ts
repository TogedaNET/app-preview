import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";
import { verifyAuth } from "~/lib/verify-jwt";

const ALLOWED_BUCKETS = new Set(["togeda-profile-photos"]);
const VALID_KEY_PATTERN = /^[a-zA-Z0-9\-_/.]+$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46 ...  57 45 42 50
const MAGIC_BYTES: Array<{ type: string; bytes: number[] }> = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
];

// Accepts the image blob from the client, gets a presigned URL server-side,
// uploads to S3 server-side (avoids CORS), and returns the final S3 URL.
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.error;
  const authorization = auth.authorization;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const bucketName = formData.get("bucketName") as string | null;
    const keyName = formData.get("keyName") as string | null;

    if (!file || !bucketName || !keyName) {
      return NextResponse.json({ error: "Missing file, bucketName or keyName" }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.has(bucketName)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }

    if (!VALID_KEY_PATTERN.test(keyName) || keyName.includes("..")) {
      return NextResponse.json({ error: "Invalid key name" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Verify magic bytes match claimed content type
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const matchesMagic = MAGIC_BYTES.some((m) =>
      m.bytes.every((b, i) => header[i] === b),
    );
    if (!matchesMagic) {
      return NextResponse.json({ error: "File content does not match type" }, { status: 400 });
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

    if (!presignRes.ok) {
      return NextResponse.json({ error: "Failed to generate upload URL" }, { status: presignRes.status });
    }

    let presignedUrl: string;
    try {
      const parsed = JSON.parse(presignText) as string | { url?: string; presignedUrl?: string };
      presignedUrl = typeof parsed === "string" ? parsed : (parsed.url ?? parsed.presignedUrl ?? "");
    } catch {
      presignedUrl = presignText;
    }

    // Validate the presigned URL points to the expected S3 bucket
    const expectedPrefix = `https://${bucketName}.s3.`;
    if (!presignedUrl.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid presigned URL from backend" }, { status: 502 });
    }

    // Step 2: upload to S3 server-side (no CORS)
    const imageBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "S3 upload failed" }, { status: uploadRes.status });
    }

    const s3Url = `https://${bucketName}.s3.eu-central-1.amazonaws.com/${finalKeyName}`;
    return NextResponse.json({ url: s3Url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
