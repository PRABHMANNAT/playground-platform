import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { issuer, client, random, seal, options } from "@/lib/auth";
export async function GET(request: NextRequest) {
  try {
    const discovery = await fetch(
      issuer + "/.well-known/openid-configuration",
      { cache: "no-store" },
    ).then((r) => r.json());
    const state = random(),
      nonce = random(),
      verifier = random(),
      redirect = request.nextUrl.origin + "/auth/callback";
    const url = new URL(discovery.authorization_endpoint);
    url.search = new URLSearchParams({
      client_id: client,
      redirect_uri: redirect,
      response_type: "code",
      scope: "openid profile",
      state,
      nonce,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
    const response = NextResponse.redirect(url);
    response.cookies.set(
      "pg_oauth",
      await seal({ state, nonce, verifier, redirect }, "5m"),
      { ...options, maxAge: 300 },
    );
    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        "/?auth_error=OIDC%20provider%20unavailable.%20Start%20local%20identity%20service.",
        request.url,
      ),
    );
  }
}
