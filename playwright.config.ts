import { defineConfig } from "@playwright/test";
import path from "path";

const tmpDbDir = path.resolve(__dirname, ".tmp");
const tmpDbPath = path.join(tmpDbDir, "e2e.db");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  globalSetup: path.resolve(__dirname, "tests/e2e/global-setup.ts"),
  webServer: {
    command: `npm run dev -w apps/web`,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      DATABASE_URL: `file:${tmpDbPath}`,
    },
    cwd: __dirname,
  },
});