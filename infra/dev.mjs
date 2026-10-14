import { spawn } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";
if (existsSync(".env"))
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, "");
  }
const python = resolve(
  process.platform === "win32"
    ? ".venv/Scripts/python.exe"
    : ".venv/bin/python",
);
if (!existsSync(python))
  throw new Error(
    "Create .venv and install services/api/requirements.txt first. See docs/SETUP.md.",
  );
process.env.PYTHONPATH = resolve("services/api");
process.env.APP_ENV = "development";
const children = [];
function start(command, args, label) {
  const child = spawn(command, args, {
    env: process.env,
    windowsHide: true,
    stdio:
      label === "postgres"
        ? ["ignore", "pipe", "pipe", "ipc"]
        : ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  child.stdout.on("data", (x) => process.stdout.write(`[${label}] ${x}`));
  child.stderr.on("data", (x) => process.stderr.write(`[${label}] ${x}`));
  return child;
}
function finished(child) {
  return new Promise((ok, fail) => {
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? ok() : fail(new Error("Setup exited " + code)),
    );
  });
}
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  for (const child of [...children].reverse()) {
    if (child.exitCode !== null) continue;
    if (child.connected) {
      child.send({ type: "shutdown" });
      await Promise.race([
        new Promise((ok) => child.once("exit", ok)),
        new Promise((ok) => setTimeout(ok, 5000)),
      ]);
    }
    if (child.exitCode !== null) continue;
    if (process.platform === "win32")
      await new Promise((ok) => {
        const kill = spawn(
          "taskkill",
          ["/PID", String(child.pid), "/T", "/F"],
          { windowsHide: true, stdio: "ignore" },
        );
        kill.once("exit", ok);
      });
    else child.kill("SIGTERM");
  }
};
process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});
process.on("message", async (message) => {
  if (message?.type === "shutdown") {
    await shutdown();
    process.exit(0);
  }
});
const pg = start(process.execPath, ["infra/local-postgres.mjs"], "postgres");
await new Promise((ok, fail) => {
  pg.stdout.on("data", (text) => {
    if (text.toString().includes("PostgreSQL ready")) ok();
  });
  pg.on("exit", (code) => fail(new Error("Postgres exited " + code)));
});
await finished(
  start(
    python,
    ["-m", "alembic", "-c", "services/api/alembic.ini", "upgrade", "head"],
    "migration",
  ),
);
await finished(start(python, ["-m", "playground.seed"], "seed"));
mkdirSync(".local/artifacts", { recursive: true });
if (existsSync("tests/fixtures/artifacts"))
  cpSync("tests/fixtures/artifacts", ".local/artifacts", {
    recursive: true,
    force: false,
    preserveTimestamps: true,
  });
start(
  python,
  [
    "-m",
    "uvicorn",
    "playground.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
    "--no-access-log",
  ],
  "api",
);
if (
  (process.env.OIDC_ISSUER || "http://127.0.0.1:8001") ===
  "http://127.0.0.1:8001"
)
  start(
    python,
    [
      "-m",
      "uvicorn",
      "infra.dev_oidc:app",
      "--host",
      "127.0.0.1",
      "--port",
      "8001",
      "--no-access-log",
    ],
    "oidc",
  );
if (!process.env.npm_execpath)
  throw new Error(
    "Launch through npm run local so npm CLI is resolved correctly.",
  );
start(process.execPath, [process.env.npm_execpath, "run", "dev"], "web");
console.log(
  "Local workspace: http://localhost:3000. Ctrl+C stops owned child processes.",
);
