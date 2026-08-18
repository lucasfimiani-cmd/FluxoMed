import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Maria Teste",
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

async function selectOptionByText(page: any, selectId: string, text: string) {
  const option = page.locator(`#${selectId} option:has-text("${text}")`);
  const value = await option.getAttribute("value");
  if (value) {
    await page.selectOption(`#${selectId}`, value);
  }
}

test.describe("Atividades CRUD", () => {
  test("should create atividades with 3 models, realizar, cancelar, editar, block cancelada edit", async ({
    page,
  }) => {
    // ── Login ──────────────────────────────────────────────────────────────
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");

    // ── Ensure a PF perfil exists ──────────────────────────────────────────
    await page.click("text=Perfis Fiscais");
    await page.waitForURL("/app/perfis");

    const emptyPerfilState = page.locator("text=Nenhum perfil fiscal");
    if (await emptyPerfilState.isVisible()) {
      await page.click("text=Novo Perfil");
      await page.waitForURL("/app/perfis/novo");
      await page.selectOption("#tipo", "PF");
      await page.selectOption("#regime", "PF_AUTONOMO");
      await page.fill("#aliquotaEfetiva", "27.5");
      await page.click('button:has-text("Salvar")');
      await page.waitForURL("/app/perfis");
    }

    // ── Navigate to fontes and create 3 fontes ────────────────────────────
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");

    // Create FIXO_MENSAL (valor 5000)
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "FixoMensal Teste");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "FIXO_MENSAL");
    await page.fill("#prazoPagamentoDias", "30");
    await page.fill("#valorMensal", "5000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=FixoMensal Teste")).toBeVisible();

    // Create POR_ATIVIDADE (valor 1200)
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "PorAtividade Teste");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_ATIVIDADE");
    await page.fill("#prazoPagamentoDias", "15");
    await page.fill("#valorPorAtividade", "1200");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=PorAtividade Teste")).toBeVisible();

    // Create POR_UNIDADE (preços: PLANTAO 1500, CONSULTA 300)
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "PorUnidade Teste");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_UNIDADE");
    await page.fill("#preco_PLANTAO", "1500");
    await page.fill("#preco_CONSULTA", "300");
    await page.fill("#prazoPagamentoDias", "7");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=PorUnidade Teste")).toBeVisible();

    // ── Navigate to atividades ─────────────────────────────────────────────
    await page.click("text=Atividades");
    await page.waitForURL("/app/atividades");
    await expect(page.locator("h1")).toHaveText("Atividades");

    // ── Create FIXO_MENSAL activity ────────────────────────────────────────
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "PLANTAO");
    await selectOptionByText(page, "fonteDeRendaId", "FixoMensal");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Should show R$ 5.000,00
    await expect(page.locator("text=R$ 5.000,00")).toBeVisible();
    await expect(page.locator("text=FixoMensal Teste")).toBeVisible();
    await expect(page.locator("text=Agendada")).toBeVisible();

    // ── Create POR_ATIVIDADE activity ───────────────────────────────────────
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "CONSULTA");
    await selectOptionByText(page, "fonteDeRendaId", "PorAtividade");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Should show R$ 1.200,00
    await expect(page.locator("text=R$ 1.200,00")).toBeVisible();

    // ── Create POR_UNIDADE activity (PLANTAO) ──────────────────────────────
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "PLANTAO");
    await selectOptionByText(page, "fonteDeRendaId", "PorUnidade");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Should show R$ 1.500,00
    await expect(page.locator("text=R$ 1.500,00")).toBeVisible();

    // ── Realizar a primeira atividade (agendada → realizada) ──────────────
    const atividadeCards = page.locator(".space-y-3 > div");
    await expect(atividadeCards).toHaveCount(3);

    // Realizar the last created (first in list, index 0)
    await atividadeCards.nth(0).locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // Badge should now be "Realizada"
    await expect(atividadeCards.nth(0).locator("text=Realizada")).toBeVisible();
    // Editar button should be gone for Realizada
    await expect(atividadeCards.nth(0).locator("text=Editar")).not.toBeVisible();

    // ── Cancelar a segunda atividade ───────────────────────────────────────
    await atividadeCards.nth(1).locator("text=Cancelar").click();
    await page.waitForURL("/app/atividades");

    await expect(atividadeCards.nth(1).locator("text=Cancelada")).toBeVisible();

    // ── Editar a terceira atividade (AGENDADA) → trocar fonte ──────────────
    await atividadeCards.nth(2).locator("text=Editar").click();
    await page.waitForURL("/app/atividades/**/editar");

    // Change to fixa (FIXO_MENSAL) → valor should recalculate to 5000
    await selectOptionByText(page, "fonteDeRendaId", "FixoMensal");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Valor should now be R$ 5.000,00 (from the new FIXO_MENSAL source) — check on the specific card
    await expect(atividadeCards.nth(2).locator("text=R$ 5.000,00")).toBeVisible();

    // ── Tentar editar a cancelada — deve bloquear ─────────────────────────
    // The Cancelada card (index 1) should not have Editar button
    await expect(atividadeCards.nth(1).locator("text=Editar")).not.toBeVisible();
  });
});