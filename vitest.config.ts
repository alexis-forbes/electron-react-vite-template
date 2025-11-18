import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.ts"
    ],
    exclude: [
      "tests/e2e/**",
      "playwright.config.ts",
      "node_modules/**",
      "dist/**"
    ]
  }
});
