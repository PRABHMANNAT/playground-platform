import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return new NextResponse("Invalid origin", { status: 403 });
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete("pg_session");
  return response;
}
