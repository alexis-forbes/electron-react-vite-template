import { expect, test } from "@playwright/test";

// NOTE: This assumes the renderer is available at http://localhost:5173.
// In CI you would normally start the dev server or serve the built files
// before running this test.

test("homepage renders", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await expect(page).toHaveTitle(/Electron React Vite Template/i);
});
