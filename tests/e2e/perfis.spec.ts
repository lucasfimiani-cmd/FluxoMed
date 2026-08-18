import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

test.describe("Perfis Fiscais CRUD", () => {
  test("should create PF, create PJ, list both, edit, and delete", async ({
    page,
  }) => {
    // Login with existing user (created by auth test)
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");

    // Navigate to perfis
    await page.click("text=Perfis Fiscais");
    await page.waitForURL("/app/perfis");
    await expect(page.locator("h1")).toHaveText("Perfis Fiscais");
    await expect(page.locator("text=Nenhum perfil fiscal")).toBeVisible();

    // Create PF
    await page.click("text=Novo Perfil");
    await page.waitForURL("/app/perfis/novo");
    await page.selectOption("#tipo", "PF");
    await page.selectOption("#regime", "PF_AUTONOMO");
    await page.fill("#aliquotaEfetiva", "27.5");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/perfis");
    await expect(page.locator("text=Pessoa Física")).toBeVisible();
    await expect(page.locator("text=PF Autônoma")).toBeVisible();
    await expect(page.locator("text=27.5%")).toBeVisible();

    // Create PJ
    await page.click("text=Novo Perfil");
    await page.selectOption("#tipo", "PJ");
    await page.selectOption("#regime", "SIMPLES_NACIONAL");
    await page.fill("#aliquotaEfetiva", "15");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/perfis");
    await expect(page.locator("text=Pessoa Jurídica")).toBeVisible();
    await expect(page.locator("text=Simples Nacional")).toBeVisible();
    await expect(page.locator("text=15%")).toBeVisible();

    // Both should be visible
    const cards = page.locator(".space-y-3 > div");
    await expect(cards).toHaveCount(2);

    // Edit the PF card (second card, since ordered by desc createdAt)
    await cards.nth(1).locator("text=Editar").click();
    await page.waitForURL("/app/perfis/**/editar");
    await page.fill("#aliquotaEfetiva", "30");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/perfis");
    await expect(page.locator("text=30%")).toBeVisible();

    // Delete the PF card (second card)
    await cards.nth(1).locator("text=Excluir").click();
    await page.waitForURL("/app/perfis");
    await expect(page.locator("text=Pessoa Jurídica")).toBeVisible();
    await expect(page.locator("text=Pessoa Física")).not.toBeVisible();
  });
});