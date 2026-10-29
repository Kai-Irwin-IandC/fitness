import { createHash, timingSafeEqual } from "node:crypto";
import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One private JSON document holds everything; the passcode is the only key to it. */
const PATHNAME = "kai-health/data.json";

const digest = (s: string) => createHash("sha256").update(s).digest();

function authorize(req: Request): Response | null {
  const passcode = process.env.APP_PASSCODE;
  if (!process.env.BLOB_READ_WRITE_TOKEN || !passcode) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  const given = req.headers.get("x-app-passcode") ?? "";
  if (!timingSafeEqual(digest(given), digest(passcode))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/** The strong ETag that `put({ ifMatch })` compares against, or null when the blob doesn't exist. */
async function currentEtag(): Promise<string | null> {
  try {
    return (await head(PATHNAME)).etag;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

export async function GET(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  // get() reports a weak (W/) ETag for the transfer, which ifMatch never matches, so take the
  // ETag from head(). Read it before the content: if a write lands in between, the ETag is the
  // older one and this device's next push conflicts and re-pulls instead of overwriting.
  const etag = await currentEtag();
  const result = etag ? await get(PATHNAME, { access: "private", useCache: false }) : null;
  if (!etag || !result || result.statusCode !== 200) {
    return Response.json({ data: null, etag: null });
  }
  const data = JSON.parse(await new Response(result.stream).text());
  return Response.json({ data, etag });
}

export async function PUT(req: Request) {
  const denied = authorize(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { data?: unknown; etag?: string | null } | null;
  if (!body || typeof body.data !== "object" || body.data === null) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  // without an etag this device has never seen the remote copy: only create, never overwrite
  if (!body.etag && (await currentEtag())) {
    return Response.json({ error: "conflict" }, { status: 409 });
  }
  try {
    const result = await put(PATHNAME, JSON.stringify(body.data), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      // only overwrite the version this device last saw
      ...(body.etag ? { ifMatch: body.etag } : {}),
    });
    return Response.json({ etag: result.etag });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      return Response.json({ error: "conflict" }, { status: 409 });
    }
    throw error;
  }
}
