import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Maria Teste",
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

test.describe("Fontes de Renda CRUD", () => {
  test("should create FIXO_MENSAL and POR_UNIDADE, list, edit, deactivate, and block perfil deletion", async ({
    page,
  }) => {
    // Login (user created by auth test)
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");

    // Create a PF perfil first (if not exists)
    await page.click("text=Perfis Fiscais");
    await page.waitForURL("/app/perfis");

    // Check if there are already perfis; if not, create one
    const emptyState = page.locator("text=Nenhum perfil fiscal");
    if (await emptyState.isVisible()) {
      await page.click("text=Novo Perfil");
      await page.waitForURL("/app/perfis/novo");
      await page.selectOption("#tipo", "PF");
      await page.selectOption("#regime", "PF_AUTONOMO");
      await page.fill("#aliquotaEfetiva", "27.5");
      await page.click('button:has-text("Salvar")');
      await page.waitForURL("/app/perfis");
    }

    // Navigate to fontes
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");
    await expect(page.locator("h1")).toHaveText("Fontes de Renda");

    // Create FIXO_MENSAL
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Hospital Teste");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "FIXO_MENSAL");
    await page.fill("#prazoPagamentoDias", "30");
    await page.fill("#valorMensal", "5000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Hospital Teste")).toBeVisible();
    await expect(page.locator("text=Fixo Mensal")).toBeVisible();
    await expect(page.locator("span:has-text('Ativa')")).toBeVisible();

    // Create POR_UNIDADE with table
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Clínica Teste");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_UNIDADE");
    await page.fill("#preco_PLANTAO", "1200");
    await page.fill("#preco_CONSULTA", "250");
    await page.fill("#prazoPagamentoDias", "15");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Clínica Teste")).toBeVisible();
    await expect(page.locator("text=Por Unidade")).toBeVisible();

    // Both fontes should be visible
    const cards = page.locator(".space-y-3 > div");
    await expect(cards).toHaveCount(2);

    // Edit the Clínica Teste card (first card, ordered by desc createdAt)
    await cards.nth(0).locator("text=Editar").click();
    await page.waitForURL("/app/fontes/**/editar");
    // Change prazo
    await page.fill("#prazoPagamentoDias", "45");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=45 dias")).toBeVisible();

    // Deactivate (toggle ativa) - the first card
    await cards.nth(0).locator("text=Desativar").click();
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Inativa")).toBeVisible();

    // Try to delete the perfil that has fontes — should get error
    await page.click("text=Perfis Fiscais");
    await page.waitForURL("/app/perfis");

    // Try to delete the first perfil (which has fontes linked)
    // It should show the blocking error message
    const perfilCards = page.locator(".space-y-3 > div");
    const deleteBtn = perfilCards.nth(0).locator("text=Excluir");
    await deleteBtn.click();
    await page.waitForURL("/app/perfis**");

    // Error message should appear
    await expect(
      page.locator("text=Fontes de Renda vinculadas")
    ).toBeVisible();
  });
});