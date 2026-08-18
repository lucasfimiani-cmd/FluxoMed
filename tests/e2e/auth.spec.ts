import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Maria Teste",
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

test.describe("Auth flow", () => {
  test("should register, login, access protected area, and logout", async ({
    page,
  }) => {
    // Navigate to register page
    await page.goto("/register");
    await expect(page.locator("h1")).toHaveText("Criar conta");

    // Fill registration form
    await page.fill("#name", TEST_USER.name);
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to /app after registration
    await page.waitForURL("/app");
    await expect(page.locator("h1")).toHaveText("Dashboard");
    await expect(page.locator(`text=${TEST_USER.name}`)).toBeVisible();

    // Logout
    await page.click('button:has-text("Sair")');
    await page.waitForURL("/login");

    // Try to access /app — should redirect to /login
    await page.goto("/app");
    await page.waitForURL("/login");

    // Login again
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should be back in /app
    await page.waitForURL("/app");
    await expect(page.locator("h1")).toHaveText("Dashboard");
    await expect(page.locator(`text=${TEST_USER.name}`)).toBeVisible();
  });

  test("should show error for invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "naoexiste@teste.com");
    await page.fill("#password", "senhaerrada");
    await page.click('button[type="submit"]');

    // Should stay on login page with error
    await expect(page.locator("h1")).toHaveText("Entrar");
    await expect(page.locator("text=Email ou senha inválidos")).toBeVisible();
  });

  test("should redirect to login when accessing /app without session", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForURL("/login");
  });
});