import { test, expect } from "@playwright/test";

test.describe("Health endpoint", () => {
  test("should return ok status", async ({ page }) => {
    const response = await page.goto("/api/health");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const body = await response!.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    expect(typeof body.userCount).toBe("number");
  });
});

test.describe("Home page", () => {
  test("should render FluxoMed title and auth links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("FluxoMed");
    await expect(page.locator("text=Entrar")).toBeVisible();
    await expect(page.locator("text=Criar conta")).toBeVisible();
  });
});