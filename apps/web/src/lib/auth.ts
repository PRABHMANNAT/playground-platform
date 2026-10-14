import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash, randomBytes } from "node:crypto";
export const issuer = process.env.OIDC_ISSUER || "http://127.0.0.1:8001";
export const client = process.env.OIDC_CLIENT_ID || "playground-web";
export const secret =
  process.env.OIDC_CLIENT_SECRET ||
  (process.env.NODE_ENV === "development" ? "local-client-only" : "");
function key() {
  const value =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV === "development"
      ? "local-session-only-do-not-use-in-production"
      : "");
  if (value.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHash("sha256").update(value).digest();
}
export const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function seal(data: Record<string, unknown>, expires = "1h") {
  return new EncryptJWT(data)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .encrypt(key());
}
export async function unseal(value: string) {
  return (await jwtDecrypt(value, key())).payload;
}
export async function access() {
  try {
    const cookie = (await cookies()).get("pg_session");
    if (!cookie) return null;
    return (await unseal(cookie.value)).access_token as string;
  } catch {
    return null;
  }
}
export function random() {
  return randomBytes(32).toString("base64url");
}
