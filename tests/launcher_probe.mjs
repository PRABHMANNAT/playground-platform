import { spawn } from "node:child_process";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run launcher:check");
const launcher = spawn(process.execPath, ["infra/dev.mjs"], {
  env: process.env,
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe", "ipc"],
});
launcher.stdout.on("data", (x) => process.stdout.write(x));
launcher.stderr.on("data", (x) => process.stderr.write(x));
let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    const a = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(1000),
    });
    const w = await fetch("http://localhost:3000", {
      signal: AbortSignal.timeout(1000),
    });
    const o = await fetch(
      "http://127.0.0.1:8001/.well-known/openid-configuration",
      { signal: AbortSignal.timeout(1000) },
    );
    if (a.ok && w.ok && o.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((ok) => setTimeout(ok, 500));
}
launcher.send({ type: "shutdown" });
await new Promise((ok, fail) => {
  launcher.once("exit", (code) =>
    code === 0 ? ok() : fail(new Error("Shutdown failed " + code)),
  );
  setTimeout(() => fail(new Error("Shutdown timed out")), 15000).unref();
});
if (!ready) throw new Error("Local startup failed");
console.log(
  "Local startup health checks and orderly child-process shutdown passed.",
);
