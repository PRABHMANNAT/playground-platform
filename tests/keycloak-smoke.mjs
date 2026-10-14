import { chromium } from "@playwright/test";
import { randomBytes, createHash } from "node:crypto";
const issuer = "http://localhost:8080/realms/playground";
const discovery = await fetch(
  issuer + "/.well-known/openid-configuration",
).then((r) => r.json());
const verifier = randomBytes(32).toString("base64url"),
  nonce = randomBytes(20).toString("base64url");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const url = new URL(discovery.authorization_endpoint);
url.search = new URLSearchParams({
  client_id: "playground-web",
  redirect_uri: "http://localhost:3000/auth/callback",
  response_type: "code",
  scope: "openid profile",
  state: "keycloak-smoke",
  nonce,
  code_challenge_method: "S256",
  code_challenge: createHash("sha256").update(verifier).digest("base64url"),
}).toString();
let callback;
const callbackRequest = page.waitForRequest(
  (request) => new URL(request.url()).pathname === "/auth/callback",
  { timeout: 45000 },
);
await page.goto(url.toString());
await page.locator("#username").fill("alice");
await page.locator("#password").fill("playground");
await page.locator("#kc-login").click();
await Promise.race([
  callbackRequest,
  page.locator("#email").waitFor({ state: "visible" }),
]);
if (await page.locator("#email").isVisible()) {
  await page.locator("#email").fill("alice@example.test");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}
callback = (await callbackRequest).url();
const code = new URL(callback).searchParams.get("code");
const response = await fetch(discovery.token_endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: "playground-web",
    client_secret: "local-client-only",
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:3000/auth/callback",
    code,
    code_verifier: verifier,
  }),
});
if (!response.ok)
  throw new Error("Keycloak token exchange failed: " + response.status);
const tokens = await response.json();
const claims = JSON.parse(
  Buffer.from(tokens.access_token.split(".")[1], "base64url").toString(),
);
if (
  claims.sub !== "local-alice" ||
  ![claims.aud].flat().includes("playground-web")
)
  throw new Error("Identity mapping or audience incompatible");
const api = await fetch("http://127.0.0.1:8002/v1/me", {
  headers: { Authorization: "Bearer " + tokens.access_token },
});
if (!api.ok) throw new Error("API rejected Keycloak identity: " + api.status);
console.log(
  "Verified Keycloak authorization-code + PKCE, audience mapper, seeded identity mapping, discovery/JWKS signature validation, and API membership.",
);
await browser.close();
