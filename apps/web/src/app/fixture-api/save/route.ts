import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { build, application } = await request.json();
  if (build !== "A" && build !== "B")
    return NextResponse.json({ error: "Unknown build" }, { status: 422 });
  return build === "A" && !application
    ? NextResponse.json(
        { error: "Intentional HireFlow sample Save failure" },
        { status: 500 },
      )
    : NextResponse.json(
        { saved: true, provenance: "OWNED_SAMPLE_FIXTURE" },
        { status: 201 },
      );
}
