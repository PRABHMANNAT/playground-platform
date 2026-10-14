import { NextRequest, NextResponse } from "next/server";
import { access } from "@/lib/auth";
const api = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const participant = path[0] === "v1" && path[1] === "participant";
  if (
    !["GET", "HEAD"].includes(request.method) &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 },
    );
  const token = await access();
  if (!token && !participant)
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const headers = new Headers();
  if (token) headers.set("Authorization", "Bearer " + token);
  if (request.headers.has("content-type"))
    headers.set("Content-Type", request.headers.get("content-type")!);
  for (const h of ["idempotency-key", "last-event-id", "x-workspace-id"])
    if (request.headers.has(h)) headers.set(h, request.headers.get(h)!);
  try {
    const result = await fetch(
      api +
        "/" +
        path.map(encodeURIComponent).join("/") +
        request.nextUrl.search,
      {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.text(),
        cache: "no-store",
        signal: request.signal,
      },
    );
    return new NextResponse(result.body, {
      status: result.status,
      headers: {
        "Content-Type":
          result.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "API unavailable. Start PostgreSQL and FastAPI, then retry." },
      { status: 503 },
    );
  }
}
export const GET = proxy,
  POST = proxy,
  PUT = proxy,
  PATCH = proxy,
  DELETE = proxy;
