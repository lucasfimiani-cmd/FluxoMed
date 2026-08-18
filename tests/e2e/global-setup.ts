import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const tmpDbDir = path.resolve(__dirname, "..", "..", ".tmp");
const tmpDbPath = path.join(tmpDbDir, "e2e.db");

export default async function globalSetup() {
  // Clean and recreate temp directory
  fs.rmSync(tmpDbDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDbDir, { recursive: true });

  // Run Prisma migrations on the temp database
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "..", "..", "apps", "web"),
    env: {
      ...process.env,
      DATABASE_URL: `file:${tmpDbPath}`,
    },
    stdio: "pipe",
  });

  console.log(`E2E temp database created at ${tmpDbPath}`);
}