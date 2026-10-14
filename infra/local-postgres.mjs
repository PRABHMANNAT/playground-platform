import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync } from "node:fs";
mkdirSync(".local", { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: ".local/postgres",
  user: "postgres",
  password: "local-postgres-only",
  port: 54329,
  persistent: true,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8"],
  postgresFlags: ["-h", "127.0.0.1"],
});
if (!existsSync(".local/postgres/PG_VERSION")) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
if (
  !(await client.query("SELECT 1 FROM pg_database WHERE datname='playground'"))
    .rowCount
)
  await client.query(
    "CREATE DATABASE playground ENCODING 'UTF8' TEMPLATE template0",
  );
if (
  !(await client.query("SELECT 1 FROM pg_roles WHERE rolname='playground_app'"))
    .rowCount
)
  await client.query(
    "CREATE ROLE playground_app LOGIN PASSWORD 'local-app-only'",
  );
await client.end();
console.log(
  "PostgreSQL ready at 127.0.0.1:54329; persistent data in .local/postgres",
);
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("message", (message) => {
  if (message?.type === "shutdown") stop();
});
setInterval(() => {}, 60000);
