import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev:renderer",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  use: {
    headless: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
