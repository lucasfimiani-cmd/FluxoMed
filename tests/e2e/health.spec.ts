import { test, expect } from "@playwright/test";

test.describe("Health endpoint", () => {
  test("should return ok status with hits", async ({ page }) => {
    const response = await page.goto("/api/health");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const body = await response!.json();
    expect(body.status).toBe("ok");
    expect(typeof body.hits).toBe("number");
    expect(body.hits).toBeGreaterThanOrEqual(1);
    expect(body.updatedAt).toBeDefined();
  });

  test("should increment hits on subsequent calls", async ({ page }) => {
    // First call
    const res1 = await page.goto("/api/health");
    const body1 = await res1!.json();
    const hits1 = body1.hits;

    // Second call
    const res2 = await page.goto("/api/health");
    const body2 = await res2!.json();
    const hits2 = body2.hits;

    expect(hits2).toBe(hits1 + 1);
  });
});

test.describe("Home page", () => {
  test("should render FluxoMed title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("FluxoMed");
    await expect(page.locator("p")).toContainText(
      "Gestão financeira para profissionais da saúde"
    );
  });
});