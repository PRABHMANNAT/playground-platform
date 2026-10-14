import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { issuer, client, secret, seal, unseal, options } from "@/lib/auth";
export async function GET(request: NextRequest) {
  try {
    const pending = await unseal(request.cookies.get("pg_oauth")?.value || "");
    if (pending.state !== request.nextUrl.searchParams.get("state"))
      throw new Error("State mismatch");
    const discovery = await fetch(
      issuer + "/.well-known/openid-configuration",
      { cache: "no-store" },
    ).then((r) => r.json());
    const response = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: client,
        client_secret: secret,
        grant_type: "authorization_code",
        code: request.nextUrl.searchParams.get("code") || "",
        redirect_uri: String(pending.redirect),
        code_verifier: String(pending.verifier),
      }),
    });
    if (!response.ok) throw new Error("Token exchange failed");
    const tokens = await response.json();
    const { payload } = await jwtVerify(
      tokens.id_token,
      createRemoteJWKSet(new URL(discovery.jwks_uri)),
      { issuer, audience: client },
    );
    if (payload.nonce !== pending.nonce) throw new Error("Nonce mismatch");
    const result = NextResponse.redirect(new URL("/", request.url));
    result.cookies.set(
      "pg_session",
      await seal({ access_token: tokens.access_token }),
      { ...options, maxAge: 3600 },
    );
    result.cookies.delete("pg_oauth");
    return result;
  } catch {
    return NextResponse.redirect(
      new URL(
        "/?auth_error=Sign%20in%20failed.%20Retry%20local%20sign%20in.",
        request.url,
      ),
    );
  }
}
